import { bidsService } from '../api/services/bids';
import apiClient from '../api/client';

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('Bids Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('placeBid', () => {
    it('should place bid with snake_case payload', async () => {
      const mockBid = {
        id: 'bid-1',
        auctionId: 'auction-1',
        amount: 100,
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
      };
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: mockBid },
      });

      const result = await bidsService.placeBid({
        auction_id: 'auction-1',
        amount: 100,
      });

      expect(result).toEqual(mockBid);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/bids',
        {
          auction_id: 'auction-1',
          amount: 100,
        }
      );
    });

    it('should place bid with camelCase payload', async () => {
      const mockBid = {
        id: 'bid-1',
        auctionId: 'auction-1',
        amount: 100,
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
      };
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: mockBid },
      });

      const result = await bidsService.placeBid({
        auctionId: 'auction-1',
        amount: 100,
      } as any);

      expect(result).toEqual(mockBid);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/bids',
        expect.objectContaining({
          auction_id: 'auction-1',
          amount: 100,
        })
      );
    });

    it('should throw error when auction_id is missing', async () => {
      await expect(
        bidsService.placeBid({ amount: 100 } as any)
      ).rejects.toThrow('Missing auction_id');
    });

    it('should propagate API errors', async () => {
      const error = new Error('Network error');
      (apiClient.post as jest.Mock).mockRejectedValue(error);

      await expect(
        bidsService.placeBid({ auction_id: 'auction-1', amount: 100 })
      ).rejects.toThrow('Network error');
    });
  });

  describe('getAuctionBids', () => {
    it('should fetch bids for auction', async () => {
      const mockBids = [
        { id: 'bid-1', auctionId: 'auction-1', amount: 100, userId: 'user-1' },
        { id: 'bid-2', auctionId: 'auction-1', amount: 150, userId: 'user-2' },
      ];
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: mockBids },
      });

      const result = await bidsService.getAuctionBids('auction-1');

      expect(result).toEqual(mockBids);
      expect(apiClient.get).toHaveBeenCalledWith('/bids/auction/auction-1');
    });
  });

  describe('getMyBids', () => {
    it('should fetch current user bids', async () => {
      const mockBids = [
        { id: 'bid-1', auctionId: 'auction-1', amount: 100 },
      ];
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: mockBids },
      });

      const result = await bidsService.getMyBids();

      expect(result).toEqual(mockBids);
      expect(apiClient.get).toHaveBeenCalledWith('/bids/my-bids');
    });
  });
});
