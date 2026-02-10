import { WatchlistRepository } from '../repositories/watchlist.repository';
import { AppResult } from '../utils/result';

export class WatchlistService {
  private repository: WatchlistRepository;

  constructor() {
    this.repository = new WatchlistRepository();
  }

  async addToWatchlist(
    userId: string,
    target: { streamId?: string; productId?: string },
  ): Promise<AppResult<any>> {
    return await this.repository.addToWatchlist({
      userId,
      ...target,
    });
  }

  async removeFromWatchlist(
    userId: string,
    itemId: string,
  ): Promise<AppResult<boolean>> {
    return await this.repository.removeFromWatchlist(userId, itemId);
  }

  async getWatchlist(userId: string): Promise<AppResult<any[]>> {
    return await this.repository.getWatchlist(userId);
  }

  async toggleNotifications(
    userId: string,
    itemId: string,
    enabled: boolean,
  ): Promise<AppResult<any>> {
    return await this.repository.updateNotification(userId, itemId, enabled);
  }
}
