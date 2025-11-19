import { getDatabase, saveDatabase } from '../db/database.js';
import { User } from '../types/index.js';

export class UserModel {
  static async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const db = await getDatabase();
    db.run(
      'INSERT INTO users (id, email, password, createdAt) VALUES (?, ?, ?, ?)',
      [id, user.email, user.password, createdAt]
    );
    await saveDatabase();

    return {
      id,
      email: user.email,
      password: user.password,
      createdAt: new Date(createdAt),
    };
  }

  static async findByEmail(email: string): Promise<User | null> {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.bind([email]);
    const row = stmt.step()
      ? (stmt.getAsObject() as {
          id: string;
          email: string;
          password: string;
          createdAt: string;
        })
      : undefined;
    stmt.free();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      password: row.password,
      createdAt: new Date(row.createdAt),
    };
  }

  static async findById(id: string): Promise<User | null> {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([id]);
    const row = stmt.step()
      ? (stmt.getAsObject() as {
          id: string;
          email: string;
          password: string;
          createdAt: string;
        })
      : undefined;
    stmt.free();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      password: row.password,
      createdAt: new Date(row.createdAt),
    };
  }
}
