import { count, desc, eq, inArray } from 'drizzle-orm';
import {
  db,
  sellerApplications,
  verificationDocuments,
  sellerDetails,
  profiles,
  SellerApplication,
  SellerDetails,
} from '../db';
import {
  AppResult,
  success,
  failure,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../utils/result';

/**
 * Seller Applications Repository
 * Data access layer for seller applications and verification documents
 */
export class SellerApplicationsRepository {
  /**
   * Create a new seller application
   */
  async create(
    userId: string,
    data: {
      businessType: 'individual' | 'business';
      businessName: string;
      taxId?: string;
    },
  ): Promise<AppResult<SellerApplication>> {
    try {
      // Check if user already has an application
      const existing = await db.query.sellerApplications.findFirst({
        where: eq(sellerApplications.userId, userId),
      });

      if (existing) {
        const canReuseExisting = ['draft', 'more_info_needed', 'rejected'].includes(
          existing.status,
        );

        if (canReuseExisting) {
          const [updated] = await db
            .update(sellerApplications)
            .set({
              status: 'draft',
              businessType: data.businessType,
              businessName: data.businessName,
              taxId: data.taxId,
              rejectionReason: null,
              adminNotes: null,
              reviewerId: null,
              submittedAt: null,
              reviewedAt: null,
              updatedAt: new Date(),
            })
            .where(eq(sellerApplications.id, existing.id))
            .returning();

          if (!updated) {
            return failure(new NotFoundError('Seller application'));
          }

          return success(updated);
        }

        return failure(
          new ConflictError('User already has a seller application'),
        );
      }

      const [application] = await db
        .insert(sellerApplications)
        .values({
          userId,
          businessType: data.businessType,
          businessName: data.businessName,
          taxId: data.taxId,
          status: 'draft',
        })
        .returning();

      return success(application);
    } catch (error) {
      console.error('Error creating seller application:', error);
      return failure(
        new ValidationError('Failed to create seller application'),
      );
    }
  }

  /**
   * Find application by user ID
   */
  async findByUserId(
    userId: string,
  ): Promise<AppResult<SellerApplication | null>> {
    try {
      const application = await db.query.sellerApplications.findFirst({
        where: eq(sellerApplications.userId, userId),
      });
      return success(application || null);
    } catch (error) {
      console.error('Error finding seller application:', error);
      return failure(new NotFoundError('Seller application'));
    }
  }

  /**
   * Find application by ID
   */
  async findById(id: string): Promise<AppResult<SellerApplication | null>> {
    try {
      const application = await db.query.sellerApplications.findFirst({
        where: eq(sellerApplications.id, id),
      });
      return success(application || null);
    } catch (error) {
      console.error('Error finding seller application:', error);
      return failure(new NotFoundError('Seller application'));
    }
  }

  /**
   * Update application status
   */
  async updateStatus(
    applicationId: string,
    status:
      | 'draft'
      | 'submitted'
      | 'in_review'
      | 'approved'
      | 'rejected'
      | 'more_info_needed',
    additionalData?: {
      rejectionReason?: string;
      adminNotes?: string;
      reviewerId?: string;
    },
  ): Promise<AppResult<SellerApplication>> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'submitted') {
        updateData.submittedAt = new Date();
      }

      if (status === 'approved' || status === 'rejected') {
        updateData.reviewedAt = new Date();
      }

      if (additionalData?.rejectionReason) {
        updateData.rejectionReason = additionalData.rejectionReason;
      }

      if (additionalData?.adminNotes) {
        updateData.adminNotes = additionalData.adminNotes;
      }

      if (additionalData?.reviewerId) {
        updateData.reviewerId = additionalData.reviewerId;
      }

      const [updated] = await db
        .update(sellerApplications)
        .set(updateData)
        .where(eq(sellerApplications.id, applicationId))
        .returning();

      if (!updated) {
        return failure(new NotFoundError('Seller application'));
      }

      return success(updated);
    } catch (error) {
      console.error('Error updating application status:', error);
      return failure(
        new ValidationError('Failed to update application status'),
      );
    }
  }

  /**
   * Add a verification document to an application
   */
  async addDocument(
    applicationId: string,
    data: {
      documentType:
        | 'id_front'
        | 'id_back'
        | 'business_license'
        | 'tax_form'
        | 'bank_statement';
      fileUrl: string;
      fileName?: string;
    },
  ): Promise<AppResult<typeof verificationDocuments.$inferSelect>> {
    try {
      const [document] = await db
        .insert(verificationDocuments)
        .values({
          applicationId,
          documentType: data.documentType,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          verificationStatus: 'pending',
        })
        .returning();

      return success(document);
    } catch (error) {
      console.error('Error adding verification document:', error);
      return failure(
        new ValidationError('Failed to add verification document'),
      );
    }
  }

  /**
   * Get all documents for an application
   */
  async getDocuments(
    applicationId: string,
  ): Promise<AppResult<(typeof verificationDocuments.$inferSelect)[]>> {
    try {
      const docs = await db.query.verificationDocuments.findMany({
        where: eq(verificationDocuments.applicationId, applicationId),
      });
      return success(docs);
    } catch (error) {
      console.error('Error getting verification documents:', error);
      return failure(
        new ValidationError('Failed to get verification documents'),
      );
    }
  }

  /**
   * Update document verification status
   */
  async updateDocumentStatus(
    documentId: string,
    status: 'pending' | 'verified' | 'failed',
    verificationData?: Record<string, unknown>,
  ): Promise<AppResult<typeof verificationDocuments.$inferSelect>> {
    try {
      const [updated] = await db
        .update(verificationDocuments)
        .set({
          verificationStatus: status,
          verificationData: verificationData || null,
        })
        .where(eq(verificationDocuments.id, documentId))
        .returning();

      if (!updated) {
        return failure(new NotFoundError('Verification document'));
      }

      return success(updated);
    } catch (error) {
      console.error('Error updating document status:', error);
      return failure(new ValidationError('Failed to update document status'));
    }
  }

  /**
   * Create seller details after approval
   */
  async createSellerDetails(userId: string): Promise<AppResult<SellerDetails>> {
    try {
      // Check if already exists
      const existing = await db.query.sellerDetails.findFirst({
        where: eq(sellerDetails.userId, userId),
      });

      if (existing) {
        return success(existing);
      }

      // Create seller details
      const [newSeller] = await db
        .insert(sellerDetails)
        .values({
          userId,
        })
        .returning();

      // Update profile to mark as seller
      await db
        .update(profiles)
        .set({
          isSeller: true,
          sellerTier: 'basic',
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      return success(newSeller);
    } catch (error) {
      console.error('Error creating seller details:', error);
      return failure(new ValidationError('Failed to create seller details'));
    }
  }

  /**
   * Update identity verification flag for seller details
   */
  async setIdentityVerified(
    userId: string,
    verified: boolean,
  ): Promise<AppResult<SellerDetails>> {
    try {
      const [updated] = await db
        .update(sellerDetails)
        .set({
          identityVerified: verified,
          updatedAt: new Date(),
        })
        .where(eq(sellerDetails.userId, userId))
        .returning();

      if (!updated) {
        return failure(new NotFoundError('Seller details'));
      }

      return success(updated);
    } catch (error) {
      console.error('Error updating identity verification:', error);
      return failure(
        new ValidationError('Failed to update identity verification'),
      );
    }
  }

  /**
   * Get seller details for a user (if created)
   */
  async getSellerDetailsByUserId(
    userId: string,
  ): Promise<AppResult<SellerDetails | null>> {
    try {
      const seller = await db.query.sellerDetails.findFirst({
        where: eq(sellerDetails.userId, userId),
      });
      return success(seller || null);
    } catch (error) {
      console.error('Error fetching seller details:', error);
      return failure(new NotFoundError('Seller details'));
    }
  }

  /**
   * List seller applications for admin review
   */
  async listForAdmin(
    limit: number,
    offset: number,
    statuses?: Array<
      | 'draft'
      | 'submitted'
      | 'in_review'
      | 'approved'
      | 'rejected'
      | 'more_info_needed'
    >,
  ): Promise<
    AppResult<
      Array<
        SellerApplication & {
          user: {
            id: string;
            username: string;
            fullName: string | null;
            isSeller: boolean;
            isAdmin: boolean;
          } | null;
        }
      >
    >
  > {
    try {
      const whereClause =
        statuses && statuses.length > 0
          ? inArray(sellerApplications.status, statuses)
          : undefined;

      const items = await db.query.sellerApplications.findMany({
        where: whereClause,
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              isSeller: true,
              isAdmin: true,
            },
          },
        },
        orderBy: [desc(sellerApplications.updatedAt)],
        limit,
        offset,
      });

      return success(items as any);
    } catch (error) {
      console.error('Error listing seller applications:', error);
      return failure(
        new ValidationError('Failed to list seller applications'),
      );
    }
  }

  /**
   * Count seller applications for admin review
   */
  async countForAdmin(
    statuses?: Array<
      | 'draft'
      | 'submitted'
      | 'in_review'
      | 'approved'
      | 'rejected'
      | 'more_info_needed'
    >,
  ): Promise<AppResult<number>> {
    try {
      const whereClause =
        statuses && statuses.length > 0
          ? inArray(sellerApplications.status, statuses)
          : undefined;

      const query = db.select({ total: count() }).from(sellerApplications);
      const [result] = whereClause ? await query.where(whereClause) : await query;
      return success(Number(result?.total || 0));
    } catch (error) {
      console.error('Error counting seller applications:', error);
      return failure(
        new ValidationError('Failed to count seller applications'),
      );
    }
  }
}
