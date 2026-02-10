import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  message: string;
  isDeleted: boolean;
  createdAt: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  sendMessage: (text: string, username: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useChat(streamId: string | undefined): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('initializing');

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!streamId) return;

    console.log('📨 Fetching chat messages for stream:', streamId);

    try {
      setLoading(true);

      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          stream_id,
          user_id,
          message,
          is_deleted,
          created_at
        `)
        .eq('stream_id', streamId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) {
        console.error('❌ Error fetching messages:', messagesError);
        throw messagesError;
      }

      console.log('📨 Raw messages data:', messagesData?.length || 0, 'messages');

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      const userIds = [...new Set(messagesData.map(msg => msg.user_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
      }

      const userMap: Record<string, { username: string; avatarUrl: string | null }> = {};
      profilesData?.forEach(profile => {
        userMap[profile.id] = {
          username: profile.username || 'Unknown',
          avatarUrl: profile.avatar_url,
        };
      });

      const mappedMessages: ChatMessage[] = messagesData.map((msg: any) => ({
        id: msg.id,
        streamId: msg.stream_id,
        userId: msg.user_id,
        username: userMap[msg.user_id]?.username || 'Unknown',
        avatarUrl: userMap[msg.user_id]?.avatarUrl || null,
        message: msg.message,
        isDeleted: msg.is_deleted,
        createdAt: msg.created_at,
      }));

      console.log('✅ Setting messages:', mappedMessages.length);
      setMessages(mappedMessages);
    } catch (error) {
      console.error('❌ Failed to fetch chat messages:', error);
    } finally {
      setLoading(false);
    }
  }, [streamId]);

  // Subscribe to new messages via Supabase Realtime
  useEffect(() => {
    if (!streamId) return;

    console.log('🔔 Setting up chat realtime for stream:', streamId);

    // Initial fetch
    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${streamId}`,
        },
        async (payload) => {
          console.log('📨 REALTIME: New message received:', payload.new);
          const newMsg = payload.new as any;

          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newMsg.user_id)
            .single();

          const message: ChatMessage = {
            id: newMsg.id,
            streamId: newMsg.stream_id,
            userId: newMsg.user_id,
            username: profile?.username || 'Unknown',
            avatarUrl: profile?.avatar_url || null,
            message: newMsg.message,
            isDeleted: newMsg.is_deleted,
            createdAt: newMsg.created_at,
          };

          console.log('📨 REALTIME: Adding message to state:', message.username, ':', message.message);

          // Use functional update to ensure we get latest state
          setMessages(prevMessages => {
            const newMessages = [...prevMessages, message];
            console.log('📨 REALTIME: Updated messages count:', newMessages.length);
            return newMessages;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          console.log('📝 Message updated:', payload.new);
          const updated = payload.new as any;

          setMessages(prev =>
            prev.map(msg =>
              msg.id === updated.id
                ? { ...msg, message: updated.message, isDeleted: updated.is_deleted }
                : msg
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('🔔 Chat subscription status:', status);
        setSubscriptionStatus(status);
      });

    return () => {
      console.log('🧹 Cleaning up chat subscription');
      supabase.removeChannel(subscription);
    };
  }, [streamId, fetchMessages]);

  // Send message - persistent to database
  const sendMessage = useCallback(async (text: string, username: string) => {
    if (!streamId || !text.trim()) return;

    console.log('📤 Sending message:', text, 'to stream:', streamId);
    console.log('📤 Current subscription status:', subscriptionStatus);

    try {
      setSending(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        throw new Error('Not authenticated');
      }

      console.log('👤 Current user:', user.id);

      // IMPORTANT: Don't add message to local state here
      // Wait for realtime subscription to add it
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: text.trim(),
          is_deleted: false,
        })
        .select();

      if (error) {
        console.error('❌ Error inserting message:', error);
        throw error;
      }

      console.log('✅ Message inserted to DB:', data);
      console.log('⏳ Waiting for realtime to broadcast...');

      // If realtime doesn't work, manually refresh after 500ms
      setTimeout(() => {
        console.log('🔄 Manually refreshing messages (realtime fallback)');
        fetchMessages();
      }, 500);

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [streamId, subscriptionStatus, fetchMessages]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    refresh: fetchMessages,
  };
}
