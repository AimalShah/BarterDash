import { sellersService } from '../api/services/sellers';
import apiClient from '../api/client';

jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Sellers Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSeller = {
    id: 'seller-1',
    userId: 'user-1',
    businessName: 'Test Business',
    businessType: 'individual',
    taxId: '123-45-6789',
    status: 'pending',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('register', () => {
    it('should register as a seller', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: mockSeller },
      });

      const payload = {
        businessName: 'Test Business',
        businessType: 'individual' as const,
        taxId: '123-45-6789',
      };

      const result = await sellersService.register(payload);

      expect(result).toEqual(mockSeller);
      expect(apiClient.post).toHaveBeenCalledWith('/sellers/register', payload);
    });
  });

  describe('startApplication', () => {
    it('should start seller application', async () => {
      const mockApplication = {
        id: 'app-1',
        userId: 'user-1',
        businessName: 'Test Business',
        businessType: 'individual',
        taxId: '123-45-6789',
        status: 'draft',
        createdAt: '2024-01-01T00:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: mockApplication },
      });

      const payload = {
        business_type: 'individual',
        business_name: 'Test Business',
        tax_id: '123-45-6789',
      };

      const result = await sellersService.startApplication(payload);

      expect(result).toEqual(mockApplication);
      expect(apiClient.post).toHaveBeenCalledWith('/sellers/apply', payload);
    });
  });

  describe('getDashboard', () => {
    it('should fetch seller dashboard', async () => {
      const mockDashboard = {
        totalSales: 15000,
        totalOrders: 45,
        pendingOrders: 3,
        revenueThisMonth: 5000,
        topProducts: [
          { id: 'prod-1', name: 'Product 1', sales: 20 },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: mockDashboard },
      });

      const result = await sellersService.getDashboard();

      expect(result).toEqual(mockDashboard);
      expect(apiClient.get).toHaveBeenCalledWith('/sellers/dashboard');
    });
  });

  describe('getActiveDashboard', () => {
    it('should fetch active dashboard data', async () => {
      const mockActiveData = {
        activeAuctions: 2,
        liveStreams: 1,
        recentBids: 15,
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: mockActiveData },
      });

      const result = await sellersService.getActiveDashboard();

      expect(result).toEqual(mockActiveData);
      expect(apiClient.get).toHaveBeenCalledWith('/sellers/active-dashboard');
    });
  });

  describe('uploadDocument', () => {
    it('should upload seller document', async () => {
      const mockResponse = { documentId: 'doc-1', status: 'uploaded' };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: mockResponse },
      });

      const payload = {
        document_type: 'id_front' as const,
        file_url: 'https://storage.example.com/doc-1.jpg',
        file_name: 'id_front.jpg',
      };

      const result = await sellersService.uploadDocument(payload);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/sellers/apply/documents', payload);
    });
  });

  describe('submitApplication', () => {
    it('should submit seller application', async () => {
      const mockApplication = {
        id: 'app-1',
        userId: 'user-1',
        status: 'submitted',
        submittedAt: '2024-01-01T00:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: mockApplication },
      });

      const payload = { confirm_documents: true };

      const result = await sellersService.submitApplication(payload);

      expect(result).toEqual(mockApplication);
      expect(apiClient.post).toHaveBeenCalledWith('/sellers/apply/submit', payload);
    });
  });

  describe('getApplicationStatus', () => {
    it('should fetch application status', async () => {
      const mockStatus = {
        status: 'pending_review',
        submittedAt: '2024-01-01T00:00:00Z',
        reviewedAt: null,
        rejectionReason: null,
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: mockStatus },
      });

      const result = await sellersService.getApplicationStatus();

      expect(result).toEqual(mockStatus);
      expect(apiClient.get).toHaveBeenCalledWith('/sellers/apply/status');
    });

    it('should return null if no application exists', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { data: null },
      });

      const result = await sellersService.getApplicationStatus();

      expect(result).toBeNull();
    });
  });

  describe('createVerificationSession', () => {
    it('should create verification session', async () => {
      const mockSession = {
        url: 'https://verify.stripe.com/session/abc123',
        sessionId: 'session-123',
        expiresAt: '2024-01-02T00:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({
        data: { data: mockSession },
      });

      const result = await sellersService.createVerificationSession();

      expect(result).toEqual(mockSession);
      expect(apiClient.post).toHaveBeenCalledWith('/sellers/verify/session');
    });
  });
});
