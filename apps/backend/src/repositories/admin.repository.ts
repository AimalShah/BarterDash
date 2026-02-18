import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  or,
  sql,
  sum,
} from 'drizzle-orm';
import {
  db,
  escrowTransactions,
  orders,
  profiles,
  refunds,
  reports,
  sellerApplications,
  streams,
  type Profile,
} from '../db';
import {
  AppResult,
  failure,
  NotFoundError,
  success,
  ValidationError,
} from '../utils/result';

export type AdminActivityArea = 'applications' | 'reports' | 'refunds';

export interface AdminActivityItem {
  id: string;
  area: AdminActivityArea;
  action: string;
  targetId: string;
  actorId: string | null;
  actorUsername: string | null;
  at: string;
  metadata: Record<string, unknown>;
}

export type AdminDisputeStatus =
  | 'pending'
  | 'held'
  | 'releasing'
  | 'released'
  | 'refunding'
  | 'refunded'
  | 'disputed'
  | 'cancelled';

export interface AdminAnalyticsOverview {
  snapshot: {
    totalUsers: number;
    totalSellers: number;
    totalAdmins: number;
    activeUsers: number;
    suspendedUsers: number;
    bannedUsers: number;
    pendingSellerApplications: number;
    pendingReports: number;
    pendingRefunds: number;
    disputedEscrows: number;
    liveStreams: number;
  };
  financials: {
    deliveredOrderRevenue: number;
    heldEscrowAmount: number;
    disputedEscrowAmount: number;
    refundedEscrowAmount: number;
  };
  trends: {
    lookbackDays: number;
    signups: number;
    orders: number;
    orderRevenue: number;
    refundRequests: number;
    disputesCreated: number;
  };
  breakdowns: {
    userStatus: Array<{ status: string; total: number }>;
    reportStatus: Array<{ status: string; total: number }>;
    refundStatus: Array<{ status: string; total: number }>;
    disputeStatus: Array<{ status: string; total: number }>;
  };
}

export interface AdminDisputeItem {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  amount: string;
  currency: string;
  sellerAmount: string;
  platformFee: string;
  disputeId: string | null;
  releaseReason: string | null;
  refundReason: string | null;
  heldAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminUserRoleFilter = 'USER' | 'SELLER' | 'ADMIN';

export interface AdminUserItem {
  id: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  isSeller: boolean;
  isAdmin: boolean;
  accountStatus: 'active' | 'suspended' | 'banned' | 'under_review';
  emailVerified: boolean;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export class AdminRepository {
  async listActivity(params: {
    page: number;
    limit: number;
    areas?: AdminActivityArea[];
  }): Promise<
    AppResult<{
      items: AdminActivityItem[];
      total: number;
    }>
  > {
    const offset = (params.page - 1) * params.limit;
    const sourceFetchLimit = params.page * params.limit + params.limit;

    const includeArea = (area: AdminActivityArea): boolean =>
      !params.areas || params.areas.length === 0 || params.areas.includes(area);

    try {
      const [
        applicationRows,
        reportRows,
        refundRows,
        applicationCount,
        reportCount,
        refundCount,
      ] = await Promise.all([
        includeArea('applications')
          ? db
              .select({
                id: sellerApplications.id,
                status: sellerApplications.status,
                actorId: sellerApplications.reviewerId,
                actorUsername: profiles.username,
                at: sellerApplications.reviewedAt,
              })
              .from(sellerApplications)
              .leftJoin(profiles, eq(sellerApplications.reviewerId, profiles.id))
              .where(
                and(
                  isNotNull(sellerApplications.reviewedAt),
                  isNotNull(sellerApplications.reviewerId),
                ),
              )
              .orderBy(desc(sellerApplications.reviewedAt))
              .limit(sourceFetchLimit)
          : Promise.resolve([]),

        includeArea('reports')
          ? db
              .select({
                id: reports.id,
                status: reports.status,
                actorId: reports.reviewedBy,
                actorUsername: profiles.username,
                at: reports.resolvedAt,
              })
              .from(reports)
              .leftJoin(profiles, eq(reports.reviewedBy, profiles.id))
              .where(and(isNotNull(reports.resolvedAt), isNotNull(reports.reviewedBy)))
              .orderBy(desc(reports.resolvedAt))
              .limit(sourceFetchLimit)
          : Promise.resolve([]),

        includeArea('refunds')
          ? db
              .select({
                id: refunds.id,
                status: refunds.status,
                actorId: refunds.approvedBy,
                actorUsername: profiles.username,
                at: refunds.updatedAt,
              })
              .from(refunds)
              .leftJoin(profiles, eq(refunds.approvedBy, profiles.id))
              .where(isNotNull(refunds.approvedBy))
              .orderBy(desc(refunds.updatedAt))
              .limit(sourceFetchLimit)
          : Promise.resolve([]),

        includeArea('applications')
          ? db
              .select({ total: count() })
              .from(sellerApplications)
              .where(
                and(
                  isNotNull(sellerApplications.reviewedAt),
                  isNotNull(sellerApplications.reviewerId),
                ),
              )
          : Promise.resolve([{ total: 0 }]),

        includeArea('reports')
          ? db
              .select({ total: count() })
              .from(reports)
              .where(and(isNotNull(reports.resolvedAt), isNotNull(reports.reviewedBy)))
          : Promise.resolve([{ total: 0 }]),

        includeArea('refunds')
          ? db.select({ total: count() }).from(refunds).where(isNotNull(refunds.approvedBy))
          : Promise.resolve([{ total: 0 }]),
      ]);

      const applicationItems: AdminActivityItem[] = applicationRows
        .filter((row) => row.at)
        .map((row) => ({
          id: `application-${row.id}`,
          area: 'applications',
          action: `application_${row.status}`,
          targetId: row.id,
          actorId: row.actorId,
          actorUsername: row.actorUsername ?? null,
          at: row.at!.toISOString(),
          metadata: { status: row.status },
        }));

      const reportItems: AdminActivityItem[] = reportRows
        .filter((row) => row.at)
        .map((row) => ({
          id: `report-${row.id}`,
          area: 'reports',
          action: `report_${row.status}`,
          targetId: row.id,
          actorId: row.actorId,
          actorUsername: row.actorUsername ?? null,
          at: row.at!.toISOString(),
          metadata: { status: row.status },
        }));

      const refundItems: AdminActivityItem[] = refundRows
        .filter((row) => row.at)
        .map((row) => ({
          id: `refund-${row.id}`,
          area: 'refunds',
          action: `refund_${row.status}`,
          targetId: row.id,
          actorId: row.actorId,
          actorUsername: row.actorUsername ?? null,
          at: row.at.toISOString(),
          metadata: { status: row.status },
        }));

      const merged = [...applicationItems, ...reportItems, ...refundItems].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      );

      const items = merged.slice(offset, offset + params.limit);
      const total =
        toNumber(applicationCount[0]?.total) +
        toNumber(reportCount[0]?.total) +
        toNumber(refundCount[0]?.total);

      return success({ items, total });
    } catch (error) {
      console.error('Error listing admin activity:', error);
      return failure(new ValidationError('Failed to list admin activity'));
    }
  }

  async getAnalyticsOverview(
    lookbackDays: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<AppResult<AdminAnalyticsOverview>> {
    try {
      const startDate = dateRange?.startDate ?? new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.endDate ?? new Date();

      // Batch 1: User counts and status breakdown in single query
      const userStatsPromise = db
        .select({
          accountStatus: profiles.accountStatus,
          total: count(),
          isSellerCount: count(sql`CASE WHEN ${profiles.isSeller} = true THEN 1 END`),
          isAdminCount: count(sql`CASE WHEN ${profiles.isAdmin} = true THEN 1 END`),
        })
        .from(profiles)
        .groupBy(profiles.accountStatus);

      // Batch 2: Pending counts
      const pendingCountsPromise = Promise.all([
        db
          .select({ total: count() })
          .from(sellerApplications)
          .where(
            inArray(sellerApplications.status, ['submitted', 'in_review', 'more_info_needed']),
          ),
        db.select({ total: count() }).from(reports).where(eq(reports.status, 'pending')),
        db.select({ total: count() }).from(refunds).where(eq(refunds.status, 'pending')),
        db
          .select({ total: count() })
          .from(escrowTransactions)
          .where(eq(escrowTransactions.status, 'disputed')),
        db.select({ total: count() }).from(streams).where(eq(streams.status, 'live')),
      ]);

      // Batch 3: Financial aggregates
      const financialPromise = Promise.all([
        db
          .select({ total: sum(orders.total) })
          .from(orders)
          .where(eq(orders.status, 'delivered')),
        db
          .select({
            held: sum(sql`CASE WHEN ${escrowTransactions.status} IN ('held', 'releasing') THEN ${escrowTransactions.amount} ELSE 0 END`),
            disputed: sum(sql`CASE WHEN ${escrowTransactions.status} = 'disputed' THEN ${escrowTransactions.amount} ELSE 0 END`),
            refunded: sum(sql`CASE WHEN ${escrowTransactions.status} = 'refunded' THEN ${escrowTransactions.amount} ELSE 0 END`),
          })
          .from(escrowTransactions),
      ]);

      // Batch 4: Trend data
      const { lte } = await import('drizzle-orm');
      const trendPromise = Promise.all([
        db
          .select({ total: count() })
          .from(profiles)
          .where(and(gte(profiles.createdAt, startDate), lte(profiles.createdAt, endDate))),
        db
          .select({ total: count(), revenue: sum(orders.total) })
          .from(orders)
          .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))),
        db
          .select({ total: count() })
          .from(refunds)
          .where(and(gte(refunds.createdAt, startDate), lte(refunds.createdAt, endDate))),
        db
          .select({ total: count() })
          .from(escrowTransactions)
          .where(
            and(
              eq(escrowTransactions.status, 'disputed'),
              gte(escrowTransactions.updatedAt, startDate),
              lte(escrowTransactions.updatedAt, endDate),
            ),
          ),
      ]);

      // Batch 5: Status breakdowns
      const breakdownPromise = Promise.all([
        db
          .select({ status: reports.status, total: count() })
          .from(reports)
          .groupBy(reports.status),
        db
          .select({ status: refunds.status, total: count() })
          .from(refunds)
          .groupBy(refunds.status),
        db
          .select({ status: escrowTransactions.status, total: count() })
          .from(escrowTransactions)
          .groupBy(escrowTransactions.status),
      ]);

      // Execute all batches
      const [userStats, pendingCounts, financials, trends, breakdowns] = await Promise.all([
        userStatsPromise,
        pendingCountsPromise,
        financialPromise,
        trendPromise,
        breakdownPromise,
      ]);

      // Calculate user totals from userStats
      let totalUsers = 0;
      let totalSellers = 0;
      let totalAdmins = 0;
      let activeUsers = 0;
      let suspendedUsers = 0;
      let bannedUsers = 0;

      for (const stat of userStats) {
        const count = toNumber(stat.total);
        totalUsers += count;
        totalSellers += toNumber(stat.isSellerCount);
        totalAdmins += toNumber(stat.isAdminCount);
        
        if (stat.accountStatus === 'active') activeUsers += count;
        if (stat.accountStatus === 'suspended') suspendedUsers += count;
        if (stat.accountStatus === 'banned') bannedUsers += count;
      }

      const [
        pendingApplications,
        pendingReports,
        pendingRefunds,
        disputedEscrows,
        liveStreams,
      ] = pendingCounts;

      const [deliveredRevenue, escrowAmounts] = financials;
      const [signupsWindow, ordersWindow, refundsWindow, disputesWindow] = trends;
      const [reportStatusBreakdown, refundStatusBreakdown, disputeStatusBreakdown] = breakdowns;

      return success({
        snapshot: {
          totalUsers,
          totalSellers,
          totalAdmins,
          activeUsers,
          suspendedUsers,
          bannedUsers,
          pendingSellerApplications: toNumber(pendingApplications[0]?.total),
          pendingReports: toNumber(pendingReports[0]?.total),
          pendingRefunds: toNumber(pendingRefunds[0]?.total),
          disputedEscrows: toNumber(disputedEscrows[0]?.total),
          liveStreams: toNumber(liveStreams[0]?.total),
        },
        financials: {
          deliveredOrderRevenue: toNumber(deliveredRevenue[0]?.total),
          heldEscrowAmount: toNumber(escrowAmounts[0]?.held),
          disputedEscrowAmount: toNumber(escrowAmounts[0]?.disputed),
          refundedEscrowAmount: toNumber(escrowAmounts[0]?.refunded),
        },
        trends: {
          lookbackDays,
          signups: toNumber(signupsWindow[0]?.total),
          orders: toNumber(ordersWindow[0]?.total),
          orderRevenue: toNumber(ordersWindow[0]?.revenue),
          refundRequests: toNumber(refundsWindow[0]?.total),
          disputesCreated: toNumber(disputesWindow[0]?.total),
        },
        breakdowns: {
          userStatus: userStats.map((item) => ({
            status: item.accountStatus,
            total: toNumber(item.total),
          })),
          reportStatus: reportStatusBreakdown.map((item) => ({
            status: item.status,
            total: toNumber(item.total),
          })),
          refundStatus: refundStatusBreakdown.map((item) => ({
            status: item.status,
            total: toNumber(item.total),
          })),
          disputeStatus: disputeStatusBreakdown.map((item) => ({
            status: item.status,
            total: toNumber(item.total),
          })),
        },
      });
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      return failure(new ValidationError('Failed to fetch admin analytics'));
    }
  }

  async listDisputes(params: {
    page: number;
    limit: number;
    statuses?: AdminDisputeStatus[];
  }): Promise<AppResult<AdminDisputeItem[]>> {
    const offset = (params.page - 1) * params.limit;
    const statuses: AdminDisputeStatus[] = params.statuses?.length
      ? params.statuses
      : ['disputed'];

    try {
      const rows = await db.query.escrowTransactions.findMany({
        where: inArray(escrowTransactions.status, statuses),
        orderBy: [desc(escrowTransactions.updatedAt)],
        limit: params.limit,
        offset,
      });

      return success(
        rows.map((row) => ({
          id: row.id,
          orderId: row.orderId,
          buyerId: row.buyerId,
          sellerId: row.sellerId,
          status: row.status,
          amount: row.amount,
          currency: row.currency,
          sellerAmount: row.sellerAmount,
          platformFee: row.platformFee,
          disputeId: row.disputeId || null,
          releaseReason: row.releaseReason || null,
          refundReason: row.refundReason || null,
          heldAt: row.heldAt ? row.heldAt.toISOString() : null,
          releasedAt: row.releasedAt ? row.releasedAt.toISOString() : null,
          refundedAt: row.refundedAt ? row.refundedAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      );
    } catch (error) {
      console.error('Error listing disputes:', error);
      return failure(new ValidationError('Failed to list disputes'));
    }
  }

  async countDisputes(statuses?: AdminDisputeStatus[]): Promise<AppResult<number>> {
    const effectiveStatuses: AdminDisputeStatus[] = statuses?.length
      ? statuses
      : ['disputed'];

    try {
      const [result] = await db
        .select({ total: count() })
        .from(escrowTransactions)
        .where(inArray(escrowTransactions.status, effectiveStatuses));

      return success(toNumber(result?.total));
    } catch (error) {
      console.error('Error counting disputes:', error);
      return failure(new ValidationError('Failed to count disputes'));
    }
  }

  async getDisputeById(id: string): Promise<AppResult<AdminDisputeItem | null>> {
    try {
      const row = await db.query.escrowTransactions.findFirst({
        where: eq(escrowTransactions.id, id),
      });

      if (!row) {
        return success(null);
      }

      return success({
        id: row.id,
        orderId: row.orderId,
        buyerId: row.buyerId,
        sellerId: row.sellerId,
        status: row.status,
        amount: row.amount,
        currency: row.currency,
        sellerAmount: row.sellerAmount,
        platformFee: row.platformFee,
        disputeId: row.disputeId || null,
        releaseReason: row.releaseReason || null,
        refundReason: row.refundReason || null,
        heldAt: row.heldAt ? row.heldAt.toISOString() : null,
        releasedAt: row.releasedAt ? row.releasedAt.toISOString() : null,
        refundedAt: row.refundedAt ? row.refundedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      });
    } catch (error) {
      console.error('Error getting dispute:', error);
      return failure(new ValidationError('Failed to get dispute'));
    }
  }

  private buildUserWhereClause(filters: {
    query?: string;
    role?: AdminUserRoleFilter;
    accountStatus?: 'active' | 'suspended' | 'banned' | 'under_review';
  }) {
    const conditions: any[] = [];

    if (filters.query?.trim()) {
      const query = `%${filters.query.trim()}%`;
      conditions.push(
        or(ilike(profiles.username, query), ilike(profiles.fullName, query)),
      );
    }

    if (filters.accountStatus) {
      conditions.push(eq(profiles.accountStatus, filters.accountStatus));
    }

    if (filters.role === 'ADMIN') {
      conditions.push(eq(profiles.isAdmin, true));
    } else if (filters.role === 'SELLER') {
      conditions.push(eq(profiles.isSeller, true));
    } else if (filters.role === 'USER') {
      conditions.push(and(eq(profiles.isAdmin, false), eq(profiles.isSeller, false)));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async listUsers(params: {
    page: number;
    limit: number;
    query?: string;
    role?: AdminUserRoleFilter;
    accountStatus?: 'active' | 'suspended' | 'banned' | 'under_review';
  }): Promise<AppResult<AdminUserItem[]>> {
    const offset = (params.page - 1) * params.limit;
    const whereClause = this.buildUserWhereClause(params);

    try {
      const rows = await db.query.profiles.findMany({
        where: whereClause,
        columns: {
          id: true,
          username: true,
          fullName: true,
          phone: true,
          isSeller: true,
          isAdmin: true,
          accountStatus: true,
          emailVerified: true,
          onboarded: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [desc(profiles.updatedAt)],
        limit: params.limit,
        offset,
      });

      return success(
        rows.map((row) => ({
          id: row.id,
          username: row.username,
          fullName: row.fullName,
          phone: row.phone,
          isSeller: row.isSeller,
          isAdmin: row.isAdmin,
          accountStatus: row.accountStatus,
          emailVerified: row.emailVerified,
          onboarded: row.onboarded,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      );
    } catch (error) {
      console.error('Error listing users:', error);
      return failure(new ValidationError('Failed to list users'));
    }
  }

  async countUsers(params: {
    query?: string;
    role?: AdminUserRoleFilter;
    accountStatus?: 'active' | 'suspended' | 'banned' | 'under_review';
  }): Promise<AppResult<number>> {
    const whereClause = this.buildUserWhereClause(params);

    try {
      const query = db.select({ total: count() }).from(profiles);
      const [result] = whereClause ? await query.where(whereClause) : await query;

      return success(toNumber(result?.total));
    } catch (error) {
      console.error('Error counting users:', error);
      return failure(new ValidationError('Failed to count users'));
    }
  }

  async updateUserById(
    userId: string,
    data: {
      accountStatus?: 'active' | 'suspended' | 'banned' | 'under_review';
      isAdmin?: boolean;
      isSeller?: boolean;
    },
  ): Promise<AppResult<Profile>> {
    try {
      const [updated] = await db
        .update(profiles)
        .set({
          accountStatus: data.accountStatus,
          isAdmin: data.isAdmin,
          isSeller: data.isSeller,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId))
        .returning();

      if (!updated) {
        return failure(new NotFoundError('Profile', userId));
      }

      return success(updated);
    } catch (error) {
      console.error('Error updating user:', error);
      return failure(new ValidationError('Failed to update user'));
    }
  }
}
