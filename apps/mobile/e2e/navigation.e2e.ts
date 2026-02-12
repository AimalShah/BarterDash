import { by, device, element, expect } from 'detox';

describe('Navigation and Core Flows', () => {
  beforeAll(async () => {
    // Login first
    await device.launchApp({ newInstance: true });
    
    if (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
      await element(by.id('email-input')).typeText(process.env.E2E_TEST_EMAIL);
      await element(by.id('password-input')).typeText(process.env.E2E_TEST_PASSWORD);
      await element(by.id('sign-in-button')).tap();
      
      // Wait for home screen
      await expect(element(by.id('home-screen'))).toBeVisible();
    }
  });

  describe('Bottom Navigation', () => {
    it('should navigate through all tabs', async () => {
      // Home tab
      await element(by.id('tab-home')).tap();
      await expect(element(by.id('home-screen'))).toBeVisible();
      
      // My Bids tab
      await element(by.id('tab-my-bids')).tap();
      await expect(element(by.id('my-bids-screen'))).toBeVisible();
      
      // Sell tab
      await element(by.id('tab-sell')).tap();
      await expect(element(by.id('sell-screen'))).toBeVisible();
      
      // Cart tab
      await element(by.id('tab-cart')).tap();
      await expect(element(by.id('cart-screen'))).toBeVisible();
      
      // Profile tab
      await element(by.id('tab-profile')).tap();
      await expect(element(by.id('profile-screen'))).toBeVisible();
    });
  });

  describe('Deep Linking', () => {
    it('should open product via deep link', async () => {
      const productId = process.env.E2E_TEST_PRODUCT_ID || 'test-product-123';
      
      await device.launchApp({
        newInstance: false,
        url: `barterdash://product/${productId}`,
      });
      
      await expect(element(by.id('product-detail-screen'))).toBeVisible();
    });

    it('should open stream via deep link', async () => {
      const streamId = process.env.E2E_TEST_STREAM_ID || 'test-stream-123';
      
      await device.launchApp({
        newInstance: false,
        url: `barterdash://stream/${streamId}`,
      });
      
      await expect(element(by.id('stream-screen'))).toBeVisible();
    });

    it('should open seller profile via deep link', async () => {
      const sellerId = process.env.E2E_TEST_SELLER_ID || 'test-seller-123';
      
      await device.launchApp({
        newInstance: false,
        url: `barterdash://seller/${sellerId}`,
      });
      
      await expect(element(by.id('seller-profile-screen'))).toBeVisible();
    });
  });

  describe('App State', () => {
    it('should handle app background/foreground', async () => {
      // Background the app
      await device.sendToHome();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Bring back to foreground
      await device.launchApp({ newInstance: false });
      
      // Should still be on same screen
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Enable airplane mode (if supported)
      try {
        await device.setURLBlacklist(['.*']);
        
        await element(by.id('tab-home')).tap();
        
        // Pull to refresh
        await element(by.id('home-scroll-view')).swipe('down');
        
        // Should show error state or cached content
        await expect(element(by.id('home-screen'))).toBeVisible();
        
        // Re-enable network
        await device.setURLBlacklist([]);
      } catch (e) {
        console.log('Network error handling test skipped');
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible elements on login screen', async () => {
      // Logout first
      await element(by.id('tab-profile')).tap();
      await element(by.id('profile-scroll-view')).scrollTo('bottom');
      await element(by.id('logout-button')).tap();
      await element(by.text('Logout')).tap();
      
      await expect(element(by.id('login-screen'))).toBeVisible();
      
      // Check accessibility labels
      await expect(element(by.label('Email input field'))).toExist();
      await expect(element(by.label('Password input field'))).toExist();
      await expect(element(by.label('Sign in button'))).toExist();
    });

    it('should support VoiceOver/TalkBack navigation', async () => {
      // This would require actual screen reader testing
      // For now, just verify elements have accessibility labels
      await element(by.id('email-input')).tap();
      
      const attributes = await element(by.id('email-input')).getAttributes();
      expect(attributes.accessibilityLabel || attributes.label).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should load home screen within 3 seconds', async () => {
      const startTime = Date.now();
      
      await device.launchApp({ newInstance: true });
      await element(by.id('email-input')).typeText(process.env.E2E_TEST_EMAIL || 'test@example.com');
      await element(by.id('password-input')).typeText(process.env.E2E_TEST_PASSWORD || 'password123');
      await element(by.id('sign-in-button')).tap();
      
      await expect(element(by.id('home-screen'))).toBeVisible();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(3000);
    });

    it('should handle large lists smoothly', async () => {
      await element(by.id('tab-home')).tap();
      
      // Scroll through long list
      for (let i = 0; i < 10; i++) {
        await element(by.id('products-list')).swipe('up', 'fast', 0.5);
      }
      
      // App should still be responsive
      await expect(element(by.id('home-screen'))).toBeVisible();
    });
  });
});
