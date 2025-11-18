/// <reference types="jest" />
import request from 'supertest';
import app from '../src/index.js';
import db from '../src/db/database.js';

describe('POST /generations', () => {
  beforeEach(() => {
    // Clear generations and users tables before each test
    db.exec('DELETE FROM generations');
    db.exec('DELETE FROM users');
  });

  describe('Successful generation creation', () => {
    it('should create a new generation with valid data', async () => {
      const response = await request(app).post('/generations').send({
        prompt: 'A beautiful sunset over mountains',
        style: 'realistic',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        'message',
        'Generation created successfully'
      );
      expect(response.body).toHaveProperty('generation');
      expect(response.body.generation).toHaveProperty('id');
      expect(response.body.generation).toHaveProperty('userId');
      expect(response.body.generation).toHaveProperty(
        'prompt',
        'A beautiful sunset over mountains'
      );
      expect(response.body.generation).toHaveProperty('style', 'realistic');
      expect(response.body.generation).toHaveProperty('imageUrl');
      expect(response.body.generation).toHaveProperty('status', 'pending');
      expect(response.body.generation).toHaveProperty('createdAt');
    });

    it('should generate a placeholder image URL', async () => {
      const response = await request(app).post('/generations').send({
        prompt: 'Test prompt',
        style: 'artistic',
      });

      expect(response.status).toBe(201);
      expect(response.body.generation.imageUrl).toContain('placeholder.com');
      expect(response.body.generation.imageUrl).toContain('text=');
    });

    it('should create generation with pending status', async () => {
      const response = await request(app).post('/generations').send({
        prompt: 'Test prompt',
        style: 'test',
      });

      expect(response.status).toBe(201);
      expect(response.body.generation.status).toBe('pending');
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for missing prompt', async () => {
      const response = await request(app).post('/generations').send({
        style: 'realistic',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for missing style', async () => {
      const response = await request(app).post('/generations').send({
        prompt: 'A beautiful landscape',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for empty prompt', async () => {
      const response = await request(app).post('/generations').send({
        prompt: '',
        style: 'realistic',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for empty style', async () => {
      const response = await request(app).post('/generations').send({
        prompt: 'A beautiful landscape',
        style: '',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for prompt too long', async () => {
      const longPrompt = 'a'.repeat(501);
      const response = await request(app).post('/generations').send({
        prompt: longPrompt,
        style: 'realistic',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for style too long', async () => {
      const longStyle = 'a'.repeat(101);
      const response = await request(app).post('/generations').send({
        prompt: 'A beautiful landscape',
        style: longStyle,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for non-string prompt', async () => {
      const response = await request(app).post('/generations').send({
        prompt: 123,
        style: 'realistic',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for non-string style', async () => {
      const response = await request(app).post('/generations').send({
        prompt: 'A beautiful landscape',
        style: 123,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', async () => {
      const response = await request(app).post('/generations').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/generations')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle prompt at maximum length', async () => {
      const maxPrompt = 'a'.repeat(500);
      const response = await request(app).post('/generations').send({
        prompt: maxPrompt,
        style: 'realistic',
      });

      expect(response.status).toBe(201);
      expect(response.body.generation.prompt).toBe(maxPrompt);
    });

    it('should handle style at maximum length', async () => {
      const maxStyle = 'a'.repeat(100);
      const response = await request(app).post('/generations').send({
        prompt: 'A beautiful landscape',
        style: maxStyle,
      });

      expect(response.status).toBe(201);
      expect(response.body.generation.style).toBe(maxStyle);
    });

    it('should handle special characters in prompt', async () => {
      const response = await request(app).post('/generations').send({
        prompt: 'A sunset with 🌅 and special chars: !@#$%',
        style: 'artistic',
      });

      expect(response.status).toBe(201);
      expect(response.body.generation.prompt).toBe(
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

  describe('Successful retrieval', () => {
    it('should return all generations for the user', async () => {
      // Create some generations
      await request(app).post('/generations').send({
        prompt: 'First generation',
        style: 'realistic',
      });

      await request(app).post('/generations').send({
        prompt: 'Second generation',
        style: 'artistic',
      });

      const response = await request(app).get('/generations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'message',
        'Generations retrieved successfully'
      );
      expect(response.body).toHaveProperty('generations');
      expect(response.body).toHaveProperty('count', 2);
      expect(Array.isArray(response.body.generations)).toBe(true);
      expect(response.body.generations).toHaveLength(2);
    });

    it('should return generations ordered by createdAt DESC', async () => {
      // Create generations with a small delay
      const response1 = await request(app).post('/generations').send({
        prompt: 'First generation',
        style: 'realistic',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const response2 = await request(app).post('/generations').send({
        prompt: 'Second generation',
        style: 'artistic',
      });

      const getResponse = await request(app).get('/generations');

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.generations).toHaveLength(2);
      // Most recent should be first
      expect(getResponse.body.generations[0].id).toBe(
        response2.body.generation.id
      );
      expect(getResponse.body.generations[1].id).toBe(
        response1.body.generation.id
      );
    });

    it('should return empty array when user has no generations', async () => {
      const response = await request(app).get('/generations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('generations');
      expect(response.body).toHaveProperty('count', 0);
      expect(response.body.generations).toHaveLength(0);
      expect(Array.isArray(response.body.generations)).toBe(true);
    });

    it('should return generation with all required fields', async () => {
      await request(app).post('/generations').send({
        prompt: 'Test generation',
        style: 'test',
      });

      const response = await request(app).get('/generations');

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
  });

  describe('Edge cases', () => {
    it('should handle multiple generations correctly', async () => {
      // Create 5 generations
      for (let i = 0; i < 5; i++) {
        await request(app).post('/generations').send({
          prompt: `Generation ${i + 1}`,
          style: 'style',
        });
      }

      const response = await request(app).get('/generations');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(5);
      expect(response.body.generations).toHaveLength(5);
    });

    it('should return correct count in response', async () => {
      await request(app).post('/generations').send({
        prompt: 'Generation 1',
        style: 'style1',
      });

      await request(app).post('/generations').send({
        prompt: 'Generation 2',
        style: 'style2',
      });

      const response = await request(app).get('/generations');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      expect(response.body.generations.length).toBe(response.body.count);
    });
  });
});
