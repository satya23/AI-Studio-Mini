/// <reference types="jest" />
import { GenerationService } from '../src/services/generation.service.js';
import { GenerationModel } from '../src/models/generation.model.js';
import db from '../src/db/database.js';

describe('GenerationService', () => {
  beforeEach(() => {
    // Clear generations table before each test
    db.exec('DELETE FROM generations');
  });

  describe('create', () => {
    it('should create a generation successfully', async () => {
      const userId = 'user-123';
      const input = {
        prompt: 'A beautiful landscape',
        style: 'realistic',
      };

      const result = await GenerationService.create(userId, input);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId', userId);
      expect(result).toHaveProperty('prompt', 'A beautiful landscape');
      expect(result).toHaveProperty('style', 'realistic');
      expect(result).toHaveProperty('imageUrl');
      expect(result.imageUrl).toContain('placeholder.com');
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('createdAt');
    });

    it('should generate image URL with encoded prompt', async () => {
      const userId = 'user-123';
      const input = {
        prompt: 'Sunset over ocean',
        style: 'artistic',
      };

      const result = await GenerationService.create(userId, input);

      expect(result.imageUrl).toContain('placeholder.com');
      expect(result.imageUrl).toContain('text=');
    });

    it('should create generation in database', async () => {
      const userId = 'user-123';
      const input = {
        prompt: 'Test prompt',
        style: 'test',
      };

      const result = await GenerationService.create(userId, input);

      // Verify it was saved to database
      const found = GenerationModel.findById(result.id);
      expect(found).not.toBeNull();
      expect(found?.prompt).toBe('Test prompt');
    });

    it('should create generation with pending status', async () => {
      const userId = 'user-123';
      const input = {
        prompt: 'Test prompt',
        style: 'test',
      };

      const result = await GenerationService.create(userId, input);

      expect(result.status).toBe('pending');
    });

    it('should handle different user IDs', async () => {
      const input = {
        prompt: 'Same prompt',
        style: 'same style',
      };

      const result1 = await GenerationService.create('user-1', input);
      const result2 = await GenerationService.create('user-2', input);

      expect(result1.userId).toBe('user-1');
      expect(result2.userId).toBe('user-2');
      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('getByUserId', () => {
    it('should return all generations for a user', async () => {
      const userId = 'user-123';
      const input1 = {
        prompt: 'Prompt 1',
        style: 'style1',
      };
      const input2 = {
        prompt: 'Prompt 2',
        style: 'style2',
      };

      await GenerationService.create(userId, input1);
      await GenerationService.create(userId, input2);

      const results = await GenerationService.getByUserId(userId);

      expect(results).toHaveLength(2);
      expect(results[0].prompt).toBe('Prompt 2'); // Should be ordered by createdAt DESC
      expect(results[1].prompt).toBe('Prompt 1');
    });

    it('should return empty array for user with no generations', async () => {
      const results = await GenerationService.getByUserId('non-existent-user');
      expect(results).toHaveLength(0);
    });

    it('should only return generations for the specified user', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      await GenerationService.create(userId1, {
        prompt: 'User 1 prompt',
        style: 'style1',
      });

      await GenerationService.create(userId2, {
        prompt: 'User 2 prompt',
        style: 'style2',
      });

      const results = await GenerationService.getByUserId(userId1);

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(userId1);
      expect(results[0].prompt).toBe('User 1 prompt');
    });

    it('should return generations ordered by createdAt DESC', async () => {
      const userId = 'user-123';

      const gen1 = await GenerationService.create(userId, {
        prompt: 'First prompt',
        style: 'style1',
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const gen2 = await GenerationService.create(userId, {
        prompt: 'Second prompt',
        style: 'style2',
      });

      const results = await GenerationService.getByUserId(userId);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(gen2.id); // Most recent first
      expect(results[1].id).toBe(gen1.id);
    });
  });
});
