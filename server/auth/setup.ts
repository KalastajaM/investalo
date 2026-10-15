import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { ensureDevAuthConfigTable, seedFromEnvIfNeeded, getPasswordHash, verifyPassword } from "./devAuthStorage";
import { checkRateLimit } from "../rate-limiter";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET ?? "dev-only-insecure-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

/** Fixed dev test account used when DEV_MODE=true */
const DEV_USER = {
  id: "dev-user",
  email: "dev@localhost",
  firstName: "Dev",
  lastName: "User",
  profileImageUrl: null,
};

export async function setupAuth(app: Express) {
  console.log("[startup] setupAuth called");

  if (process.env.DEV_MODE === "true") {
    console.warn(
      "[startup] DEV_MODE=true — OAuth bypassed, all requests run as dev test account. NEVER enable this in production."
    );

    // Sessions are required to track whether the dev password has been entered
    app.set("trust proxy", 1);
    app.use(getSession());

    // The dev account must exist in users: projects/properties/settings reference it by FK.
    await authStorage.upsertUser(DEV_USER);

    // Ensure the table exists regardless of migration runner state, then seed.
    await ensureDevAuthConfigTable();
    await seedFromEnvIfNeeded();
    const hasPassword = (await getPasswordHash()) !== null;
    if (hasPassword) {
      // Public endpoint: validate password and stamp the session
      app.post("/api/dev-login", async (req: any, res) => {
        // Rate limit: 5 attempts per 15 minutes per IP to prevent brute force
        const ip = (req.ip ?? req.socket?.remoteAddress ?? "unknown") as string;
        if (!checkRateLimit(`devlogin:${ip}`, 5, 15 * 60 * 1000)) {
          return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
        }
        try {
          const hash = await getPasswordHash();
          if (!hash) return res.status(500).json({ error: "No password configured" });
          const ok = await verifyPassword(req.body?.password ?? "", hash);
          if (!ok) return res.status(401).json({ error: "Incorrect password" });
          req.session.devAuthenticated = true;
          res.json({ ok: true });
        } catch (err) {
          console.error("dev-login error:", err);
          res.status(500).json({ error: "Internal error" });
        }
      });

      // Gate: block API requests until the session is stamped.
      // Non-API paths (HTML, JS, CSS) are allowed through so the React app can load
      // and render the DevPasswordGate component.
      app.use((req: any, res, next) => {
        if (!req.path.startsWith("/api")) return next();
        if (req.path === "/api/dev-login") return next();
        if (!req.session?.devAuthenticated) {
          return res.status(401).json({ needsDevPassword: true });
        }
        next();
      });
    }

    // Inject the dev user on every request so route handlers find req.user
    app.use((req: any, _res, next) => {
      req.user = DEV_USER;
      next();
    });
    return;
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(
      "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set — Google auth is disabled. All protected routes will return 401."
    );
    return;
  }
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set when Google auth is enabled");
  }
  console.log("[startup] setting up Google OAuth session...");

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const baseUrl =
    process.env.APP_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : "http://localhost:5000");

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${baseUrl}/api/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await authStorage.upsertUser({
            id: profile.id,
            email: profile.emails?.[0]?.value,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            profileImageUrl: profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authStorage.getUser(id);
      done(null, user ?? false);
    } catch (error) {
      done(error);
    }
  });

  app.get(
    "/api/login",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/callback",
    passport.authenticate("google", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (process.env.DEV_MODE === "true") {
    return next();
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
