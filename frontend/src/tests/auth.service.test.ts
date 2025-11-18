import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../services/auth.service.js';
import api from '../services/api.js';

// Mock axios
vi.mock('axios');

// Mock the api module
vi.mock('../services/api.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('signup', () => {
    it('should call API and return response', async () => {
      const mockResponse = {
        data: {
          message: 'User created successfully',
          user: {
            id: '1',
            email: 'test@example.com',
            createdAt: new Date().toISOString(),
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.signup({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(api.post).toHaveBeenCalledWith('/auth/signup', {
        email: 'test@example.com',
        password: 'Password123',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle signup errors', async () => {
      const mockError = {
        response: {
          data: {
            message: 'User with this email already exists',
          },
        },
      };

      vi.mocked(api.post).mockRejectedValue(mockError);

      await expect(
        authService.signup({
          email: 'existing@example.com',
          password: 'Password123',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('login', () => {
    it('should call API, store token and user, and return response', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
      };
      const mockToken = 'mock-jwt-token';
      const mockResponse = {
        data: {
          message: 'Login successful',
          user: mockUser,
          token: mockToken,
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'Password123',
      });
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
      expect(result).toEqual(mockResponse.data);
    });

    it('should not store token if not provided in response', async () => {
      const mockResponse = {
        data: {
          message: 'Login successful',
          user: {
            id: '1',
            email: 'test@example.com',
            createdAt: new Date().toISOString(),
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      await authService.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should handle login errors', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid email or password',
          },
        },
      };

      vi.mocked(api.post).mockRejectedValue(mockError);

      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toEqual(mockError);
    });
  });

  describe('logout', () => {
    it('should clear token and user from localStorage', () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ id: '1', email: 'test@example.com' })
      );

      authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const user = authService.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null if no user in localStorage', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null if user data is invalid JSON', () => {
      localStorage.setItem('user', 'invalid-json');

      const user = authService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('token', 'mock-token');

      const token = authService.getToken();

      expect(token).toBe('mock-token');
    });

    it('should return null if no token in localStorage', () => {
      const token = authService.getToken();
      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', () => {
      localStorage.setItem('token', 'mock-token');

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false if no token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});
