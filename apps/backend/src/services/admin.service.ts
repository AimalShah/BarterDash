import {
  AdminActivityArea,
  AdminActivityItem,
  AdminAnalyticsOverview,
  AdminDisputeItem,
  AdminDisputeStatus,
  AdminRepository,
  AdminUserItem,
  AdminUserRoleFilter,
} from '../repositories/admin.repository';
import { EscrowService } from './escrow.service';
import {
  AppResult,
  failure,
  NotFoundError,
  success,
  ValidationError,
} from '../utils/result';

export class AdminService {
  private repository: AdminRepository;
  private escrowService: EscrowService;

  constructor() {
    this.repository = new AdminRepository();
    this.escrowService = new EscrowService();
  }

  async listActivity(params: {
    page: number;
    limit: number;
    areas?: AdminActivityArea[];
  }): Promise<
    AppResult<{
      items: AdminActivityItem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
      };
    }>
  > {
    const result = await this.repository.listActivity(params);
    if (result.isErr()) return failure(result.error);

    const totalPages = Math.max(1, Math.ceil(result.value.total / params.limit));

    return success({
      items: result.value.items,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: result.value.total,
        totalPages,
        hasNextPage: params.page < totalPages,
      },
    });
  }

  async getAnalyticsOverview(
    lookbackDays: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<AppResult<AdminAnalyticsOverview>> {
    return this.repository.getAnalyticsOverview(lookbackDays, dateRange);
  }

  async listDisputes(params: {
    page: number;
    limit: number;
    statuses?: AdminDisputeStatus[];
  }): Promise<
    AppResult<{
      items: AdminDisputeItem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
      };
    }>
  > {
    const [itemsResult, countResult] = await Promise.all([
      this.repository.listDisputes(params),
      this.repository.countDisputes(params.statuses),
    ]);

    if (itemsResult.isErr()) return failure(itemsResult.error);
    if (countResult.isErr()) return failure(countResult.error);

    const totalPages = Math.max(1, Math.ceil(countResult.value / params.limit));

    return success({
      items: itemsResult.value,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: countResult.value,
        totalPages,
        hasNextPage: params.page < totalPages,
      },
    });
  }

  async resolveDispute(params: {
    escrowId: string;
    resolution: 'release' | 'refund';
    reason: string;
  }): Promise<
    AppResult<{
      escrowId: string;
      resolution: 'release' | 'refund';
      status: string;
      reason: string;
    }>
  > {
    const disputeResult = await this.repository.getDisputeById(params.escrowId);
    if (disputeResult.isErr()) return failure(disputeResult.error);

    if (!disputeResult.value) {
      return failure(new NotFoundError('Escrow dispute', params.escrowId));
    }

    const currentStatus = disputeResult.value.status;
    const actionable = ['disputed', 'held', 'refunding'];
    if (!actionable.includes(currentStatus)) {
      return failure(
        new ValidationError(
          `Dispute cannot be resolved from status '${currentStatus}'`,
        ),
      );
    }

    if (params.resolution === 'release') {
      const releaseResult = await this.escrowService.releaseToSeller(
        params.escrowId,
        params.reason || 'dispute_resolved',
      );
      if (releaseResult.isErr()) return failure(releaseResult.error);

      return success({
        escrowId: params.escrowId,
        resolution: 'release',
        status: releaseResult.value.escrow.status,
        reason: params.reason,
      });
    }

    const refundResult = await this.escrowService.refundToBuyer(
      params.escrowId,
      params.reason || 'dispute_refund',
    );
    if (refundResult.isErr()) return failure(refundResult.error);

    return success({
      escrowId: params.escrowId,
      resolution: 'refund',
      status: refundResult.value.escrow.status,
      reason: params.reason,
    });
  }

  async listUsers(params: {
    page: number;
    limit: number;
    query?: string;
    role?: AdminUserRoleFilter;
    accountStatus?: 'active' | 'suspended' | 'banned' | 'under_review';
  }): Promise<
    AppResult<{
      items: AdminUserItem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
      };
    }>
  > {
    const [itemsResult, countResult] = await Promise.all([
      this.repository.listUsers(params),
      this.repository.countUsers(params),
    ]);

    if (itemsResult.isErr()) return failure(itemsResult.error);
    if (countResult.isErr()) return failure(countResult.error);

    const totalPages = Math.max(1, Math.ceil(countResult.value / params.limit));

    return success({
      items: itemsResult.value,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: countResult.value,
        totalPages,
        hasNextPage: params.page < totalPages,
      },
    });
  }

  async updateUser(params: {
    actorId: string;
    userId: string;
    accountStatus?: 'active' | 'suspended' | 'banned' | 'under_review';
    isAdmin?: boolean;
    isSeller?: boolean;
  }): Promise<AppResult<AdminUserItem>> {
    if (params.actorId === params.userId && params.isAdmin === false) {
      return failure(
        new ValidationError('You cannot remove your own admin privileges'),
      );
    }

    const updateResult = await this.repository.updateUserById(params.userId, {
      accountStatus: params.accountStatus,
      isAdmin: params.isAdmin,
      isSeller: params.isSeller,
    });

    if (updateResult.isErr()) return failure(updateResult.error);

    const profile = updateResult.value;

    return success({
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName || null,
      phone: profile.phone || null,
      isSeller: profile.isSeller,
      isAdmin: profile.isAdmin,
      accountStatus: profile.accountStatus,
      emailVerified: profile.emailVerified,
      onboarded: profile.onboarded,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    });
  }

  async bulkUpdateUsers(params: {
    actorId: string;
    userIds: string[];
    accountStatus?: 'active' | 'suspended' | 'banned' | 'under_review';
    isAdmin?: boolean;
    isSeller?: boolean;
  }): Promise<AppResult<{ updatedCount: number; failedCount: number }>> {
    // Prevent removing own admin privileges
    if (params.userIds.includes(params.actorId) && params.isAdmin === false) {
      return failure(
        new ValidationError('You cannot remove your own admin privileges'),
      );
    }

    let updatedCount = 0;
    let failedCount = 0;

    // Process updates sequentially to avoid overwhelming the database
    for (const userId of params.userIds) {
      const result = await this.repository.updateUserById(userId, {
        accountStatus: params.accountStatus,
        isAdmin: params.isAdmin,
        isSeller: params.isSeller,
      });

      if (result.isOk()) {
        updatedCount++;
      } else {
        failedCount++;
      }
    }

    return success({ updatedCount, failedCount });
  }
}
