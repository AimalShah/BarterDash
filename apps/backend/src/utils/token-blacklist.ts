import { redisConnection } from './redis';

/**
 * Token Blacklist Service
 * Manages blacklisted JWT tokens for secure logout
 * Tokens are stored with TTL matching their expiry time
 */
export class TokenBlacklist {
  private static readonly PREFIX = 'token:blacklist:';

  /**
   * Add a token to the blacklist
   * @param token - JWT token to blacklist
   * @param expiresIn - Time in seconds until token expires
   */
  static async blacklist(token: string, expiresIn: number): Promise<void> {
    const key = `${this.PREFIX}${token}`;
    await redisConnection.setex(key, expiresIn, '1');
  }

  /**
   * Check if a token is blacklisted
   * @param token - JWT token to check
   * @returns true if token is blacklisted
   */
  static async isBlacklisted(token: string): Promise<boolean> {
    const key = `${this.PREFIX}${token}`;
    const result = await redisConnection.get(key);
    return result === '1';
  }

  /**
   * Extract expiration time from JWT token
   * @param token - JWT token
   * @returns Expiration time in seconds from now, or default 24 hours
   */
  static getTokenExpiry(token: string): number {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      
      if (payload.exp) {
        const expiryTime = payload.exp - Math.floor(Date.now() / 1000);
        return expiryTime > 0 ? expiryTime : 3600; // Default 1 hour if expired
      }
    } catch (error) {
      console.error('Error parsing JWT token:', error);
    }
    return 24 * 3600; // Default 24 hours
  }
}

export default TokenBlacklist;
