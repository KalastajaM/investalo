import "./env";
import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { NotFoundError, AppError } from "./errors";
import path from "path";

console.log("[startup] server process started");
const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // CSP: same-origin SPA; unsafe-inline needed for Vite-injected scripts/styles
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-ancestors 'none'",
    ].join("; "),
  );
  // HSTS: only in production (avoids breaking local http:// dev)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Paths whose response bodies must never be logged (contain user data or credentials)
const SENSITIVE_LOG_PATHS = ["/api/auth", "/api/settings", "/api/properties", "/api/dev-login"];

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const isSensitive = SENSITIVE_LOG_PATHS.some((p) => path.startsWith(p));
  if (!isSensitive) {
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const bodySnippet = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${bodySnippet.length > 200 ? bodySnippet.slice(0, 200) + "…" : bodySnippet}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register health check immediately so Railway can probe during startup
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Run DB migrations before accepting traffic
  try {
    console.log("[startup] running migrations...");
    // Resolve from the working directory: __dirname is undefined when the dev server runs as ESM
    const migrationsFolder = path.resolve(process.cwd(), "migrations");
    await migrate(db, { migrationsFolder });
    console.log("[startup] migrations complete");
  } catch (err: any) {
    // Fatal: serving without a valid schema only produces confusing runtime errors.
    console.error("[startup] migration error:", err.message);
    process.exit(1);
  }

  console.log("[startup] registering routes...");
  await registerRoutes(httpServer, app);
  console.log("[startup] routes registered");

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);

    if (err instanceof z.ZodError) {
      const issue = err.errors[0];
      return res.status(400).json({
        message: issue?.message ?? "Validation error",
        field: issue?.path.join("."),
      });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ message: err.message });
    }
    if (err instanceof AppError) {
      return res.status(err.status).json({ message: err.message });
    }

    console.error("Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    console.log("[startup] serving static files...");
    serveStatic(app);
    console.log("[startup] static files ready");
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Serves both the API and the client. Hosting platforms set PORT.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
})();
