import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Falta la variable de entorno ${name} requerida para conectar a PostgreSQL.`);
  }
  return value;
}

const pool = new Pool({
  host: requireEnv('SQL_HOST'),
  port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
  user: requireEnv('SQL_USER'),
  password: requireEnv('SQL_PASSWORD'),
  database: requireEnv('SQL_DB_NAME'),
  ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

export const db = drizzle(pool, { schema });
