import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Bell, X, Check, CheckCheck } from 'lucide-react-native';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../lib/api/services/notifications';
import { COLORS } from '@/constants/colors';

interface NotificationBellProps {
  userId: string | undefined;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(userId);

  const handleBellPress = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    await markAsRead(notificationId);
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleDelete = useCallback(async (notificationId: string) => {
    await deleteNotification(notificationId);
  }, [deleteNotification]);

  const renderNotification = useCallback(({ item }: { item: Notification }) => (
    <View style={[styles.notificationItem, !item.isRead && styles.unreadItem]}>
      <View style={styles.notificationContent}>
        {item.title && (
          <Text style={[styles.notificationTitle, !item.isRead && styles.unreadText]}>
            {item.title}
          </Text>
        )}
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.createdAt).toLocaleDateString()} {' '}
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.notificationActions}>
        {!item.isRead && (
          <TouchableOpacity
            onPress={() => handleMarkAsRead(item.id)}
            style={styles.actionButton}
          >
            <Check size={20} color={COLORS.primaryGold} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.actionButton}
        >
          <X size={20} color={COLORS.errorRed} />
        </TouchableOpacity>
      </View>
    </View>
  ), [handleMarkAsRead, handleDelete]);

  // Separate unread and read notifications
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);
  const recentReadNotifications = readNotifications.slice(0, 10); // Show last 10 read

  return (
    <>
      {/* Bell Icon with Badge */}
      <TouchableOpacity onPress={handleBellPress} style={styles.bellContainer}>
        <Bell size={24} color={COLORS.textPrimary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={handleMarkAllAsRead}
                    style={styles.markAllButton}
                  >
                    <CheckCheck size={20} color="#6366f1" />
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <X size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Unread Section */}
            {unreadNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Unread ({unreadNotifications.length})
                </Text>
                <FlatList
                  data={unreadNotifications}
                  renderItem={renderNotification}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Recent Read Section */}
            {recentReadNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent</Text>
                <FlatList
                  data={recentReadNotifications}
                  renderItem={renderNotification}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Empty State */}
            {notifications.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Bell size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.liveIndicator,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayMedium,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.luxuryBlack,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    padding: 4,
  },
  markAllText: {
    marginLeft: 4,
    color: COLORS.primaryGold,
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
    backgroundColor: COLORS.luxuryBlack,
  },
  unreadItem: {
    backgroundColor: 'rgba(244, 197, 66, 0.1)',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  unreadText: {
    color: COLORS.textPrimary,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
  },
});

export default NotificationBell;
