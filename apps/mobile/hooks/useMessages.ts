import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { messagesService } from '@/lib/api/services/messages';

interface MessagesQueryOptions {
  conversationId?: string;
  limit?: number;
  offset?: number;
}

interface SendMessageInput {
  conversationId: string;
  content: string;
}

export function useConversations() {
  return useQuery({
    queryKey: [...queryKeys.messages, 'conversations'] as const,
    queryFn: () => messagesService.getConversations(),
  });
}

export function useConversationMessages({
  conversationId,
  limit = 50,
  offset = 0,
}: MessagesQueryOptions) {
  return useQuery({
    queryKey: [...queryKeys.messages, 'conversation', conversationId, limit, offset] as const,
    queryFn: () => messagesService.getMessages(conversationId as string, limit, offset),
    enabled: Boolean(conversationId),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content }: SendMessageInput) =>
      messagesService.sendMessage(conversationId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.messages, 'conversation', variables.conversationId],
      });
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => messagesService.markAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.messages, 'conversation', conversationId],
      });
    },
  });
}
