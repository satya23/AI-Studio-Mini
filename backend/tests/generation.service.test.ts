/// <reference types="jest" />
import { GenerationService } from '../src/services/generation.js';
import { GenerationModel } from '../src/models/generation.model.js';
import { UserModel } from '../src/models/user.model.js';
import { clearDatabase } from '../src/db/database.js';

let userCounter = 0;
const createUser = async () => {
  userCounter++;
  return await UserModel.create({
    email: `test-${Date.now()}-${userCounter}-${Math.random().toString(36).substring(7)}@example.com`,
    password: 'password123',
  });
};

describe('GenerationService', () => {
  let randomSpy: jest.SpyInstance<number, []>;

  beforeEach(async () => {
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    await clearDatabase();
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  describe('create', () => {
    it('should create a generation successfully', async () => {
      const user = await createUser();
      const input = {
        prompt: 'A beautiful landscape',
        style: 'realistic',
      };

      const result = await GenerationService.create(user.id, input);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId', user.id);
      expect(result).toHaveProperty('prompt', 'A beautiful landscape');
      expect(result).toHaveProperty('style', 'realistic');
      expect(result).toHaveProperty('imageUrl');
      expect(result.imageUrl).toContain('placeholder.com');
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('createdAt');
    });

    it('should generate image URL with encoded prompt', async () => {
      const user = await createUser();
      const input = {
        prompt: 'Sunset over ocean',
        style: 'artistic',
      };

      const result = await GenerationService.create(user.id, input);

      expect(result.imageUrl).toContain('placeholder.com');
      expect(result.imageUrl).toContain('text=');
    });

    it('should create generation in database', async () => {
      const user = await createUser();
      const input = {
        prompt: 'Test prompt',
        style: 'test',
      };

      const result = await GenerationService.create(user.id, input);

      // Verify it was saved to database
      const found = await GenerationModel.findById(result.id);
      expect(found).not.toBeNull();
      expect(found?.prompt).toBe('Test prompt');
    });

    it('should create generation with completed status', async () => {
      const user = await createUser();
      const input = {
        prompt: 'Test prompt',
        style: 'test',
      };

      const result = await GenerationService.create(user.id, input);

      expect(result.status).toBe('completed');
    });

    it('should simulate generation delay (1-2 seconds)', async () => {
      const user = await createUser();
      const input = {
        prompt: 'Test prompt',
        style: 'test',
      };

      const startTime = Date.now();
      await GenerationService.create(user.id, input);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(1000);
      expect(duration).toBeLessThan(3000); // Allow some buffer
    });

    it('should use imageUpload if provided', async () => {
      const user = await createUser();
      const input = {
        prompt: 'Test prompt',
        style: 'test',
        imageUpload: 'https://example.com/custom-image.jpg',
      };

      const result = await GenerationService.create(user.id, input);

      expect(result.imageUrl).toBe('https://example.com/custom-image.jpg');
    });

    it('should handle different user IDs', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      const input = {
        prompt: 'Same prompt',
        style: 'same style',
      };

      const result1 = await GenerationService.create(user1.id, input);
      const result2 = await GenerationService.create(user2.id, input);

      expect(result1.userId).toBe(user1.id);
      expect(result2.userId).toBe(user2.id);
      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('getByUserId', () => {
    it('should return all generations for a user', async () => {
      const user = await createUser();
      const input1 = {
        prompt: 'Prompt 1',
        style: 'style1',
      };
      const input2 = {
        prompt: 'Prompt 2',
        style: 'style2',
      };

      await GenerationService.create(user.id, input1);
      await GenerationService.create(user.id, input2);

      const results = await GenerationService.getByUserId(user.id);

      expect(results).toHaveLength(2);
      expect(results[0].prompt).toBe('Prompt 2'); // Should be ordered by createdAt DESC
      expect(results[1].prompt).toBe('Prompt 1');
    });

    it('should return empty array for user with no generations', async () => {
      const results = await GenerationService.getByUserId('non-existent-user');
      expect(results).toHaveLength(0);
    });

    it('should only return generations for the specified user', async () => {
      const user1 = await createUser();
      const user2 = await createUser();

      await GenerationService.create(user1.id, {
        prompt: 'User 1 prompt',
        style: 'style1',
      });

      await GenerationService.create(user2.id, {
        prompt: 'User 2 prompt',
        style: 'style2',
      });

      const results = await GenerationService.getByUserId(user1.id);

      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe(user1.id);
      expect(results[0].prompt).toBe('User 1 prompt');
    });

    it('should return generations ordered by createdAt DESC', async () => {
      const user = await createUser();

      const gen1 = await GenerationService.create(user.id, {
        prompt: 'First prompt',
        style: 'style1',
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const gen2 = await GenerationService.create(user.id, {
        prompt: 'Second prompt',
        style: 'style2',
      });

      const results = await GenerationService.getByUserId(user.id);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(gen2.id); // Most recent first
      expect(results[1].id).toBe(gen1.id);
    });

    it('should respect limit parameter', async () => {
      const user = await createUser();

      // Create 5 generations
      for (let i = 0; i < 5; i++) {
        await GenerationService.create(user.id, {
          prompt: `Prompt ${i + 1}`,
          style: 'style',
        });
      }

      const results = await GenerationService.getByUserId(user.id, 3);

      expect(results).toHaveLength(3);
    }, 15000); // Increase timeout to 15 seconds for 5 generations with delays

    it('should return all generations when limit is not provided', async () => {
      const user = await createUser();

      // Create 3 generations
      for (let i = 0; i < 3; i++) {
        await GenerationService.create(user.id, {
          prompt: `Prompt ${i + 1}`,
          style: 'style',
        });
      }

      const results = await GenerationService.getByUserId(user.id);

      expect(results).toHaveLength(3);
    });
  });
});
