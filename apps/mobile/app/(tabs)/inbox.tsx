import React, { useState, useEffect, useCallback } from "react";
import {
	FlatList,
	StatusBar,
	RefreshControl,
	KeyboardAvoidingView,
	Platform,
	Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
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
import { MessageCircle, Edit, X, Users, UserCheck } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { theme } from "@/constants/theme";
import { messagesService, Conversation } from "@/lib/api/services/messages";
import { socialService } from "@/lib/api/services/social";
import { useToast } from "@/context/ToastContext";
import { handleApiError } from "@/lib/api/errorHandle";
import { COLORS } from '../../constants/colors';
import { supabase } from "@/lib/supabase";

interface FollowUser {
	id: string;
	username: string;
	avatar_url?: string;
}

export default function InboxScreen() {
	const router = useRouter();
	const { profile } = useAuthStore();
	const { showError } = useToast();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [showNewMessageModal, setShowNewMessageModal] = useState(false);
	const [followers, setFollowers] = useState<FollowUser[]>([]);
	const [following, setFollowing] = useState<FollowUser[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const [activeTab, setActiveTab] = useState<'followers' | 'following'>('following');
	const activeUsers = activeTab === 'following' ? following : followers;

	useEffect(() => {
		fetchConversations();
	}, []);

	// Subscribe to message updates for realtime inbox
	useEffect(() => {
		if (!profile?.id) return;

		console.log('🔔 Setting up inbox realtime for user:', profile.id);

		// Subscribe to ALL direct_messages where we are a participant might be hard via postgres_changes filter
		// So we subscribe to the conversations table changes OR just any message change and check our conversations?
		// Actually, listening to INSERT on direct_messages is better.
		// Since we don't have an easy way to filter by "conversations I am in" via postgres_changes,
		// we can listen to all inserts and refetch conversations.

		const channel = supabase
			.channel('inbox-realtime')
			.on(
				'postgres_changes',
				{
					event: '*', // Listen to INSERT, UPDATE, DELETE
					schema: 'public',
					table: 'direct_messages',
				},
				() => {
					console.log('📨 Inbox change detected, refreshing...');
					fetchConversations(false);
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [profile?.id]);

	// Auto-refresh when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			fetchConversations();
		}, [])
	);

	const fetchConversations = async (isRefresh = false) => {
		if (isRefresh) setRefreshing(true);
		else setLoading(true);

		try {
			const data = await messagesService.getConversations();
			setConversations(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error("Error fetching conversations:", error);
			setConversations([]);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const fetchFollowUsers = async () => {
		if (!profile?.id) return;
		setLoadingUsers(true);
		try {
			const [followersRes, followingRes] = await Promise.all([
				socialService.getFollowers(profile.id),
				socialService.getFollowing(profile.id),
			]);
			setFollowers(followersRes?.followers || []);
			setFollowing(followingRes?.following || []);
		} catch (error) {
			console.error("Error fetching follow users:", error);
		} finally {
			setLoadingUsers(false);
		}
	};

	const handleNewMessage = () => {
		fetchFollowUsers();
		setShowNewMessageModal(true);
	};

	const handleStartConversation = async (userId: string) => {
		try {
			const conversation = await messagesService.startConversation(userId);
			setShowNewMessageModal(false);
			router.push(`/messages/${conversation.id}`);
		} catch (error) {
			const message = handleApiError(error, { context: "Messaging", showAlert: false });
			showError(message);
		}
	};

	const handleConversationPress = (conversation: Conversation) => {
		router.push(`/messages/${conversation.id}`);
	};

	const formatTime = (dateString?: string) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Now";
		if (diffMins < 60) return `${diffMins}m`;
		if (diffHours < 24) return `${diffHours}h`;
		if (diffDays < 7) return `${diffDays}d`;
		return date.toLocaleDateString();
	};

	const renderFollowUser = ({ item }: { item: FollowUser }) => (
		<Pressable
			onPress={() => handleStartConversation(item.id)}
			px="$4"
			py="$3"
			borderBottomWidth={1}
			borderColor={COLORS.darkBorder}
			sx={{ ":active": { bg: COLORS.luxuryBlackLight } }}
		>
			<HStack alignItems="center" space="md">
				{item.avatar_url ? (
					<Image
						source={{ uri: item.avatar_url }}
						alt={item.username}
						w={48}
						h={48}
						rounded="$full"
						bg={COLORS.luxuryBlackLight}
					/>
				) : (
					<Center w={48} h={48} rounded="$full" bg={COLORS.luxuryBlackLight}>
						<Text color={COLORS.textMuted} fontWeight="$bold" size="md">
							{item.username?.[0]?.toUpperCase() ?? "?"}
						</Text>
					</Center>
				)}
				<VStack flex={1}>
					<Text color={COLORS.textPrimary} fontWeight="$semibold" size="md">
						@{item.username}
					</Text>
					<Text color={COLORS.textSecondary} size="sm">Tap to message</Text>
				</VStack>
				<Box bg={COLORS.primaryGold} p="$2" rounded="$full">
					<MessageCircle size={20} color={COLORS.luxuryBlack} />
				</Box>
			</HStack>
		</Pressable>
	);

	const renderConversation = ({ item }: { item: Conversation }) => (
		<Pressable
			onPress={() => handleConversationPress(item)}
			px="$6"
			py="$4"
			borderBottomWidth={1}
			borderColor={COLORS.darkBorder}
			bg={item.unreadCount > 0 ? COLORS.luxuryBlackLight : COLORS.luxuryBlack}
			sx={{ ":active": { bg: COLORS.darkBorder } }}
		>
			<HStack alignItems="center" space="md">
				{item.otherUser.avatarUrl ? (
					<Image
						source={{ uri: item.otherUser.avatarUrl }}
						alt={item.otherUser.username}
						w={56}
						h={56}
						rounded="$full"
						bg={COLORS.luxuryBlackLight}
					/>
				) : (
					<Center w={56} h={56} rounded="$full" bg={COLORS.luxuryBlackLight}>
						<Text color={COLORS.textMuted} fontWeight="$bold" size="lg">
							{item.otherUser.username?.[0]?.toUpperCase() ?? "?"}
						</Text>
					</Center>
				)}

				<VStack flex={1}>
					<HStack justifyContent="space-between" alignItems="center">
						<Text
							color={COLORS.textPrimary}
							fontWeight={item.unreadCount > 0 ? "$bold" : "$semibold"}
							size="md"
						>
							@{item.otherUser.username}
						</Text>
						<Text color={COLORS.textSecondary} size="xs">
							{formatTime(item.lastMessage?.createdAt || item.lastMessageAt)}
						</Text>
					</HStack>
					<HStack justifyContent="space-between" alignItems="center" mt="$1">
						<Text
							color={item.unreadCount > 0 ? COLORS.textPrimary : COLORS.textSecondary}
							size="sm"
							numberOfLines={1}
							flex={1}
							fontWeight={item.unreadCount > 0 ? "$medium" : "$normal"}
						>
							{item.lastMessage?.content || "No messages yet"}
						</Text>
						{item.unreadCount > 0 && (
							<Center
								bg={COLORS.primaryGold}
								rounded="$full"
								minWidth="$5"
								h="$5"
								px="$2"
								ml="$2"
							>
								<Text color={COLORS.luxuryBlack} size="xs" fontWeight="$bold">
									{item.unreadCount}
								</Text>
							</Center>
						)}
					</HStack>
				</VStack>
			</HStack>
		</Pressable>
	);

	if (loading) {
		return (
			<Box flex={1} bg={COLORS.luxuryBlack} justifyContent="center" alignItems="center">
				<Spinner size="large" color={COLORS.primaryGold} />
			</Box>
		);
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={{ flex: 1 }}
			keyboardVerticalOffset={theme.keyboard.keyboardVerticalOffset}
		>
			<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }} edges={['top']}>
				<StatusBar barStyle="light-content" />

				{/* Header */}
				<HStack
					px="$6"
					py="$4"
					borderBottomWidth={1}
					borderColor={COLORS.darkBorder}
					bg={COLORS.luxuryBlack}>
					<VStack alignItems="center">
						<Heading size="2xl" color={COLORS.textPrimary} fontWeight="$bold">
							Inbox
						</Heading>
						<Text color={COLORS.textSecondary} size="sm">
							Your messages
						</Text>
					</VStack>
					<Pressable
						onPress={handleNewMessage}
						p="$3"
						bg={COLORS.primaryGold}
						rounded="$full"
						sx={{ ":active": { opacity: 0.9 } }}
					>
						<Edit size={20} color={COLORS.luxuryBlack} />
					</Pressable>
				</HStack>

				{/* Conversations List */}
				{conversations.length > 0 ? (
					<FlatList
						data={conversations}
						renderItem={renderConversation}
						keyExtractor={(item) => item.id}
						contentContainerStyle={{ paddingBottom: 100 }}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={() => fetchConversations(true)}
								tintColor={COLORS.primaryGold}
							/>
						}
					/>
				) : (
					<Center flex={1} px="$10">
						<Center
							w={96}
							h={96}
							bg={COLORS.luxuryBlackLight}
							rounded="$full"
							mb="$6"
						>
							<MessageCircle size={48} color={COLORS.textMuted} />
						</Center>
						<Heading size="lg" color={COLORS.textPrimary} textAlign="center" mb="$2">
							No messages yet
						</Heading>
						<Text color={COLORS.textSecondary} textAlign="center" mb="$6">
							Start a conversation with someone you follow or who follows you.
						</Text>
						<Pressable
							onPress={handleNewMessage}
							bg={COLORS.primaryGold}
							px="$8"
							py="$4"
							rounded="$full"
							sx={{ ":active": { opacity: 0.9 } }}
						>
							<Text color={COLORS.luxuryBlack} fontWeight="$bold">
								New Message
							</Text>
						</Pressable>
					</Center>
				)}

				{/* New Message Modal */}
				<Modal
					visible={showNewMessageModal}
					animationType="slide"
					presentationStyle="pageSheet"
					onRequestClose={() => setShowNewMessageModal(false)}
				>
					<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.luxuryBlack }}>
						{/* Modal Header */}
						<HStack
							px="$6"
							py="$4"
							borderBottomWidth={1}
							borderColor={COLORS.darkBorder}
							justifyContent="space-between"
							alignItems="center"
							bg={COLORS.luxuryBlack}
						>
							<Heading size="xl" color={COLORS.textPrimary} fontWeight="$bold">
								New Message
							</Heading>
							<Pressable
								onPress={() => setShowNewMessageModal(false)}
								p="$2"
								rounded="$full"
								sx={{ ":active": { bg: COLORS.luxuryBlackLight } }}
							>
								<X size={24} color={COLORS.textPrimary} />
							</Pressable>
						</HStack>

						{/* Tabs */}
						<HStack px="$6" py="$4" space="md">
							<Pressable
								onPress={() => setActiveTab('following')}
								flex={1}
								py="$3"
								px="$4"
								bg={activeTab === 'following' ? COLORS.primaryGold : COLORS.luxuryBlackLight}
								rounded="$full"
								alignItems="center"
							>
								<HStack space="sm" alignItems="center">
									<UserCheck size={18} color={activeTab === 'following' ? COLORS.luxuryBlack : COLORS.textMuted} />
									<Text color={activeTab === 'following' ? COLORS.luxuryBlack : COLORS.textMuted} fontWeight="$bold">
										Following ({following.length})
									</Text>
								</HStack>
							</Pressable>
							<Pressable
								onPress={() => setActiveTab('followers')}
								flex={1}
								py="$3"
								px="$4"
								bg={activeTab === 'followers' ? COLORS.primaryGold : COLORS.luxuryBlackLight}
								rounded="$full"
								alignItems="center"
							>
								<HStack space="sm" alignItems="center">
									<Users size={18} color={activeTab === 'followers' ? COLORS.luxuryBlack : COLORS.textMuted} />
									<Text color={activeTab === 'followers' ? COLORS.luxuryBlack : COLORS.textMuted} fontWeight="$bold">
										Followers ({followers.length})
									</Text>
								</HStack>
							</Pressable>
						</HStack>

						{/* User List */}
						{loadingUsers ? (
							<Center flex={1}>
								<Spinner size="large" color={COLORS.primaryGold} />
							</Center>
						) : (
							<FlatList
								data={activeUsers}
								renderItem={renderFollowUser}
								keyExtractor={(item) => item.id}
								contentContainerStyle={{
									paddingBottom: 20,
									flexGrow: 1,
									justifyContent: activeUsers.length === 0 ? "center" : "flex-start",
									alignItems: activeUsers.length === 0 ? "center" : "stretch",
								}}
								ListEmptyComponent={() => (
									<Center py="$20" px="$6">
										<Users size={48} color={COLORS.textMuted} />
										<Text color={COLORS.textSecondary} textAlign="center" mt="$4" size="md">
											{activeTab === 'following'
												? "You're not following anyone yet."
												: "You don't have any followers yet."}
										</Text>
									</Center>
								)}
							/>
						)}
					</SafeAreaView>
				</Modal>
			</SafeAreaView>
		</KeyboardAvoidingView>
	);
}
