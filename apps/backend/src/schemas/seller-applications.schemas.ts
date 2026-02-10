import { z } from 'zod';

/**
 * Seller Application Validation Schemas
 */

// Business types matching the DB enum
export const businessTypeEnum = z.enum(['individual', 'business']);

// Document types matching the DB enum
export const documentTypeEnum = z.enum([
  'id_front',
  'id_back',
  'business_license',
  'tax_form',
  'bank_statement',
]);

// Application status matching the DB enum
export const applicationStatusEnum = z.enum([
  'draft',
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'more_info_needed',
]);

/**
 * Create a new seller application
 */
export const createApplicationSchema = z.object({
  body: z.object({
    business_type: businessTypeEnum,
    business_name: z.string().min(2).max(255),
    tax_id: z.string().max(100).optional(),
  }),
});

export type CreateApplicationInput = z.infer<
  typeof createApplicationSchema
>['body'];

/**
 * Upload a verification document
 */
export const uploadDocumentSchema = z.object({
  body: z.object({
    document_type: documentTypeEnum,
    file_url: z.string().url(),
    file_name: z.string().max(255).optional(),
  }),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>['body'];

/**
 * Submit application for review
 */
export const submitApplicationSchema = z.object({
  body: z.object({
    // Confirmation that user has uploaded required documents
    confirm_documents: z.literal(true, {
      errorMap: () => ({
        message: 'You must confirm that all documents are uploaded',
      }),
    }),
  }),
});

export type SubmitApplicationInput = z.infer<
  typeof submitApplicationSchema
>['body'];

/**
 * Admin: Update application status
 */
export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: applicationStatusEnum,
    rejection_reason: z.string().max(1000).optional(),
    admin_notes: z.string().max(2000).optional(),
  }),
});

export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>['body'];
