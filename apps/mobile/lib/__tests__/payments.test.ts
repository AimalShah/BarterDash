import { paymentsService } from '../api/services/payments';
import api from '../api/client';

// Mock the API client
jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
  },
}));

describe('Payments Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIntent', () => {
    it('should create payment intent successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            clientSecret: 'secret_123',
            id: 'pi_123',
          },
        },
      };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await paymentsService.createIntent({
        amount: 100,
        auction_id: 'auction-1',
      });

      expect(result).toEqual({
        clientSecret: 'secret_123',
        id: 'pi_123',
      });
      expect(api.post).toHaveBeenCalledWith(
        '/payments/create-intent',
        expect.objectContaining({
          amount: 100,
          auction_id: 'auction-1',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String),
          }),
        })
      );
    });

    it('should use custom idempotency key when provided', async () => {
      const mockResponse = {
        data: {
          data: {
            clientSecret: 'secret_123',
            id: 'pi_123',
          },
        },
      };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      await paymentsService.createIntent(
        { amount: 100, auction_id: 'auction-1' },
        'custom-key-123'
      );

      expect(api.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: {
            'Idempotency-Key': 'custom-key-123',
          },
        })
      );
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session', async () => {
      const mockResponse = {
        data: {
          data: {
            url: 'https://checkout.stripe.com/test',
            sessionId: 'cs_123',
          },
        },
      };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await paymentsService.createCheckoutSession('order-1');

      expect(result).toEqual({
        url: 'https://checkout.stripe.com/test',
        sessionId: 'cs_123',
      });
      expect(api.post).toHaveBeenCalledWith(
        '/payments/create-checkout-session',
        { orderId: 'order-1' }
      );
    });
  });

  describe('createPaymentSheet', () => {
    it('should create payment sheet', async () => {
      const mockResponse = {
        data: {
          data: {
            paymentIntent: 'pi_secret',
            ephemeralKey: 'ek_secret',
            customer: 'cus_123',
            publishableKey: 'pk_test',
          },
        },
      };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await paymentsService.createPaymentSheet({
        orderId: 'order-1',
        amount: 99.99,
        currency: 'usd',
      });

      expect(result).toEqual({
        paymentIntent: 'pi_secret',
        ephemeralKey: 'ek_secret',
        customer: 'cus_123',
        publishableKey: 'pk_test',
      });
    });
  });

  describe('getPaymentMethods', () => {
    it('should fetch payment methods', async () => {
      const mockMethods = [
        {
          id: 'pm-1',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          isDefault: true,
          fingerprint: 'fp_123',
        },
      ];
      (api.get as jest.Mock).mockResolvedValue({
        data: { data: mockMethods },
      });

      const result = await paymentsService.getPaymentMethods();

      expect(result).toEqual(mockMethods);
      expect(api.get).toHaveBeenCalledWith('/payments/methods');
    });
  });

  describe('savePaymentMethod', () => {
    it('should save payment method', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'pm-1',
            type: 'card',
            last4: '4242',
            brand: 'visa',
            isDefault: true,
            fingerprint: 'fp_123',
          },
        },
      };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await paymentsService.savePaymentMethod({
        stripePaymentMethodId: 'pm_stripe_123',
        isDefault: true,
      });

      expect(result.id).toBe('pm-1');
      expect(api.post).toHaveBeenCalledWith(
        '/payments/methods',
        {
          paymentMethodId: 'pm_stripe_123',
          setAsDefault: true,
        }
      );
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete payment method', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await paymentsService.deletePaymentMethod('pm-1');

      expect(api.delete).toHaveBeenCalledWith('/payments/methods/pm-1');
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set default payment method', async () => {
      (api.put as jest.Mock).mockResolvedValue({});

      await paymentsService.setDefaultPaymentMethod('pm-1');

      expect(api.put).toHaveBeenCalledWith('/payments/methods/pm-1/default');
    });
  });
});
