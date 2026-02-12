import { by, device, element, expect } from 'detox';

describe('Authentication Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  describe('Login', () => {
    it('should display login screen elements', async () => {
      await expect(element(by.id('login-screen'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('sign-in-button'))).toBeVisible();
      await expect(element(by.id('forgot-password-link'))).toBeVisible();
      await expect(element(by.id('sign-up-link'))).toBeVisible();
    });

    it('should show error for empty fields', async () => {
      await element(by.id('sign-in-button')).tap();
      
      // Alert should appear
      await expect(element(by.text('Error'))).toBeVisible();
      await expect(element(by.text('Please fill in all fields'))).toBeVisible();
      
      // Dismiss alert
      await element(by.text('OK')).tap();
    });

    it('should login with valid credentials', async () => {
      const testEmail = process.env.E2E_TEST_EMAIL || 'test@example.com';
      const testPassword = process.env.E2E_TEST_PASSWORD || 'password123';

      await element(by.id('email-input')).typeText(testEmail);
      await element(by.id('password-input')).typeText(testPassword);
      
      // Dismiss keyboard
      await element(by.id('login-screen')).tap({ x: 1, y: 1 });
      
      await element(by.id('sign-in-button')).tap();
      
      // Should navigate to home
      await expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('email-input')).typeText('invalid@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      
      await element(by.id('sign-in-button')).tap();
      
      // Alert should appear
      await expect(element(by.text('Login Failed'))).toBeVisible();
      
      // Dismiss alert
      await element(by.text('OK')).tap();
    });
  });

  describe('Registration', () => {
    beforeEach(async () => {
      // Navigate to register screen
      await element(by.id('sign-up-link')).tap();
    });

    it('should display registration screen elements', async () => {
      await expect(element(by.id('register-screen'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('username-input'))).toBeVisible();
      await expect(element(by.id('sign-up-button'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      await element(by.id('sign-up-button')).tap();
      
      // Alert should appear
      await expect(element(by.text('Error'))).toBeVisible();
      
      // Dismiss alert
      await element(by.text('OK')).tap();
    });

    it('should navigate back to login', async () => {
      await expect(element(by.id('login-link'))).toBeVisible();
      await element(by.id('login-link')).tap();
      
      await expect(element(by.id('login-screen'))).toBeVisible();
    });
  });

  describe('Forgot Password', () => {
    beforeEach(async () => {
      await element(by.id('forgot-password-link')).tap();
    });

    it('should display forgot password screen', async () => {
      await expect(element(by.id('forgot-password-screen'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('send-reset-button'))).toBeVisible();
    });

    it('should send password reset email', async () => {
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('send-reset-button')).tap();
      
      // Success message should appear
      await expect(element(by.text('Email Sent'))).toBeVisible();
    });
  });
});
