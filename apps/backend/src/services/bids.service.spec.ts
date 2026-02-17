import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BidsService } from './bids.service';
import { success, failure, InternalError } from '../utils/result';

jest.mock('../repositories/bids.repository', () => ({
  BidsRepository: jest.fn().mockImplementation(() => ({
    placeBid: jest.fn(),
    findByAuction: jest.fn(),
    findByUser: jest.fn(),
    getAuctionForBid: jest.fn(),
  })),
}));
jest.mock('../repositories/auto-bids.repository', () => ({
  AutoBidsRepository: jest.fn().mockImplementation(() => ({
    createOrUpdate: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  })),
}));
jest.mock('./auto-bids.service', () => ({
  AutoBidsService: jest.fn().mockImplementation(() => ({
    processAutoBids: jest.fn(),
  })),
}));

describe('BidsService', () => {
  let service: BidsService;
  let mockRepository: any;
  let mockAutoBids: any;
  let mockAutoBidsRepository: any;
  let mockAuthService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BidsService();
    mockRepository = (service as any).repository;
    mockAutoBids = (service as any).autoBidsService;
    mockAutoBidsRepository = (service as any).autoBidsRepository;
    mockAuthService = (service as any).authService;
    mockAuthService.getProfile = jest.fn(async () => success({ id: 'user-1' }));
  });

  it('should trigger auto-bids when bid placement succeeds', async () => {
    const userId = 'user-1';
    const input = { auction_id: 'auction-1', amount: 120 };

    (mockRepository.placeBid as jest.MockedFunction<any>).mockImplementation(
      async () => success({ id: 'bid-1' }),
    );
    (mockAutoBids.processAutoBids as jest.MockedFunction<any>).mockImplementation(
      async () => undefined,
    );

    const result = await service.placeBid(userId, input as any);

    expect(result.isOk()).toBe(true);
    expect(mockRepository.placeBid).toHaveBeenCalledWith(userId, input);
    expect(mockAutoBids.processAutoBids).toHaveBeenCalledWith(input.auction_id, userId, input.amount);
  });

  it('should not trigger auto-bids when bid placement fails', async () => {
    const userId = 'user-1';
    const input = { auction_id: 'auction-1', amount: 120 };

    (mockRepository.placeBid as jest.MockedFunction<any>).mockImplementation(
      async () => failure(new InternalError('Failed to place bid')),
    );

    const result = await service.placeBid(userId, input as any);

    expect(result.isErr()).toBe(true);
    expect(mockRepository.placeBid).toHaveBeenCalledWith(userId, input);
    expect(mockAutoBids.processAutoBids).not.toHaveBeenCalled();
  });

  it('should persist max bid configuration when is_max_bid is true', async () => {
    const userId = 'user-1';
    const input = { auction_id: 'auction-1', amount: 220, is_max_bid: true };

    (mockRepository.placeBid as jest.MockedFunction<any>).mockResolvedValue(
      success({ id: 'bid-2' }),
    );
    (mockAutoBidsRepository.createOrUpdate as jest.MockedFunction<any>).mockResolvedValue(
      success({ id: 'auto-bid-1' }),
    );

    const result = await service.placeBid(userId, input as any);

    expect(result.isOk()).toBe(true);
    expect(mockAutoBidsRepository.createOrUpdate).toHaveBeenCalledWith({
      auction_id: input.auction_id,
      bidder_id: userId,
      max_amount: input.amount,
    });
    expect(mockAutoBids.processAutoBids).toHaveBeenCalledWith(
      input.auction_id,
      userId,
      input.amount,
    );
  });

  it('should return auction bid history', async () => {
    (mockRepository.findByAuction as jest.MockedFunction<any>).mockImplementation(
      async () => success([]),
    );

    const result = await service.getAuctionBids('auction-1');

    expect(result.isOk()).toBe(true);
    expect(mockRepository.findByAuction).toHaveBeenCalledWith('auction-1');
  });

  it('should return user bid history', async () => {
    (mockRepository.findByUser as jest.MockedFunction<any>).mockImplementation(
      async () => success([]),
    );

    const result = await service.getMyBids('user-1');

    expect(result.isOk()).toBe(true);
    expect(mockRepository.findByUser).toHaveBeenCalledWith('user-1');
  });
});
