import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use in-memory database for tests
const dbPath =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : process.env.DATABASE_PATH ||
      path.join(__dirname, '../../data/database.db');

// Ensure the directory exists for file-based databases
if (dbPath !== ':memory:') {
  const dbDir = path.dirname(dbPath);
  mkdirSync(dbDir, { recursive: true });
}

// Create database instance
const dbInstance = new Database(dbPath);

// Enable foreign keys
dbInstance.pragma('foreign_keys = ON');

// Create users table
dbInstance.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Create generations table
dbInstance.exec(`
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

// Export as default
// Using InstanceType to create a type that can be named in declaration files
export type DatabaseInstance = InstanceType<typeof Database>;
const db: DatabaseInstance = dbInstance;
export default db;
