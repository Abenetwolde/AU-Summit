import { io, Socket } from 'socket.io-client';
import { FILE_BASE_URL } from './api';

class SocketClient {
    private static instance: SocketClient;
    private socket: Socket | null = null;

    private constructor() { }

    public static getInstance(): SocketClient {
        if (!SocketClient.instance) {
            SocketClient.instance = new SocketClient();
        }
        return SocketClient.instance;
    }

    public connect(token: string): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(FILE_BASE_URL, {
            auth: {
                token: `Bearer ${token}`
            },
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connected');
        });

        this.socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });

        return this.socket;
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log('[Socket] Disconnected');
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }
}

export const socketService = SocketClient.getInstance();
