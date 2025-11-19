/// <reference types="jest" />
import { GenerationModel } from '../src/models/generation.model.js';
import { UserModel } from '../src/models/user.model.js';
import { clearDatabase } from '../src/db/database.js';

const createUserForId = async (userId: string) => {
  const user = await UserModel.create({
    email: `${userId}-${Date.now()}@example.com`,
    password: 'password123',
  });
  return user.id;
};

describe('GenerationModel', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('create', () => {
    it('should create a new generation successfully', async () => {
      const userId = await createUserForId('user-123');
      const generationData = {
        userId,
        prompt: 'A beautiful sunset over mountains',
        style: 'realistic',
        imageUrl: 'https://example.com/image.jpg',
        status: 'pending' as const,
      };

      const result = await GenerationModel.create(generationData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId', userId);
      expect(result).toHaveProperty(
        'prompt',
        'A beautiful sunset over mountains'
      );
      expect(result).toHaveProperty('style', 'realistic');
      expect(result).toHaveProperty(
        'imageUrl',
        'https://example.com/image.jpg'
      );
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('createdAt');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs for different generations', async () => {
      const userId = await createUserForId('user-123');
      const generationData1 = {
        userId,
        prompt: 'Prompt 1',
        style: 'style1',
        imageUrl: 'https://example.com/image1.jpg',
        status: 'pending' as const,
      };

      const generationData2 = {
        userId,
        prompt: 'Prompt 2',
        style: 'style2',
        imageUrl: 'https://example.com/image2.jpg',
        status: 'pending' as const,
      };

      const gen1 = await GenerationModel.create(generationData1);
      const gen2 = await GenerationModel.create(generationData2);

      expect(gen1.id).not.toBe(gen2.id);
    });

    it('should set createdAt timestamp', async () => {
      const userId = await createUserForId('user-123');
      const generationData = {
        userId,
        prompt: 'Test prompt',
        style: 'test',
        imageUrl: 'https://example.com/image.jpg',
        status: 'pending' as const,
      };

      const before = new Date();
      const result = await GenerationModel.create(generationData);
      const after = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('findByUserId', () => {
    it('should return all generations for a user', async () => {
      const userId = await createUserForId('user-123');
      const generationData1 = {
        userId,
        prompt: 'Prompt 1',
        style: 'style1',
        imageUrl: 'https://example.com/image1.jpg',
        status: 'pending' as const,
      };
      const generationData2 = {
        userId,
        prompt: 'Prompt 2',
        style: 'style2',
        imageUrl: 'https://example.com/image2.jpg',
        status: 'completed' as const,
      };

      const gen1 = await GenerationModel.create(generationData1);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const gen2 = await GenerationModel.create(generationData2);

      const results = await GenerationModel.findByUserId(userId);

      expect(results).toHaveLength(2);
      // Should be ordered by createdAt DESC (most recent first)
      expect(results[0].id).toBe(gen2.id);
      expect(results[1].id).toBe(gen1.id);
    });

    it('should return empty array for user with no generations', async () => {
      const results = await GenerationModel.findByUserId('non-existent-user');
      expect(results).toHaveLength(0);
    });

    it('should only return generations for the specified user', async () => {
      const userId1 = await createUserForId('user-123');
      const userId2 = await createUserForId('user-456');

      await GenerationModel.create({
        userId: userId1,
        prompt: 'User 1 prompt',
        style: 'style1',
        imageUrl: 'https://example.com/image1.jpg',
        status: 'pending' as const,
      });

      await GenerationModel.create({
        userId: userId2,
        prompt: 'User 2 prompt',
        style: 'style2',
        imageUrl: 'https://example.com/image2.jpg',
        status: 'pending' as const,
      });

      const results = await GenerationModel.findByUserId(userId1);
      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(userId1);
      expect(results[0].prompt).toBe('User 1 prompt');
    });
  });

  describe('findById', () => {
    it('should return generation by id', async () => {
      const userId = await createUserForId('user-123');
      const generationData = {
        userId,
        prompt: 'Test prompt',
        style: 'test',
        imageUrl: 'https://example.com/image.jpg',
        status: 'pending' as const,
      };

      const created = await GenerationModel.create(generationData);
      const found = await GenerationModel.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.prompt).toBe('Test prompt');
    });

    it('should return null for non-existent id', async () => {
      const found = await GenerationModel.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });
});
