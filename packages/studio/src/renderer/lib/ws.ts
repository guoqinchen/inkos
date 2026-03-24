// WebSocket client for multi-window sync
import type { WSMessage, WSMessageType } from '../../shared/types.js';

class WSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: WSMessage) => void>> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WS] Connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.emit(message.type, message);
          } catch (e) {
            console.error('[WS] Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WS] Disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WS] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: Omit<WSMessage, 'timestamp'>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ...message, timestamp: Date.now() }));
    }
  }

  on(type: WSMessageType, callback: (data: WSMessage) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  off(type: WSMessageType, callback: (data: WSMessage) => void) {
    this.listeners.get(type)?.delete(callback);
  }

  private emit(type: string, data: WSMessage) {
    this.listeners.get(type)?.forEach((callback) => callback(data));
  }
}

export const wsClient = new WSClient('ws://localhost:4567');
export type { WSMessage };
