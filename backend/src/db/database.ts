import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use in-memory database for tests
const dbPath =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : process.env.DATABASE_PATH ||
      path.join(__dirname, '../../data/database.db');

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

// Export as default
// Using InstanceType to create a type that can be named in declaration files
export type DatabaseInstance = InstanceType<typeof Database>;
const db: DatabaseInstance = dbInstance;
export default db;
