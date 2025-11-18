import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Helper function to generate unique email
const generateEmail = () => {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
};

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(FRONTEND_URL);
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test.describe('Signup Flow', () => {
    test('should successfully sign up a new user', async ({ page, request }) => {
      const email = generateEmail();
      const password = 'Password123';

      // Navigate to signup page
      await page.goto(`${FRONTEND_URL}/signup`);

      // Fill in signup form
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for navigation to home page
      await page.waitForURL(`${FRONTEND_URL}/`, { timeout: 5000 });

      // Verify user is logged in (check for email in header)
      await expect(page.locator('text=' + email)).toBeVisible();

      // Verify token is stored in localStorage
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
      expect(token?.length).toBeGreaterThan(0);

      // Verify user data is stored in localStorage
      const userStr = await page.evaluate(() => localStorage.getItem('user'));
      expect(userStr).toBeTruthy();
      if (userStr) {
        const user = JSON.parse(userStr);
        expect(user.email).toBe(email);
        expect(user.id).toBeTruthy();
      }
    });

    test('should show error for duplicate email', async ({ page, request }) => {
      const email = generateEmail();
      const password = 'Password123';

      // First, create a user via API
      const signupResponse = await request.post(`${API_BASE_URL}/auth/signup`, {
        data: {
          email,
          password,
        },
      });
      expect(signupResponse.ok()).toBeTruthy();

      // Try to sign up again with same email
      await page.goto(`${FRONTEND_URL}/signup`);
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button[type="submit"]');

      // Wait for error message
      await expect(
        page.locator('text=/User with this email already exists/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show error for password mismatch', async ({ page }) => {
      const email = generateEmail();

      await page.goto(`${FRONTEND_URL}/signup`);
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'Password123');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword');
      await page.click('button[type="submit"]');

      // Wait for error message
      await expect(page.locator('text=/Passwords do not match/i')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show error for weak password', async ({ page }) => {
      const email = generateEmail();

      await page.goto(`${FRONTEND_URL}/signup`);
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'weak');
      await page.fill('input[name="confirmPassword"]', 'weak');
      await page.click('button[type="submit"]');

      // Wait for password validation error
      await expect(
        page.locator('text=/Password must be at least 8 characters/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should validate password requirements', async ({ page }) => {
      const email = generateEmail();

      await page.goto(`${FRONTEND_URL}/signup`);

      // Test missing uppercase
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(
        page.locator('text=/must contain at least one uppercase letter/i')
      ).toBeVisible({ timeout: 5000 });

      // Test missing lowercase
      await page.fill('input[name="password"]', 'PASSWORD123');
      await page.fill('input[name="confirmPassword"]', 'PASSWORD123');
      await page.click('button[type="submit"]');
      await expect(
        page.locator('text=/must contain at least one lowercase letter/i')
      ).toBeVisible({ timeout: 5000 });

      // Test missing number
      await page.fill('input[name="password"]', 'Password');
      await page.fill('input[name="confirmPassword"]', 'Password');
      await page.click('button[type="submit"]');
      await expect(
        page.locator('text=/must contain at least one number/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Login Flow', () => {
    test('should successfully log in existing user', async ({ page, request }) => {
      const email = generateEmail();
      const password = 'Password123';

      // Create user via API first
      const signupResponse = await request.post(`${API_BASE_URL}/auth/signup`, {
        data: {
          email,
          password,
        },
      });
      expect(signupResponse.ok()).toBeTruthy();

      // Navigate to login page
      await page.goto(`${FRONTEND_URL}/login`);

      // Fill in login form
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for navigation to home page
      await page.waitForURL(`${FRONTEND_URL}/`, { timeout: 5000 });

      // Verify user is logged in
      await expect(page.locator('text=' + email)).toBeVisible();

      // Verify token is stored
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/login`);
      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      await page.click('button[type="submit"]');

      // Wait for error message
      await expect(
        page.locator('text=/Invalid email or password/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show error for wrong password', async ({ page, request }) => {
      const email = generateEmail();
      const password = 'Password123';

      // Create user via API
      await request.post(`${API_BASE_URL}/auth/signup`, {
        data: { email, password },
      });

      // Try to login with wrong password
      await page.goto(`${FRONTEND_URL}/login`);
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'WrongPassword');
      await page.click('button[type="submit"]');

      // Wait for error message
      await expect(
        page.locator('text=/Invalid email or password/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Session Persistence', () => {
    test('should persist session across page refreshes', async ({ page, request }) => {
      const email = generateEmail();
      const password = 'Password123';

      // Create user and login
      await request.post(`${API_BASE_URL}/auth/signup`, {
        data: { email, password },
      });

      await page.goto(`${FRONTEND_URL}/login`);
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${FRONTEND_URL}/`, { timeout: 5000 });

      // Refresh page
      await page.reload();

      // Verify user is still logged in
      await expect(page.locator('text=' + email)).toBeVisible({ timeout: 5000 });
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
    });

    test('should redirect to login when accessing protected route without auth', async ({
      page,
    }) => {
      // Clear any existing auth
      await page.goto(FRONTEND_URL);
      await page.evaluate(() => {
        localStorage.clear();
      });

      // Try to access home page
      await page.goto(`${FRONTEND_URL}/`);

      // Should redirect to login
      await page.waitForURL(`${FRONTEND_URL}/login`, { timeout: 5000 });
    });
  });

  test.describe('Logout Flow', () => {
    test('should successfully log out user', async ({ page, request }) => {
      const email = generateEmail();
      const password = 'Password123';

      // Create user and login
      await request.post(`${API_BASE_URL}/auth/signup`, {
        data: { email, password },
      });

      await page.goto(`${FRONTEND_URL}/login`);
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${FRONTEND_URL}/`, { timeout: 5000 });

      // Click logout button
      await page.click('button:has-text("Logout")');

      // Should redirect to login
      await page.waitForURL(`${FRONTEND_URL}/login`, { timeout: 5000 });

      // Verify localStorage is cleared
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const user = await page.evaluate(() => localStorage.getItem('user'));
      expect(token).toBeNull();
      expect(user).toBeNull();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate between login and signup pages', async ({ page }) => {
      // Start at login
      await page.goto(`${FRONTEND_URL}/login`);

      // Click link to signup
      await page.click('a[href="/signup"]');
      await page.waitForURL(`${FRONTEND_URL}/signup`, { timeout: 5000 });
      await expect(page.locator('text=/Create your account/i')).toBeVisible();

      // Click link back to login
      await page.click('a[href="/login"]');
      await page.waitForURL(`${FRONTEND_URL}/login`, { timeout: 5000 });
      await expect(page.locator('text=/Sign in to AI Studio Mini/i')).toBeVisible();
    });
  });

  test.describe('API Endpoints', () => {
    test('POST /auth/signup should create user', async ({ request }) => {
      const email = generateEmail();
      const password = 'Password123';

      const response = await request.post(`${API_BASE_URL}/auth/signup`, {
        data: {
          email,
          password,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('id');
      expect(body.user.email).toBe(email);
      expect(body.user).not.toHaveProperty('password');
    });

    test('POST /auth/signup should reject duplicate email', async ({ request }) => {
      const email = generateEmail();
      const password = 'Password123';

      // First signup
      const response1 = await request.post(`${API_BASE_URL}/auth/signup`, {
        data: { email, password },
      });
      expect(response1.ok()).toBeTruthy();

      // Second signup with same email
      const response2 = await request.post(`${API_BASE_URL}/auth/signup`, {
        data: { email, password },
      });
      expect(response2.status()).toBe(409);
      const body = await response2.json();
      expect(body.message).toContain('already exists');
    });

    test('POST /auth/login should return token', async ({ request }) => {
      const email = generateEmail();
      const password = 'Password123';

      // Create user
      await request.post(`${API_BASE_URL}/auth/signup`, {
        data: { email, password },
      });

      // Login
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: { email, password },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe(email);
      expect(typeof body.token).toBe('string');
      expect(body.token.length).toBeGreaterThan(0);
    });

    test('POST /auth/login should reject invalid credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          email: 'nonexistent@example.com',
          password: 'WrongPassword',
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.message).toContain('Invalid email or password');
    });

    test('POST /auth/login should validate input', async ({ request }) => {
      // Missing email
      const response1 = await request.post(`${API_BASE_URL}/auth/login`, {
        data: { password: 'Password123' },
      });
      expect(response1.status()).toBe(400);

      // Missing password
      const response2 = await request.post(`${API_BASE_URL}/auth/login`, {
        data: { email: 'test@example.com' },
      });
      expect(response2.status()).toBe(400);

      // Invalid email format
      const response3 = await request.post(`${API_BASE_URL}/auth/login`, {
        data: { email: 'invalid-email', password: 'Password123' },
      });
      expect(response3.status()).toBe(400);
    });
  });
});

