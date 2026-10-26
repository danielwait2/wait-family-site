import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/wait-family.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const execute = (sql, args = {}) => client.execute({ sql, args });

export const all = async (sql, params) => (await execute(sql, params)).rows;
export const get = async (sql, params) => (await execute(sql, params)).rows[0];
export const run = (sql, params) => execute(sql, params);

export default client;
