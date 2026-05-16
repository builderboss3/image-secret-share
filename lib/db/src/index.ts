import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const dbUrl = process.env["DATABASE_URL"];

export const pool = new Pool({
  connectionString: dbUrl ?? "postgresql://localhost/phantom_placeholder",
});

export const db = drizzle(pool, { schema });

export * from "./schema";
