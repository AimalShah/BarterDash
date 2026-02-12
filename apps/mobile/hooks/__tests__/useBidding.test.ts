import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBidding } from '../useBidding';
import { bidsService } from '../../lib/api/services/bids';
import { Alert } from 'react-native';

jest.mock('../../lib/api/services/bids');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    }),
    removeChannel: jest.fn(),
  },
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    profile: { id: 'user-1' },
    user: { id: 'user-1' },
    session: { user: { id: 'user-1' } },
  }),
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('useBidding', () => {
  const mockAuction = {
    id: 'auction-1',
    currentBid: 100,
    startingBid: 50,
    status: 'live',
    endsAt: new Date(Date.now() + 60000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with auction bid values', () => {
    const { result } = renderHook(() => useBidding(mockAuction as any));

    expect(result.current.currentBid).toBe(100);
    expect(result.current.isPlacingBid).toBe(false);
    expect(result.current.canBid).toBe(true);
  });

  it('should initialize with zero when no auction', () => {
    const { result } = renderHook(() => useBidding(null));

    expect(result.current.currentBid).toBe(0);
    expect(result.current.canBid).toBe(false);
    expect(result.current.cannotBidReason).toBe('No active auction');
  });

  it('should place minimum bid successfully', async () => {
    (bidsService.placeBid as jest.Mock).mockResolvedValue({
      id: 'bid-1',
      amount: 105,
      timer_extended: false,
    });

    const onBidPlaced = jest.fn();
    const { result } = renderHook(() =>
      useBidding(mockAuction as any, onBidPlaced)
    );

    let success: boolean;
    await act(async () => {
      success = await result.current.placeBid();
    });

    expect(success!).toBe(true);
    expect(bidsService.placeBid).toHaveBeenCalledWith({
      auction_id: 'auction-1',
      amount: 105,
      is_max_bid: false,
    });
    expect(onBidPlaced).toHaveBeenCalled();
  });

  it('should place custom bid successfully', async () => {
    (bidsService.placeBid as jest.Mock).mockResolvedValue({
      id: 'bid-1',
      amount: 150,
      timer_extended: false,
    });

    const { result } = renderHook(() => useBidding(mockAuction as any));

    let success: boolean;
    await act(async () => {
      success = await result.current.placeCustomBid(150);
    });

    expect(success!).toBe(true);
    expect(bidsService.placeBid).toHaveBeenCalledWith({
      auction_id: 'auction-1',
      amount: 150,
      is_max_bid: false,
    });
  });

  it('should place max bid successfully', async () => {
    (bidsService.placeBid as jest.Mock).mockResolvedValue({
      id: 'bid-1',
      amount: 200,
      timer_extended: false,
    });

    const { result } = renderHook(() => useBidding(mockAuction as any));

    let success: boolean;
    await act(async () => {
      success = await result.current.placeMaxBid(200);
    });

    expect(success!).toBe(true);
    expect(bidsService.placeBid).toHaveBeenCalledWith({
      auction_id: 'auction-1',
      amount: 200,
      is_max_bid: true,
    });
  });

  it('should show alert when bid is too low', async () => {
    const { result } = renderHook(() => useBidding(mockAuction as any));

    let success: boolean;
    await act(async () => {
      success = await result.current.placeCustomBid(50);
    });

    expect(success!).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Bid Failed',
      expect.stringContaining('at least')
    );
    expect(bidsService.placeBid).not.toHaveBeenCalled();
  });

  it('should handle bid placement error', async () => {
    const error = new Error('Network error');
    (bidsService.placeBid as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useBidding(mockAuction as any));

    let success: boolean;
    await act(async () => {
      success = await result.current.placeBid();
    });

    expect(success!).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith('Bid Failed', 'Network error');
    expect(result.current.isPlacingBid).toBe(false);
  });

  it('should handle 404 error with custom message', async () => {
    const error = {
      response: {
        status: 404,
        data: { message: 'Not found' },
      },
    };
    (bidsService.placeBid as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useBidding(mockAuction as any));

    await act(async () => {
      await result.current.placeBid();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Bid Failed',
      'Auction not found - may have ended'
    );
  });

  it('should handle 400 error with bid too low message', async () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Bid below minimum' },
      },
    };
    (bidsService.placeBid as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useBidding(mockAuction as any));

    await act(async () => {
      await result.current.placeBid();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Bid Failed',
      'Bid too low - someone else bid higher'
    );
  });

  it('should dismiss error', () => {
    const { result } = renderHook(() => useBidding(mockAuction as any));

    act(() => {
      result.current.dismissError();
    });

    expect(result.current.lastBidError).toBeNull();
  });

  it('should not place bid if already placing', async () => {
    (bidsService.placeBid as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useBidding(mockAuction as any));

    act(() => {
      result.current.placeBid();
    });

    expect(result.current.isPlacingBid).toBe(true);

    await act(async () => {
      await result.current.placeBid();
    });

    expect(bidsService.placeBid).toHaveBeenCalledTimes(1);
  });

  it('should show alert when user not authenticated', async () => {
    jest.resetModules();
    jest.mock('../../store/authStore', () => ({
      useAuthStore: () => ({
        profile: null,
        user: null,
      }),
    }));

    const { result } = renderHook(() => useBidding(mockAuction as any));

    expect(result.current.canBid).toBe(false);

    await act(async () => {
      await result.current.placeBid();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign In Required',
      'Please sign in to place a bid.'
    );
  });

  it('should handle timer extended response', async () => {
    (bidsService.placeBid as jest.Mock).mockResolvedValue({
      id: 'bid-1',
      amount: 105,
      timer_extended: true,
      new_ends_at: new Date(Date.now() + 70000).toISOString(),
    });

    const { result } = renderHook(() => useBidding(mockAuction as any));

    await act(async () => {
      await result.current.placeBid();
    });

    expect(result.current.timerExtended).toBe(true);
    expect(result.current.newEndsAt).not.toBeNull();
  });

  it('should calculate correct minimum bid based on tier', () => {
    const lowBidAuction = {
      ...mockAuction,
      currentBid: 10,
    };

    const { result } = renderHook(() => useBidding(lowBidAuction as any));

    expect(result.current.minimumBid).toBe(11);
    expect(result.current.bidIncrement).toBe(1);
  });
});
