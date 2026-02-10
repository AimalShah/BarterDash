import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Gift, MessageCircle, AlertCircle } from "lucide-react-native";
import { notificationsService, Notification } from "../lib/api/services/notifications";
import { COLORS } from "../constants/colors";

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();
        markAllAsRead();
    }, []);

    const fetchNotifications = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await notificationsService.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsService.markAllAsRead();
        } catch (error) {
            console.error("Error marking notifications as read:", error);
        }
    };

    const handleNotificationPress = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await notificationsService.markAsRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                );
            } catch (error) {
                console.error("Error marking as read", error);
            }
        }

        if (notification.actionUrl) {
            if (notification.actionUrl.startsWith("/")) {
                router.push(notification.actionUrl as any);
            }
        } else {
            switch (notification.type) {
                case 'message':
                    router.push('/(tabs)/inbox');
                    break;
                case 'order':
                    break;
            }
        }
    };

    const getIcon = (type: string) => {
        const iconProps = { size: 24, color: COLORS.textPrimary };
        switch (type) {
            case 'message':
                return <MessageCircle {...iconProps} />;
            case 'order':
                return <Gift {...iconProps} />;
            case 'alert':
                return <AlertCircle {...iconProps} />;
            default:
                return <Bell {...iconProps} />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "JUST NOW";
        if (diffMins < 60) return `${diffMins}M AGO`;
        if (diffHours < 24) return `${diffHours}H AGO`;
        if (diffDays < 7) return `${diffDays}D AGO`;
        return date.toLocaleDateString().toUpperCase();
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            onPress={() => handleNotificationPress(item)}
            style={[
                styles.notificationItem,
                { backgroundColor: item.isRead ? COLORS.luxuryBlack : COLORS.luxuryBlackLight }
            ]}
        >
            <View style={styles.iconContainer}>
                {getIcon(item.type)}
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
            </View>
            {!item.isRead && (
                <View style={styles.unreadIndicator} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Notifications List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchNotifications(true)}
                            tintColor={COLORS.primaryGold}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Bell size={48} color={COLORS.textPrimary} />
                            </View>
                            <Text style={styles.emptyTitle}>NO NOTIFICATIONS</Text>
                            <Text style={styles.emptySubtitle}>You're all caught up!</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.luxuryBlack,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.darkBorder,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        backgroundColor: COLORS.cardBackground,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: -1,
    },
    placeholder: {
        width: 44,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: "700",
    },
    listContent: {
        paddingBottom: 40,
    },
    notificationItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.darkBorder,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
    },
    notificationMessage: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: "700",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    timeText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: "700",
    },
    unreadIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primaryGold,
        marginLeft: 12,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 16,
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.darkBorder,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 32,
    },
    emptyTitle: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: "900",
        marginBottom: 8,
        textAlign: "center",
    },
    emptySubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: "700",
        textTransform: "uppercase",
        textAlign: "center",
    },
});
