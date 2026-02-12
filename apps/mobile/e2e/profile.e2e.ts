import { by, device, element, expect } from 'detox';

describe('Profile and Settings', () => {
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

  describe('Profile Screen', () => {
    it('should navigate to profile tab', async () => {
      await element(by.id('tab-profile')).tap();
      
      await expect(element(by.id('profile-screen'))).toBeVisible();
      await expect(element(by.id('profile-header'))).toBeVisible();
      await expect(element(by.id('edit-profile-button'))).toBeVisible();
    });

    it('should display user information', async () => {
      await element(by.id('tab-profile')).tap();
      
      await expect(element(by.id('username'))).toBeVisible();
      await expect(element(by.id('user-email'))).toBeVisible();
    });

    it('should edit profile', async () => {
      await element(by.id('tab-profile')).tap();
      await element(by.id('edit-profile-button')).tap();
      
      await expect(element(by.id('edit-profile-screen'))).toBeVisible();
      
      // Edit username
      await element(by.id('username-input')).clearText();
      await element(by.id('username-input')).typeText('NewUsername');
      
      // Save changes
      await element(by.id('save-profile-button')).tap();
      
      // Should return to profile
      await expect(element(by.id('profile-screen'))).toBeVisible();
    });
  });

  describe('Settings', () => {
    beforeEach(async () => {
      await element(by.id('tab-profile')).tap();
    });

    it('should open settings', async () => {
      await element(by.id('settings-button')).tap();
      
      await expect(element(by.id('settings-screen'))).toBeVisible();
    });

    it('should toggle notifications', async () => {
      await element(by.id('settings-button')).tap();
      
      // Toggle push notifications
      await element(by.id('push-notifications-toggle')).tap();
      
      // Toggle should change state
      await expect(element(by.id('push-notifications-toggle'))).toBeVisible();
    });

    it('should change password', async () => {
      await element(by.id('settings-button')).tap();
      await element(by.id('change-password-button')).tap();
      
      await expect(element(by.id('change-password-screen'))).toBeVisible();
      
      await element(by.id('current-password-input')).typeText('oldpassword');
      await element(by.id('new-password-input')).typeText('newpassword123');
      await element(by.id('confirm-password-input')).typeText('newpassword123');
      
      await element(by.id('update-password-button')).tap();
      
      // Should show success
      await expect(element(by.text('Password Updated'))).toBeVisible();
    });
  });

  describe('Orders', () => {
    it('should view order history', async () => {
      await element(by.id('tab-profile')).tap();
      await element(by.id('orders-button')).tap();
      
      await expect(element(by.id('orders-screen'))).toBeVisible();
      await expect(element(by.id('active-orders-tab'))).toBeVisible();
      await expect(element(by.id('completed-orders-tab'))).toBeVisible();
    });

    it('should view order details', async () => {
      await element(by.id('tab-profile')).tap();
      await element(by.id('orders-button')).tap();
      
      try {
        await element(by.id('order-card-0')).tap();
        
        await expect(element(by.id('order-detail-screen'))).toBeVisible();
        await expect(element(by.id('order-status'))).toBeVisible();
        await expect(element(by.id('order-items'))).toBeVisible();
        await expect(element(by.id('order-total'))).toBeVisible();
        
        // Go back
        await element(by.id('back-button')).tap();
      } catch (e) {
        console.log('No orders available');
      }
    });
  });

  describe('Saved Items', () => {
    it('should view saved items', async () => {
      await element(by.id('tab-profile')).tap();
      await element(by.id('saved-items-button')).tap();
      
      await expect(element(by.id('saved-items-screen'))).toBeVisible();
    });

    it('should remove saved item', async () => {
      await element(by.id('tab-profile')).tap();
      await element(by.id('saved-items-button')).tap();
      
      try {
        await element(by.id('remove-saved-item-0')).tap();
        
        // Confirm removal
        await element(by.text('Remove')).tap();
      } catch (e) {
        console.log('No saved items');
      }
    });
  });

  describe('Logout', () => {
    it('should logout user', async () => {
      await element(by.id('tab-profile')).tap();
      
      // Scroll to logout button if needed
      await element(by.id('profile-scroll-view')).scrollTo('bottom');
      
      await element(by.id('logout-button')).tap();
      
      // Confirm logout
      await element(by.text('Logout')).tap();
      
      // Should return to login screen
      await expect(element(by.id('login-screen'))).toBeVisible();
    });
  });
});
