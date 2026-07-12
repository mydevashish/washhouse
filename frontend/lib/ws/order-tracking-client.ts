import {
  getOrderWebSocketUrl,
  parseOrderWsMessage,
  type OrderWsMessage,
} from '@/lib/ws/order-tracking-messages';

export type OrderTrackingConnectionMode = 'connecting' | 'live' | 'polling';

export type OrderTrackingClientOptions = {
  orderId: string;
  accessToken: string;
  apiBaseUrl: string;
  onMessage: (message: OrderWsMessage) => void;
  onModeChange: (mode: OrderTrackingConnectionMode) => void;
  pingIntervalMs?: number;
  pongTimeoutMs?: number;
  maxReconnectDelayMs?: number;
};

const DEFAULT_PING_MS = 25_000;
const DEFAULT_PONG_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RECONNECT_MS = 30_000;

export class OrderTrackingWebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private awaitingPong = false;

  constructor(private readonly options: OrderTrackingClientOptions) {}

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.options.onModeChange('polling');
  }

  private connect(): void {
    if (this.stopped || typeof WebSocket === 'undefined') {
      this.options.onModeChange('polling');
      return;
    }

    this.options.onModeChange('connecting');
    const url = getOrderWebSocketUrl(
      this.options.orderId,
      this.options.accessToken,
      this.options.apiBaseUrl,
    );

    const ws = new WebSocket(url);
    this.socket = ws;

    ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.options.onModeChange('live');
      this.startHeartbeat();
    };

    ws.onmessage = (event) => {
      const message = parseOrderWsMessage(String(event.data));
      if (!message) return;

      if (message.type === 'pong') {
        this.awaitingPong = false;
        this.clearPongTimer();
        return;
      }

      this.options.onMessage(message);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onclose = () => {
      this.socket = null;
      this.clearHeartbeat();
      if (this.stopped) {
        this.options.onModeChange('polling');
        return;
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    this.options.onModeChange('polling');
    const maxDelay = this.options.maxReconnectDelayMs ?? DEFAULT_MAX_RECONNECT_MS;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, maxDelay);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.stopped) this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    const interval = this.options.pingIntervalMs ?? DEFAULT_PING_MS;
    this.pingTimer = setInterval(() => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
      if (this.awaitingPong) {
        this.socket.close();
        return;
      }
      this.awaitingPong = true;
      this.socket.send(JSON.stringify({ type: 'ping' }));
      this.pongTimer = setTimeout(() => {
        if (this.awaitingPong && this.socket) {
          this.socket.close();
        }
      }, this.options.pongTimeoutMs ?? DEFAULT_PONG_TIMEOUT_MS);
    }, interval);
  }

  private clearPongTimer(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private clearHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.clearPongTimer();
    this.awaitingPong = false;
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
