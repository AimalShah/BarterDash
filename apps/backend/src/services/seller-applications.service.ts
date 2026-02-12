import Stripe from 'stripe';
import { stripe } from '../utils/stripe';
import { SellerApplicationsRepository } from '../repositories/seller-applications.repository';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  NotFoundError,
} from '../utils/result';
import { SellerApplication, SellerDetails } from '../db/schema';
import {
  CreateApplicationInput,
  UploadDocumentInput,
} from '../schemas/seller-applications.schemas';

/**
 * Seller Applications Service
 * Business logic for seller applications and Stripe Identity verification
 */
export class SellerApplicationsService {
  private repository: SellerApplicationsRepository;

  constructor() {
    this.repository = new SellerApplicationsRepository();
  }

  /**
   * Start a new seller application
   */
  async startApplication(
    userId: string,
    data: CreateApplicationInput,
  ): Promise<AppResult<SellerApplication>> {
    return await this.repository.create(userId, {
      businessType: data.business_type,
      businessName: data.business_name,
      taxId: data.tax_id,
    });
  }

  /**
   * Get the current user's application
   */
  async getApplication(
    userId: string,
  ): Promise<AppResult<SellerApplication | null>> {
    return await this.repository.findByUserId(userId);
  }

  /**
   * Get application with documents
   */
  async getApplicationWithDocuments(userId: string): Promise<
    AppResult<{
      application: SellerApplication;
      documents: any[];
    } | null>
  > {
    const appResult = await this.repository.findByUserId(userId);
    if (appResult.isErr()) return failure(appResult.error);
    if (!appResult.value) return success(null);

    const docsResult = await this.repository.getDocuments(appResult.value.id);
    if (docsResult.isErr()) return failure(docsResult.error);

    return success({
      application: appResult.value,
      documents: docsResult.value,
    });
  }

  /**
   * Upload a verification document
   */
  async uploadDocument(
    userId: string,
    data: UploadDocumentInput,
  ): Promise<AppResult<any>> {
    // Get the user's application
    const appResult = await this.repository.findByUserId(userId);
    if (appResult.isErr()) return failure(appResult.error);
    if (!appResult.value) {
      return failure(
        new NotFoundError('Seller application. Start an application first.'),
      );
    }

    // Can only upload docs in draft or more_info_needed status
    if (!['draft', 'more_info_needed'].includes(appResult.value.status)) {
      return failure(
        new ValidationError(
          'Cannot upload documents once application is submitted',
        ),
      );
    }

    return await this.repository.addDocument(appResult.value.id, {
      documentType: data.document_type,
      fileUrl: data.file_url,
      fileName: data.file_name,
    });
  }

  /**
   * Submit application for verification
   */
  async submitApplication(
    userId: string,
  ): Promise<AppResult<SellerApplication>> {
    const appResult = await this.repository.findByUserId(userId);
    if (appResult.isErr()) return failure(appResult.error);
    if (!appResult.value) {
      return failure(new NotFoundError('Seller application'));
    }

    if (
      appResult.value.status !== 'draft' &&
      appResult.value.status !== 'more_info_needed'
    ) {
      return failure(
        new ValidationError('Application has already been submitted'),
      );
    }

    // Check if required documents are uploaded
    const docsResult = await this.repository.getDocuments(appResult.value.id);
    if (docsResult.isErr()) return failure(docsResult.error);

    const documentTypes = docsResult.value.map((d) => d.documentType);
    const requiredDocs = ['id_front', 'id_back'];
    const missingDocs = requiredDocs.filter(
      (d) => !documentTypes.includes(d as any),
    );

    if (missingDocs.length > 0) {
      return failure(
        new ValidationError(
          `Missing required documents: ${missingDocs.join(', ')}`,
        ),
      );
    }

    // Update status to submitted
    return await this.repository.updateStatus(appResult.value.id, 'submitted');
  }

  /**
   * Create a Stripe Identity verification session
   */
  async createVerificationSession(userId: string): Promise<
    AppResult<{
      sessionId: string;
      clientSecret: string;
      url: string;
    }>
  > {
    const appResult = await this.repository.findByUserId(userId);
    if (appResult.isErr()) return failure(appResult.error);
    if (!appResult.value) {
      return failure(new NotFoundError('Seller application'));
    }

    // Must be in submitted status to create verification session
    if (appResult.value.status !== 'submitted') {
      return failure(
        new ValidationError(
          'Application must be submitted before verification',
        ),
      );
    }

    try {
      // Get the return URL from environment or use default
      const returnUrl =
        process.env.IDENTITY_RETURN_URL || 'barterdash://seller/verification';

      // Create Stripe Identity verification session
      const session = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          user_id: userId,
          application_id: appResult.value.id,
        },
        options: {
          document: {
            allowed_types: ['driving_license', 'passport', 'id_card'],
            require_matching_selfie: true,
          },
        },
        return_url: returnUrl,
      });

      // Update application status to in_review
      await this.repository.updateStatus(appResult.value.id, 'in_review');

      return success({
        sessionId: session.id,
        clientSecret: session.client_secret!,
        url: session.url!,
      });
    } catch (error) {
      console.error('Error creating Stripe Identity session:', error);
      return failure(
        new ValidationError('Failed to create verification session'),
      );
    }
  }

  /**
   * Handle Stripe Identity webhook events
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<AppResult<void>> {
    try {
      switch (event.type) {
        case 'identity.verification_session.verified': {
          const session = event.data.object;
          const applicationId = session.metadata?.application_id;
          const userId = session.metadata?.user_id;

          if (!applicationId || !userId) {
            console.error('Missing metadata in verification session');
            return success(undefined);
          }

          // Approve the application
          await this.repository.updateStatus(applicationId, 'approved', {
            adminNotes: `Auto-approved via Stripe Identity. Session: ${session.id}`,
          });

          // Create seller details
          const createResult =
            await this.repository.createSellerDetails(userId);
          if (createResult.isErr()) return failure(createResult.error);

          const verifyResult = await this.repository.setIdentityVerified(
            userId,
            true,
          );
          if (verifyResult.isErr()) return failure(verifyResult.error);

          console.log(`✅ Seller application approved: ${applicationId}`);
          break;
        }

        case 'identity.verification_session.requires_input': {
          const session = event.data.object;
          const applicationId = session.metadata?.application_id;

          if (applicationId) {
            await this.repository.updateStatus(
              applicationId,
              'more_info_needed',
              {
                adminNotes: `Verification requires additional input. Session: ${session.id}`,
              },
            );
            console.log(
              `⚠️ Seller application needs more info: ${applicationId}`,
            );
          }
          break;
        }

        case 'identity.verification_session.canceled': {
          const session = event.data.object;
          const applicationId = session.metadata?.application_id;

          if (applicationId) {
            await this.repository.updateStatus(applicationId, 'rejected', {
              rejectionReason: 'Verification was canceled',
            });
            console.log(
              `❌ Seller application rejected (canceled): ${applicationId}`,
            );
          }
          break;
        }

        default:
          // Ignore other events
          break;
      }

      return success(undefined);
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      return failure(new ValidationError('Failed to process webhook'));
    }
  }

  /**
   * Admin: Manually approve an application
   */
  async adminApprove(
    applicationId: string,
    adminId: string,
    adminNotes?: string,
  ): Promise<AppResult<SellerDetails>> {
    const appResult = await this.repository.findById(applicationId);
    if (appResult.isErr()) return failure(appResult.error);
    if (!appResult.value) {
      return failure(new NotFoundError('Seller application'));
    }

    // Update status to approved
    await this.repository.updateStatus(applicationId, 'approved', {
      adminNotes,
      reviewerId: adminId,
    });

    // Create seller details
    return await this.repository.createSellerDetails(appResult.value.userId);
  }

  /**
   * Admin: Reject an application
   */
  async adminReject(
    applicationId: string,
    adminId: string,
    rejectionReason: string,
    adminNotes?: string,
  ): Promise<AppResult<SellerApplication>> {
    const appResult = await this.repository.findById(applicationId);
    if (appResult.isErr()) return failure(appResult.error);
    if (!appResult.value) {
      return failure(new NotFoundError('Seller application'));
    }

    const updateResult = await this.repository.updateStatus(
      applicationId,
      'rejected',
      {
        rejectionReason,
        adminNotes,
        reviewerId: adminId,
      },
    );

    if (updateResult.isErr()) return failure(updateResult.error);
    if (!updateResult.value) {
      return failure(new ValidationError('Failed to update application'));
    }
    return updateResult;
  }

  /**
   * Mock approval for testing - automatically approves applications
   */
  async mockApproveApplication(
    applicationId: string,
    adminId: string,
  ): Promise<AppResult<SellerApplication>> {
    try {
      const appResult = await this.repository.findById(applicationId);

      if (appResult.isErr()) return failure(appResult.error);
      if (!appResult.value) {
        return failure(new NotFoundError('Seller application'));
      }

      // Update application status to approved
      const updateResult = await this.repository.updateStatus(
        applicationId,
        'approved',
        {
          adminNotes: 'Mock approval for testing',
          reviewerId: adminId,
        },
      );

      if (updateResult.isErr()) {
        return failure(updateResult.error);
      }

      if (!updateResult.value) {
        return failure(new ValidationError('Failed to update application'));
      }

      // Create seller details record
      await this.repository.createSellerDetails(appResult.value.userId);

      return success(updateResult.value);
    } catch (error) {
      return failure(new ValidationError('Failed to approve application'));
    }
  }

  /**
   * Admin: Get identity verification status for an application
   */
  async adminGetIdentityStatus(applicationId: string): Promise<
    AppResult<{
      applicationId: string;
      userId: string;
      applicationStatus: SellerApplication['status'];
      identityVerified: boolean;
      sellerDetailsId: string | null;
    }>
  > {
    const appResult = await this.repository.findById(applicationId);
    if (appResult.isErr()) return failure(appResult.error);
    if (!appResult.value) {
      return failure(new NotFoundError('Seller application'));
    }

    const sellerResult = await this.repository.getSellerDetailsByUserId(
      appResult.value.userId,
    );
    if (sellerResult.isErr()) return failure(sellerResult.error);

    return success({
      applicationId: appResult.value.id,
      userId: appResult.value.userId,
      applicationStatus: appResult.value.status,
      identityVerified: sellerResult.value?.identityVerified ?? false,
      sellerDetailsId: sellerResult.value?.id ?? null,
    });
  }
}
