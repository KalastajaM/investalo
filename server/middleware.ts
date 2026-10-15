
import type { Request, Response, NextFunction, RequestHandler } from "express";

type AuthedHandler = (userId: string, req: Request, res: Response) => Promise<unknown>;

/**
 * Wraps an authenticated route handler:
 * - Extracts `userId` from `req.user` (typed, no `as any` needed in handlers)
 * - Wraps the handler in try/catch and forwards errors to Express's `next`
 *
 * Usage:
 *   app.get("/api/...", isAuthenticated, authHandler(async (userId, req, res) => {
 *     ...
 *   }));
 */
export function authHandler(fn: AuthedHandler): RequestHandler {
  return async (req, res, next) => {
    try {
      const userId = (req.user as { id: string }).id;
      await fn(userId, req, res);
    } catch (err) {
      next(err);
    }
  };
}
