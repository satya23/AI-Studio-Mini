import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext.js';
import * as authService from '../services/auth.service.js';

// Mock the auth service
vi.mock('../services/auth.service.js', () => ({
  authService: {
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide initial state with no user', () => {
    vi.mocked(authService.authService.getCurrentUser).mockReturnValue(null);
    vi.mocked(authService.authService.isAuthenticated).mockReturnValue(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should load user from localStorage on mount', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(authService.authService.getCurrentUser).mockReturnValue(mockUser);
    vi.mocked(authService.authService.isAuthenticated).mockReturnValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('should call login and update user state', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    };
    const mockResponse = {
      message: 'Login successful',
      user: mockUser,
      token: 'mock-token',
    };

    vi.mocked(authService.authService.getCurrentUser).mockImplementation(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
    vi.mocked(authService.authService.isAuthenticated).mockImplementation(
      () => !!localStorage.getItem('token')
    );
    vi.mocked(authService.authService.login).mockImplementation(async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      return mockResponse;
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'Password123');
    });

    expect(authService.authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123',
    });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should call signup and then login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    };
    const mockSignupResponse = {
      message: 'User created successfully',
      user: mockUser,
    };
    const mockLoginResponse = {
      message: 'Login successful',
      user: mockUser,
      token: 'mock-token',
    };

    vi.mocked(authService.authService.getCurrentUser).mockImplementation(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
    vi.mocked(authService.authService.isAuthenticated).mockImplementation(
      () => !!localStorage.getItem('token')
    );
    vi.mocked(authService.authService.signup).mockResolvedValue(
      mockSignupResponse
    );
    vi.mocked(authService.authService.login).mockImplementation(async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      return mockLoginResponse;
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signup('test@example.com', 'Password123');
    });

    expect(authService.authService.signup).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123',
    });
    expect(authService.authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123',
    });
    expect(result.current.user).toEqual(mockUser);
  });

  it('should call logout and clear user state', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(authService.authService.getCurrentUser).mockReturnValue(mockUser);
    vi.mocked(authService.authService.isAuthenticated).mockReturnValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    act(() => {
      result.current.logout();
    });

    expect(authService.authService.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
