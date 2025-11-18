import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';

const rootDir = process.cwd();

// Use in-memory database for tests
const dbPath =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : process.env.DATABASE_PATH ||
      path.resolve(rootDir, 'data/database.db');

// Ensure the directory exists for file-based databases
if (dbPath !== ':memory:') {
  const dbDir = path.dirname(dbPath);
  mkdirSync(dbDir, { recursive: true });
}

const wasmDirectory = path.join(rootDir, 'node_modules/sql.js/dist');

const persistDatabase = (db: SqlJsDatabase) => {
  if (dbPath === ':memory:') {
    return;
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
};

let dbPromise: Promise<SqlJsDatabase> | null = null;

const initializeDatabase = async (): Promise<SqlJsDatabase> => {
  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(wasmDirectory, file),
  });

  const dbInstance =
    dbPath !== ':memory:' && existsSync(dbPath)
      ? new SQL.Database(readFileSync(dbPath))
      : new SQL.Database();

  dbInstance.run('PRAGMA foreign_keys = ON');

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      prompt TEXT NOT NULL,
      style TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  persistDatabase(dbInstance);
  return dbInstance;
};

export const getDatabase = async (): Promise<SqlJsDatabase> => {
  if (!dbPromise) {
    dbPromise = initializeDatabase();
  }
  return dbPromise;
};

export type DatabaseInstance = SqlJsDatabase;
export const saveDatabase = async () => {
  if (dbPath === ':memory:') {
    return;
  }
  const db = await getDatabase();
  persistDatabase(db);
};

export const clearDatabase = async () => {
  const db = await getDatabase();
  db.run('DELETE FROM generations');
  db.run('DELETE FROM users');
  persistDatabase(db);
};
