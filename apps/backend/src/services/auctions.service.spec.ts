import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuctionsService } from './auctions.service';
import { success } from '../utils/result';

jest.mock('../repositories/auctions.repository', () => ({
  AuctionsRepository: jest.fn().mockImplementation(() => ({
    getSellerByUserId: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  })),
}));
jest.mock('./orders.service');
jest.mock('./email.service');
jest.mock('./notifications.service');
jest.mock('../jobs/auction.processor', () => ({
  auctionQueue: { add: jest.fn().mockImplementation(async () => undefined) },
}));
jest.mock('../utils/supabase', () => ({
  supabase: { auth: { admin: { getUserById: jest.fn() } } },
}));

jest.mock('../db', () => {
  const query = {
    products: { findFirst: jest.fn() },
    streams: { findFirst: jest.fn() },
    streamProducts: { findFirst: jest.fn() },
    auctions: { findMany: jest.fn() },
  };

  return {
    db: {
      query,
      insert: jest.fn(() => ({
        values: jest.fn().mockImplementation(async () => undefined),
      })),
      update: jest.fn(() => ({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockImplementation(async () => undefined),
        }),
      })),
    },
    products: {},
    streams: {},
    streamProducts: {},
    orders: {},
  };
});

describe('AuctionsService', () => {
  let service: AuctionsService;
  let mockRepository: any;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuctionsService();
    mockRepository = (service as any).repository;
    mockDb = require('../db').db;
  });

  it('should reject create when user is not a seller', async () => {
    (mockRepository.getSellerByUserId as jest.MockedFunction<any>).mockImplementation(
      async () => success({ isSeller: false }),
    );

    const result = await service.create('user-1', {
      product_id: 'product-1',
      starting_bid: 10,
      minimum_bid_increment: 1,
      duration_minutes: 10,
    } as any);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should reject startStreamAuction when stream is not live', async () => {
    (mockDb.query.streams.findFirst as jest.MockedFunction<any>).mockImplementation(async () => ({
      id: 'stream-1',
      sellerId: 'seller-1',
      status: 'scheduled',
    }));

    const result = await service.startStreamAuction('seller-1', {
      stream_id: 'stream-1',
      product_id: 'product-1',
      starting_bid: 10,
      minimum_bid_increment: 1,
      duration_minutes: 5,
    } as any);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should reject startStreamAuction when seller does not own stream', async () => {
    (mockDb.query.streams.findFirst as jest.MockedFunction<any>).mockImplementation(async () => ({
      id: 'stream-1',
      sellerId: 'seller-2',
      status: 'live',
    }));

    const result = await service.startStreamAuction('seller-1', {
      stream_id: 'stream-1',
      product_id: 'product-1',
      starting_bid: 10,
      minimum_bid_increment: 1,
      duration_minutes: 5,
    } as any);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });

  it('should create a stream auction and schedule end job', async () => {
    (mockDb.query.streams.findFirst as jest.MockedFunction<any>).mockImplementation(async () => ({
      id: 'stream-1',
      sellerId: 'seller-1',
      status: 'live',
    }));
    (mockDb.query.products.findFirst as jest.MockedFunction<any>).mockImplementation(async () => ({
      id: 'product-1',
      sellerId: 'seller-1',
      status: 'active',
    }));
    (mockDb.query.streamProducts.findFirst as jest.MockedFunction<any>).mockImplementation(
      async () => null,
    );
    (mockRepository.create as jest.MockedFunction<any>).mockImplementation(
      async () => success({ id: 'auction-1' }),
    );

    const result = await service.startStreamAuction('seller-1', {
      stream_id: 'stream-1',
      product_id: 'product-1',
      starting_bid: 10,
      minimum_bid_increment: 1,
      duration_minutes: 5,
    } as any);

    expect(result.isOk()).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('should reject starting a non-pending auction', async () => {
    (mockRepository.findById as jest.MockedFunction<any>).mockImplementation(
      async () => success({ id: 'auction-1', status: 'active' }),
    );

    const result = await service.startAuction('auction-1');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should reject cancel when auction has bids', async () => {
    (mockRepository.findById as jest.MockedFunction<any>).mockImplementation(async () =>
      success({
        id: 'auction-1',
        bidCount: 1,
        product: { sellerId: 'seller-1' },
      }),
    );

    const result = await service.cancel('auction-1', 'seller-1');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
