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

test.describe('Image Generation E2E Tests', () => {
  let authToken: string;
  let userEmail: string;

  test.beforeEach(async ({ page, request }) => {
    // Create a user and get auth token for each test
    userEmail = generateEmail();
    const password = 'Password123';

    // Signup
    const signupResponse = await request.post(`${API_BASE_URL}/auth/signup`, {
      data: { email: userEmail, password },
    });
    expect(signupResponse.ok()).toBeTruthy();

    // Login to get token
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { email: userEmail, password },
    });
    const loginBody = await loginResponse.json();
    authToken = loginBody.token;

    // Navigate to home page and clear localStorage
    await page.goto(FRONTEND_URL);
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },
      { token: authToken, user: loginBody.user }
    );
  });

  test.describe('Generation Form', () => {
    test('should display generation studio form', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      await expect(page.locator('text=Image Generation Studio')).toBeVisible();
      await expect(page.locator('label:has-text("Upload Image")')).toBeVisible();
      await expect(page.locator('label:has-text("Prompt")')).toBeVisible();
      await expect(page.locator('label:has-text("Style")')).toBeVisible();
      await expect(page.locator('button:has-text("Generate")')).toBeVisible();
    });

    test('should update prompt when typing', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      const promptTextarea = page.locator('textarea[id="prompt"]');
      await promptTextarea.fill('A beautiful sunset over mountains');

      await expect(promptTextarea).toHaveValue('A beautiful sunset over mountains');
    });

    test('should change style selection', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      const styleSelect = page.locator('select[id="style"]');
      await styleSelect.selectOption('Anime');

      await expect(styleSelect).toHaveValue('Anime');
    });

    test('should show error when generating without prompt', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      const generateButton = page.locator('button:has-text("Generate")');
      await generateButton.click();

      await expect(
        page.locator('text=/Please enter a prompt/i')
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Image Upload', () => {
    test('should show image preview when image is uploaded', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      // Create a test image file (1x1 PNG)
      const imageData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: imageData,
      });

      // Wait for preview to appear
      await expect(page.locator('img[alt="Preview"]')).toBeVisible({
        timeout: 3000,
      });
    });

    test('should show error for file exceeding 10MB', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      // Create a large file (11MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'x');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'large.jpg',
        mimeType: 'image/jpeg',
        buffer: largeBuffer,
      });

      await expect(
        page.locator('text=/Image size must be less than 10MB/i')
      ).toBeVisible({ timeout: 3000 });
    });

    test('should show error for invalid file type', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.gif',
        mimeType: 'image/gif',
        buffer: Buffer.from('test'),
      });

      await expect(
        page.locator('text=/Image must be JPEG or PNG format/i')
      ).toBeVisible({ timeout: 3000 });
    });

    test('should clear image when clear button is clicked', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      const imageData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: imageData,
      });

      await expect(page.locator('img[alt="Preview"]')).toBeVisible();

      const clearButton = page.locator('text=Clear');
      await clearButton.click();

      await expect(page.locator('img[alt="Preview"]')).not.toBeVisible();
    });
  });

  test.describe('Generation Flow', () => {
    test('should successfully generate an image', async ({ page, request }) => {
      await page.goto(`${FRONTEND_URL}/`);

      // Fill in the form
      await page.fill('textarea[id="prompt"]', 'A beautiful sunset');
      await page.selectOption('select[id="style"]', 'Realistic');

      // Click generate
      const generateButton = page.locator('button:has-text("Generate")');
      await generateButton.click();

      // Wait for generation to complete (may take 1-2 seconds)
      // The spinner should appear first
      await expect(page.locator('text=/Generating.../i')).toBeVisible({
        timeout: 1000,
      });

      // Wait for generation to complete (up to 5 seconds)
      await expect(page.locator('text=/Generating.../i')).not.toBeVisible({
        timeout: 5000,
      });

      // Verify past generations section is updated
      await expect(
        page.locator('text=Recent Generations')
      ).toBeVisible();
    });

    test('should show spinner during generation', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      await page.fill('textarea[id="prompt"]', 'A beautiful sunset');
      await page.selectOption('select[id="style"]', 'Realistic');

      const generateButton = page.locator('button:has-text("Generate")');
      await generateButton.click();

      // Spinner should appear
      await expect(page.locator('text=/Generating.../i')).toBeVisible({
        timeout: 1000,
      });

      // Generate button should be disabled
      await expect(generateButton).toBeDisabled();
    });

    test('should display abort button during generation', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      await page.fill('textarea[id="prompt"]', 'A beautiful sunset');
      await page.selectOption('select[id="style"]', 'Realistic');

      const generateButton = page.locator('button:has-text("Generate")');
      await generateButton.click();

      // Abort button should appear
      await expect(page.locator('button:has-text("Abort")')).toBeVisible({
        timeout: 1000,
      });
    });
  });

  test.describe('Past Generations', () => {
    test('should display past generations', async ({ page, request }) => {
      // Create some generations via API
      const token = authToken;
      for (let i = 0; i < 3; i++) {
        await request.post(`${API_BASE_URL}/generations`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            prompt: `Test prompt ${i}`,
            style: 'Realistic',
          },
        });
      }

      await page.goto(`${FRONTEND_URL}/`);

      // Wait for past generations to load
      await expect(page.locator('text=Recent Generations')).toBeVisible({
        timeout: 3000,
      });

      // Should see at least one generation
      const generationCards = page.locator('div:has-text("Test prompt")');
      await expect(generationCards.first()).toBeVisible();
    });

    test('should restore generation when clicking on past generation', async ({
      page,
      request,
    }) => {
      const token = authToken;
      const testPrompt = 'Sunset over mountains';
      const testStyle = 'Anime';

      // Create a generation
      await request.post(`${API_BASE_URL}/generations`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          prompt: testPrompt,
          style: testStyle,
        },
      });

      await page.goto(`${FRONTEND_URL}/`);

      // Wait for generation to appear
      await expect(page.locator(`text=${testPrompt}`)).toBeVisible({
        timeout: 3000,
      });

      // Click on the generation card
      const generationCard = page
        .locator(`text=${testPrompt}`)
        .locator('..')
        .locator('..');
      await generationCard.click();

      // Verify form is populated
      await expect(page.locator('textarea[id="prompt"]')).toHaveValue(
        testPrompt
      );
      await expect(page.locator('select[id="style"]')).toHaveValue(testStyle);
    });

    test('should show message when no generations exist', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/`);

      await expect(
        page.locator('text=/No generations yet/i')
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept and fail the request
      await page.route('**/generations', route => {
        route.abort('failed');
      });

      await page.goto(`${FRONTEND_URL}/`);

      await page.fill('textarea[id="prompt"]', 'A beautiful sunset');
      await page.selectOption('select[id="style"]', 'Realistic');

      const generateButton = page.locator('button:has-text("Generate")');
      await generateButton.click();

      // Should show error message
      await expect(
        page.locator('text=/Failed to generate/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('API Endpoints', () => {
    test('POST /generations should create generation', async ({ request }) => {
      const token = authToken;

      const response = await request.post(`${API_BASE_URL}/generations`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          prompt: 'A beautiful sunset',
          style: 'Realistic',
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('imageUrl');
      expect(body).toHaveProperty('prompt', 'A beautiful sunset');
      expect(body).toHaveProperty('style', 'Realistic');
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('createdAt');
    });

    test('POST /generations should require authentication', async ({
      request,
    }) => {
      const response = await request.post(`${API_BASE_URL}/generations`, {
        data: {
          prompt: 'A beautiful sunset',
          style: 'Realistic',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('POST /generations should validate input', async ({ request }) => {
      const token = authToken;

      // Missing prompt
      const response1 = await request.post(`${API_BASE_URL}/generations`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { style: 'Realistic' },
      });
      expect(response1.status()).toBe(400);

      // Missing style
      const response2 = await request.post(`${API_BASE_URL}/generations`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { prompt: 'A beautiful sunset' },
      });
      expect(response2.status()).toBe(400);
    });

    test('GET /generations should return user generations', async ({
      request,
    }) => {
      const token = authToken;

      // Create some generations
      for (let i = 0; i < 3; i++) {
        await request.post(`${API_BASE_URL}/generations`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            prompt: `Test ${i}`,
            style: 'Realistic',
          },
        });
      }

      const response = await request.get(
        `${API_BASE_URL}/generations?limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('generations');
      expect(body).toHaveProperty('count');
      expect(Array.isArray(body.generations)).toBeTruthy();
      expect(body.generations.length).toBeGreaterThan(0);
    });

    test('GET /generations should respect limit parameter', async ({
      request,
    }) => {
      const token = authToken;

      // Create 5 generations
      for (let i = 0; i < 5; i++) {
        await request.post(`${API_BASE_URL}/generations`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            prompt: `Test ${i}`,
            style: 'Realistic',
          },
        });
      }

      const response = await request.get(
        `${API_BASE_URL}/generations?limit=3`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.generations.length).toBeLessThanOrEqual(3);
    });

    test('GET /generations should require authentication', async ({
      request,
    }) => {
      const response = await request.get(`${API_BASE_URL}/generations`);

      expect(response.status()).toBe(401);
    });
  });
});

