import { SellersRepository } from '../repositories/sellers.repository';
import { SellerApplicationsRepository } from '../repositories/seller-applications.repository';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  ForbiddenError,
} from '../utils/result';
import { SellerDetails } from '../db/schema';
import { RegisterSellerInput } from '../schemas/sellers.schemas';

/**
 * Sellers Service
 * Business logic for sellers
 */
export class SellersService {
  private repository: SellersRepository;
  private applicationsRepository: SellerApplicationsRepository;

  constructor() {
    this.repository = new SellersRepository();
    this.applicationsRepository = new SellerApplicationsRepository();
  }

  /**
   * Register as a seller
   */
  async register(
    userId: string,
    _data: RegisterSellerInput,
  ): Promise<AppResult<SellerDetails>> {
    const sellerDetailsResult =
      await this.applicationsRepository.getSellerDetailsByUserId(userId);

    if (sellerDetailsResult.isErr()) {
      return failure(sellerDetailsResult.error);
    }

    if (sellerDetailsResult.value) {
      if (sellerDetailsResult.value.identityVerified) {
        return success(sellerDetailsResult.value);
      }

      const verifyExistingResult = await this.applicationsRepository.setIdentityVerified(
        userId,
        true,
      );
      if (verifyExistingResult.isErr()) {
        return failure(verifyExistingResult.error);
      }
      return success(verifyExistingResult.value);
    }

    const applicationResult = await this.applicationsRepository.findByUserId(userId);
    if (applicationResult.isErr()) {
      return failure(applicationResult.error);
    }

    if (!applicationResult.value || applicationResult.value.status !== 'approved') {
      return failure(
        new ForbiddenError(
          'Complete seller application approval before registering as a seller',
        ),
      );
    }

    const createSellerResult =
      await this.applicationsRepository.createSellerDetails(userId);
    if (createSellerResult.isErr()) {
      return failure(createSellerResult.error);
    }

    const verifyResult = await this.applicationsRepository.setIdentityVerified(
      userId,
      true,
    );
    if (verifyResult.isErr()) {
      return failure(verifyResult.error);
    }

    return success(verifyResult.value);
  }

  /**
   * Get seller dashboard stats
   */
  async getDashboard(userId: string): Promise<AppResult<any>> {
    const sellerResult = await this.repository.findByUserId(userId);

    if (sellerResult.isErr()) {
      return failure(sellerResult.error);
    }

    if (!sellerResult.value) {
      return failure(new ValidationError('User is not a seller'));
    }

    const stats = await this.repository.getDashboardStats(userId);

    if (!stats) {
      return failure(new ValidationError('Dashboard stats not available'));
    }

    return success(stats);
  }

  /**
   * Get active dashboard data (current live stream details)
   */
  async getActiveStreamDashboard(userId: string): Promise<AppResult<any>> {
    // 1. Get current active stream
    const activeStream = await this.repository.getActiveStream(userId);

    if (!activeStream) {
      return success({ isLive: false });
    }

    // 2. Get dashboard data for this stream
    const dashboardData = await this.repository.getStreamDashboardData(
      activeStream.id,
    );

    return success({
      isLive: true,
      stream: activeStream,
      ...dashboardData,
    });
  }
}
