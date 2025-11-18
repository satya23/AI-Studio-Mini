/// <reference types="jest" />
import { UserModel } from '../src/models/user.model.js';
import { clearDatabase } from '../src/db/database.js';

describe('UserModel', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('create', () => {
    it('should create a user with all required fields', async () => {
      const hashedPassword = 'hashed_password_123';
      const user = await UserModel.create({
        email: 'test@example.com',
        password: hashedPassword,
      });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBe(hashedPassword);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs', async () => {
      const user1 = await UserModel.create({
        email: 'user1@example.com',
        password: 'password1',
      });

      const user2 = await UserModel.create({
        email: 'user2@example.com',
        password: 'password2',
      });

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const hashedPassword = 'hashed_password_123';
      const createdUser = await UserModel.create({
        email: 'findme@example.com',
        password: hashedPassword,
      });

      const foundUser = await UserModel.findByEmail('findme@example.com');

      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe('findme@example.com');
    });

    it('should return null if user not found', async () => {
      const foundUser = await UserModel.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const createdUser = await UserModel.create({
        email: 'findbyid@example.com',
        password: 'password123',
      });

      const foundUser = await UserModel.findById(createdUser.id);

      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe('findbyid@example.com');
    });

    it('should return null if user not found', async () => {
      const foundUser = await UserModel.findById('nonexistent-id');
      expect(foundUser).toBeNull();
    });
  });
});
