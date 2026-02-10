import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { SocialService } from '../services/social.service';

const router = Router();
const socialService = new SocialService();

router.post(
  '/follow/:userId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const targetUserId = req.params.userId as string;

    // Prevent following yourself
    if (targetUserId === req.user!.id) {
      res.status(400).json({
        success: false,
        error: 'Cannot follow yourself',
      });
      return;
    }

    const result = await socialService.followUser(req.user!.id, targetUserId);
    if (result.isErr()) throw result.error;
    res.json({ success: true, message: 'Followed user' });
  }),
);

router.delete(
  '/unfollow/:userId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await socialService.unfollowUser(
      req.user!.id,
      req.params.userId as string,
    );
    if (result.isErr()) throw result.error;
    res.json({ success: true, message: 'Unfollowed user' });
  }),
);

router.get(
  '/followers/:userId',
  asyncHandler(async (req, res: Response) => {
    const result = await socialService.getFollowers(
      req.params.userId as string,
    );
    if (result.isErr()) throw result.error;
    // Format response for frontend: extract follower user data
    const followers = (result.value || []).map((f: any) => ({
      id: f.follower?.id || f.followerId,
      username: f.follower?.username || 'user',
      avatar_url: f.follower?.avatarUrl || f.follower?.avatar_url,
    }));
    res.json({ success: true, data: { followers, count: followers.length } });
  }),
);

router.get(
  '/following/:userId',
  asyncHandler(async (req, res: Response) => {
    const result = await socialService.getFollowing(
      req.params.userId as string,
    );
    if (result.isErr()) throw result.error;
    // Format response for frontend: extract following user data
    const following = (result.value || []).map((f: any) => ({
      id: f.following?.id || f.followingId,
      username: f.following?.username || 'user',
      avatar_url: f.following?.avatarUrl || f.following?.avatar_url,
    }));
    res.json({ success: true, data: { following, count: following.length } });
  }),
);

router.get(
  '/stats/:userId',
  asyncHandler(async (req, res: Response) => {
    const result = await socialService.getStats(req.params.userId as string);
    if (result.isErr()) throw result.error;
    // Normalize response keys for frontend
    res.json({
      success: true,
      data: {
        followers_count: result.value.followersCount,
        following_count: result.value.followingCount,
      },
    });
  }),
);

router.get(
  '/is-following/:userId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await socialService.isFollowing(
      req.user!.id,
      req.params.userId as string,
    );
    if (result.isErr()) throw result.error;
    res.json({ success: true, data: { isFollowing: result.value } });
  }),
);

export default router;
