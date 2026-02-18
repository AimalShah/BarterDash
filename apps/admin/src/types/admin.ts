export interface ApiErrorPayload {
  message?: string;
  code?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiErrorPayload;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export type AdminRole = 'USER' | 'SELLER' | 'ADMIN' | string;

export interface AdminProfile {
  id: string;
  username?: string;
  fullName?: string;
  email?: string;
  role?: AdminRole;
  isAdmin?: boolean;
  is_admin?: boolean;
  isSeller?: boolean;
  is_seller?: boolean;
  onboarded?: boolean;
  onboardingStep?: string;
  updatedAt?: string;
}

export interface SellerIdentityStatus {
  id?: string;
  applicationId?: string;
  status?: string;
  verificationStatus?: string;
  verificationSessionId?: string;
  reviewedAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AdminApplicationRow {
  id: string;
  userId: string;
  status:
    | 'draft'
    | 'submitted'
    | 'in_review'
    | 'approved'
    | 'rejected'
    | 'more_info_needed'
    | string;
  businessType?: string | null;
  businessName?: string | null;
  taxId?: string | null;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    username: string;
    fullName: string | null;
    isSeller: boolean;
    isAdmin: boolean;
  } | null;
}

export interface ReportRecord {
  id: string;
  status?: 'pending' | 'resolved' | 'dismissed' | string;
  reporterId?: string | null;
  reportedUserId?: string | null;
  reportedProductId?: string | null;
  reportedStreamId?: string | null;
  reportType?: string;
  description?: string;
  reviewNotes?: string;
  actionTaken?: string;
  resolvedAt?: string | null;
  reviewedBy?: string | null;
  createdAt?: string;
  reviewedAt?: string;
  [key: string]: unknown;
}

export interface RefundRecord {
  id: string;
  orderId?: string;
  status?: 'requested' | 'approved' | 'rejected' | string;
  requestedBy?: string | null;
  reason?: string;
  amount?: string | number;
  approvedBy?: string | null;
  approvedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  adminNotes?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AdminActivity {
  id: string;
  area: 'applications' | 'reports' | 'refunds' | 'disputes' | 'users';
  action: string;
  targetId: string;
  outcome: 'success' | 'error';
  at: string;
}

export interface BackendAdminActivity {
  id: string;
  area: 'applications' | 'reports' | 'refunds';
  action: string;
  targetId: string;
  actorId: string | null;
  actorUsername: string | null;
  at: string;
  metadata: Record<string, unknown>;
}

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

export interface AdminDisputeRecord {
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

export interface ResolveDisputeResult {
  escrowId: string;
  resolution: 'release' | 'refund';
  status: string;
  reason: string;
}

export interface AdminUserRecord {
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
