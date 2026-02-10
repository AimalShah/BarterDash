import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';

import { useChat } from '../../hooks/useChat';

const { width, height } = Dimensions.get('window');

interface InstagramLiveChatProps {
  streamId: string;
  viewers?: { id: string; username: string; avatarUrl?: string }[];
  showInput?: boolean;
}

interface InstagramLiveChatUIProps {
  messages: {
    id: string;
    username: string;
    avatarUrl: string | null;
    message: string;
  }[];
  viewers?: { id: string; username: string; avatarUrl?: string }[];
  showInput?: boolean;
  sending?: boolean;
  onSendMessage?: (text: string) => Promise<void>;
}

export const InstagramLiveChatUI: React.FC<InstagramLiveChatUIProps> = ({
  messages,
  viewers = [],
  showInput = true,
  sending = false,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const prevMessagesCount = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      // New message received
      const lastMessage = messages[messages.length - 1];
      // Only vibrate if it's from someone else
      if (lastMessage && lastMessage.username !== 'You') {
        Vibration.vibrate(50);
      }
    }
    prevMessagesCount.current = messages.length;
  }, [messages]);

  const handleTextChange = (text: string) => {
    setInputText(text);

    // Check for tagging intent
    const lastWord = text.split(' ').pop();
    if (lastWord && lastWord.startsWith('@')) {
      const query = lastWord.substring(1);
      setTagQuery(query);
      setShowTagSuggestions(true);
    } else {
      setShowTagSuggestions(false);
    }
  };

  const handleTagUser = (username: string) => {
    const words = inputText.split(' ');
    words.pop(); // Remove the partial tag
    const newText = [...words, `@${username} `].join(' ');
    setInputText(newText);
    setShowTagSuggestions(false);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      if (onSendMessage) {
        await onSendMessage(inputText.trim());
      }
      setInputText('');
      setShowTagSuggestions(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={styles.messageRow}>
      <Image
        source={{
          uri: item.avatarUrl || `https://ui-avatars.com/api/?name=${item.username}&background=random&color=fff`
        }}
        style={styles.messageAvatar}
      />
      <View style={styles.messageBody}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.messageText}>{item.message || item.text}</Text>
      </View>
    </View>
  );

  const filteredViewers = viewers.filter(v =>
    v.username.toLowerCase().includes(tagQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={[styles.container, { paddingBottom: showInput ? insets.bottom : 0 }]}
    >
      {/* Messages with gradient fade */}
      <View style={styles.messagesWrapper}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          extraData={messages.length}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      </View>

      {/* Tag Suggestions */}
      {showInput && showTagSuggestions && filteredViewers.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={filteredViewers}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleTagUser(item.username)}
              >
                <View style={styles.suggestionAvatar}>
                  <Text style={styles.suggestionAvatarText}>{item.username[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.suggestionText}>{item.username}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input area - Only shown if showInput is true */}
      {showInput && (
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={handleTextChange}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.textSecondary}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              multiline={false}
              testID="stream-chat-input"
            />
            <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            disabled={!inputText.trim() || sending}
            testID="stream-chat-send"
          >
            <Ionicons name="send" size={20} color={inputText.trim() ? COLORS.primaryGold : COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export const InstagramLiveChat: React.FC<InstagramLiveChatProps> = ({
  streamId,
  viewers = [],
  showInput = true,
}) => {
  const { messages, sendMessage, sending } = useChat(streamId);

  return (
    <InstagramLiveChatUI
      messages={messages}
      viewers={viewers}
      showInput={showInput}
      sending={sending}
      onSendMessage={(text) => sendMessage(text, 'You')}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    maxHeight: 250,
  },
  messagesWrapper: {
    flex: 1,
    position: 'relative',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  messageBody: {
    flex: 1,
  },
  username: {
    color: COLORS.primaryGold,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 18,
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkBorderLight,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 44,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
    maxHeight: 60,
  },
  sendButton: {
    padding: 4,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  suggestionsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  suggestionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  suggestionAvatarText: {
    color: COLORS.luxuryBlack,
    fontSize: 12,
    fontWeight: 'bold',
  },
  suggestionText: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
});

export default InstagramLiveChat;
