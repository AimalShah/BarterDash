import sgMail from '@sendgrid/mail';
import { config } from '../config';

/**
 * Email Service
 * Handles transactional emails via SendGrid
 */
export class EmailService {
  constructor() {
    if (config.sendgridApiKey) {
      sgMail.setApiKey(config.sendgridApiKey);
    }
  }

  /**
   * Send general email
   */
  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<boolean> {
    if (!config.sendgridApiKey) {
      console.log('📧 [DEV EMAIL LOG]:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text}`);
      return true;
    }

    try {
      await sgMail.send({
        to,
        from: config.fromEmail,
        subject,
        text,
        html: html || text,
      });
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send Winner Notification
   */
  async sendWinnerNotification(
    to: string,
    productName: string,
    amount: string,
    orderId: string,
  ): Promise<boolean> {
    const subject = `You won the auction: ${productName}!`;
    const text = `Congratulations! You won the auction for ${productName} with a bid of $${amount}. 
        Click here to complete your order: https://barterdash.com/orders/${orderId}`;
    const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #6366F1;">You Won! 🎉</h1>
                <p>Congratulations! You won the auction for <strong>${productName}</strong>.</p>
                <p>Winning Bid: <strong>$${amount}</strong></p>
                <p>Please complete your purchase to ensure fast delivery.</p>
                <a href="https://barterdash.com/orders/${orderId}" 
                   style="display: inline-block; background: #6366F1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                   Complete Checkout
                </a>
            </div>
        `;

    return await this.sendEmail(to, subject, text, html);
  }
}
