import { useState, useEffect } from 'react';
import { socketService } from '../store/services/socket';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface UseSocketConnectionReturn {
    connectionState: ConnectionState;
    isConnected: boolean;
    reconnect: () => Promise<void>;
}

/**
 * Hook to monitor socket connection status
 * Useful for displaying connection indicators in the UI
 */
export function useSocketConnection(): UseSocketConnectionReturn {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

    useEffect(() => {
        // Poll connection state every second
        const interval = setInterval(() => {
            const state = socketService.getConnectionState();
            setConnectionState(state);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const reconnect = async () => {
        const token = localStorage.getItem('managment_token');
        if (token) {
            try {
                await socketService.connect(token);
            } catch (error) {
                console.error('Manual reconnect failed:', error);
            }
        }
    };

    return {
        connectionState,
        isConnected: socketService.isConnected(),
        reconnect,
    };
}
