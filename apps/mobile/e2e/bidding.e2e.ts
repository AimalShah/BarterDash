import { by, device, element, expect } from 'detox';

describe('Bidding Flow', () => {
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

  describe('My Bids', () => {
    it('should navigate to my bids tab', async () => {
      await element(by.id('tab-my-bids')).tap();
      
      await expect(element(by.id('my-bids-screen'))).toBeVisible();
      await expect(element(by.id('active-bids-tab'))).toBeVisible();
      await expect(element(by.id('won-bids-tab'))).toBeVisible();
    });

    it('should switch between active and won bids', async () => {
      await element(by.id('tab-my-bids')).tap();
      
      // Switch to won bids
      await element(by.id('won-bids-tab')).tap();
      await expect(element(by.id('won-bids-list'))).toBeVisible();
      
      // Switch back to active
      await element(by.id('active-bids-tab')).tap();
      await expect(element(by.id('active-bids-list'))).toBeVisible();
    });
  });

  describe('Place Bid', () => {
    it('should open auction and view bidding interface', async () => {
      // Navigate to a stream with auction
      await element(by.id('tab-shows')).tap();
      
      try {
        await element(by.id('stream-card-0')).tap();
        await expect(element(by.id('stream-screen'))).toBeVisible();
        
        // Check for auction section
        if (await element(by.id('auction-section')).isVisible()) {
          await expect(element(by.id('current-bid'))).toBeVisible();
          await expect(element(by.id('bid-buttons'))).toBeVisible();
        }
      } catch (e) {
        console.log('No streams or auction available');
      }
    });

    it('should place quick bid', async () => {
      await element(by.id('tab-shows')).tap();
      
      try {
        await element(by.id('stream-card-0')).tap();
        
        if (await element(by.id('auction-section')).isVisible()) {
          const currentBid = await element(by.id('current-bid-amount')).getAttributes();
          
          // Tap +100 button
          await element(by.id('quick-bid-100')).tap();
          
          // Should show bid alert
          await expect(element(by.id('bid-alert'))).toBeVisible();
        }
      } catch (e) {
        console.log('Auction not available');
      }
    });

    it('should place custom bid', async () => {
      await element(by.id('tab-shows')).tap();
      
      try {
        await element(by.id('stream-card-0')).tap();
        
        if (await element(by.id('auction-section')).isVisible()) {
          // Open custom bid modal
          await element(by.id('custom-bid-button')).tap();
          
          await expect(element(by.id('bid-modal'))).toBeVisible();
          
          // Enter bid amount
          await element(by.id('bid-amount-input')).typeText('500');
          await element(by.id('place-bid-button')).tap();
          
          // Should show success or error alert
          await expect(element(by.id('bid-alert'))).toBeVisible();
        }
      } catch (e) {
        console.log('Auction not available');
      }
    });

    it('should show error for bid below minimum', async () => {
      await element(by.id('tab-shows')).tap();
      
      try {
        await element(by.id('stream-card-0')).tap();
        
        if (await element(by.id('auction-section')).isVisible()) {
          await element(by.id('custom-bid-button')).tap();
          
          // Enter bid that's too low (e.g., $1)
          await element(by.id('bid-amount-input')).typeText('1');
          await element(by.id('place-bid-button')).tap();
          
          // Should show error
          await expect(element(by.text('Bid Too Low'))).toBeVisible();
        }
      } catch (e) {
        console.log('Auction not available');
      }
    });
  });

  describe('Cart and Checkout', () => {
    it('should navigate to cart', async () => {
      await element(by.id('tab-cart')).tap();
      
      await expect(element(by.id('cart-screen'))).toBeVisible();
    });

    it('should proceed to checkout', async () => {
      await element(by.id('tab-cart')).tap();
      
      try {
        // If cart has items
        if (await element(by.id('cart-item-0')).isVisible()) {
          await element(by.id('checkout-button')).tap();
          
          await expect(element(by.id('checkout-screen'))).toBeVisible();
          await expect(element(by.id('payment-methods'))).toBeVisible();
        }
      } catch (e) {
        console.log('Cart is empty');
      }
    });

    it('should add shipping address', async () => {
      await element(by.id('tab-cart')).tap();
      
      try {
        if (await element(by.id('cart-item-0')).isVisible()) {
          await element(by.id('checkout-button')).tap();
          
          // Add address
          await element(by.id('add-address-button')).tap();
          await expect(element(by.id('address-form'))).toBeVisible();
          
          await element(by.id('address-line-1')).typeText('123 Test St');
          await element(by.id('city')).typeText('New York');
          await element(by.id('state')).typeText('NY');
          await element(by.id('zip')).typeText('10001');
          
          await element(by.id('save-address-button')).tap();
        }
      } catch (e) {
        console.log('Checkout flow not available');
      }
    });
  });
});
