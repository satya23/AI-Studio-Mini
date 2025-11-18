import db from '../db/database.js';
import { Generation } from '../types/index.js';

export class GenerationModel {
  static create(generation: Omit<Generation, 'id' | 'createdAt'>): Generation {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(
      'INSERT INTO generations (id, userId, prompt, style, imageUrl, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    stmt.run(
      id,
      generation.userId,
      generation.prompt,
      generation.style,
      generation.imageUrl,
      generation.status,
      createdAt
    );

    return {
      id,
      userId: generation.userId,
      prompt: generation.prompt,
      style: generation.style,
      imageUrl: generation.imageUrl,
      status: generation.status,
      createdAt: new Date(createdAt),
    };
  }

  static findByUserId(userId: string): Generation[] {
    const stmt = db.prepare(
      'SELECT * FROM generations WHERE userId = ? ORDER BY createdAt DESC'
    );
    const rows = stmt.all(userId) as Array<{
      id: string;
      userId: string;
      prompt: string;
      style: string;
      imageUrl: string;
      status: string;
      createdAt: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      userId: row.userId,
      prompt: row.prompt,
      style: row.style,
      imageUrl: row.imageUrl,
      status: row.status as 'pending' | 'completed' | 'failed',
      createdAt: new Date(row.createdAt),
    }));
  }

  static findById(id: string): Generation | null {
    const stmt = db.prepare('SELECT * FROM generations WHERE id = ?');
    const row = stmt.get(id) as
      | {
          id: string;
          userId: string;
          prompt: string;
          style: string;
          imageUrl: string;
          status: string;
          createdAt: string;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.userId,
      prompt: row.prompt,
      style: row.style,
      imageUrl: row.imageUrl,
      status: row.status as 'pending' | 'completed' | 'failed',
      createdAt: new Date(row.createdAt),
    };
  }
}
