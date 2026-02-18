import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';

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

interface ClientInfo {
  ws: WebSocket;
  userId?: string;
  isAdmin: boolean;
  subscriptions: Set<string>;
}

export class RealtimeService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientInfo> = new Map();
  private eventHistory: ActivityEvent[] = [];
  private readonly MAX_HISTORY = 100;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: (info, cb) => {
        const token = this.extractToken(info.req);
        if (!token) {
          cb(false, 401, 'Unauthorized');
          return;
        }
        
        try {
          const decoded = jwt.verify(token, config.jwtSecret) as { sub: string; role: string };
          (info.req as any).user = decoded;
          cb(true);
        } catch {
          cb(false, 401, 'Invalid token');
        }
      }
    });

    this.wss.on('connection', (ws, req) => {
      const user = (req as any).user;
      const isAdmin = user?.role === 'ADMIN';
      
      const clientInfo: ClientInfo = {
        ws,
        userId: user?.sub,
        isAdmin,
        subscriptions: new Set(isAdmin ? ['admin', 'activity'] : ['activity']),
      };

      this.clients.set(ws, clientInfo);

      // Send recent history to admin clients
      if (isAdmin && this.eventHistory.length > 0) {
        this.sendToClient(ws, {
          type: 'history',
          events: this.eventHistory.slice(-20),
        });
      }

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        isAdmin,
        timestamp: new Date().toISOString(),
      });
    });

    console.log('📡 WebSocket server initialized on /ws');
  }

  private extractToken(req: any): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    return token;
  }

  private handleMessage(ws: WebSocket, message: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        if (client.isAdmin && message.channel) {
          client.subscriptions.add(message.channel);
          this.sendToClient(ws, { type: 'subscribed', channel: message.channel });
        }
        break;
      case 'unsubscribe':
        if (message.channel) {
          client.subscriptions.delete(message.channel);
        }
        break;
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
    }
  }

  private sendToClient(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  broadcastToAdmins(event: ActivityEvent) {
    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory.shift();
    }

    // Broadcast to admin clients
    const message = JSON.stringify({
      type: 'activity',
      event,
    });

    for (const [ws, client] of this.clients) {
      if (client.isAdmin && client.subscriptions.has('activity')) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      }
    }
  }

  broadcast(event: ActivityEvent, channel: string = 'activity') {
    const message = JSON.stringify({
      type: 'activity',
      event,
    });

    for (const [ws, client] of this.clients) {
      if (client.subscriptions.has(channel)) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      }
    }
  }

  getRecentEvents(limit: number = 50): ActivityEvent[] {
    return this.eventHistory.slice(-limit);
  }

  close() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
  }
}

export const realtimeService = new RealtimeService();
