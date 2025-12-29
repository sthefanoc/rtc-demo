import { Router } from "express";
import { z } from "zod";
import { login, register, signToken } from "./auth.service.js";

export const authRouter = Router();

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

authRouter.post("/register", async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  try {
    const user = await register(parsed.data.email, parsed.data.password);
    const token = signToken({ userId: user.id, email: user.email });
    return res.json({ token, user });
  } catch {
    return res.status(409).json({ error: "Email already in use" });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const user = await login(parsed.data.email, parsed.data.password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ userId: user.id, email: user.email });
  return res.json({ token, user });
});