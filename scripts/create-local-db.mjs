import pg from "pg";
import { loadEnv } from "./env.mjs";
loadEnv("local");
const url = new URL(process.env.DATABASE_URL);
const name = url.pathname.slice(1);
if (!/^[a-z][a-z0-9_]{0,62}$/.test(name))
  throw new Error("Invalid local database name");
url.pathname = "/postgres";
const db = new pg.Client({ connectionString: url.toString() });
try {
  await db.connect();
  const exists = await db.query("SELECT 1 FROM pg_database WHERE datname=$1", [
    name,
  ]);
  if (!exists.rowCount) await db.query(`CREATE DATABASE "${name}"`);
  console.log(
    exists.rowCount
      ? "Local database already exists."
      : "Created local database.",
  );
} catch {
  console.error(
    "Cannot connect to local PostgreSQL; check the service and local credentials.",
  );
  process.exitCode = 1;
} finally {
  await db.end();
}
