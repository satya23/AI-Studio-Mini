/// <reference types="jest" />
import { AuthService } from '../src/services/auth.service.js';
import { UserModel } from '../src/models/user.model.js';
import { clearDatabase } from '../src/db/database.js';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const result = await AuthService.signup(input);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await UserModel.findByEmail('test@example.com');
      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should hash the password before storing', async () => {
      const input = {
        email: 'test2@example.com',
        password: 'Password123',
      };

      await AuthService.signup(input);

      const user = await UserModel.findByEmail('test2@example.com');
      expect(user?.password).not.toBe('Password123');
      expect(user?.password.length).toBeGreaterThan(20); // bcrypt hash is long
    });

    it('should throw error if user already exists', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'Password123',
      };

      // Create user first
      await AuthService.signup(input);

      // Try to create same user again
      await expect(AuthService.signup(input)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('should generate unique IDs for different users', async () => {
      const user1 = await AuthService.signup({
        email: 'user1@example.com',
        password: 'Password123',
      });

      const user2 = await AuthService.signup({
        email: 'user2@example.com',
        password: 'Password123',
      });

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      // Create a user first
      const signupInput = {
        email: 'login@example.com',
        password: 'Password123',
      };
      await AuthService.signup(signupInput);

      // Login with correct credentials
      const loginInput = {
        email: 'login@example.com',
        password: 'Password123',
      };
      const result = await AuthService.login(loginInput);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email', 'login@example.com');
      expect(result.user).toHaveProperty('createdAt');
      expect(result.user).not.toHaveProperty('password');
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
    });

    it('should generate a valid JWT token', async () => {
      // Create a user first
      await AuthService.signup({
        email: 'jwt@example.com',
        password: 'Password123',
      });

      // Login
      const result = await AuthService.login({
        email: 'jwt@example.com',
        password: 'Password123',
      });

      // Verify token is valid
      const JWT_SECRET =
        process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const decoded = jwt.verify(result.token, JWT_SECRET) as {
        id: string;
        email: string;
      };

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email', 'jwt@example.com');
    });

    it('should throw error for non-existent user', async () => {
      const loginInput = {
        email: 'nonexistent@example.com',
        password: 'Password123',
      };

      await expect(AuthService.login(loginInput)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error for incorrect password', async () => {
      // Create a user first
      await AuthService.signup({
        email: 'wrongpass@example.com',
        password: 'Password123',
      });

      // Try to login with wrong password
      const loginInput = {
        email: 'wrongpass@example.com',
        password: 'WrongPassword123',
      };

      await expect(AuthService.login(loginInput)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should return user without password', async () => {
      // Create a user first
      await AuthService.signup({
        email: 'nopass@example.com',
        password: 'Password123',
      });

      // Login
      const result = await AuthService.login({
        email: 'nopass@example.com',
        password: 'Password123',
      });

      expect(result.user).not.toHaveProperty('password');
    });
  });
});
