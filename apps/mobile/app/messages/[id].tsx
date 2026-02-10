import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    TextInput,
    StatusBar,
    Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Pressable,
    Center,
    Spinner,
    Image,
} from "@gluestack-ui/themed";
import { ArrowLeft, Send } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { messagesService, Message } from "@/lib/api/services/messages";
import { usersService } from "@/lib/api/services/users";
import { supabase } from "@/lib/supabase";
import { COLORS } from "../../constants/colors";

interface UserProfile {
    id: string;
    username: string;
    avatarUrl?: string;
}

interface EnrichedMessage extends Message {
    sender: UserProfile;
}

export default function ConversationScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { profile } = useAuthStore();

    const [messages, setMessages] = useState<EnrichedMessage[]>([]);
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputText, setInputText] = useState("");
    const flatListRef = useRef<FlatList>(null);
    const hasMessages = messages.length > 0;

    // Fetch conversation and messages when screen is focused
    useFocusEffect(
        useCallback(() => {
            if (id) {
                loadData();
            }
        }, [id])
    );

    // Subscribe to realtime messages
    useEffect(() => {
        if (!id) return;

        const channel = supabase
            .channel(`conversation:${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${id}`,
                },
                async (payload) => {
                    console.log('📨 New DM received:', payload.new);
                    const newMsg = payload.new as any;

                    // Only process if it's not from us (we add our own messages immediately for UX)
                    if (newMsg.sender_id === profile?.id) return;

                    try {
                        // Fetch sender profile for the new message
                        const senderProfile = await usersService.getProfile(newMsg.sender_id);

                        const enrichedMsg: EnrichedMessage = {
                            id: newMsg.id,
                            conversationId: newMsg.conversation_id,
                            senderId: newMsg.sender_id,
                            content: newMsg.content,
                            isRead: !!newMsg.read_at,
                            createdAt: newMsg.created_at,
                            sender: {
                                id: senderProfile.id,
                                username: senderProfile.username,
                                avatarUrl: senderProfile.avatar_url || senderProfile.avatarUrl,
                            }
                        };

                        setMessages((prev) => [enrichedMsg, ...prev]);
                        Vibration.vibrate(50);

                        // Mark as read
                        await messagesService.markAsRead(id);
                    } catch (error) {
                        console.error("Error enrichment realtime message:", error);
                        // Fallback to reload if enrichment fails
                        loadMessages(false);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadConversation(),
                loadMessages(),
            ]);
        } catch (error) {
            console.error("Error loading chat:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadConversation = async () => {
        if (!id || !profile) return;

        try {
            const msgs = await messagesService.getMessages(id, 1);

            if (msgs.length > 0) {
                const firstMsg = msgs[0];
                if (firstMsg.sender && firstMsg.senderId !== profile.id) {
                    setOtherUser(firstMsg.sender);
                } else {
                    await fetchOtherUser(firstMsg.senderId === profile.id ? firstMsg.senderId : firstMsg.senderId);
                }
            }
        } catch (error) {
            console.error("Error loading conversation:", error);
        }
    };

    const fetchOtherUser = async (userId: string) => {
        try {
            const userProfile = await usersService.getProfile(userId);
            setOtherUser({
                id: userProfile.id,
                username: userProfile.username,
                avatarUrl: userProfile.avatar_url || userProfile.avatarUrl,
            });
        } catch (error) {
            console.error("Error fetching other user:", error);
        }
    };

    const loadMessages = async (showLoading = true) => {
        if (!id) return;
        try {
            const data = await messagesService.getMessages(id);
            setMessages(data as EnrichedMessage[]);

            if (data.length > 0) {
                await messagesService.markAsRead(id);
            }

            if (!otherUser && data.length > 0 && profile) {
                const otherMsg = data.find(m => m.senderId !== profile.id);
                if (otherMsg?.sender) {
                    setOtherUser(otherMsg.sender);
                } else if (otherMsg) {
                    await fetchOtherUser(otherMsg.senderId);
                }
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !id || sending) return;

        const content = inputText.trim();
        setInputText("");
        setSending(true);

        try {
            const newMessage = await messagesService.sendMessage(id, content);
            setMessages((prev) => [newMessage as EnrichedMessage, ...prev]);
        } catch (error) {
            console.error("Error sending message:", error);
            setInputText(content);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: EnrichedMessage }) => {
        const isMe = item.senderId === profile?.id;
        const sender = item.sender;

        return (
            <Box
                alignSelf={isMe ? "flex-end" : "flex-start"}
                maxWidth="85%"
                mb="$4"
                px="$4"
            >
                {!isMe && sender && (
                    <HStack alignItems="center" space="xs" mb="$1">
                        {sender.avatarUrl ? (
                            <Image
                                source={{ uri: sender.avatarUrl }}
                                w={24}
                                h={24}
                                rounded="$full"
                                alt={sender.username}
                            />
                        ) : (
                            <Center w={24} h={24} rounded="$full" bg={COLORS.luxuryBlackLight}>
                                <Text size="xs" fontWeight="$bold" color={COLORS.textMuted}>
                                    {sender.username?.[0]?.toUpperCase()}
                                </Text>
                            </Center>
                        )}
                        <Text size="xs" color={COLORS.textMuted}>@{sender.username}</Text>
                    </HStack>
                )}
                <Box
                    bg={isMe ? COLORS.primaryGold : COLORS.luxuryBlackLight}
                    rounded="$2xl"
                    borderBottomRightRadius={isMe ? 4 : 16}
                    borderBottomLeftRadius={isMe ? 16 : 4}
                    px="$4"
                    py="$3"
                >
                    <Text color={isMe ? COLORS.luxuryBlack : COLORS.textPrimary}>
                        {item.content}
                    </Text>
                </Box>
                <Text
                    color={COLORS.textMuted}
                    size="xs"
                    mt="$1"
                    textAlign={isMe ? "right" : "left"}
                >
                    {formatTime(item.createdAt)}
                </Text>
            </Box>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                {/* Header */}
                <HStack
                    px="$4"
                    py="$3"
                    borderBottomWidth={1}
                    borderColor={COLORS.darkBorder}
                    alignItems="center"
                    space="md"
                    bg={COLORS.luxuryBlack}
                >
                    <Pressable onPress={() => router.back()} p="$2">
                        <ArrowLeft size={24} color={COLORS.textPrimary} />
                    </Pressable>

                    {/* Avatar & Name */}
                    <HStack flex={1} alignItems="center" space="sm">
                        {otherUser?.avatarUrl ? (
                            <Image
                                source={{ uri: otherUser.avatarUrl }}
                                w={40}
                                h={40}
                                rounded="$full"
                                bg={COLORS.luxuryBlackLight}
                                alt={otherUser.username}
                            />
                        ) : (
                            <Center w={40} h={40} bg={COLORS.luxuryBlackLight} rounded="$full">
                                <Text color={COLORS.textMuted} fontWeight="$bold" size="md">
                                    {otherUser?.username?.[0]?.toUpperCase() || "?"}
                                </Text>
                            </Center>
                        )}
                        <VStack>
                            <Heading size="md" color={COLORS.textPrimary}>
                                {otherUser ? `@${otherUser.username}` : "Chat"}
                            </Heading>
                        </VStack>
                    </HStack>
                </HStack>

                {/* Messages */}
                <Box flex={1} bg={COLORS.luxuryBlack}>
                    {loading ? (
                        <Center flex={1}>
                            <Spinner size="large" color={COLORS.primaryGold} />
                        </Center>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item) => item.id}
                            inverted
                            contentContainerStyle={{
                                paddingHorizontal: 16,
                                paddingTop: 24,
                                paddingBottom: 24,
                                flexGrow: 1,
                                justifyContent: hasMessages ? "flex-start" : "center",
                                alignItems: "stretch",
                            }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={() => (
                                <Center flex={1} py="$20">
                                    <Text color={COLORS.textMuted} textAlign="center">
                                        No messages yet.{'\n'}Start the conversation!
                                    </Text>
                                </Center>
                            )}
                        />
                    )}
                </Box>

                {/* Input Area */}
                <Box
                    px="$4"
                    py="$3"
                    borderTopWidth={1}
                    borderColor={COLORS.darkBorder}
                    bg={COLORS.luxuryBlack}
                >
                    <HStack alignItems="flex-end" space="sm">
                        <Box
                            flex={1}
                            bg={COLORS.luxuryBlackLight}
                            rounded="$xl"
                            px="$4"
                            py={Platform.OS === 'ios' ? "$3" : "$1"}
                            minHeight={48}
                            justifyContent="center"
                        >
                            <TextInput
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Type a message..."
                                placeholderTextColor={COLORS.textMuted}
                                multiline
                                style={{
                                    color: COLORS.textPrimary,
                                    fontSize: 16,
                                    maxHeight: 100,
                                }}
                            />
                        </Box>
                        <Pressable
                            onPress={handleSend}
                            bg={inputText.trim() ? COLORS.primaryGold : COLORS.darkBorder}
                            w={48}
                            h={48}
                            rounded="$full"
                            alignItems="center"
                            justifyContent="center"
                            disabled={!inputText.trim() || sending}
                        >
                            {sending ? (
                                <Spinner size="small" color={COLORS.luxuryBlack} />
                            ) : (
                                <Send size={20} color={inputText.trim() ? COLORS.luxuryBlack : COLORS.textMuted} />
                            )}
                        </Pressable>
                    </HStack>
                </Box>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
