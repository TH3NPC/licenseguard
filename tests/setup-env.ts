// Runs before any test module imports the Prisma client, so the client binds
// to the throwaway test database rather than the dev DB.
// file: URLs resolve relative to the schema dir (prisma/), so this is prisma/test.db.
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? "file:./test.db";
process.env.AUTH_SECRET =
  process.env.AUTH_SECRET ?? "test-secret-value-at-least-32-chars-long-xxxx";
// NODE_ENV is read-only in @types/node; Vitest already sets it to "test".
