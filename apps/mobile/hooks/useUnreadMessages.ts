import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { messagesService } from '../lib/api/services/messages';

export function useUnreadMessages(userId: string | undefined) {
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        if (!userId) return;
        try {
            const count = await messagesService.getUnreadCount();
            setUnreadMessagesCount(count);
        } catch (error) {
            console.error('Error fetching unread DM count:', error);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        fetchUnreadCount();

        // Subscribe to additions/updates to direct_messages
        const channel = supabase
            .channel(`unread-messages:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'direct_messages',
                },
                () => {
                    // Refetch whenever there's any change in direct_messages
                    // Ideally we'd filter for messages WHERE participants include userId,
                    // but postgres_changes filter is limited.
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchUnreadCount]);

    return { unreadMessagesCount, refresh: fetchUnreadCount };
}
