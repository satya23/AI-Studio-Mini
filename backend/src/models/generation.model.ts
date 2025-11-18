import { getDatabase, saveDatabase } from '../db/database.js';
import { Generation } from '../types/index.js';

export class GenerationModel {
  static async create(
    generation: Omit<Generation, 'id' | 'createdAt'>
  ): Promise<Generation> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const db = await getDatabase();
    db.run(
      'INSERT INTO generations (id, userId, prompt, style, imageUrl, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        generation.userId,
        generation.prompt,
        generation.style,
        generation.imageUrl,
        generation.status,
        createdAt,
      ]
    );
    await saveDatabase();

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

  static async findByUserId(userId: string): Promise<Generation[]> {
    const db = await getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM generations WHERE userId = ? ORDER BY createdAt DESC'
    );
    stmt.bind([userId]);
    const rows: Array<{
      id: string;
      userId: string;
      prompt: string;
      style: string;
      imageUrl: string;
      status: string;
      createdAt: string;
    }> = [];

    while (stmt.step()) {
      rows.push(stmt.getAsObject() as (typeof rows)[number]);
    }

    stmt.free();

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

  static async findById(id: string): Promise<Generation | null> {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM generations WHERE id = ?');
    stmt.bind([id]);
    const row = stmt.step()
      ? (stmt.getAsObject() as {
          id: string;
          userId: string;
          prompt: string;
          style: string;
          imageUrl: string;
          status: string;
          createdAt: string;
        })
      : undefined;
    stmt.free();

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
