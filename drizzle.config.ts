import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // For Turso, include the token in the URL: libsql://<db>.turso.io?authToken=...
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data/app.db",
  },
});
