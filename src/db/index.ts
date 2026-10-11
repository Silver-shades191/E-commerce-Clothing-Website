import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/app.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

// Reuse a single connection across hot reloads in development.
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof drizzle<typeof schema>> };

export const db =
  globalForDb.__db ??
  drizzle(createClient({ url, authToken }), { schema });

if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export { schema };
