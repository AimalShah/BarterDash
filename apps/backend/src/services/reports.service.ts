import { ReportsRepository } from '../repositories/reports.repository';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
} from '../utils/result';
import { Report } from '../db';
import { PaymentsService } from './payments.service';

/**
 * Reports Service
 * Business logic for reporting users, products, or streams
 */
export class ReportsService {
  private repository: ReportsRepository;
  private paymentsService: PaymentsService;

  constructor() {
    this.repository = new ReportsRepository();
    this.paymentsService = new PaymentsService();
  }

  /**
   * Submit a report
   */
  async submitReport(
    reporterId: string,
    data: {
      targetId: string;
      targetType: 'user' | 'product' | 'stream' | 'order';
      reason: string;
      description?: string;
    },
  ): Promise<AppResult<Report>> {
    return this.repository.create({
      reporterId,
      targetId: data.targetId,
      targetType: data.targetType,
      reason: data.reason,
      description: data.description,
    });
  }

  /**
   * Resolve a report (Admin/Moderator action)
   */
  async resolveReport(
    reportId: string,
    resolution: string,
    refundOrder: boolean = false,
  ): Promise<AppResult<Report>> {
    const reportResult = await this.repository.findById(reportId);
    if (reportResult.isErr() || !reportResult.value)
      return failure(new NotFoundError('Report', reportId));

    const report = reportResult.value;

    // 1. If it's an order report and refund is requested
    if (refundOrder && report.targetType === 'order') {
      const refundResult = await this.paymentsService.refundOrder(
        report.targetId,
      );
      if (refundResult.isErr()) {
        return failure(
          new ValidationError(
            `Resolution failed: ${refundResult.error.message}`,
          ),
        );
      }
    }

    return this.repository.updateStatus(reportId, 'resolved', resolution);
  }

  /**
   * Get reports for a target
   */
  async getReports(targetId: string): Promise<AppResult<Report[]>> {
    return this.repository.getByTarget(targetId);
  }
}
