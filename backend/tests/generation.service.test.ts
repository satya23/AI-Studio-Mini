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
});
