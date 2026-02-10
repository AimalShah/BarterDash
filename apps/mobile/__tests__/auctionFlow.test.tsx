import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { auctionsService } from '../lib/api/services/auctions';
import { bidsService } from '../lib/api/services/bids';
import { streamsService } from '../lib/api/services/streams';
import { paymentsService } from '../lib/api/services/payments';
import AuctionDetailScreen from '../app/auction/[id]';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ id: 'auction-1' })),
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));

jest.mock('../lib/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const apiClient = jest.requireMock('../lib/api/client').default;

describe('Auction/Bidding Flow (Mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockReset();
  });

  describe('API Services', () => {
    it('places a bid with normalized payload', async () => {
      apiClient.post.mockResolvedValue({ data: { data: { id: 'bid-1' } } });

      const result = await bidsService.placeBid({
        auctionId: 'auction-1',
        amount: 125,
      } as any);

      expect(apiClient.post).toHaveBeenCalledWith('/bids', {
        auction_id: 'auction-1',
        amount: 125,
      });
      expect(result).toEqual({ id: 'bid-1' });
    });

    it('starts a stream auction', async () => {
      const auction = { id: 'auction-2' };
      apiClient.post.mockResolvedValue({ data: { data: auction } });

      const result = await auctionsService.startStreamAuction({
        stream_id: 'stream-1',
        product_id: 'product-1',
        starting_bid: 50,
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auctions/stream', {
        stream_id: 'stream-1',
        product_id: 'product-1',
        starting_bid: 50,
      });
      expect(result).toEqual(auction);
    });

    it('starts a stream and returns the stream payload', async () => {
      const stream = { id: 'stream-1' };
      apiClient.post.mockResolvedValue({ data: { data: { stream } } });

      const result = await streamsService.start('stream-1');

      expect(apiClient.post).toHaveBeenCalledWith('/stream/start', { stream_id: 'stream-1' });
      expect(result).toEqual(stream);
    });

    it('creates a payment intent with normalized auction id', async () => {
      const intent = { clientSecret: 'secret', id: 'pi_1' };
      apiClient.post.mockResolvedValue({ data: { data: intent } });

      const result = await paymentsService.createIntent({
        auctionId: 'auction-99',
        amount: 250,
      } as any);

      expect(apiClient.post).toHaveBeenCalledWith('/payments/create-intent', {
        auction_id: 'auction-99',
        order_id: undefined,
        amount: 250,
      });
      expect(result).toEqual(intent);
    });
  });

  describe('UI to Payments', () => {
    const baseAuction = {
      id: 'auction-1',
      title: 'Vintage Watch',
      status: 'live',
      images: [],
      description: 'Test',
      seller: { username: 'seller' },
      currentBid: 100,
      buyNowPrice: 500,
      ends_at: new Date(Date.now() + 600000).toISOString(),
    };

    const mockFetch = (auction: any) => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: auction }),
      });
    };

    it('navigates to checkout from Buy Now', async () => {
      mockFetch(baseAuction);

      jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
        const proceed = buttons?.find((b) => b.text === 'Proceed to Checkout');
        proceed?.onPress?.();
      });

      const { getByText } = render(<AuctionDetailScreen />);

      await waitFor(() => expect(getByText('Buy Now')).toBeTruthy());
      fireEvent.press(getByText('Buy Now'));

      expect(mockPush).toHaveBeenCalledWith('/checkout?auctionId=auction-1');
    });

    it('navigates to checkout after auction ends', async () => {
      mockFetch({ ...baseAuction, status: 'ended' });

      jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons) => {
        const proceed = buttons?.find((b) => b.text === 'Proceed');
        proceed?.onPress?.();
      });

      const { getByText } = render(<AuctionDetailScreen />);

      await waitFor(() => expect(getByText('Proceed to Checkout')).toBeTruthy());
      fireEvent.press(getByText('Proceed to Checkout'));

      expect(mockPush).toHaveBeenCalledWith('/checkout?auctionId=auction-1');
    });
  });
});
