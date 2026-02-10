import { connect } from 'getstream';
import { config } from '../config';

export class StreamVideoService {
  private client = connect(
    config.streamApiKey || '',
    config.streamApiSecret || '',
  );

  private requireConfig() {
    if (!config.streamApiKey || !config.streamApiSecret) {
      throw new Error('Missing Stream API key/secret');
    }
  }

  createUserToken(userId: string): string {
    this.requireConfig();
    return this.client.createUserToken(userId);
  }
}
