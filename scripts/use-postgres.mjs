// Switches the Prisma datasource from SQLite (local dev default) to PostgreSQL
// for production builds, and adds a directUrl (used by `prisma db push` /
// migrations through the Supabase session pooler). Run by the Vercel build
// command; a no-op if already PostgreSQL. The committed schema stays SQLite so
// local dev/tests are unaffected — this only mutates the ephemeral build
// checkout on Vercel.
import { readFileSync, writeFileSync } from "node:fs";

const path = "prisma/schema.prisma";
let src = readFileSync(path, "utf8");

if (src.includes('provider = "sqlite"')) {
  src = src.replace('provider = "sqlite"', 'provider = "postgresql"');
  // directUrl is only needed for schema pushes/migrations, so only add it when
  // DIRECT_URL is actually set — a missing variable must never break the build.
  if (!src.includes("directUrl") && process.env.DIRECT_URL) {
    src = src.replace(
      'url      = env("DATABASE_URL")',
      'url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")',
    );
  }
  writeFileSync(path, src);
  console.log(
    "✔ Prisma datasource → postgresql" + (src.includes("directUrl") ? " (+ directUrl)" : ""),
  );
} else {
  console.log("Prisma datasource provider is not sqlite; leaving as-is.");
}
