import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultPath = path.resolve(process.cwd(), 'data', 'wait-family.db');
const dbPath = process.env.SQLITE_DB_PATH ? path.resolve(process.cwd(), process.env.SQLITE_DB_PATH) : defaultPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = path.resolve(__dirname, '../schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// Migration: Add category, submitted_by, prep_time, cook_time, and serves columns if they don't exist
try {
  const tableInfo = db.prepare("PRAGMA table_info(recipes)").all();
  const hasCategory = tableInfo.some((col) => col.name === 'category');
  const hasSubmittedBy = tableInfo.some((col) => col.name === 'submitted_by');
  const hasPrepTime = tableInfo.some((col) => col.name === 'prep_time');
  const hasCookTime = tableInfo.some((col) => col.name === 'cook_time');
  const hasServes = tableInfo.some((col) => col.name === 'serves');

  if (!hasCategory) {
    console.log('Migrating: Adding category column to recipes table...');
    db.exec(`
      ALTER TABLE recipes ADD COLUMN category TEXT NOT NULL DEFAULT 'dinner';
      CREATE INDEX IF NOT EXISTS recipes_category_idx ON recipes (category);
    `);
    console.log('Migration complete: category column added.');
  }

  if (!hasSubmittedBy) {
    console.log('Migrating: Adding submitted_by column to recipes table...');
    db.exec(`
      ALTER TABLE recipes ADD COLUMN submitted_by TEXT;
    `);
    console.log('Migration complete: submitted_by column added.');
  }

  if (!hasPrepTime) {
    console.log('Migrating: Adding prep_time column to recipes table...');
    db.exec(`
      ALTER TABLE recipes ADD COLUMN prep_time INTEGER;
    `);
    console.log('Migration complete: prep_time column added.');
  }

  if (!hasCookTime) {
    console.log('Migrating: Adding cook_time column to recipes table...');
    db.exec(`
      ALTER TABLE recipes ADD COLUMN cook_time INTEGER;
    `);
    console.log('Migration complete: cook_time column added.');
  }

  if (!hasServes) {
    console.log('Migrating: Adding serves column to recipes table...');
    db.exec(`
      ALTER TABLE recipes ADD COLUMN serves INTEGER;
    `);
    console.log('Migration complete: serves column added.');
  }
} catch (error) {
  console.error('Migration error:', error.message);
}

export const all = (sql, params = {}) => db.prepare(sql).all(params);
export const get = (sql, params = {}) => db.prepare(sql).get(params);
export const run = (sql, params = {}) => db.prepare(sql).run(params);

export default db;
