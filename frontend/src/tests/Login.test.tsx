import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../components/Login.js';
import { AuthProvider } from '../contexts/AuthContext.js';
import * as authService from '../services/auth.service.js';

// Mock the auth service
vi.mock('../services/auth.service.js', () => ({
  authService: {
    login: vi.fn(),
    getCurrentUser: vi.fn(() => null),
    getToken: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render login form with email and password fields', () => {
    renderLogin();

    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show link to signup page', () => {
    renderLogin();

    const signupLink = screen.getByRole('link', { name: /create a new account/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('should update email field when user types', async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByPlaceholderText('Email address');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password field when user types', async () => {
    const user = userEvent.setup();
    renderLogin();

    const passwordInput = screen.getByPlaceholderText('Password');
    await user.type(passwordInput, 'Password123');

    expect(passwordInput).toHaveValue('Password123');
  });

  it('should call login function on form submit', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({
      message: 'Login successful',
      user: { id: '1', email: 'test@example.com', createdAt: new Date() },
      token: 'mock-token',
    });

    vi.mocked(authService.authService.login).mockImplementation(mockLogin);

    renderLogin();

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
    });
  });

  it('should navigate to home page on successful login', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({
      message: 'Login successful',
      user: { id: '1', email: 'test@example.com', createdAt: new Date() },
      token: 'mock-token',
    });

    vi.mocked(authService.authService.login).mockImplementation(mockLogin);

    renderLogin();

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockRejectedValue({
      response: {
        data: {
          message: 'Invalid email or password',
        },
      },
    });

    vi.mocked(authService.authService.login).mockImplementation(mockLogin);

    renderLogin();

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                message: 'Login successful',
                user: { id: '1', email: 'test@example.com', createdAt: new Date() },
                token: 'mock-token',
              }),
            100
          )
        )
    );

    vi.mocked(authService.authService.login).mockImplementation(mockLogin);

    renderLogin();

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
    });
  });

  it('should require email and password fields', () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});

