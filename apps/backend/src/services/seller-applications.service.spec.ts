import { SellerApplicationsService } from './seller-applications.service';
import { SellerApplicationsRepository } from '../repositories/seller-applications.repository';
import { success } from '../utils/result';

// Mock dependencies
jest.mock('../repositories/seller-applications.repository');
jest.mock('../utils/stripe', () => ({
  stripe: {
    identity: {
      verificationSessions: {
        create: jest.fn().mockResolvedValue({
          id: 'sess_123',
          client_secret: 'secret',
          url: 'https://verify.stripe.com/start',
        }),
      },
    },
  },
}));

describe('SellerApplicationsService', () => {
  let service: SellerApplicationsService;
  let repository: jest.Mocked<SellerApplicationsRepository>;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Initialize service
    service = new SellerApplicationsService();
    // Get mocked repository instance (it's created inside the service constructor)
    // We need to access the prototype mock to effect the instance used by service
    repository = (SellerApplicationsRepository as any).mock.instances[0];
  });

  describe('startApplication', () => {
    it('should create a new application', async () => {
      const mockInput = {
        business_type: 'individual' as const,
        business_name: 'Test Business',
        tax_id: '123',
      };

      const mockResult = { id: 'app_1', ...mockInput };

      (repository.create as jest.Mock).mockResolvedValue(success(mockResult));

      const result = await service.startApplication('user_1', mockInput);

      expect(repository.create).toHaveBeenCalledWith('user_1', {
        businessType: 'individual',
        businessName: 'Test Business',
        taxId: '123',
      });
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockResult);
    });
  });

  describe('submitApplication', () => {
    it('should submit application if all documents are present', async () => {
      // Mock finding application
      (repository.findByUserId as jest.Mock).mockResolvedValue(
        success({ id: 'app_1', userId: 'user_1', status: 'draft' }),
      );

      // Mock getting documents
      (repository.getDocuments as jest.Mock).mockResolvedValue(
        success([{ documentType: 'id_front' }, { documentType: 'id_back' }]),
      );

      // Mock update status
      (repository.updateStatus as jest.Mock).mockResolvedValue(
        success({ id: 'app_1', status: 'submitted' }),
      );

      const result = await service.submitApplication('user_1');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'app_1',
        'submitted',
      );
      expect(result.isOk()).toBe(true);
    });

    it('should fail if documents are missing', async () => {
      // Mock finding application
      (repository.findByUserId as jest.Mock).mockResolvedValue(
        success({ id: 'app_1', userId: 'user_1', status: 'draft' }),
      );

      // Mock getting documents (missing id_back)
      (repository.getDocuments as jest.Mock).mockResolvedValue(
        success([{ documentType: 'id_front' }]),
      );

      const result = await service.submitApplication('user_1');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('VALIDATION_ERROR');
    });
  });

  describe('createVerificationSession', () => {
    it('should create session for submitted application', async () => {
      // Mock finding application
      (repository.findByUserId as jest.Mock).mockResolvedValue(
        success({ id: 'app_1', userId: 'user_1', status: 'submitted' }),
      );

      // Mock update status
      (repository.updateStatus as jest.Mock).mockResolvedValue(
        success({ id: 'app_1', status: 'in_review' }),
      );

      const result = await service.createVerificationSession('user_1');
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveProperty('sessionId', 'sess_123');
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'app_1',
        'in_review',
      );
    });
  });
});
