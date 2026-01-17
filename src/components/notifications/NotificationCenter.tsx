import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Bell, Info, AlertTriangle, CheckCircle, MailOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

import { socketService } from '../../store/services/socket';
import {
    useGetNotificationsQuery,
    useGetUnreadNotificationCountQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
    api,
    Notification as ApiNotification
} from '../../store/services/api';

import { Button } from '../ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../ui/popover';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

const NotificationCenter: React.FC = () => {
    const [page] = useState(1);
    const dispatch = useDispatch();
    const { data: notificationsData, isLoading } = useGetNotificationsQuery({ page, limit: 15 });
    const { data: unreadData } = useGetUnreadNotificationCountQuery(); // Polling removed
    const [markAsRead] = useMarkNotificationAsReadMutation();
    const [markAllRead] = useMarkAllNotificationsAsReadMutation();
    const navigate = useNavigate();

    const unreadCount = unreadData?.unreadCount || 0;

    useEffect(() => {
        let isMounted = true;
        let notificationHandler: ((data: ApiNotification) => void) | null = null;

        const initializeSocket = async () => {
            const token = localStorage.getItem('managment_token');
            if (!token) {
                console.warn('[NotificationCenter] No token available');
                return;
            }

            try {
                // Connect to socket (non-blocking)
                await socketService.connect(token);

                if (!isMounted) return;

                // Define notification handler
                notificationHandler = (data: ApiNotification) => {
                    if (!isMounted) return;

                    console.log('[NotificationCenter] New notification received:', data);

                    // Invalidate tags to trigger refetch
                    dispatch(api.util.invalidateTags(['Notification']));

                    // Browser Notification (non-blocking)
                    if (window.Notification && Notification.permission === 'granted') {
                        try {
                            new Notification(data.title, {
                                body: data.message,
                                icon: '/favicon.ico',
                                tag: `notification-${data.id}`,
                            });
                        } catch (err) {
                            console.error('[NotificationCenter] Browser notification failed:', err);
                        }
                    }
                };

                // Register event handler
                socketService.on('new_notification', notificationHandler);

                console.log('[NotificationCenter] Socket initialized successfully');
            } catch (error) {
                console.error('[NotificationCenter] Socket initialization failed:', error);
                // Socket will auto-reconnect in background
            }
        };

        // Initialize socket in background
        initializeSocket();

        // Cleanup function
        return () => {
            isMounted = false;

            // Remove event handler if it was registered
            if (notificationHandler) {
                socketService.off('new_notification', notificationHandler);
            }

            // Note: We don't disconnect the socket here as it may be used by other components
            // The socket will be disconnected when the user logs out
        };
    }, [dispatch]);

    useEffect(() => {
        if (window.Notification && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const handleNotificationClick = async (notif: ApiNotification) => {
        if (!notif.isRead) {
            await markAsRead(notif.id);
        }

        if (notif.applicationId) {
            navigate(`/dashboard/journalist/${notif.applicationId}`);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'WORKFLOW_ACTION': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'WARNING': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'ERROR': return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group overflow-visible">
                    <Bell className="h-5 w-5 text-slate-600 group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-in zoom-in-50 duration-300 rounded-full"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-2xl border-slate-200/50 backdrop-blur-xl bg-white/95" align="end">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                        Notifications
                        {unreadCount > 0 && <span className="text-[10px] font-normal text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded-full">{unreadCount} unread</span>}
                    </h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                            onClick={() => markAllRead()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[350px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48 text-slate-400 text-xs italic">
                            Loading notifications...
                        </div>
                    ) : !notificationsData?.rows?.length ? (
                        <div className="flex flex-col items-center justify-center h-64 p-8 text-center bg-slate-50/30">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <Bell className="h-5 w-5 text-slate-300" />
                            </div>
                            <p className="text-slate-500 text-xs font-medium">No alerts yet</p>
                            <p className="text-slate-400 text-[10px] mt-1">Stay tuned for updates on applications.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {notificationsData.rows.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={cn(
                                        "p-3.5 transition-all cursor-pointer group hover:bg-blue-50/30",
                                        !notif.isRead ? "bg-white border-l-[3px] border-l-blue-500" : "bg-white/50"
                                    )}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-0.5 flex-shrink-0">
                                            {getTypeIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 space-y-1 overflow-hidden">
                                            <div className="flex items-start justify-between">
                                                <p className={cn(
                                                    "text-[13px] text-slate-800 leading-snug group-hover:text-blue-700 truncate-2-lines",
                                                    !notif.isRead ? "font-bold" : "font-medium"
                                                )}>
                                                    {notif.title}
                                                </p>
                                            </div>
                                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-[9px] text-slate-400">
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                </span>
                                                {!notif.isRead && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                    <Button variant="ghost" className="w-full text-[10px] text-slate-500 hover:text-slate-700 h-7">
                        View notification history
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationCenter;
