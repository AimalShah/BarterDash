// User types
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role: "USER" | "SELLER" | "ADMIN";
  is_seller?: boolean;
  seller_status?: "pending" | "approved" | "rejected";
  account_status?: "active" | "suspended" | "banned" | "under_review";
  stripe_account_status?: string;
  onboarded?: boolean;
  onboarding_step?: string;
  onboarding_completed_at?: string;
  interests?: string[];
  notification_preferences?: {
    streamAlerts: boolean;
    bidAlerts: boolean;
    emailNotifications: boolean;
  };
  created_at: string;
}

// Auth types
export interface AuthResponse {
  access_token?: string;
  user?: User;
  // Supabase session structure
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  profile?: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  full_name?: string;
  fullName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  onboarded?: boolean;
  onboarding_step?: string;
  interests?: string[];
  notification_preferences?: {
    streamAlerts: boolean;
    bidAlerts: boolean;
    emailNotifications: boolean;
  };
}

// Seller types
export interface Seller {
  id: string;
  user_id: string;
  business_name: string;
  description?: string;
  is_verified: boolean;
  created_at: string;
}

export interface RegisterSellerPayload {
  business_name: string;
  description?: string;
}

export type SellerApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "more_info_needed";

export type VerificationDocumentType =
  | "id_front"
  | "id_back"
  | "business_license"
  | "tax_form"
  | "bank_statement";

export interface SellerApplication {
  id: string;
  userId: string;
  status: SellerApplicationStatus;
  businessType: "individual" | "business";
  businessName: string;
  taxId?: string;
  rejectionReason?: string;
  adminNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationDocument {
  id: string;
  applicationId: string;
  documentType: VerificationDocumentType;
  fileUrl: string;
  fileName?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  createdAt: string;
}

export interface CreateSellerApplicationPayload {
  business_type: "individual" | "business";
  business_name: string;
  tax_id?: string;
}

export interface UploadSellerDocumentPayload {
  document_type: VerificationDocumentType;
  file_url: string;
  file_name?: string;
}

export interface SubmitSellerApplicationPayload {
  confirm_documents: true;
}

export interface SellerApplicationStatusResponse {
  application: SellerApplication;
  documents: VerificationDocument[];
}

export interface SellerVerificationSession {
  sessionId: string;
  clientSecret: string;
  url: string;
}

export interface SellerDashboard {
  total_auctions: number;
  active_auctions: number;
  total_bids_received: number;
  total_revenue: number;
  rating?: number;
  total_streams?: number;
  trust_score?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
  subcategories?: Category[];
}

// Auction types
export type AuctionStatus =
  | "draft"
  | "live"
  | "ended"
  | "cancelled"
  | "scheduled";

export interface Auction {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  starting_price: number;
  current_price: number;
  buyout_price?: number;
  bid_increment: number;
  status: AuctionStatus;
  images?: string[];
  thumbnail_url?: string;
  category?: string | any;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
  seller?: {
    username: string;
    avatar_url?: string;
  };
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  price: number;
  condition: "new" | "used" | "fair";
  images: string[];
  category_id: string;
  created_at: string;
  seller?: {
    username: string;
    avatar_url?: string;
  };
}

export interface CreateProductPayload {
  title: string;
  description?: string;
  price: number;
  category_id: string;
  condition: string;
  images: string[];
}

export interface CreateAuctionPayload {
  title: string;
  description?: string;
  starting_price?: number;
  buyout_price?: number;
  duration_minutes?: number;
  bid_increment?: number;
  images?: string[];
  category_id?: string;
  schedule_start?: string;
  thumbnail_url?: string;
}

// Bid types
export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
  bidder?: {
    username: string;
  };
}

export interface CreateBidPayload {
  auctionId: string;
  auction_id?: string;
  amount: number;
}

// Payment types
export interface PaymentIntent {
  clientSecret: string | null;
  id: string;
}

export interface CreatePaymentIntentPayload {
  auctionId: string;
  auction_id?: string;
  order_id?: string;
  amount: number;
}

// API Error
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Cart types
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  product: Product;
}

export interface CartTotal {
  subtotal: number;
  shipping: number;
  total: number;
  items: CartItem[];
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Social stats
export interface SocialStats {
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  streamId?: string;
  orderType: "auction" | "buy_now";
  itemPrice: string;
  shippingCost: string;
  tax: string;
  platformFee: string;
  total: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  stripePaymentIntentId?: string;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  buyer?: User;
  seller?: User;
  product?: Product;
}

// API Utility types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Stream Session type for Explore View
export interface StreamSession {
  id: string;
  title: string;
  thumbnail?: string;
  sellerId?: string;
  sellerHandle?: string;
  sellerAvatar?: string;
  status?: 'live' | 'ended' | 'scheduled';
  viewerCount?: number;
  scheduledStart?: string;
  category?: string;
}

// Data Export types
export interface DataExportResponse {
  download_url: string;
  expires_at: string;
  file_size_mb: number;
}
