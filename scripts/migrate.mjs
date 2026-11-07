import { readdir, readFile } from "node:fs/promises";
import { Client } from "pg";

if (!process.env.DATABASE_URL) throw new Error("Cần đặt DATABASE_URL.");
const client = new Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  const directory = new URL("../db/", import.meta.url);
  const migrations = (await readdir(directory)).filter(name => name.endsWith(".sql")).sort();
  for (const name of migrations) await client.query(await readFile(new URL(name, directory), "utf8"));
  console.log("Đã chuẩn bị cơ sở dữ liệu game.");
} finally {
  await client.end();
}
