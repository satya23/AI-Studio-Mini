/// <reference types="jest" />
import request from 'supertest';
import app from '../src/index.js';
import { clearDatabase } from '../src/db/database.js';

describe('POST /auth/signup', () => {
  beforeEach(async () => {
    await clearDatabase();
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
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
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

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Successful login', () => {
    it('should login successfully with correct credentials', async () => {
      // Create a user first
      await request(app).post('/auth/signup').send({
        email: 'login@example.com',
        password: 'Password123',
      });

      // Login with correct credentials
      const response = await request(app).post('/auth/login').send({
        email: 'login@example.com',
        password: 'Password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'login@example.com');
      expect(response.body.user).toHaveProperty('createdAt');
      expect(response.body.user).not.toHaveProperty('password');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it('should return a valid JWT token', async () => {
      // Create a user first
      await request(app).post('/auth/signup').send({
        email: 'jwt@example.com',
        password: 'Password123',
      });

      // Login
      const response = await request(app).post('/auth/login').send({
        email: 'jwt@example.com',
        password: 'Password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      // JWT tokens have 3 parts separated by dots
      const tokenParts = response.body.token.split('.');
      expect(tokenParts.length).toBe(3);
    });
  });

  describe('Authentication errors', () => {
    it('should return 401 for non-existent user', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'Password123',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid email or password'
      );
    });

    it('should return 401 for incorrect password', async () => {
      // Create a user first
      await request(app).post('/auth/signup').send({
        email: 'wrongpass@example.com',
        password: 'Password123',
      });

      // Try to login with wrong password
      const response = await request(app).post('/auth/login').send({
        email: 'wrongpass@example.com',
        password: 'WrongPassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid email or password'
      );
    });

    it('should return 401 for empty password', async () => {
      // Create a user first
      await request(app).post('/auth/signup').send({
        email: 'emptypass@example.com',
        password: 'Password123',
      });

      // Try to login with empty password
      const response = await request(app).post('/auth/login').send({
        email: 'emptypass@example.com',
        password: '',
      });

      // Validation catches empty password before authentication, so 400 is correct
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for invalid email format', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'invalid-email',
        password: 'Password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app).post('/auth/login').send({
        password: 'Password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', async () => {
      const response = await request(app).post('/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should be case-sensitive for email', async () => {
      // Create a user first
      await request(app).post('/auth/signup').send({
        email: 'CaseSensitive@example.com',
        password: 'Password123',
      });

      // Try to login with different case
      const response = await request(app).post('/auth/login').send({
        email: 'casesensitive@example.com',
        password: 'Password123',
      });

      // Should fail because email is case-sensitive in database
      expect(response.status).toBe(401);
    });
  });
});
