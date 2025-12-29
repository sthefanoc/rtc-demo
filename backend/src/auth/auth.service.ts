import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { env } from "../env.js";

export type JwtUser = { userId: string; email: string };

export async function register(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  const res = await query<{ id: string; email: string }>(
    `insert into users (email, password_hash)
     values ($1, $2)
     returning id, email`,
    [email.toLowerCase(), passwordHash]
  );
  return res.rows[0];
}

export async function login(email: string, password: string) {
  const res = await query<{ id: string; email: string; password_hash: string }>(
    `select id, email, password_hash from users where email = $1`,
    [email.toLowerCase()]
  );
  const user = res.rows[0];
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;

  return { id: user.id, email: user.email };
}

export function signToken(payload: JwtUser) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtUser {
  return jwt.verify(token, env.jwtSecret) as JwtUser;
}