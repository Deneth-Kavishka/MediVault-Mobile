import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Platform,
  RefreshControl,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated from 'react-native-reanimated';
import AdminDoctors from '../../components/admin/AdminDoctors';
import AdminMessages from '../../components/admin/AdminMessages';
import AdminNotifications from '../../components/admin/AdminNotifications';
import AdminPatients from '../../components/admin/AdminPatients';
import AdminReports from '../../components/admin/AdminReports';
import AdminSettings from '../../components/admin/AdminSettings';
import AdminUserManagement from '../../components/admin/AdminUserManagement';
import AppointmentsView from '../../components/shared/AppointmentsView';
import { sessionService } from '../../src/services/sessionService';
import { storageService } from '../../src/services/storageService';
import { useFadeIn, useSlideInTop, useStaggerAnimation } from '../../utils/animations';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;
const isTablet = width >= 768;

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  activeSessions: number;
  pendingApprovals: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
  icon: string;
  color: string;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 10547,
    totalDoctors: 523,
    totalPatients: 9824,
    totalAppointments: 1247,
    activeSessions: 342,
    pendingApprovals: 15
  });

  // Slow animations (600-1000ms)
  const headerAnim = useSlideInTop(0, -30);
  const stat1Anim = useStaggerAnimation(0, 150);
  const stat2Anim = useStaggerAnimation(1, 150);
  const stat3Anim = useStaggerAnimation(2, 150);
  const stat4Anim = useStaggerAnimation(3, 150);
  const stat5Anim = useStaggerAnimation(4, 150);
  const stat6Anim = useStaggerAnimation(5, 150);
  const quickActionsAnim = useFadeIn(900, 800);
  const activitiesAnim = useFadeIn(1100, 800);

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'user_registration',
      description: 'New doctor registered - Dr. Sarah Johnson',
      time: '5 minutes ago',
      icon: 'account-plus',
      color: '#10B981'
    },
    {
      id: '2',
      type: 'appointment',
      description: 'New appointment scheduled',
      time: '12 minutes ago',
      icon: 'calendar-check',
      color: '#3B82F6'
    },
    {
      id: '3',
      type: 'system',
      description: 'System backup completed successfully',
      time: '1 hour ago',
      icon: 'cloud-check',
      color: '#8B5CF6'
    },
    {
      id: '4',
      type: 'approval',
      description: 'Pending doctor verification - Dr. Mike Wilson',
      time: '2 hours ago',
      icon: 'alert-circle',
      color: '#F59E0B'
    }
  ]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const user = await storageService.getUser();
      setAdminUser(user);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await sessionService.clearSession();
          router.replace('/(auth)/landing-page' as any);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#35c6ebff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/images/Background-image.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay} />

        {/* Header */}
        <Animated.View style={[styles.header, headerAnim]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={async () => {
                await sessionService.clearSession();
                router.replace('/(auth)/login' as any);
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <RNText style={styles.greeting}>Welcome Back, Admin</RNText>
              <RNText style={styles.userName}>{adminUser?.fullName || 'Administrator'}</RNText>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Navigation Bar */}
        <View style={styles.navContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navScrollContent}
          >
            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'dashboard' && styles.navItemActive]}
              onPress={() => setActiveNav('dashboard')}
            >
              <MaterialCommunityIcons 
                name="view-dashboard" 
                size={20} 
                color={activeNav === 'dashboard' ? '#35c6eb' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'dashboard' && styles.navTextActive]}>Dashboard</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'messages' && styles.navItemActive]}
              onPress={() => setActiveNav('messages')}
            >
              <Ionicons 
                name="chatbubbles-outline" 
                size={20} 
                color={activeNav === 'messages' ? '#35c6eb' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'messages' && styles.navTextActive]}>Messages</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'notifications' && styles.navItemActive]}
              onPress={() => setActiveNav('notifications')}
            >
              <Ionicons 
                name="notifications-outline" 
                size={20} 
                color={activeNav === 'notifications' ? '#35c6eb' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'notifications' && styles.navTextActive]}>Notifications</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'users' && styles.navItemActive]}
              onPress={() => setActiveNav('users')}
            >
              <MaterialCommunityIcons 
                name="account-cog" 
                size={20} 
                color={activeNav === 'users' ? '#35c6eb' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'users' && styles.navTextActive]}>User Management</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'patients' && styles.navItemActive]}
              onPress={() => setActiveNav('patients')}
            >
              <MaterialCommunityIcons 
                name="account-heart" 
                size={20} 
                color={activeNav === 'patients' ? '#35c6eb' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'patients' && styles.navTextActive]}>Patients</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'doctors' && styles.navItemActive]}
              onPress={() => setActiveNav('doctors')}
            >
              <MaterialCommunityIcons 
                name="doctor" 
                size={20} 
                color={activeNav === 'doctors' ? '#35c6eb' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'doctors' && styles.navTextActive]}>Doctors</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'appointments' && styles.navItemActive]}
              onPress={() => setActiveNav('appointments')}
            >
              <MaterialCommunityIcons 
                name="calendar-clock" 
                size={20} 
                color={activeNav === 'appointments' ? '#35c6eb' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'appointments' && styles.navTextActive]}>Appointments</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'reports' && styles.navItemActive]}
              onPress={() => setActiveNav('reports')}
            >
              <MaterialCommunityIcons 
                name="file-chart" 
                size={20} 
                color={activeNav === 'reports' ? '#35c6eb' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'reports' && styles.navTextActive]}>Reports</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'settings' && styles.navItemActive]}
              onPress={() => setActiveNav('settings')}
            >
              <Ionicons 
                name="settings-outline" 
                size={20} 
                color={activeNav === 'settings' ? '#35c6eb' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'settings' && styles.navTextActive]}>System Settings</RNText>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {activeNav === 'appointments' ? (
          <AppointmentsView userRole="admin" userId={adminUser?.id} />
        ) : activeNav === 'messages' ? (
          <AdminMessages />
        ) : activeNav === 'notifications' ? (
          <AdminNotifications />
        ) : activeNav === 'users' ? (
          <AdminUserManagement />
        ) : activeNav === 'patients' ? (
          <AdminPatients />
        ) : activeNav === 'doctors' ? (
          <AdminDoctors />
        ) : activeNav === 'reports' ? (
          <AdminReports />
        ) : activeNav === 'settings' ? (
          <AdminSettings />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Quick Stats Grid */}
            <View style={styles.section}>
            <RNText style={styles.sectionTitle}>Dashboard Overview</RNText>
            <View style={styles.statsGrid}>
              <Animated.View style={[styles.statCard, stat1Anim]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#3B82F615' }]}>
                  <MaterialCommunityIcons name="account-group" size={28} color="#3B82F6" />
                </View>
                <RNText style={styles.statValue}>{stats.totalUsers.toLocaleString()}</RNText>
                <RNText style={styles.statLabel}>Total Users</RNText>
              </Animated.View>

              <Animated.View style={[styles.statCard, stat2Anim]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
                  <MaterialCommunityIcons name="doctor" size={28} color="#10B981" />
                </View>
                <RNText style={styles.statValue}>{stats.totalDoctors}</RNText>
                <RNText style={styles.statLabel}>Doctors</RNText>
              </Animated.View>

              <Animated.View style={[styles.statCard, stat3Anim]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF615' }]}>
                  <MaterialCommunityIcons name="account-heart" size={28} color="#8B5CF6" />
                </View>
                <RNText style={styles.statValue}>{stats.totalPatients.toLocaleString()}</RNText>
                <RNText style={styles.statLabel}>Patients</RNText>
              </Animated.View>

              <Animated.View style={[styles.statCard, stat4Anim]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
                  <MaterialCommunityIcons name="calendar-clock" size={28} color="#F59E0B" />
                </View>
                <RNText style={styles.statValue}>{stats.totalAppointments.toLocaleString()}</RNText>
                <RNText style={styles.statLabel}>Appointments</RNText>
              </Animated.View>
            </View>
          </View>

          {/* System Status */}
          <Animated.View style={[styles.section, stat5Anim]}>
            <View style={styles.systemStatusCard}>
              <View style={styles.systemStatusHeader}>
                <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
                <RNText style={styles.systemStatusTitle}>System Status</RNText>
              </View>
              <View style={styles.systemStatusRow}>
                <RNText style={styles.systemStatusLabel}>Active Sessions</RNText>
                <RNText style={styles.systemStatusValue}>{stats.activeSessions}</RNText>
              </View>
              <View style={styles.systemStatusRow}>
                <RNText style={styles.systemStatusLabel}>Pending Approvals</RNText>
                <View style={styles.pendingBadge}>
                  <RNText style={styles.pendingBadgeText}>{stats.pendingApprovals}</RNText>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View style={[styles.section, quickActionsAnim]}>
            <RNText style={styles.sectionTitle}>Quick Actions</RNText>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <MaterialCommunityIcons name="account-plus" size={32} color="#3B82F6" />
                <RNText style={styles.actionText}>Add User</RNText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <MaterialCommunityIcons name="doctor" size={32} color="#10B981" />
                <RNText style={styles.actionText}>Manage Doctors</RNText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <MaterialCommunityIcons name="file-document" size={32} color="#8B5CF6" />
                <RNText style={styles.actionText}>Reports</RNText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <MaterialCommunityIcons name="cog" size={32} color="#F59E0B" />
                <RNText style={styles.actionText}>Settings</RNText>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Recent Activity */}
          <Animated.View style={[styles.section, activitiesAnim]}>
            <RNText style={styles.sectionTitle}>Recent Activity</RNText>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                  <MaterialCommunityIcons name={activity.icon as any} size={20} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <RNText style={styles.activityDescription}>{activity.description}</RNText>
                  <RNText style={styles.activityTime}>{activity.time}</RNText>
                </View>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147, 197, 253, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(53, 198, 235, 0.95)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginTop: 4,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navContainer: {
    backgroundColor: '#fff',
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
  navScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginRight: 8,
    gap: 8,
  },
  navItemActive: {
    backgroundColor: '#35c6eb15',
    borderWidth: 1,
    borderColor: '#35c6eb',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  navTextActive: {
    color: '#35c6eb',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  systemStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  systemStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  systemStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  systemStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  systemStatusLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  systemStatusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});
