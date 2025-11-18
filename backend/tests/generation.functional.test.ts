/// <reference types="jest" />
import request from 'supertest';
import app from '../src/index.js';
import db from '../src/db/database.js';

// Helper function to create a user and get auth token
async function createUserAndGetToken() {
  const email = `test${Date.now()}@example.com`;
  const password = 'Password123';

  // Sign up
  await request(app).post('/auth/signup').send({
    email,
    password,
  });

  // Login to get token
  const loginResponse = await request(app).post('/auth/login').send({
    email,
    password,
  });

  return {
    token: loginResponse.body.token,
    userId: loginResponse.body.user.id,
    email,
  };
}

describe('POST /generations', () => {
  beforeEach(() => {
    // Clear generations and users tables before each test
    db.exec('DELETE FROM generations');
    db.exec('DELETE FROM users');
  });

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).post('/generations').send({
        prompt: 'A beautiful sunset',
        style: 'realistic',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should return 403 when invalid token is provided', async () => {
      const response = await request(app)
        .post('/generations')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          prompt: 'A beautiful sunset',
          style: 'realistic',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid or expired token'
      );
    });
  });

  describe('Successful generation creation', () => {
    it('should create a new generation with valid data', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'A beautiful sunset over mountains',
          style: 'realistic',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty(
        'prompt',
        'A beautiful sunset over mountains'
      );
      expect(response.body).toHaveProperty('style', 'realistic');
      expect(response.body).toHaveProperty('imageUrl');
      expect(response.body).toHaveProperty('status', 'completed');
      expect(response.body).toHaveProperty('createdAt');
      // Should not include userId in response
      expect(response.body).not.toHaveProperty('userId');
    });

    it('should generate a placeholder image URL when imageUpload not provided', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Test prompt',
          style: 'artistic',
        });

      expect(response.status).toBe(201);
      expect(response.body.imageUrl).toContain('placeholder.com');
      expect(response.body.imageUrl).toContain('text=');
    });

    it('should use imageUpload when provided', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Test prompt',
          style: 'artistic',
          imageUpload: 'https://example.com/custom-image.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body.imageUrl).toBe(
        'https://example.com/custom-image.jpg'
      );
    });

    it('should create generation with completed status', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Test prompt',
          style: 'test',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('completed');
    });

    it('should simulate generation delay (1-2 seconds)', async () => {
      const { token } = await createUserAndGetToken();

      const startTime = Date.now();
      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Test prompt',
          style: 'test',
        });
      const endTime = Date.now();

      expect(response.status).toBe(201);
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(1000);
      expect(duration).toBeLessThan(3000); // Allow some buffer
    });
  });

  describe('Model overloaded error (20% chance)', () => {
    it('should handle model overloaded error when it occurs', async () => {
      const { token } = await createUserAndGetToken();

      // Try multiple times to increase chance of hitting the 20% error
      let errorOccurred = false;
      for (let i = 0; i < 20; i++) {
        const response = await request(app)
          .post('/generations')
          .set('Authorization', `Bearer ${token}`)
          .send({
            prompt: `Test prompt ${i}`,
            style: 'test',
          });

        if (response.status === 503) {
          expect(response.body).toHaveProperty('message', 'Model overloaded');
          errorOccurred = true;
          break;
        }
      }

      // At least one should have hit the error (statistically likely)
      // Note: This test may occasionally fail due to randomness, but it's acceptable
      expect(errorOccurred).toBe(true);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for missing prompt', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          style: 'realistic',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for missing style', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'A beautiful landscape',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for empty prompt', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: '',
          style: 'realistic',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for empty style', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'A beautiful landscape',
          style: '',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for prompt too long', async () => {
      const { token } = await createUserAndGetToken();
      const longPrompt = 'a'.repeat(501);

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: longPrompt,
          style: 'realistic',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for style too long', async () => {
      const { token } = await createUserAndGetToken();
      const longStyle = 'a'.repeat(101);

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'A beautiful landscape',
          style: longStyle,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should handle prompt at maximum length', async () => {
      const { token } = await createUserAndGetToken();
      const maxPrompt = 'a'.repeat(500);

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: maxPrompt,
          style: 'realistic',
        });

      expect(response.status).toBe(201);
      expect(response.body.prompt).toBe(maxPrompt);
    });

    it('should handle style at maximum length', async () => {
      const { token } = await createUserAndGetToken();
      const maxStyle = 'a'.repeat(100);

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'A beautiful landscape',
          style: maxStyle,
        });

      expect(response.status).toBe(201);
      expect(response.body.style).toBe(maxStyle);
    });

    it('should handle special characters in prompt', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'A sunset with 🌅 and special chars: !@#$%',
          style: 'artistic',
        });

      expect(response.status).toBe(201);
      expect(response.body.prompt).toBe(
        'A sunset with 🌅 and special chars: !@#$%'
      );
    });
  });
});

describe('GET /generations', () => {
  beforeEach(() => {
    // Clear generations and users tables before each test
    db.exec('DELETE FROM generations');
    db.exec('DELETE FROM users');
  });

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get('/generations');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should return 403 when invalid token is provided', async () => {
      const response = await request(app)
        .get('/generations')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid or expired token'
      );
    });
  });

  describe('Successful retrieval', () => {
    it('should return generations with default limit of 5', async () => {
      const { token } = await createUserAndGetToken();

      // Create 7 generations
      for (let i = 0; i < 7; i++) {
        await request(app)
          .post('/generations')
          .set('Authorization', `Bearer ${token}`)
          .send({
            prompt: `Generation ${i + 1}`,
            style: 'realistic',
          });
      }

      const response = await request(app)
        .get('/generations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Generations retrieved successfully'
      );
      expect(response.body).toHaveProperty('generations');
      expect(response.body).toHaveProperty('count', 5);
      expect(Array.isArray(response.body.generations)).toBe(true);
      expect(response.body.generations).toHaveLength(5);
    });

    it('should respect limit query parameter', async () => {
      const { token } = await createUserAndGetToken();

      // Create 10 generations
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/generations')
          .set('Authorization', `Bearer ${token}`)
          .send({
            prompt: `Generation ${i + 1}`,
            style: 'realistic',
          });
      }

      const response = await request(app)
        .get('/generations?limit=3')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
      expect(response.body.generations).toHaveLength(3);
    });

    it('should return generations ordered by createdAt DESC', async () => {
      const { token } = await createUserAndGetToken();

      // Create generations with a small delay
      const response1 = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'First generation',
          style: 'realistic',
        });

      await new Promise(resolve => setTimeout(resolve, 10));

      const response2 = await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Second generation',
          style: 'artistic',
        });

      const getResponse = await request(app)
        .get('/generations')
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.generations).toHaveLength(2);
      // Most recent should be first
      expect(getResponse.body.generations[0].id).toBe(response2.body.id);
      expect(getResponse.body.generations[1].id).toBe(response1.body.id);
    });

    it('should return empty array when user has no generations', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .get('/generations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('generations');
      expect(response.body).toHaveProperty('count', 0);
      expect(response.body.generations).toHaveLength(0);
      expect(Array.isArray(response.body.generations)).toBe(true);
    });

    it('should return generation with all required fields', async () => {
      const { token } = await createUserAndGetToken();

      await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Test generation',
          style: 'test',
        });

      const response = await request(app)
        .get('/generations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.generations).toHaveLength(1);

      const generation = response.body.generations[0];
      expect(generation).toHaveProperty('id');
      expect(generation).toHaveProperty('userId');
      expect(generation).toHaveProperty('prompt', 'Test generation');
      expect(generation).toHaveProperty('style', 'test');
      expect(generation).toHaveProperty('imageUrl');
      expect(generation).toHaveProperty('status');
      expect(generation).toHaveProperty('createdAt');
    });

    it('should only return generations for the authenticated user', async () => {
      const { token: token1, userId: userId1 } = await createUserAndGetToken();
      const { token: token2, userId: userId2 } = await createUserAndGetToken();

      // Create generation for user 1
      await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          prompt: 'User 1 generation',
          style: 'realistic',
        });

      // Create generation for user 2
      await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          prompt: 'User 2 generation',
          style: 'artistic',
        });

      // Get generations for user 1
      const response1 = await request(app)
        .get('/generations')
        .set('Authorization', `Bearer ${token1}`);

      expect(response1.status).toBe(200);
      expect(response1.body.generations).toHaveLength(1);
      expect(response1.body.generations[0].userId).toBe(userId1);
      expect(response1.body.generations[0].prompt).toBe('User 1 generation');

      // Get generations for user 2
      const response2 = await request(app)
        .get('/generations')
        .set('Authorization', `Bearer ${token2}`);

      expect(response2.status).toBe(200);
      expect(response2.body.generations).toHaveLength(1);
      expect(response2.body.generations[0].userId).toBe(userId2);
      expect(response2.body.generations[0].prompt).toBe('User 2 generation');
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for invalid limit parameter', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .get('/generations?limit=invalid')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid limit parameter'
      );
    });

    it('should return 400 for negative limit', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .get('/generations?limit=-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid limit parameter'
      );
    });

    it('should return 400 for zero limit', async () => {
      const { token } = await createUserAndGetToken();

      const response = await request(app)
        .get('/generations?limit=0')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid limit parameter'
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple generations correctly', async () => {
      const { token } = await createUserAndGetToken();

      // Create 5 generations
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/generations')
          .set('Authorization', `Bearer ${token}`)
          .send({
            prompt: `Generation ${i + 1}`,
            style: 'style',
          });
      }

      const response = await request(app)
        .get('/generations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(5);
      expect(response.body.generations).toHaveLength(5);
    });

    it('should return correct count in response', async () => {
      const { token } = await createUserAndGetToken();

      await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Generation 1',
          style: 'style1',
        });

      await request(app)
        .post('/generations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Generation 2',
          style: 'style2',
        });

      const response = await request(app)
        .get('/generations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(response.body.generations.length).toBe(response.body.count);
    });
  });
});
