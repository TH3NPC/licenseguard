import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Create a fresh SQLite test database by pushing the Prisma schema. Runs once
 * before the suite. Pure-logic tests don't touch it; DB-backed tests rely on it.
 */
export default function setup() {
  // file: URLs resolve relative to prisma/, so this file lands at prisma/test.db.
  const dbUrl = "file:./test.db";
  const dbFile = resolve(process.cwd(), "prisma/test.db");
  if (existsSync(dbFile)) rmSync(dbFile);

  try {
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
  } catch (e) {
    console.error("Failed to prepare test database. Is Prisma installed?", e);
    throw e;
  }

  return () => {
    if (existsSync(dbFile)) rmSync(dbFile);
  };
}
