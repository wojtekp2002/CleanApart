import { Router } from "express";
import { prisma } from "../lib/prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { z } from "zod";

const router = Router();
const Email = z.string().email();
const Password = z.string().min(8, "min 8 znaków");

router.post("/register", async (req, res) => {
  const parsed = z.object({ email: Email, password: Password, name: z.string().min(1).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password, name } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ error: "Email already registered" });

  const user = await prisma.user.create({ data: { email, password: await argon2.hash(password), name } });
  const token = jwt.sign({}, process.env.JWT_SECRET!, { subject: user.id, expiresIn: "7d" });
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

router.post("/login", async (req, res) => {
  const parsed = z.object({ email: Email, password: Password }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await argon2.verify(user.password, password))) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({}, process.env.JWT_SECRET!, { subject: user.id, expiresIn: "7d" });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

export default router;
