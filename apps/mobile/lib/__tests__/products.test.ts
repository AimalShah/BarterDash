import { productsService } from '../api/services/products';
import apiClient from '../api/client';

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Products Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProduct = {
    id: 'prod-1',
    title: 'Test Product',
    description: 'Test Description',
    price: 100,
    sellerId: 'seller-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('findAll', () => {
    it('should fetch all products', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: [mockProduct] },
      });

      const result = await productsService.findAll();

      expect(result).toEqual([mockProduct]);
      expect(apiClient.get).toHaveBeenCalledWith('/products', { params: undefined });
    });

    it('should fetch products with query params', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: [mockProduct] },
      });

      await productsService.findAll({ category: 'electronics', limit: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/products', {
        params: { category: 'electronics', limit: 10 },
      });
    });
  });

  describe('findById', () => {
    it('should fetch product by id', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: mockProduct },
      });

      const result = await productsService.findById('prod-1');

      expect(result).toEqual(mockProduct);
      expect(apiClient.get).toHaveBeenCalledWith('/products/prod-1');
    });
  });

  describe('create', () => {
    it('should create product with normalized payload', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: mockProduct },
      });

      const payload = {
        title: 'Test Product',
        description: 'Test Description',
        categoryId: 'cat-1',
        condition: 'new' as const,
        startingBid: '50',
        buyNowPrice: '100',
        quantity: 1,
      };

      const result = await productsService.create(payload);

      expect(result).toEqual(mockProduct);
      expect(apiClient.post).toHaveBeenCalledWith('/products', {
        title: 'Test Product',
        description: 'Test Description',
        category_id: 'cat-1',
        condition: 'new',
        starting_bid: '50',
        buy_now_price: '100',
        reserve_price: undefined,
        quantity: 1,
        shipping_cost: undefined,
        images: undefined,
      });
    });
  });

  describe('update', () => {
    it('should update product with partial data', async () => {
      (apiClient.patch as jest.Mock).mockResolvedValue({
        data: { data: { ...mockProduct, title: 'Updated Title' } },
      });

      await productsService.update('prod-1', { title: 'Updated Title' });

      expect(apiClient.patch).toHaveBeenCalledWith('/products/prod-1', {
        title: 'Updated Title',
      });
    });

    it('should normalize update payload to snake_case', async () => {
      (apiClient.patch as jest.Mock).mockResolvedValue({
        data: { data: mockProduct },
      });

      await productsService.update('prod-1', {
        categoryId: 'cat-2',
        buyNowPrice: '150',
      });

      expect(apiClient.patch).toHaveBeenCalledWith('/products/prod-1', {
        category_id: 'cat-2',
        buy_now_price: '150',
      });
    });
  });

  describe('delete', () => {
    it('should delete product', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await productsService.delete('prod-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/products/prod-1');
    });
  });

  describe('getSellerProducts', () => {
    it('should fetch products by seller', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: [mockProduct] },
      });

      const result = await productsService.getSellerProducts('seller-1');

      expect(result).toEqual([mockProduct]);
      expect(apiClient.get).toHaveBeenCalledWith('/products/seller/seller-1');
    });
  });

  describe('getMyProducts', () => {
    it('should fetch current user products', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: [mockProduct] },
      });

      const result = await productsService.getMyProducts();

      expect(result).toEqual([mockProduct]);
      expect(apiClient.get).toHaveBeenCalledWith('/products/my-products');
    });
  });
});
