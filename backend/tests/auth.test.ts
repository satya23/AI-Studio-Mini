import { AuthService } from '../src/services/auth.service.js';
import { UserModel } from '../src/models/user.model.js';
import db from '../src/db/database.js';

describe('AuthService', () => {
  beforeEach(() => {
    // Clear users table before each test
    db.exec('DELETE FROM users');
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
      const user = UserModel.findByEmail('test@example.com');
      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should hash the password before storing', async () => {
      const input = {
        email: 'test2@example.com',
        password: 'Password123',
      };

      await AuthService.signup(input);

      const user = UserModel.findByEmail('test2@example.com');
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
});
