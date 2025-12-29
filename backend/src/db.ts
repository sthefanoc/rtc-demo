import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({ connectionString: env.databaseUrl });

export async function query<T>(text: string, params: unknown[] = []) {
  const res = await pool.query<T>(text, params);
  return res;
}