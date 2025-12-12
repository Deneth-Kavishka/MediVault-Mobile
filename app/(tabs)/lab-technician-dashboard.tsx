import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  RefreshControl,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated from 'react-native-reanimated';
import AssignedTests from '../../components/lab-technician/AssignedTests';
import FlagAbnormalResults from '../../components/lab-technician/FlagAbnormalResults';
import ManageNotifications from '../../components/lab-technician/ManageNotifications';
import TestHistory from '../../components/lab-technician/TestHistory';
import UploadResults from '../../components/lab-technician/UploadResults';
import AppointmentsView from '../../components/shared/AppointmentsView';
import { sessionService } from '../../src/services/sessionService';
import { storageService } from '../../src/services/storageService';
import { useFadeIn, useStaggerAnimation } from '../../utils/animations';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;
const isTablet = width >= 768;

interface LabTest {
  id: string;
  patientName: string;
  patientNIC: string;
  testType: string;
  testName: string;
  orderDate: string;
  sampleCollectionDate?: string;
  status: 'ordered' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  doctorName: string;
  results?: string;
  isAbnormal?: boolean;
}

interface DashboardStats {
  assignedTests: number;
  inProgressTests: number;
  completedToday: number;
  abnormalResults: number;
}

export default function LabTechnicianDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assigned' | 'completed' | 'history'>('overview');
  const [activeNav, setActiveNav] = useState<'dashboard' | 'assigned-tests' | 'upload-results' | 'flag-abnormal' | 'notifications' | 'history' | 'appointments'>('dashboard');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ordered' | 'in_progress' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'routine' | 'urgent' | 'stat'>('all');
  
  // Modals
  const [showTestDetailsModal, setShowTestDetailsModal] = useState(false);
  const [showUploadResultsModal, setShowUploadResultsModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  
  // Upload Results Form
  const [testResults, setTestResults] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [resultNotes, setResultNotes] = useState('');
  
  // Stats
  const [stats, setStats] = useState<DashboardStats>({
    assignedTests: 12,
    inProgressTests: 5,
    completedToday: 8,
    abnormalResults: 3,
  });

  // Slow animations (600-1000ms)
  // ANIMATIONS REMOVED FOR BETTER PERFORMANCE
  const stat1Anim = useStaggerAnimation(0, 150);
  const stat2Anim = useStaggerAnimation(1, 150);
  const stat3Anim = useStaggerAnimation(2, 150);
  const stat4Anim = useStaggerAnimation(3, 150);
  const contentAnim = useFadeIn(600, 800);

  // Sample Data
  const [labTests, setLabTests] = useState<LabTest[]>([
    {
      id: '1',
      patientName: 'John Doe',
      patientNIC: '123456789V',
      testType: 'Blood Test',
      testName: 'Complete Blood Count (CBC)',
      orderDate: '2024-11-30',
      status: 'ordered',
      priority: 'urgent',
      doctorName: 'Dr. Smith',
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      patientNIC: '987654321V',
      testType: 'Urine Test',
      testName: 'Urinalysis',
      orderDate: '2024-11-29',
      sampleCollectionDate: '2024-11-29',
      status: 'in_progress',
      priority: 'routine',
      doctorName: 'Dr. Johnson',
    },
    {
      id: '3',
      patientName: 'Mike Johnson',
      patientNIC: '456789123V',
      testType: 'Blood Test',
      testName: 'Lipid Profile',
      orderDate: '2024-11-28',
      sampleCollectionDate: '2024-11-28',
      status: 'completed',
      priority: 'routine',
      doctorName: 'Dr. Williams',
      results: 'Total Cholesterol: 220 mg/dL (High)',
      isAbnormal: true,
    },
    {
      id: '4',
      patientName: 'Sarah Brown',
      patientNIC: '789123456V',
      testType: 'Blood Test',
      testName: 'Blood Sugar (Fasting)',
      orderDate: '2024-11-30',
      status: 'ordered',
      priority: 'stat',
      doctorName: 'Dr. Davis',
    },
    {
      id: '5',
      patientName: 'Tom Wilson',
      patientNIC: '321654987V',
      testType: 'X-Ray',
      testName: 'Chest X-Ray',
      orderDate: '2024-11-29',
      sampleCollectionDate: '2024-11-29',
      status: 'completed',
      priority: 'urgent',
      doctorName: 'Dr. Martinez',
      results: 'No abnormalities detected',
      isAbnormal: false,
    },
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await storageService.getUser();
      setUserInfo(user);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionService.clearSession();
              router.replace('/(auth)/login' as any);
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewTest = (test: LabTest) => {
    setSelectedTest(test);
    setShowTestDetailsModal(true);
  };

  const handleStartTest = (test: LabTest) => {
    Alert.alert(
      'Start Test',
      `Start processing ${test.testName} for ${test.patientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            const updatedTests = labTests.map(t =>
              t.id === test.id
                ? { ...t, status: 'in_progress' as const, sampleCollectionDate: new Date().toISOString().split('T')[0] }
                : t
            );
            setLabTests(updatedTests);
            setStats({ ...stats, assignedTests: stats.assignedTests - 1, inProgressTests: stats.inProgressTests + 1 });
            Alert.alert('Success', 'Test started successfully');
          },
        },
      ]
    );
  };

  const handleUploadResults = (test: LabTest) => {
    setSelectedTest(test);
    setTestResults('');
    setIsAbnormal(false);
    setResultNotes('');
    setShowUploadResultsModal(true);
  };

  const saveTestResults = () => {
    if (!testResults.trim()) {
      Alert.alert('Error', 'Please enter test results');
      return;
    }

    const updatedTests = labTests.map(t =>
      t.id === selectedTest?.id
        ? {
            ...t,
            status: 'completed' as const,
            results: testResults,
            isAbnormal: isAbnormal,
          }
        : t
    );
    setLabTests(updatedTests);
    
    setStats({
      ...stats,
      inProgressTests: stats.inProgressTests - 1,
      completedToday: stats.completedToday + 1,
      abnormalResults: isAbnormal ? stats.abnormalResults + 1 : stats.abnormalResults,
    });

    // Notify doctor and patient
    Alert.alert(
      'Success',
      `Test results uploaded successfully.\n${isAbnormal ? 'Abnormal results flagged.' : ''}\nNotifications sent to doctor and patient.`
    );

    setShowUploadResultsModal(false);
    setSelectedTest(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return '#EF4444';
      case 'urgent':
        return '#F59E0B';
      case 'routine':
      default:
        return '#10B981';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#1E4BA3';
      case 'ordered':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const filteredTests = labTests.filter(test => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        test.patientName.toLowerCase().includes(query) ||
        test.patientNIC.toLowerCase().includes(query) ||
        test.testName.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filter by status
    if (filterStatus !== 'all' && test.status !== filterStatus) return false;

    // Filter by priority
    if (filterPriority !== 'all' && test.priority !== filterPriority) return false;

    return true;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E4BA3" />
      </View>
    );
  }

  const renderOverview = () => (
    <>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Animated.View style={[styles.statCard, styles.transparentCard, stat1Anim]}>
          <MaterialCommunityIcons name="test-tube" size={28} color="#1E4BA3" />
          <RNText style={styles.statNumberTransparent}>{stats.assignedTests}</RNText>
          <RNText style={styles.statLabelTransparent}>Assigned Tests</RNText>
        </Animated.View>

        <Animated.View style={[styles.statCard, styles.transparentCard, stat2Anim]}>
          <MaterialCommunityIcons name="progress-clock" size={28} color="#1E4BA3" />
          <RNText style={styles.statNumberTransparent}>{stats.inProgressTests}</RNText>
          <RNText style={styles.statLabelTransparent}>In Progress</RNText>
        </Animated.View>

        <Animated.View style={[styles.statCard, styles.transparentCard, stat3Anim]}>
          <MaterialCommunityIcons name="check-circle" size={28} color="#1E4BA3" />
          <RNText style={styles.statNumberTransparent}>{stats.completedToday}</RNText>
          <RNText style={styles.statLabelTransparent}>Completed Today</RNText>
        </Animated.View>

        <Animated.View style={[styles.statCard, styles.transparentCard, stat4Anim]}>
          <MaterialCommunityIcons name="alert-circle" size={28} color="#1E4BA3" />
          <RNText style={styles.statNumberTransparent}>{stats.abnormalResults}</RNText>
          <RNText style={styles.statLabelTransparent}>Abnormal Results</RNText>
        </Animated.View>
      </View>

      {/* Quick Actions */}
      <Animated.View style={[styles.section, contentAnim]}>
        <RNText style={styles.sectionTitle}>Quick Actions</RNText>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveNav('assigned-tests')}>
            <MaterialCommunityIcons name="clipboard-list" size={32} color="#1E4BA3" />
            <RNText style={styles.quickActionText}>Assigned Tests</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveNav('upload-results')}>
            <MaterialCommunityIcons name="upload" size={32} color="#1E4BA3" />
            <RNText style={styles.quickActionText}>Upload Results</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveNav('flag-abnormal')}>
            <MaterialCommunityIcons name="alert-circle" size={32} color="#1E4BA3" />
            <RNText style={styles.quickActionText}>Abnormal Results</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveNav('history')}>
            <MaterialCommunityIcons name="history" size={32} color="#1E4BA3" />
            <RNText style={styles.quickActionText}>Test History</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveNav('appointments')}>
            <MaterialCommunityIcons name="calendar-check" size={32} color="#1E4BA3" />
            <RNText style={styles.quickActionText}>Appointments</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveNav('notifications')}>
            <MaterialCommunityIcons name="bell-ring" size={32} color="#1E4BA3" />
            <RNText style={styles.quickActionText}>Notifications</RNText>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Urgent Tests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <RNText style={styles.sectionTitle}>Urgent & STAT Tests</RNText>
          <TouchableOpacity onPress={() => setActiveNav('assigned-tests')}>
            <RNText style={styles.viewAllText}>View All</RNText>
          </TouchableOpacity>
        </View>
        {labTests
          .filter(test => (test.priority === 'urgent' || test.priority === 'stat') && test.status !== 'completed')
          .slice(0, 3)
          .map(test => (
            <TouchableOpacity
              key={test.id}
              style={styles.testCard}
              onPress={() => handleViewTest(test)}
            >
              <View style={styles.testLeft}>
                <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(test.priority) }]} />
                <View style={styles.testInfo}>
                  <RNText style={styles.testName}>{test.testName}</RNText>
                  <RNText style={styles.testPatient}>{test.patientName} • {test.patientNIC}</RNText>
                  <View style={styles.testMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(test.status) }]}>
                      <RNText style={styles.statusText}>{test.status.replace('_', ' ').toUpperCase()}</RNText>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(test.priority) }]}>
                      <RNText style={styles.priorityText}>{test.priority.toUpperCase()}</RNText>
                    </View>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
      </View>
    </>
  );

  const renderTestsList = () => (
    <View style={styles.section}>
      {/* Search & Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name, NIC, or test..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'ordered', 'in_progress', 'completed'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
              onPress={() => setFilterStatus(status as any)}
            >
              <RNText style={[styles.filterText, filterStatus === status && styles.filterTextActive]}>
                {status.replace('_', ' ').toUpperCase()}
              </RNText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Priority Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'stat', 'urgent', 'routine'].map(priority => (
            <TouchableOpacity
              key={priority}
              style={[styles.filterButton, filterPriority === priority && styles.filterButtonActive]}
              onPress={() => setFilterPriority(priority as any)}
            >
              <RNText style={[styles.filterText, filterPriority === priority && styles.filterTextActive]}>
                {priority.toUpperCase()}
              </RNText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tests List */}
      {filteredTests.length > 0 ? (
        filteredTests.map(test => (
          <TouchableOpacity
            key={test.id}
            style={styles.testCard}
            onPress={() => handleViewTest(test)}
          >
            <View style={styles.testLeft}>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(test.priority) }]} />
              <View style={styles.testInfo}>
                <RNText style={styles.testName}>{test.testName}</RNText>
                <RNText style={styles.testPatient}>{test.patientName} • {test.patientNIC}</RNText>
                <RNText style={styles.testDetails}>
                  Ordered: {test.orderDate} • Dr. {test.doctorName}
                </RNText>
                <View style={styles.testMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(test.status) }]}>
                    <RNText style={styles.statusText}>{test.status.replace('_', ' ').toUpperCase()}</RNText>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(test.priority) }]}>
                    <RNText style={styles.priorityText}>{test.priority.toUpperCase()}</RNText>
                  </View>
                  {test.isAbnormal && (
                    <View style={styles.abnormalBadge}>
                      <MaterialCommunityIcons name="alert" size={14} color="#fff" />
                      <RNText style={styles.abnormalText}>ABNORMAL</RNText>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="test-tube-empty" size={64} color="#9CA3AF" />
          <RNText style={styles.emptyText}>No tests found</RNText>
          <RNText style={styles.emptySubtext}>Try adjusting your filters</RNText>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ImageBackground
        source={require('../../assets/images/Background-image.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {/* Header - Animation removed for performance */}
        <View style={styles.header}>
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
              <RNText style={styles.greeting}>Welcome Back, Lab Technician</RNText>
              <RNText style={styles.userName}>{userInfo?.fullName || 'Lab Technician'}</RNText>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

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
                color={activeNav === 'dashboard' ? '#1E4BA3' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'dashboard' && styles.navTextActive]}>Dashboard</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'assigned-tests' && styles.navItemActive]}
              onPress={() => setActiveNav('assigned-tests')}
            >
              <MaterialCommunityIcons 
                name="clipboard-list" 
                size={20} 
                color={activeNav === 'assigned-tests' ? '#1E4BA3' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'assigned-tests' && styles.navTextActive]}>Assigned Tests</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'upload-results' && styles.navItemActive]}
              onPress={() => setActiveNav('upload-results')}
            >
              <MaterialCommunityIcons 
                name="cloud-upload" 
                size={20} 
                color={activeNav === 'upload-results' ? '#1E4BA3' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'upload-results' && styles.navTextActive]}>Upload Results</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'flag-abnormal' && styles.navItemActive]}
              onPress={() => setActiveNav('flag-abnormal')}
            >
              <MaterialCommunityIcons 
                name="alert-circle" 
                size={20} 
                color={activeNav === 'flag-abnormal' ? '#1E4BA3' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'flag-abnormal' && styles.navTextActive]}>Abnormal Results</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'notifications' && styles.navItemActive]}
              onPress={() => setActiveNav('notifications')}
            >
              <Ionicons 
                name="notifications-outline" 
                size={20} 
                color={activeNav === 'notifications' ? '#1E4BA3' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'notifications' && styles.navTextActive]}>Notifications</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'history' && styles.navItemActive]}
              onPress={() => setActiveNav('history')}
            >
              <MaterialCommunityIcons 
                name="history" 
                size={20} 
                color={activeNav === 'history' ? '#1E4BA3' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'history' && styles.navTextActive]}>Test History</RNText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeNav === 'appointments' && styles.navItemActive]}
              onPress={() => setActiveNav('appointments')}
            >
              <MaterialCommunityIcons 
                name="calendar-check" 
                size={20} 
                color={activeNav === 'appointments' ? '#1E4BA3' : '#6B7280'} 
              />
              <RNText style={[styles.navText, activeNav === 'appointments' && styles.navTextActive]}>Appointments</RNText>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Content */}
        {activeNav === 'dashboard' && (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {renderOverview()}
          </ScrollView>
        )}
        {activeNav === 'assigned-tests' && <AssignedTests />}
        {activeNav === 'upload-results' && <UploadResults />}
        {activeNav === 'flag-abnormal' && <FlagAbnormalResults />}
        {activeNav === 'notifications' && <ManageNotifications />}
        {activeNav === 'history' && <TestHistory />}
        {activeNav === 'appointments' && <AppointmentsView userRole="lab_technician" userId={userInfo?.id} />}

        {/* Test Details Modal */}
        <Modal visible={showTestDetailsModal} animationType="slide" transparent onRequestClose={() => setShowTestDetailsModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <RNText style={styles.modalTitle}>Test Details</RNText>
                <TouchableOpacity onPress={() => setShowTestDetailsModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {selectedTest && (
                  <>
                    <View style={styles.detailRow}>
                      <RNText style={styles.detailLabel}>Test Name</RNText>
                      <RNText style={styles.detailValue}>{selectedTest.testName}</RNText>
                    </View>

                    <View style={styles.detailRow}>
                      <RNText style={styles.detailLabel}>Test Type</RNText>
                      <RNText style={styles.detailValue}>{selectedTest.testType}</RNText>
                    </View>

                    <View style={styles.detailRow}>
                      <RNText style={styles.detailLabel}>Patient Name</RNText>
                      <RNText style={styles.detailValue}>{selectedTest.patientName}</RNText>
                    </View>

                    <View style={styles.detailRow}>
                      <RNText style={styles.detailLabel}>Patient NIC</RNText>
                      <RNText style={styles.detailValue}>{selectedTest.patientNIC}</RNText>
                    </View>

                    <View style={styles.detailRow}>
                      <RNText style={styles.detailLabel}>Ordering Doctor</RNText>
                      <RNText style={styles.detailValue}>Dr. {selectedTest.doctorName}</RNText>
                    </View>

                    <View style={styles.detailRow}>
                      <RNText style={styles.detailLabel}>Order Date</RNText>
                      <RNText style={styles.detailValue}>{selectedTest.orderDate}</RNText>
                    </View>

                    {selectedTest.sampleCollectionDate && (
                      <View style={styles.detailRow}>
                        <RNText style={styles.detailLabel}>Sample Collection</RNText>
                        <RNText style={styles.detailValue}>{selectedTest.sampleCollectionDate}</RNText>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <RNText style={styles.detailLabel}>Priority</RNText>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTest.priority) }]}>
                        <RNText style={styles.priorityText}>{selectedTest.priority.toUpperCase()}</RNText>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <RNText style={styles.detailLabel}>Status</RNText>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTest.status) }]}>
                        <RNText style={styles.statusText}>{selectedTest.status.replace('_', ' ').toUpperCase()}</RNText>
                      </View>
                    </View>

                    {selectedTest.results && (
                      <View style={styles.detailRow}>
                        <RNText style={styles.detailLabel}>Results</RNText>
                        <RNText style={styles.detailValue}>{selectedTest.results}</RNText>
                      </View>
                    )}

                    {selectedTest.isAbnormal !== undefined && (
                      <View style={styles.detailRow}>
                        <RNText style={styles.detailLabel}>Result Status</RNText>
                        <View style={[styles.abnormalBadge, { backgroundColor: selectedTest.isAbnormal ? '#EF4444' : '#10B981' }]}>
                          <RNText style={styles.abnormalText}>{selectedTest.isAbnormal ? 'ABNORMAL' : 'NORMAL'}</RNText>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                {selectedTest?.status === 'ordered' && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.startButton]}
                    onPress={() => {
                      setShowTestDetailsModal(false);
                      handleStartTest(selectedTest);
                    }}
                  >
                    <MaterialCommunityIcons name="play" size={20} color="#fff" />
                    <RNText style={styles.modalButtonText}>Start Test</RNText>
                  </TouchableOpacity>
                )}

                {selectedTest?.status === 'in_progress' && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.uploadButton]}
                    onPress={() => {
                      setShowTestDetailsModal(false);
                      handleUploadResults(selectedTest);
                    }}
                  >
                    <MaterialCommunityIcons name="upload" size={20} color="#fff" />
                    <RNText style={styles.modalButtonText}>Upload Results</RNText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowTestDetailsModal(false)}
                >
                  <RNText style={styles.cancelButtonText}>Close</RNText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Upload Results Modal */}
        <Modal visible={showUploadResultsModal} animationType="slide" transparent onRequestClose={() => setShowUploadResultsModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <RNText style={styles.modalTitle}>Upload Test Results</RNText>
                <TouchableOpacity onPress={() => setShowUploadResultsModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {selectedTest && (
                  <>
                    <View style={styles.testInfoCard}>
                      <RNText style={styles.testInfoTitle}>{selectedTest.testName}</RNText>
                      <RNText style={styles.testInfoText}>{selectedTest.patientName} • {selectedTest.patientNIC}</RNText>
                    </View>

                    <View style={styles.formGroup}>
                      <RNText style={styles.formLabel}>Test Results *</RNText>
                      <TextInput
                        style={[styles.formInput, styles.formTextArea]}
                        placeholder="Enter detailed test results..."
                        placeholderTextColor="#9CA3AF"
                        value={testResults}
                        onChangeText={setTestResults}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setIsAbnormal(!isAbnormal)}
                      >
                        <View style={[styles.checkbox, isAbnormal && styles.checkboxChecked]}>
                          {isAbnormal && <Ionicons name="checkmark" size={18} color="#fff" />}
                        </View>
                        <RNText style={styles.checkboxLabel}>Flag as Abnormal Result</RNText>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                      <RNText style={styles.formLabel}>Additional Notes</RNText>
                      <TextInput
                        style={[styles.formInput, styles.formTextArea]}
                        placeholder="Enter any additional notes or observations..."
                        placeholderTextColor="#9CA3AF"
                        value={resultNotes}
                        onChangeText={setResultNotes}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>

                    {isAbnormal && (
                      <View style={styles.warningCard}>
                        <MaterialCommunityIcons name="alert" size={24} color="#F59E0B" />
                        <RNText style={styles.warningText}>
                          This result will be flagged as abnormal. Doctor and patient will be notified immediately.
                        </RNText>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.uploadButton]}
                  onPress={saveTestResults}
                >
                  <MaterialCommunityIcons name="upload" size={20} color="#fff" />
                  <RNText style={styles.modalButtonText}>Upload & Notify</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowUploadResultsModal(false)}
                >
                  <RNText style={styles.cancelButtonText}>Cancel</RNText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(98, 216, 245, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    backgroundColor: '#1E4BA3',
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
  technicianName: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  navContainer: {
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.95)',
      android: '#FFFFFF',
      default: '#FFFFFF',
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
    backgroundColor: '#1E4BA315',
    borderWidth: 1,
    borderColor: '#1E4BA3',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  navTextActive: {
    color: '#1E4BA3',
    fontWeight: '600',
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    gap: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(30, 75, 163, 0.15)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1E4BA3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isSmallScreen ? 12 : 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: isSmallScreen ? '47%' : '47%',
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: isSmallScreen ? 16 : 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transparentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(30, 75, 163, 0.4)',
  },
  statNumberTransparent: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '700',
    color: '#1E4BA3',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabelTransparent: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#1E4BA3',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: isSmallScreen ? '30%' : '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  testCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  testLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    minHeight: 60,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  testPatient: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  testDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  testMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  abnormalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  abnormalText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1E4BA3',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  testInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  testInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  testInfoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formTextArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1E4BA3',
    borderColor: '#1E4BA3',
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  modalActions: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  startButton: {
    backgroundColor: '#1E4BA3',
  },
  uploadButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

