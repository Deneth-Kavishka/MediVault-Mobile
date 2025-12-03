import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

interface Notification {
  id: string;
  type: 'appointment' | 'user' | 'system' | 'alert' | 'payment' | 'message';
  title: string;
  description: string;
  time: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
}

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'alert',
      title: 'System Alert',
      description: 'Database backup completed successfully',
      time: '5 min ago',
      read: false,
      priority: 'high',
      icon: 'alert-circle',
      color: '#FF3B30'
    },
    {
      id: '2',
      type: 'user',
      title: 'New User Registration',
      description: 'Dr. Sarah Johnson has registered as a new doctor',
      time: '15 min ago',
      read: false,
      priority: 'medium',
      icon: 'person-add',
      color: '#007AFF'
    },
    {
      id: '3',
      type: 'appointment',
      title: 'Appointment Scheduled',
      description: '12 new appointments scheduled for today',
      time: '1 hour ago',
      read: true,
      priority: 'medium',
      icon: 'calendar',
      color: '#34C759'
    },
    {
      id: '4',
      type: 'system',
      title: 'System Update Available',
      description: 'Version 2.6.0 is available for update',
      time: '2 hours ago',
      read: false,
      priority: 'low',
      icon: 'download',
      color: '#5856D6'
    },
    {
      id: '5',
      type: 'payment',
      title: 'Payment Received',
      description: 'Payment of $2,450 received from patient ID #1523',
      time: '3 hours ago',
      read: true,
      priority: 'medium',
      icon: 'cash',
      color: '#10B981'
    },
    {
      id: '6',
      type: 'message',
      title: 'New Message',
      description: 'You have 5 unread messages from doctors',
      time: '4 hours ago',
      read: false,
      priority: 'medium',
      icon: 'mail',
      color: '#FF9500'
    },
    {
      id: '7',
      type: 'alert',
      title: 'Security Alert',
      description: 'Multiple failed login attempts detected',
      time: '5 hours ago',
      read: true,
      priority: 'high',
      icon: 'shield-checkmark',
      color: '#FF3B30'
    },
    {
      id: '8',
      type: 'user',
      title: 'User Account Deactivated',
      description: 'Patient account #2341 has been deactivated',
      time: '6 hours ago',
      read: true,
      priority: 'low',
      icon: 'person-remove',
      color: '#6B7280'
    },
    {
      id: '9',
      type: 'appointment',
      title: 'Appointment Cancelled',
      description: '3 appointments cancelled for Dr. Smith',
      time: '8 hours ago',
      read: true,
      priority: 'medium',
      icon: 'close-circle',
      color: '#FF9500'
    },
    {
      id: '10',
      type: 'system',
      title: 'Maintenance Scheduled',
      description: 'System maintenance scheduled for Dec 15, 2025',
      time: '1 day ago',
      read: true,
      priority: 'low',
      icon: 'construct',
      color: '#8B5CF6'
    },
    {
      id: '11',
      type: 'payment',
      title: 'Payment Failed',
      description: 'Payment transaction failed for invoice #INV-2024',
      time: '1 day ago',
      read: false,
      priority: 'high',
      icon: 'card',
      color: '#FF3B30'
    },
    {
      id: '12',
      type: 'user',
      title: 'Doctor Verification Pending',
      description: 'Dr. Michael Chen awaiting profile verification',
      time: '2 days ago',
      read: true,
      priority: 'medium',
      icon: 'checkmark-circle',
      color: '#FF9500'
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'unread') return !notif.read;
    if (activeTab === 'system') return notif.type === 'system' || notif.type === 'alert';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const systemCount = notifications.filter(n => n.type === 'system' || n.type === 'alert').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <RNText style={styles.headerTitle}>Notifications</RNText>
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={20} color="#007AFF" />
            <RNText style={styles.markAllText}>Mark All Read</RNText>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <RNText style={styles.statValue}>{notifications.length}</RNText>
            <RNText style={styles.statLabel}>Total</RNText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <RNText style={[styles.statValue, { color: '#FF3B30' }]}>{unreadCount}</RNText>
            <RNText style={styles.statLabel}>Unread</RNText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <RNText style={[styles.statValue, { color: '#5856D6' }]}>{systemCount}</RNText>
            <RNText style={styles.statLabel}>System</RNText>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <RNText style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All ({notifications.length})
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
            onPress={() => setActiveTab('unread')}
          >
            <RNText style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
              Unread ({unreadCount})
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'system' && styles.tabActive]}
            onPress={() => setActiveTab('system')}
          >
            <RNText style={[styles.tabText, activeTab === 'system' && styles.tabTextActive]}>
              System ({systemCount})
            </RNText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off" size={64} color="#9CA3AF" />
            <RNText style={styles.emptyTitle}>No Notifications</RNText>
            <RNText style={styles.emptyText}>
              {activeTab === 'unread'
                ? "You're all caught up! No unread notifications."
                : activeTab === 'system'
                ? 'No system notifications at this time.'
                : 'No notifications to display.'}
            </RNText>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationUnread
                ]}
                onPress={() => !notification.read && markAsRead(notification.id)}
              >
                <View style={styles.notificationContent}>
                  <View style={[styles.notificationIcon, { backgroundColor: `${notification.color}15` }]}>
                    <Ionicons name={notification.icon as any} size={24} color={notification.color} />
                  </View>

                  <View style={styles.notificationBody}>
                    <View style={styles.notificationHeader}>
                      <RNText style={styles.notificationTitle}>{notification.title}</RNText>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <RNText style={styles.notificationDescription} numberOfLines={2}>
                      {notification.description}
                    </RNText>
                    <View style={styles.notificationFooter}>
                      <View style={styles.notificationMeta}>
                        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                        <RNText style={styles.notificationTime}>{notification.time}</RNText>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(notification.priority)}15` }]}>
                        <RNText style={[styles.priorityText, { color: getPriorityColor(notification.priority) }]}>
                          {notification.priority.toUpperCase()}
                        </RNText>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.notificationActions}>
                  {!notification.read && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => markAsRead(notification.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteNotification(notification.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#007AFF15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  notificationDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
