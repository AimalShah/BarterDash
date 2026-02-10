import { FollowsRepository } from '../repositories/follows.repository';
import { AppResult } from '../utils/result';

export class SocialService {
  private followsRepository: FollowsRepository;

  constructor() {
    this.followsRepository = new FollowsRepository();
  }

  async followUser(
    followerId: string,
    followingId: string,
  ): Promise<AppResult<boolean>> {
    return await this.followsRepository.follow(followerId, followingId);
  }

  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<AppResult<boolean>> {
    return await this.followsRepository.unfollow(followerId, followingId);
  }

  async getFollowers(userId: string): Promise<AppResult<any[]>> {
    return await this.followsRepository.getFollowers(userId);
  }

  async getFollowing(userId: string): Promise<AppResult<any[]>> {
    return await this.followsRepository.getFollowing(userId);
  }

  async getStats(
    userId: string,
  ): Promise<AppResult<{ followersCount: number; followingCount: number }>> {
    return await this.followsRepository.getStats(userId);
  }

  async isFollowing(
    followerId: string,
    followingId: string,
  ): Promise<AppResult<boolean>> {
    return await this.followsRepository.isFollowing(followerId, followingId);
  }
}
