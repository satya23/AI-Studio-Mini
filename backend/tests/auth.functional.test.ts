import request from 'supertest';
import app from '../src/index.js';
import db from '../src/db/database.js';

describe('POST /auth/signup', () => {
  beforeEach(() => {
    // Clear users table before each test
    db.exec('DELETE FROM users');
  });

  describe('Successful signup', () => {
    it('should create a new user with valid data', async () => {
      const response = await request(app).post('/auth/signup').send({
        email: 'newuser@example.com',
        password: 'Password123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        'message',
        'User created successfully'
      );
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty(
        'email',
        'newuser@example.com'
      );
      expect(response.body.user).toHaveProperty('createdAt');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 409 if user already exists', async () => {
      // Create user first
      await request(app).post('/auth/signup').send({
        email: 'duplicate@example.com',
        password: 'Password123',
      });

      // Try to create same user again
      const response = await request(app).post('/auth/signup').send({
        email: 'duplicate@example.com',
        password: 'Password123',
      });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty(
        'message',
        'User with this email already exists'
      );
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for invalid email', async () => {
      const response = await request(app).post('/auth/signup').send({
        email: 'invalid-email',
        password: 'Password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app).post('/auth/signup').send({
        password: 'Password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app).post('/auth/signup').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for password too short', async () => {
      const response = await request(app).post('/auth/signup').send({
        email: 'test@example.com',
        password: 'Short1',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for password without uppercase letter', async () => {
      const response = await request(app).post('/auth/signup').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for password without lowercase letter', async () => {
      const response = await request(app).post('/auth/signup').send({
        email: 'test@example.com',
        password: 'PASSWORD123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for password without number', async () => {
      const response = await request(app).post('/auth/signup').send({
        email: 'test@example.com',
        password: 'Password',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', async () => {
      const response = await request(app).post('/auth/signup').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });
});

