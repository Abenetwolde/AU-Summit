import { io, Socket } from 'socket.io-client';
import { FILE_BASE_URL } from './api';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface SocketConfig {
    maxReconnectAttempts: number;
    baseReconnectDelay: number;
    maxReconnectDelay: number;
    connectionTimeout: number;
}

class SocketClient {
    private static instance: SocketClient;
    private socket: Socket | null = null;
    private connectionState: ConnectionState = 'disconnected';
    private reconnectAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private connectionPromise: Promise<Socket> | null = null;
    private eventHandlers: Map<string, Set<Function>> = new Map();

    private config: SocketConfig = {
        maxReconnectAttempts: 10,
        baseReconnectDelay: 1000,
        maxReconnectDelay: 30000,
        connectionTimeout: 5000,
    };

    private constructor() {
        // Bind methods to preserve context
        this.handleConnect = this.handleConnect.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
        this.handleConnectError = this.handleConnectError.bind(this);
        this.handleReconnectAttempt = this.handleReconnectAttempt.bind(this);
    }

    public static getInstance(): SocketClient {
        if (!SocketClient.instance) {
            SocketClient.instance = new SocketClient();
        }
        return SocketClient.instance;
    }

    /**
     * Get current connection state
     */
    public getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    /**
     * Check if socket is connected
     */
    public isConnected(): boolean {
        return this.socket?.connected === true && this.connectionState === 'connected';
    }

    /**
     * Connect to socket server (non-blocking)
     * Returns immediately and handles connection in background
     */
    public async connect(token: string): Promise<Socket> {
        // If already connected, return existing socket
        if (this.socket?.connected && this.connectionState === 'connected') {
            console.log('[Socket] Already connected, reusing existing connection');
            return this.socket;
        }

        // If connection is in progress, return the existing promise
        if (this.connectionPromise) {
            console.log('[Socket] Connection in progress, waiting...');
            return this.connectionPromise;
        }

        // Create new connection promise
        this.connectionPromise = this.createConnection(token);

        try {
            const socket = await this.connectionPromise;
            return socket;
        } catch (error) {
            console.error('[Socket] Connection failed:', error);
            throw error;
        } finally {
            this.connectionPromise = null;
        }
    }

    /**
     * Create socket connection with timeout
     */
    private createConnection(token: string): Promise<Socket> {
        return new Promise((resolve, reject) => {
            this.connectionState = 'connecting';
            console.log('[Socket] Initiating connection...');

            // Create socket with optimized configuration
            this.socket = io(FILE_BASE_URL, {
                auth: {
                    token: `Bearer ${token}`
                },
                reconnection: false, // We'll handle reconnection manually
                timeout: this.config.connectionTimeout,
                transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
                forceNew: false, // Reuse existing connection if available
            });

            // Set up connection timeout
            const timeoutId = setTimeout(() => {
                if (this.connectionState === 'connecting') {
                    console.warn('[Socket] Connection timeout');
                    this.socket?.disconnect();
                    this.connectionState = 'error';
                    reject(new Error('Connection timeout'));
                }
            }, this.config.connectionTimeout);

            // Set up event listeners
            this.socket.once('connect', () => {
                clearTimeout(timeoutId);
                this.handleConnect();
                resolve(this.socket!);
            });

            this.socket.once('connect_error', (err) => {
                clearTimeout(timeoutId);
                this.handleConnectError(err);
                reject(err);
            });

            // Set up persistent event listeners
            this.socket.on('disconnect', this.handleDisconnect);
            this.socket.on('reconnect_attempt', this.handleReconnectAttempt);
        });
    }

    /**
     * Handle successful connection
     */
    private handleConnect(): void {
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        console.log('[Socket] ✅ Connected successfully');

        // Re-attach any registered event handlers
        this.reattachEventHandlers();
    }

    /**
     * Handle disconnection
     */
    private handleDisconnect(reason: string): void {
        console.log(`[Socket] Disconnected: ${reason}`);

        // Don't auto-reconnect if disconnected intentionally
        if (reason === 'io client disconnect') {
            this.connectionState = 'disconnected';
            return;
        }

        // Auto-reconnect for unexpected disconnections
        this.connectionState = 'reconnecting';
        this.scheduleReconnect();
    }

    /**
     * Handle connection error
     */
    private handleConnectError(err: Error): void {
        this.connectionState = 'error';
        console.error('[Socket] Connection error:', err.message);

        // Schedule reconnect with exponential backoff
        this.scheduleReconnect();
    }

    /**
     * Handle reconnection attempt
     */
    private handleReconnectAttempt(attemptNumber: number): void {
        console.log(`[Socket] Reconnection attempt ${attemptNumber}/${this.config.maxReconnectAttempts}`);
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    private scheduleReconnect(): void {
        // Clear any existing reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        // Check if we've exceeded max attempts
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.error('[Socket] Max reconnection attempts reached. Giving up.');
            this.connectionState = 'error';
            return;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
            this.config.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
            this.config.maxReconnectDelay
        );

        this.reconnectAttempts++;
        console.log(`[Socket] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.attemptReconnect();
        }, delay);
    }

    /**
     * Attempt to reconnect
     */
    private async attemptReconnect(): Promise<void> {
        const token = localStorage.getItem('managment_token');
        if (!token) {
            console.warn('[Socket] No token available for reconnection');
            return;
        }

        try {
            console.log('[Socket] Attempting to reconnect...');
            await this.connect(token);
        } catch (error) {
            console.error('[Socket] Reconnection failed:', error);
            // scheduleReconnect will be called by handleConnectError
        }
    }

    /**
     * Register event handler (non-blocking)
     */
    public on(event: string, handler: Function): void {
        // Store handler for re-attachment after reconnection
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)!.add(handler);

        // Attach to socket if connected
        if (this.socket) {
            this.socket.on(event, handler as any);
        }
    }

    /**
     * Remove event handler
     */
    public off(event: string, handler: Function): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.eventHandlers.delete(event);
            }
        }

        if (this.socket) {
            this.socket.off(event, handler as any);
        }
    }

    /**
     * Re-attach event handlers after reconnection
     */
    private reattachEventHandlers(): void {
        if (!this.socket) return;

        this.eventHandlers.forEach((handlers, event) => {
            handlers.forEach(handler => {
                this.socket!.on(event, handler as any);
            });
        });

        console.log(`[Socket] Re-attached ${this.eventHandlers.size} event handlers`);
    }

    /**
     * Emit event (non-blocking)
     */
    public emit(event: string, data?: any): void {
        if (!this.socket?.connected) {
            console.warn(`[Socket] Cannot emit '${event}': not connected`);
            return;
        }

        this.socket.emit(event, data);
    }

    /**
     * Gracefully disconnect
     */
    public disconnect(): void {
        // Clear reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // Clear event handlers
        this.eventHandlers.clear();

        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.connectionState = 'disconnected';
        this.reconnectAttempts = 0;
        console.log('[Socket] Disconnected gracefully');
    }

    /**
     * Get socket instance (for advanced usage)
     */
    public getSocket(): Socket | null {
        return this.socket;
    }

    /**
     * Reset connection (useful for token refresh)
     */
    public async reset(newToken: string): Promise<Socket> {
        console.log('[Socket] Resetting connection with new token');
        this.disconnect();
        return this.connect(newToken);
    }
}

export const socketService = SocketClient.getInstance();

