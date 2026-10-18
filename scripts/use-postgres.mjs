// Switches the Prisma datasource from SQLite (local dev default) to PostgreSQL
// for production builds. Run by the Vercel build command; a no-op if already
// PostgreSQL. The committed schema stays SQLite so local dev/tests are
// unaffected — this only mutates the ephemeral build checkout on Vercel.
import { readFileSync, writeFileSync } from "node:fs";

const path = "prisma/schema.prisma";
const src = readFileSync(path, "utf8");

if (src.includes('provider = "sqlite"')) {
  writeFileSync(path, src.replace('provider = "sqlite"', 'provider = "postgresql"'));
  console.log("✔ Prisma datasource provider → postgresql");
} else {
  console.log("Prisma datasource provider is not sqlite; leaving as-is.");
}
