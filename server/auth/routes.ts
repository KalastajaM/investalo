import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./setup";
import { getPasswordHash, setPasswordHash, verifyPassword } from "./devAuthStorage";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Change the dev gate password (only meaningful when DEV_MODE=true)
  app.post("/api/dev-change-password", isAuthenticated, async (req: any, res) => {
    if (process.env.DEV_MODE !== "true") {
      return res.status(404).json({ message: "Not found" });
    }
    try {
      const { currentPassword, newPassword } = req.body ?? {};
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "currentPassword and newPassword are required" });
      }
      const hash = await getPasswordHash();
      if (!hash || !(await verifyPassword(currentPassword, hash))) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      await setPasswordHash(newPassword);
      res.json({ ok: true });
    } catch (err) {
      console.error("dev-change-password error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // In DEV_MODE the user object is injected directly — return it as-is
      if (process.env.DEV_MODE === "true") {
        return res.json(req.user);
      }
      const userId = (req.user as any).id;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
