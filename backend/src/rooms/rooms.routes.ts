import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { createRoom, joinRoom, listHistoryForRoom } from "./rooms.service.js";

export const roomsRouter = Router();

roomsRouter.post("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const room = await createRoom(userId);
  res.json(room);
});

roomsRouter.post("/:roomId/join", requireAuth, async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user!.userId;
  await joinRoom(roomId, userId);
  res.json({ ok: true });
});

roomsRouter.get("/:roomId/history", requireAuth, async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user!.userId;
  const history = await listHistoryForRoom(roomId, userId);
  res.json({ history });
});