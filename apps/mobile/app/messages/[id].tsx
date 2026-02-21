import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useConversationMessages, useConversations, useSendMessage } from '@/hooks/useMessages';
import { COLORS } from '@/constants/colors';
import { StitchPage } from '@/components/design';

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();

  const [input, setInput] = useState('');

  const messagesQuery = useConversationMessages({ conversationId: id });
  const conversationsQuery = useConversations();
  const sendMutation = useSendMessage();

  const conversation = useMemo(
    () => (conversationsQuery.data || []).find((item) => item.id === id),
    [conversationsQuery.data, id]
  );

  const messages = useMemo(() => messagesQuery.data || [], [messagesQuery.data]);

  async function handleSend() {
    if (!id || !input.trim() || sendMutation.isPending) return;

    const content = input.trim();
    setInput('');

    try {
      await sendMutation.mutateAsync({ conversationId: id, content });
      await messagesQuery.refetch();
    } catch (error) {
      setInput(content);
    }
  }

  return (
    <StitchPage scroll={false} contentStyle={{ paddingBottom: 0 }}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color={COLORS.primaryText} />
          </Pressable>

          <View style={styles.headerMain}>
            <Text style={styles.headerTitle}>{conversation?.otherUser.username || 'Conversation'}</Text>
            <Text style={styles.headerSubtitle}>Direct message</Text>
          </View>

          <View style={styles.backBtn} />
        </View>

        <ScrollView style={styles.messagesList} contentContainerStyle={styles.messagesContent}>
          {messages.map((message) => {
            const isMe = message.senderId === profile?.id;

            return (
              <View key={message.id} style={[styles.messageWrap, isMe ? styles.messageWrapMe : styles.messageWrapOther]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>{message.content}</Text>
                </View>
                <Text style={styles.timeText}>{formatTime(message.createdAt)}</Text>
              </View>
            );
          })}

          {messages.length === 0 ? <Text style={styles.emptyText}>No messages yet. Start the conversation.</Text> : null}
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Say something..."
              placeholderTextColor={COLORS.lightGrey}
              style={styles.input}
            />
          </View>
          <Pressable style={styles.sendBtn} onPress={handleSend} disabled={sendMutation.isPending}>
            <Send size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </StitchPage>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    height: 36,
    width: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMain: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.lightGrey,
    fontSize: 11,
    marginTop: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageWrap: {
    marginBottom: 10,
    maxWidth: '82%',
  },
  messageWrapMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageWrapOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMe: {
    backgroundColor: COLORS.primaryBlue,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4F1',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  messageTextMe: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageTextOther: {
    color: COLORS.primaryText,
    fontWeight: '500',
  },
  timeText: {
    marginTop: 3,
    color: COLORS.lightGrey,
    fontSize: 10,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 24,
    color: COLORS.lightGrey,
    fontSize: 13,
    textAlign: 'center',
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE4F1',
    backgroundColor: '#F8FAFF',
    justifyContent: 'center',
  },
  input: {
    color: COLORS.primaryText,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  sendBtn: {
    height: 42,
    width: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBlue,
  },
});
