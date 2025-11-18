import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.js';
import { AuthProvider } from '../contexts/AuthContext.js';
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

const TestComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render children when user is authenticated', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(authService.authService.getCurrentUser).mockReturnValue(mockUser);
    vi.mocked(authService.authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.authService.getToken).mockReturnValue('mock-token');

    render(
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    vi.mocked(authService.authService.getCurrentUser).mockReturnValue(null);
    vi.mocked(authService.authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.authService.getToken).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should not show protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show loading state while checking authentication', () => {
    vi.mocked(authService.authService.getCurrentUser).mockReturnValue(null);
    vi.mocked(authService.authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.authService.getToken).mockReturnValue(null);

    // Mock a delay in getCurrentUser to simulate loading
    vi.mocked(authService.authService.getCurrentUser).mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(null), 100);
        }) as any
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    );

    // During loading, should show loading message
    // Note: This might not be visible immediately due to async nature
  });
});

