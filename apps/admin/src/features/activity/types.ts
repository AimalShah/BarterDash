export interface ActivityEvent {
  id: string;
  type: 'user_signup' | 'new_order' | 'dispute_filed' | 'report_submitted' | 
        'refund_requested' | 'seller_application' | 'stream_started' | 'escrow_held' |
        'order_delivered' | 'user_suspended' | 'application_approved' | 'report_resolved';
  title: string;
  description: string;
  actorId?: string;
  actorName?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}
