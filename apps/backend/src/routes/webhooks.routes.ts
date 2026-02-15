import { Request, Response, Router } from 'express';
import { config } from '../config';
import { asyncHandler } from '../middleware/error-handler';
import { validate } from '../middleware/validate';
import { supabaseEmailConfirmationWebhookSchema } from '../schemas/auth.schemas';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError } from '../utils/result';

const router = Router();
const authService = new AuthService();

function extractWebhookSecret(req: Request): string | null {
  const directSecret = req.headers['x-webhook-secret'];
  if (typeof directSecret === 'string' && directSecret.trim().length > 0) {
    return directSecret.trim();
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * POST /webhooks/supabase/email-confirmation
 * Supabase Database Webhook handler for auth.users email confirmations
 * Public route - protected by shared secret header
 */
router.post(
  '/supabase/email-confirmation',
  validate(supabaseEmailConfirmationWebhookSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!config.supabaseWebhookSecret && config.nodeEnv === 'production') {
      res.status(500).json({
        success: false,
        error: { message: 'SUPABASE_WEBHOOK_SECRET is not configured' },
      });
      return;
    }

    if (config.supabaseWebhookSecret) {
      const providedSecret = extractWebhookSecret(req);

      if (
        !providedSecret ||
        providedSecret !== config.supabaseWebhookSecret
      ) {
        throw new UnauthorizedError('Invalid webhook secret');
      }
    }

    const result = await authService.handleEmailConfirmationWebhook(req.body);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }),
);

export default router;
