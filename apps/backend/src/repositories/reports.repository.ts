import { count, desc, eq, inArray } from 'drizzle-orm';
import { db, reports, Report } from '../db';
import { AppResult, success, failure, ValidationError } from '../utils/result';

/**
 * Reports Repository
 * Data access layer for user reports/disputes
 */
export class ReportsRepository {
  /**
   * Create a new report
   */
  async create(data: {
    reporterId?: string;
    reportedUserId?: string;
    reportedProductId?: string;
    reportedStreamId?: string;
    reportType: string;
    description: string;
  }): Promise<AppResult<Report>> {
    try {
      const [newReport] = await db
        .insert(reports)
        .values({
          reporterId: data.reporterId || null,
          reportedUserId: data.reportedUserId || null,
          reportedProductId: data.reportedProductId || null,
          reportedStreamId: data.reportedStreamId || null,
          reportType: data.reportType,
          description: data.description,
          status: 'pending',
          createdAt: new Date(),
        })
        .returning();
      return success(newReport);
    } catch (error) {
      console.error('ReportsRepository.create', error);
      return failure(new ValidationError('Failed to create report'));
    }
  }

  /**
   * Find report by ID
   */
  async findById(id: string): Promise<AppResult<Report | null>> {
    try {
      const result = await db.query.reports.findFirst({
        where: eq(reports.id, id),
        with: {
          reporter: true,
          reviewedBy: true,
        },
      });
      return success(result || null);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch report'));
    }
  }

  /**
   * Get reports by reporter
   */
  async getByReporter(reporterId: string): Promise<AppResult<Report[]>> {
    try {
      const results = await db.query.reports.findMany({
        where: eq(reports.reporterId, reporterId),
        orderBy: [desc(reports.createdAt)],
      });
      return success(results);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch reports'));
    }
  }

  /**
   * Get reports for a target user
   */
  async getByUserTarget(userId: string): Promise<AppResult<Report[]>> {
    try {
      const results = await db.query.reports.findMany({
        where: eq(reports.reportedUserId, userId),
        orderBy: [desc(reports.createdAt)],
      });
      return success(results);
    } catch (error) {
      return failure(new ValidationError('Failed to fetch user reports'));
    }
  }

  /**
   * Update report status and resolution
   */
  async resolve(
    id: string,
    reviewerId: string,
    status: 'resolved' | 'dismissed',
    notes?: string,
    actionTaken?: string,
  ): Promise<AppResult<Report>> {
    try {
      const [updated] = await db
        .update(reports)
        .set({
          status,
          reviewedBy: reviewerId,
          reviewNotes: notes || null,
          actionTaken: actionTaken || null,
          resolvedAt: new Date(),
        })
        .where(eq(reports.id, id))
        .returning();
      return success(updated);
    } catch (error) {
      return failure(new ValidationError('Failed to resolve report'));
    }
  }

  /**
   * List reports for admin moderation
   */
  async listForAdmin(
    limit: number,
    offset: number,
    statuses?: Array<'pending' | 'reviewing' | 'resolved' | 'dismissed'>,
  ): Promise<AppResult<Report[]>> {
    try {
      const whereClause =
        statuses && statuses.length > 0
          ? inArray(reports.status, statuses)
          : undefined;

      const results = await db.query.reports.findMany({
        where: whereClause,
        orderBy: [desc(reports.createdAt)],
        limit,
        offset,
      });
      return success(results);
    } catch (error) {
      return failure(new ValidationError('Failed to list reports'));
    }
  }

  /**
   * Count reports for admin moderation
   */
  async countForAdmin(
    statuses?: Array<'pending' | 'reviewing' | 'resolved' | 'dismissed'>,
  ): Promise<AppResult<number>> {
    try {
      const whereClause =
        statuses && statuses.length > 0
          ? inArray(reports.status, statuses)
          : undefined;

      const query = db.select({ total: count() }).from(reports);
      const [result] = whereClause ? await query.where(whereClause) : await query;
      return success(Number(result?.total || 0));
    } catch (error) {
      return failure(new ValidationError('Failed to count reports'));
    }
  }
}
