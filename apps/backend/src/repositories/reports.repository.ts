import { eq, desc } from 'drizzle-orm';
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
    reporterId: string;
    reportType: string;
    description: string;
    reportedUserId?: string;
    reportedProductId?: string;
    reportedStreamId?: string;
  }): Promise<AppResult<Report>> {
    try {
      const [newReport] = await db
        .insert(reports)
        .values({
          ...data,
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
    notes: string,
    actionTaken?: string,
  ): Promise<AppResult<Report>> {
    try {
      const [updated] = await db
        .update(reports)
        .set({
          status,
          reviewedBy: reviewerId,
          reviewNotes: notes,
          actionTaken,
          resolvedAt: new Date(),
        })
        .where(eq(reports.id, id))
        .returning();
      return success(updated);
    } catch (error) {
      return failure(new ValidationError('Failed to resolve report'));
    }
  }
}
