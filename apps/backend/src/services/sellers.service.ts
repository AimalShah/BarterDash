import { SellersRepository } from '../repositories/sellers.repository';
import { AppResult, success, failure, ValidationError } from '../utils/result';
import { SellerDetails } from '../db/schema';
import { RegisterSellerInput } from '../schemas/sellers.schemas';

/**
 * Sellers Service
 * Business logic for sellers
 */
export class SellersService {
  private repository: SellersRepository;

  constructor() {
    this.repository = new SellersRepository();
  }

  /**
   * Register as a seller
   */
  async register(
    userId: string,
    data: RegisterSellerInput,
  ): Promise<AppResult<SellerDetails>> {
    return await this.repository.create(userId, data);
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
