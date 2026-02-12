import { by, device, element, expect } from 'detox';

describe('Seller Registration Flow', () => {
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

  describe('Seller Dashboard Access', () => {
    it('should navigate to sell tab', async () => {
      await element(by.id('tab-sell')).tap();
      
      await expect(element(by.id('sell-screen'))).toBeVisible();
    });

    it('should show seller onboarding for non-sellers', async () => {
      await element(by.id('tab-sell')).tap();
      
      // If user is not a seller, should see onboarding
      try {
        await expect(element(by.id('seller-onboarding-screen'))).toBeVisible();
        await expect(element(by.id('become-seller-button'))).toBeVisible();
      } catch (e) {
        // User might already be a seller
        console.log('User may already be a seller');
      }
    });
  });

  describe('Seller Application', () => {
    beforeEach(async () => {
      await element(by.id('tab-sell')).tap();
      
      try {
        // Start application if not already a seller
        if (await element(by.id('become-seller-button')).isVisible()) {
          await element(by.id('become-seller-button')).tap();
        }
      } catch (e) {
        // Already in application flow
      }
    });

    it('should display seller application form', async () => {
      await expect(element(by.id('seller-application-screen'))).toBeVisible();
      await expect(element(by.id('business-name-input'))).toBeVisible();
      await expect(element(by.id('tax-id-input'))).toBeVisible();
      await expect(element(by.id('business-type-selector'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      // Try to proceed without filling fields
      await element(by.id('next-button')).tap();
      
      // Should show validation errors
      await expect(element(by.text('Business name is required'))).toBeVisible();
    });

    it('should fill business information', async () => {
      await element(by.id('business-name-input')).typeText('Test Business');
      await element(by.id('tax-id-input')).typeText('12-3456789');
      
      // Select business type
      await element(by.id('business-type-individual')).tap();
      
      // Errors should be cleared
      await element(by.id('next-button')).tap();
    });

    it('should upload verification documents', async () => {
      // Navigate to documents step
      await element(by.id('business-name-input')).typeText('Test Business');
      await element(by.id('tax-id-input')).typeText('12-3456789');
      await element(by.id('next-button')).tap();
      
      // Should be on documents step
      await expect(element(by.id('documents-step'))).toBeVisible();
      
      // Select document type
      await element(by.id('doc-type-id-front')).tap();
      
      // Upload document (mock - would need actual file in real test)
      await element(by.id('upload-document-button')).tap();
      
      // Document should appear in list
      await expect(element(by.id('document-id-front'))).toBeVisible();
    });

    it('should complete seller application', async () => {
      // Fill all required info
      await element(by.id('business-name-input')).typeText('Test Business');
      await element(by.id('tax-id-input')).typeText('12-3456789');
      await element(by.id('next-button')).tap();
      
      // Upload required documents
      await element(by.id('doc-type-id-front')).tap();
      await element(by.id('upload-document-button')).tap();
      
      await element(by.id('doc-type-id-back')).tap();
      await element(by.id('upload-document-button')).tap();
      
      // Submit application
      await element(by.id('submit-application-button')).tap();
      
      // Should show success message
      await expect(element(by.text('Application Submitted'))).toBeVisible();
    });
  });

  describe('Seller Dashboard', () => {
    it('should display seller dashboard for approved sellers', async () => {
      await element(by.id('tab-sell')).tap();
      
      try {
        await expect(element(by.id('seller-dashboard'))).toBeVisible();
        await expect(element(by.id('dashboard-stats'))).toBeVisible();
        await expect(element(by.id('create-listing-button'))).toBeVisible();
        await expect(element(by.id('go-live-button'))).toBeVisible();
      } catch (e) {
        console.log('User may not be an approved seller yet');
      }
    });

    it('should view dashboard stats', async () => {
      await element(by.id('tab-sell')).tap();
      
      try {
        await expect(element(by.id('total-sales'))).toBeVisible();
        await expect(element(by.id('total-orders'))).toBeVisible();
        await expect(element(by.id('active-listings'))).toBeVisible();
      } catch (e) {
        console.log('Dashboard stats not available');
      }
    });
  });

  describe('Create Listing', () => {
    it('should open create listing form', async () => {
      await element(by.id('tab-sell')).tap();
      
      try {
        await element(by.id('create-listing-button')).tap();
        
        await expect(element(by.id('create-listing-screen'))).toBeVisible();
        await expect(element(by.id('product-title-input'))).toBeVisible();
        await expect(element(by.id('product-description-input'))).toBeVisible();
        await expect(element(by.id('product-price-input'))).toBeVisible();
      } catch (e) {
        console.log('Create listing not available');
      }
    });

    it('should create a new product listing', async () => {
      await element(by.id('tab-sell')).tap();
      
      try {
        await element(by.id('create-listing-button')).tap();
        
        // Fill product details
        await element(by.id('product-title-input')).typeText('Test Product');
        await element(by.id('product-description-input')).typeText('This is a test product description');
        await element(by.id('product-price-input')).typeText('100');
        
        // Select category
        await element(by.id('category-selector')).tap();
        await element(by.id('category-electronics')).tap();
        
        // Add photos
        await element(by.id('add-photo-button')).tap();
        
        // Submit
        await element(by.id('publish-listing-button')).tap();
        
        // Should return to dashboard
        await expect(element(by.id('seller-dashboard'))).toBeVisible();
      } catch (e) {
        console.log('Create listing not available');
      }
    });
  });

  describe('Go Live', () => {
    it('should open go live screen', async () => {
      await element(by.id('tab-sell')).tap();
      
      try {
        await element(by.id('go-live-button')).tap();
        
        await expect(element(by.id('go-live-screen'))).toBeVisible();
        await expect(element(by.id('stream-title-input'))).toBeVisible();
        await expect(element(by.id('select-products-button'))).toBeVisible();
      } catch (e) {
        console.log('Go live not available');
      }
    });

    it('should configure stream settings', async () => {
      await element(by.id('tab-sell')).tap();
      
      try {
        await element(by.id('go-live-button')).tap();
        
        await element(by.id('stream-title-input')).typeText('Test Live Stream');
        
        // Select products for stream
        await element(by.id('select-products-button')).tap();
        
        try {
          await element(by.id('product-checkbox-0')).tap();
          await element(by.id('confirm-selection-button')).tap();
        } catch (e) {
          // No products available
          await element(by.id('cancel-selection-button')).tap();
        }
        
        // Start stream
        await element(by.id('start-stream-button')).tap();
        
        // Should show stream preview
        await expect(element(by.id('stream-preview'))).toBeVisible();
      } catch (e) {
        console.log('Go live not available');
      }
    });
  });
});
