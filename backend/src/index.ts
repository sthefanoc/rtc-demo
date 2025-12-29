import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./env.js";
import { pool } from "./db.js";
import fs from "node:fs";
import path from "node:path";
import { initSocket } from "./realtime/socket.js";

async function runMigrations() {
  // simple: run init.sql at startup (idempotent create table if not exists)
  const sqlPath = path.resolve("dist/migrations/001_init.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await pool.query(sql);
}

async function main() {
  await runMigrations();

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`Backend listening on :${env.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});