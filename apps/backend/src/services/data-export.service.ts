import { eq, or, and, sql } from 'drizzle-orm';
import {
  db,
  profiles,
  userInterests,
  notificationPreferences,
  sellerApplications,
  verificationDocuments,
  sellerDetails,
  orders,
  orderItems,
  bids,
  autoBids,
  products,
  offers,
  follows,
  blockedUsers,
  conversations,
  directMessages,
  savedStreams,
  streamViewers,
  paymentMethods,
  payouts,
  notifications,
  reports,
  auctions,
} from '../db';
import { supabase } from '../utils/supabase';
import { AppResult, success, failure, InternalError } from '../utils/result';

export interface UserDataExport {
  export_info: {
    user_id: string;
    exported_at: string;
    version: string;
  };
  profile: any;
  seller_data: any;
  orders: any;
  bids: any;
  products: any;
  messages: any;
  social: any;
  financial: any;
  notifications: any;
  reports: any;
}

export interface ExportResult {
  download_url: string;
  expires_at: string;
  file_size_mb: number;
}

export class DataExportService {
  async exportUserData(userId: string): Promise<AppResult<ExportResult>> {
    try {
      const userData = await this.aggregateUserData(userId);
      
      const jsonData = JSON.stringify(userData, null, 2);
      const timestamp = Date.now();
      const fileName = `user-exports/${userId}/${timestamp}.json`;
      
      const { error } = await supabase.storage
        .from('user-exports')
        .upload(fileName, jsonData, {
          contentType: 'application/json',
          upsert: false,
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        return failure(new InternalError('Failed to upload export file'));
      }
      
      const { data: urlData, error: urlError } = await supabase.storage
        .from('user-exports')
        .createSignedUrl(fileName, 3600);
      
      if (urlError) {
        console.error('Signed URL error:', urlError);
        return failure(new InternalError('Failed to generate download link'));
      }
      
      return success({
        download_url: urlData.signedUrl,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        file_size_mb: Buffer.byteLength(jsonData) / (1024 * 1024),
      });
    } catch (error) {
      console.error('Export error:', error);
      return failure(new InternalError('Failed to export user data'));
    }
  }

  private async aggregateUserData(userId: string): Promise<UserDataExport> {
    const [
      profile,
      sellerData,
      ordersData,
      bidsData,
      productsData,
      messagesData,
      socialData,
      financialData,
      notificationsData,
      reportsData,
    ] = await Promise.all([
      this.getProfile(userId),
      this.getSellerData(userId),
      this.getOrders(userId),
      this.getBids(userId),
      this.getProducts(userId),
      this.getMessages(userId),
      this.getSocial(userId),
      this.getFinancial(userId),
      this.getNotifications(userId),
      this.getReports(userId),
    ]);

    return {
      export_info: {
        user_id: userId,
        exported_at: new Date().toISOString(),
        version: '1.0',
      },
      profile,
      seller_data: sellerData,
      orders: ordersData,
      bids: bidsData,
      products: productsData,
      messages: messagesData,
      social: socialData,
      financial: financialData,
      notifications: notificationsData,
      reports: reportsData,
    };
  }

  private async getProfile(userId: string) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    if (!profile) return null;

    const interests = await db
      .select()
      .from(userInterests)
      .where(eq(userInterests.userId, userId));

    const notifPrefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    return {
      ...profile,
      dateOfBirth: profile.dateOfBirth?.toISOString() || null,
      createdAt: profile.createdAt?.toISOString() || null,
      updatedAt: profile.updatedAt?.toISOString() || null,
      onboardingCompletedAt: profile.onboardingCompletedAt?.toISOString() || null,
      lastLoginAt: profile.lastLoginAt?.toISOString() || null,
      interests,
      notificationPreferences: notifPrefs,
    };
  }

  private async getSellerData(userId: string) {
    const applications = await db
      .select()
      .from(sellerApplications)
      .where(eq(sellerApplications.userId, userId));

    const details = await db
      .select()
      .from(sellerDetails)
      .where(eq(sellerDetails.userId, userId))
      .limit(1);

    const applicationIds = applications.map((app) => app.id);
    let documents: any[] = [];
    if (applicationIds.length > 0) {
      documents = await db
        .select()
        .from(verificationDocuments)
        .where(
          or(
            ...applicationIds.map((id) =>
              eq(verificationDocuments.applicationId, id)
            )
          )!
        );
    }

    return {
      applications: applications.map((app) => ({
        ...app,
        submittedAt: app.submittedAt?.toISOString() || null,
        reviewedAt: app.reviewedAt?.toISOString() || null,
        createdAt: app.createdAt?.toISOString() || null,
        updatedAt: app.updatedAt?.toISOString() || null,
      })),
      details: details[0]
        ? {
            ...details[0],
            createdAt: details[0].createdAt?.toISOString() || null,
            updatedAt: details[0].updatedAt?.toISOString() || null,
            nextPayoutDate: details[0].nextPayoutDate?.toISOString() || null,
            termsAcceptedAt: details[0].termsAcceptedAt?.toISOString() || null,
          }
        : null,
      documents: documents.map((doc) => ({
        ...doc,
        createdAt: doc.createdAt?.toISOString() || null,
      })),
    };
  }

  private async getOrders(userId: string) {
    const userOrders = await db
      .select()
      .from(orders)
      .where(or(eq(orders.buyerId, userId), eq(orders.sellerId, userId)));

    const orderIds = userOrders.map((order) => order.id);
    let items: any[] = [];

    if (orderIds.length > 0) {
      items = await db
        .select()
        .from(orderItems)
        .where(
          or(...orderIds.map((id) => eq(orderItems.orderId, id)))!
        );
    }

    return {
      as_buyer: userOrders
        .filter((o) => o.buyerId === userId)
        .map((order) => ({
          ...order,
          createdAt: order.createdAt?.toISOString() || null,
          updatedAt: order.updatedAt?.toISOString() || null,
          shippedAt: order.shippedAt?.toISOString() || null,
          deliveredAt: order.deliveredAt?.toISOString() || null,
          cancelledAt: order.cancelledAt?.toISOString() || null,
          estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
        })),
      as_seller: userOrders
        .filter((o) => o.sellerId === userId)
        .map((order) => ({
          ...order,
          createdAt: order.createdAt?.toISOString() || null,
          updatedAt: order.updatedAt?.toISOString() || null,
          shippedAt: order.shippedAt?.toISOString() || null,
          deliveredAt: order.deliveredAt?.toISOString() || null,
          cancelledAt: order.cancelledAt?.toISOString() || null,
          estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
        })),
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt?.toISOString() || null,
      })),
    };
  }

  private async getBids(userId: string) {
    const userBids = await db
      .select()
      .from(bids)
      .where(eq(bids.bidderId, userId));

    const auctionIds = [...new Set(userBids.map((b) => b.auctionId))];
    let auctionsWon: any[] = [];

    if (auctionIds.length > 0) {
      auctionsWon = await db
        .select()
        .from(auctions)
        .where(
          and(
            eq(auctions.currentBidderId, userId),
            eq(auctions.status, 'ended')
          )!
        );
    }

    const autoBidsData = await db
      .select()
      .from(autoBids)
      .where(eq(autoBids.userId, userId));

    return {
      bids: userBids.map((bid) => ({
        ...bid,
        createdAt: bid.createdAt?.toISOString() || null,
      })),
      auctions_won: auctionsWon.map((auction) => ({
        ...auction,
        createdAt: auction.createdAt?.toISOString() || null,
        updatedAt: auction.updatedAt?.toISOString() || null,
        startedAt: auction.startedAt?.toISOString() || null,
        endsAt: auction.endsAt?.toISOString() || null,
        originalEndsAt: auction.originalEndsAt?.toISOString() || null,
      })),
      auto_bids: autoBidsData.map((ab) => ({
        ...ab,
        createdAt: ab.createdAt?.toISOString() || null,
        updatedAt: ab.updatedAt?.toISOString() || null,
      })),
    };
  }

  private async getProducts(userId: string) {
    const userProducts = await db
      .select()
      .from(products)
      .where(eq(products.sellerId, userId));

    const productIds = userProducts.map((p) => p.id);
    let offersReceived: any[] = [];

    if (productIds.length > 0) {
      offersReceived = await db
        .select()
        .from(offers)
        .where(
          or(...productIds.map((id) => eq(offers.productId, id)))!
        );
    }

    return {
      products: userProducts.map((product) => ({
        ...product,
        createdAt: product.createdAt?.toISOString() || null,
        updatedAt: product.updatedAt?.toISOString() || null,
      })),
      offers_received: offersReceived.map((offer) => ({
        ...offer,
        expiresAt: offer.expiresAt?.toISOString() || null,
        respondedAt: offer.respondedAt?.toISOString() || null,
        createdAt: offer.createdAt?.toISOString() || null,
        updatedAt: offer.updatedAt?.toISOString() || null,
      })),
    };
  }

  private async getMessages(userId: string) {
    const userConversations = await db
      .select()
      .from(conversations)
      .where(
        sql`${conversations.participantIds} @> ${JSON.stringify([userId])}` as any
      );

    const conversationIds = userConversations.map((c) => c.id);
    let messages: any[] = [];

    if (conversationIds.length > 0) {
      messages = await db
        .select()
        .from(directMessages)
        .where(
          or(
            ...conversationIds.map((id) => eq(directMessages.conversationId, id))
          )!
        );
    }

    return {
      conversations: userConversations.map((conv) => ({
        ...conv,
        lastMessageAt: conv.lastMessageAt?.toISOString() || null,
        createdAt: conv.createdAt?.toISOString() || null,
        updatedAt: conv.updatedAt?.toISOString() || null,
      })),
      direct_messages: messages.map((msg) => ({
        ...msg,
        readAt: msg.readAt?.toISOString() || null,
        createdAt: msg.createdAt?.toISOString() || null,
      })),
    };
  }

  private async getSocial(userId: string) {
    const following = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followers = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId));

    const blocked = await db
      .select()
      .from(blockedUsers)
      .where(eq(blockedUsers.userId, userId));

    const saved = await db
      .select()
      .from(savedStreams)
      .where(eq(savedStreams.userId, userId));

    const viewers = await db
      .select()
      .from(streamViewers)
      .where(eq(streamViewers.userId, userId));

    return {
      following: following.map((f) => ({
        ...f,
        createdAt: f.createdAt?.toISOString() || null,
      })),
      followers: followers.map((f) => ({
        ...f,
        createdAt: f.createdAt?.toISOString() || null,
      })),
      blocked_users: blocked.map((b) => ({
        ...b,
        createdAt: b.createdAt?.toISOString() || null,
      })),
      saved_streams: saved.map((s) => ({
        ...s,
        createdAt: s.createdAt?.toISOString() || null,
      })),
      stream_viewing_history: viewers.map((v) => ({
        ...v,
        joinedAt: v.joinedAt?.toISOString() || null,
        leftAt: v.leftAt?.toISOString() || null,
      })),
    };
  }

  private async getFinancial(userId: string) {
    const paymentMethodsData = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId));

    const payoutHistory = await db
      .select()
      .from(payouts)
      .where(eq(payouts.sellerId, userId));

    return {
      payment_methods: paymentMethodsData.map((pm) => ({
        id: pm.id,
        type: pm.type,
        last4: pm.last4,
        brand: pm.brand,
        expiryMonth: pm.expiryMonth,
        expiryYear: pm.expiryYear,
        isDefault: pm.isDefault,
        createdAt: pm.createdAt?.toISOString() || null,
        updatedAt: pm.updatedAt?.toISOString() || null,
      })),
      payouts: payoutHistory.map((p) => ({
        ...p,
        periodStart: p.periodStart?.toISOString() || null,
        periodEnd: p.periodEnd?.toISOString() || null,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt?.toISOString() || null,
      })),
    };
  }

  private async getNotifications(userId: string) {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    return userNotifications.map((notif) => ({
      ...notif,
      deliveredAt: notif.deliveredAt?.toISOString() || null,
      clickedAt: notif.clickedAt?.toISOString() || null,
      createdAt: notif.createdAt?.toISOString() || null,
    }));
  }

  private async getReports(userId: string) {
    const userReports = await db
      .select()
      .from(reports)
      .where(eq(reports.reporterId, userId));

    return userReports.map((report) => ({
      ...report,
      createdAt: report.createdAt?.toISOString() || null,
      resolvedAt: report.resolvedAt?.toISOString() || null,
    }));
  }
}
