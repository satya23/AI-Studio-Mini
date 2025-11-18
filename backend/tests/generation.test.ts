/// <reference types="jest" />
import { GenerationModel } from '../src/models/generation.model.js';
import db from '../src/db/database.js';

describe('GenerationModel', () => {
  beforeEach(() => {
    // Clear generations table before each test
    db.exec('DELETE FROM generations');
  });

  describe('create', () => {
    it('should create a new generation successfully', () => {
      const generationData = {
        userId: 'user-123',
        prompt: 'A beautiful sunset over mountains',
        style: 'realistic',
        imageUrl: 'https://example.com/image.jpg',
        status: 'pending' as const,
      };

      const result = GenerationModel.create(generationData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId', 'user-123');
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

    it('should generate unique IDs for different generations', () => {
      const generationData1 = {
        userId: 'user-123',
        prompt: 'Prompt 1',
        style: 'style1',
        imageUrl: 'https://example.com/image1.jpg',
        status: 'pending' as const,
      };

      const generationData2 = {
        userId: 'user-123',
        prompt: 'Prompt 2',
        style: 'style2',
        imageUrl: 'https://example.com/image2.jpg',
        status: 'pending' as const,
      };

      const gen1 = GenerationModel.create(generationData1);
      const gen2 = GenerationModel.create(generationData2);

      expect(gen1.id).not.toBe(gen2.id);
    });

    it('should set createdAt timestamp', () => {
      const generationData = {
        userId: 'user-123',
        prompt: 'Test prompt',
        style: 'test',
        imageUrl: 'https://example.com/image.jpg',
        status: 'pending' as const,
      };

      const before = new Date();
      const result = GenerationModel.create(generationData);
      const after = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('findByUserId', () => {
    it('should return all generations for a user', () => {
      const userId = 'user-123';
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

      GenerationModel.create(generationData1);
      GenerationModel.create(generationData2);

      const results = GenerationModel.findByUserId(userId);

      expect(results).toHaveLength(2);
      expect(results[0].prompt).toBe('Prompt 2'); // Should be ordered by createdAt DESC
      expect(results[1].prompt).toBe('Prompt 1');
    });

    it('should return empty array for user with no generations', () => {
      const results = GenerationModel.findByUserId('non-existent-user');
      expect(results).toHaveLength(0);
    });

    it('should only return generations for the specified user', () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';

      GenerationModel.create({
        userId: userId1,
        prompt: 'User 1 prompt',
        style: 'style1',
        imageUrl: 'https://example.com/image1.jpg',
        status: 'pending' as const,
      });

      GenerationModel.create({
        userId: userId2,
        prompt: 'User 2 prompt',
        style: 'style2',
        imageUrl: 'https://example.com/image2.jpg',
        status: 'pending' as const,
      });

      const results = GenerationModel.findByUserId(userId1);
      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(userId1);
      expect(results[0].prompt).toBe('User 1 prompt');
    });
  });

  describe('findById', () => {
    it('should return generation by id', () => {
      const generationData = {
        userId: 'user-123',
        prompt: 'Test prompt',
        style: 'test',
        imageUrl: 'https://example.com/image.jpg',
        status: 'pending' as const,
      };

      const created = GenerationModel.create(generationData);
      const found = GenerationModel.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.prompt).toBe('Test prompt');
    });

    it('should return null for non-existent id', () => {
      const found = GenerationModel.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });
});
