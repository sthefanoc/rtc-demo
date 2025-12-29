import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { authRouter } from "./auth/auth.routes.js";
import { roomsRouter } from "./rooms/rooms.routes.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/rooms", roomsRouter);

  return app;
}