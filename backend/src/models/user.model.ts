import db from '../db/database.js';
import { User } from '../types/index.js';

export class UserModel {
  static create(user: Omit<User, 'id' | 'createdAt'>): User {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(
      'INSERT INTO users (id, email, password, createdAt) VALUES (?, ?, ?, ?)'
    );

    stmt.run(id, user.email, user.password, createdAt);

    return {
      id,
      email: user.email,
      password: user.password,
      createdAt: new Date(createdAt),
    };
  }

  static findByEmail(email: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email) as
      | {
          id: string;
          email: string;
          password: string;
          createdAt: string;
        }
      | undefined;

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

  static findById(id: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as
      | {
          id: string;
          email: string;
          password: string;
          createdAt: string;
        }
      | undefined;

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
