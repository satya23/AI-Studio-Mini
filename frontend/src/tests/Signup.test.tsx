import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../components/Signup.js';
import { AuthProvider } from '../contexts/AuthContext.js';
import * as authService from '../services/auth.service.js';

// Mock the auth service
vi.mock('../services/auth.service.js', () => ({
  authService: {
    signup: vi.fn(),
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

describe('Signup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderSignup = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Signup />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render signup form with all required fields', () => {
    renderSignup();

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('should show link to login page', () => {
    renderSignup();

    const loginLink = screen.getByRole('link', {
      name: /sign in to your existing account/i,
    });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should update email field when user types', async () => {
    const user = userEvent.setup();
    renderSignup();

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password fields when user types', async () => {
    const user = userEvent.setup();
    renderSignup();

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');

    expect(passwordInput).toHaveValue('Password123');
    expect(confirmPasswordInput).toHaveValue('Password123');
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderSignup();

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });

    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'DifferentPassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should show error for password too short', async () => {
    const user = userEvent.setup();
    renderSignup();

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });

    await user.type(passwordInput, 'Short1');
    await user.type(confirmPasswordInput, 'Short1');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters long')
      ).toBeInTheDocument();
    });
  });

  it('should show error for password missing lowercase', async () => {
    const user = userEvent.setup();
    renderSignup();

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });

    await user.type(passwordInput, 'PASSWORD123');
    await user.type(confirmPasswordInput, 'PASSWORD123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one lowercase letter')
      ).toBeInTheDocument();
    });
  });

  it('should show error for password missing uppercase', async () => {
    const user = userEvent.setup();
    renderSignup();

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one uppercase letter')
      ).toBeInTheDocument();
    });
  });

  it('should show error for password missing number', async () => {
    const user = userEvent.setup();
    renderSignup();

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });

    await user.type(passwordInput, 'Password');
    await user.type(confirmPasswordInput, 'Password');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one number')
      ).toBeInTheDocument();
    });
  });

  it('should call signup and login on successful form submission', async () => {
    const user = userEvent.setup();
    const mockSignup = vi.fn().mockResolvedValue({
      message: 'User created successfully',
      user: { id: '1', email: 'test@example.com', createdAt: new Date() },
    });
    const mockLogin = vi.fn().mockResolvedValue({
      message: 'Login successful',
      user: { id: '1', email: 'test@example.com', createdAt: new Date() },
      token: 'mock-token',
    });

    vi.mocked(authService.authService.signup).mockImplementation(mockSignup);
    vi.mocked(authService.authService.login).mockImplementation(mockLogin);

    renderSignup();

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password123');
    });
  });

  it('should navigate to home page on successful signup', async () => {
    const user = userEvent.setup();
    const mockSignup = vi.fn().mockResolvedValue({
      message: 'User created successfully',
      user: { id: '1', email: 'test@example.com', createdAt: new Date() },
    });
    const mockLogin = vi.fn().mockResolvedValue({
      message: 'Login successful',
      user: { id: '1', email: 'test@example.com', createdAt: new Date() },
      token: 'mock-token',
    });

    vi.mocked(authService.authService.signup).mockImplementation(mockSignup);
    vi.mocked(authService.authService.login).mockImplementation(mockLogin);

    renderSignup();

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error message on signup failure', async () => {
    const user = userEvent.setup();
    const mockSignup = vi.fn().mockRejectedValue({
      response: {
        data: {
          message: 'User with this email already exists',
        },
      },
    });

    vi.mocked(authService.authService.signup).mockImplementation(mockSignup);

    renderSignup();

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });

    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('User with this email already exists')
      ).toBeInTheDocument();
    });
  });

  it('should show loading state during signup', async () => {
    const user = userEvent.setup();
    const mockSignup = vi.fn(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                message: 'User created successfully',
                user: { id: '1', email: 'test@example.com', createdAt: new Date() },
              }),
            100
          )
        )
    );
    const mockLogin = vi.fn().mockResolvedValue({
      message: 'Login successful',
      user: { id: '1', email: 'test@example.com', createdAt: new Date() },
      token: 'mock-token',
    });

    vi.mocked(authService.authService.signup).mockImplementation(mockSignup);
    vi.mocked(authService.authService.login).mockImplementation(mockLogin);

    renderSignup();

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', {
      name: /create account/i,
    });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');
    await user.click(submitButton);

    expect(screen.getByText('Creating account...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Creating account...')).not.toBeInTheDocument();
    });
  });

  it('should show password requirements hint', () => {
    renderSignup();

    expect(
      screen.getByText(
        /must be at least 8 characters with uppercase, lowercase, and number/i
      )
    ).toBeInTheDocument();
  });
});
