import { ReportsRepository } from '../repositories/reports.repository';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
} from '../utils/result';
import { Report } from '../db';

/**
 * Reports Service
 * Business logic for reporting users, products, or streams
 */
export class ReportsService {
  private repository: ReportsRepository;

  constructor() {
    this.repository = new ReportsRepository();
  }

  /**
   * Submit a report
   */
  async submitReport(
    reporterId: string,
    data: {
      reportedUserId?: string;
      reportedProductId?: string;
      reportedStreamId?: string;
      reportType: string;
      description: string;
    },
  ): Promise<AppResult<Report>> {
    return this.repository.create({
      reporterId,
      reportedUserId: data.reportedUserId,
      reportedProductId: data.reportedProductId,
      reportedStreamId: data.reportedStreamId,
      reportType: data.reportType,
      description: data.description,
    });
  }

  /**
   * Get reports by reporter
   */
  async getReportsByReporter(reporterId: string): Promise<AppResult<Report[]>> {
    return this.repository.getByReporter(reporterId);
  }

  /**
   * Get a single report
   */
  async getReport(reportId: string): Promise<AppResult<Report>> {
    const result = await this.repository.findById(reportId);
    if (result.isErr()) return failure(result.error);
    if (!result.value) return failure(new NotFoundError('Report', reportId));
    return success(result.value);
  }

  /**
   * Resolve a report (Admin/Moderator action)
   */
  async resolveReport(
    reportId: string,
    reviewerId: string,
    status: 'resolved' | 'dismissed',
    notes?: string,
    actionTaken?: string,
  ): Promise<AppResult<Report>> {
    const reportResult = await this.repository.findById(reportId);
    if (reportResult.isErr() || !reportResult.value)
      return failure(new NotFoundError('Report', reportId));

    return this.repository.resolve(reportId, reviewerId, status, notes, actionTaken || undefined);
  }

  /**
   * Get reports for a target
   */
  async getReports(targetId: string): Promise<AppResult<Report[]>> {
    return this.repository.getByUserTarget(targetId);
  }

  /**
   * List reports for admin moderation with pagination
   */
  async listAdminReports(params: {
    page: number;
    limit: number;
    statuses?: Array<'pending' | 'reviewing' | 'resolved' | 'dismissed'>;
  }): Promise<
    AppResult<{
      items: Report[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
      };
    }>
  > {
    const offset = (params.page - 1) * params.limit;
    const [itemsResult, countResult] = await Promise.all([
      this.repository.listForAdmin(params.limit, offset, params.statuses),
      this.repository.countForAdmin(params.statuses),
    ]);

    if (itemsResult.isErr()) return failure(itemsResult.error);
    if (countResult.isErr()) return failure(countResult.error);

    const total = countResult.value;
    const totalPages = Math.max(1, Math.ceil(total / params.limit));

    return success({
      items: itemsResult.value,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNextPage: params.page < totalPages,
      },
    });
  }
}
