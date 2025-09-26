import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request { user?: { id: string } }

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
  try {
    const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET || "dev-secret") as { sub: string };
    req.user = { id: payload.sub };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
