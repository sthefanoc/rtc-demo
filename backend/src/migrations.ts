import fs from "node:fs";
import path from "node:path";
import { pool } from "./db.js";

async function run() {
  const file = path.resolve("dist/migrations/001_init.sql");
  const sql = fs.readFileSync(file, "utf8");
  await pool.query(sql);
  console.log("Migrations applied");
  await pool.end();
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});