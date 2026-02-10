import React, { useRef, useEffect } from 'react';
import { 
    View, 
    FlatList, 
    KeyboardAvoidingView, 
    Platform, 
    StyleSheet,
    Dimensions
} from 'react-native';
import {
    Box,
    Text,
    Input,
    InputField,
    Pressable,
} from "@gluestack-ui/themed";
import { Send, MessageCircle } from 'lucide-react-native';
import { useChat } from '../../hooks/useChat';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface ChatMessage {
    id: string;
    username: string;
    message: string;
}

interface ChatBoxProps {
    streamId: string;
    username: string;
}

export const ChatBox = ({ streamId, username }: ChatBoxProps) => {
    const { messages, loading, sending, sendMessage } = useChat(streamId);
    const [inputText, setInputText] = React.useState('');
    const flatListRef = useRef<FlatList>(null);

    const handleSend = async () => {
        if (inputText.trim() && !sending) {
            try {
                await sendMessage(inputText.trim(), username);
                setInputText('');
            } catch (error) {
                console.error('❌ ChatBox failed to send message:', error);
            }
        }
    };

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isFirstMessage = index === 0;
        
        return (
            <View style={styles.messageContainer}>
                <View style={styles.messageBubble}>
                    <Text style={styles.username}>
                        {item.username}
                    </Text>
                    <Text style={styles.messageText}>
                        {item.message}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <MessageCircle size={16} color={COLORS.textPrimary} />
                <Text style={styles.headerText}>
                    Live Chat ({messages.length})
                </Text>
            </View>

            {/* Messages List */}
            <View style={styles.messagesContainer}>
                {loading ? (
                    <View style={styles.centerContent}>
                        <Text color={COLORS.textPrimary} fontSize="$sm">
                            Loading messages...
                        </Text>
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.centerContent}>
                        <Text color={COLORS.textSecondary} fontSize="$sm">
                            No messages yet. Say something!
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id || Math.random().toString()}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={20}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                    />
                )}
            </View>

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <Input
                        variant="outline"
                        size="md"
                        style={styles.input}
                    >
                        <InputField
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder={sending ? "Sending..." : "Type a message..."}
                            placeholderTextColor={COLORS.textSecondary}
                            color={COLORS.textPrimary}
                            returnKeyType="send"
                            onSubmitEditing={handleSend}
                            style={styles.inputField}
                            editable={!sending}
                            multiline={false}
                            maxLength={200}
                        />
                    </Input>
                    
                    <Pressable
                        onPress={handleSend}
                        style={[
                            styles.sendButton,
                            (sending || !inputText.trim()) && styles.sendButtonDisabled
                        ]}
                        disabled={sending || !inputText.trim()}
                    >
                        <Send size={20} color={COLORS.luxuryBlack} />
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxHeight: 280,
        backgroundColor: COLORS.overlayStrong,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.darkBorderLight,
        backgroundColor: COLORS.overlaySoft,
    },
    headerText: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    messagesContainer: {
        flex: 1,
        maxHeight: 180,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 8,
    },
    messageContainer: {
        marginBottom: 8,
        maxWidth: width * 0.85,
    },
    messageBubble: {
        backgroundColor: COLORS.darkBorderLight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderBottomLeftRadius: 4,
    },
    username: {
        color: COLORS.primaryGold,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 2,
    },
    messageText: {
        color: COLORS.textPrimary,
        fontSize: 14,
        lineHeight: 20,
    },
    inputContainer: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.darkBorderLight,
        backgroundColor: COLORS.overlayMedium,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.darkBorderLight,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        borderRadius: 24,
        marginRight: 8,
    },
    inputField: {
        color: COLORS.textPrimary,
        fontSize: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 80,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.textPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
