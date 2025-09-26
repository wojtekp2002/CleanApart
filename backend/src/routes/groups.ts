import { Router } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";
import { auth, AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/", auth, async (req: AuthRequest, res) => {
  const parsed = z.object({ name: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const joinCode = nanoid(8);
  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      joinCode,
      ownerId: req.user!.id,
      members: { create: { userId: req.user!.id, role: "OWNER" } },
    },
    include: { members: true }
  });
  res.status(201).json(group);
});

router.post("/join", auth, async (req: AuthRequest, res) => {
  const parsed = z.object({ code: z.string().min(6).max(32) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const group = await prisma.group.findUnique({ where: { joinCode: parsed.data.code } });
  if (!group) return res.status(404).json({ error: "Group not found" });

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: req.user!.id } },
    update: {},
    create: { groupId: group.id, userId: req.user!.id, role: "MEMBER" },
  });

  res.json({ ok: true, groupId: group.id });
});

export default router;
