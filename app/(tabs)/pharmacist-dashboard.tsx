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
import DispensingHistory from '../../components/pharmacist/DispensingHistory';
import QRScanner from '../../components/pharmacist/QRScanner';
import AppointmentsView from '../../components/shared/AppointmentsView';
import { sessionService } from '../../src/services/sessionService';
import { storageService } from '../../src/services/storageService';
import { useFadeIn, useSlideInTop, useStaggerAnimation } from '../../utils/animations';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;
const isTablet = width >= 768;

interface DashboardStats {
  totalMedicines: number;
  lowStockItems: number;
  prescriptionsToday: number;
  pendingReorders: number;
}

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  stockLevel: number;
  reorderLevel: number;
  expiryDate: string;
  price: number;
  category: string;
}

interface Prescription {
  id: string;
  qrCode: string;
  patientName: string;
  patientNIC: string;
  doctorName: string;
  medications: Array<{
    name: string;
    dosage: string;
    quantity: number;
  }>;
  status: 'pending' | 'verified' | 'dispensed';
  issueDate: string;
}

interface StockAlert {
  id: string;
  medicineName: string;
  currentStock: number;
  reorderLevel: number;
  priority: 'low' | 'medium' | 'high';
}

export default function PharmacistDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pharmacistUser, setPharmacistUser] = useState<any>(null);
  const [activeNav, setActiveNav] = useState<'dashboard' | 'qr-scanner' | 'history' | 'appointments'>('dashboard');
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'prescriptions' | 'alerts'>('overview');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalMedicines: 1247,
    lowStockItems: 23,
    prescriptionsToday: 56,
    pendingReorders: 8
  });

  // Slow animations (600-1000ms)
  const headerAnim = useSlideInTop(0, -30);
  const stat1Anim = useStaggerAnimation(0, 150);
  const stat2Anim = useStaggerAnimation(1, 150);
  const stat3Anim = useStaggerAnimation(2, 150);
  const stat4Anim = useStaggerAnimation(3, 150);
  const contentAnim = useFadeIn(600, 800);

  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      id: '1',
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      stockLevel: 150,
      reorderLevel: 50,
      expiryDate: '2025-12-31',
      price: 250.00,
      category: 'Antibiotic'
    },
    {
      id: '2',
      name: 'Paracetamol 500mg',
      genericName: 'Acetaminophen',
      stockLevel: 35,
      reorderLevel: 100,
      expiryDate: '2025-08-15',
      price: 150.00,
      category: 'Analgesic'
    },
    {
      id: '3',
      name: 'Metformin 850mg',
      genericName: 'Metformin HCl',
      stockLevel: 200,
      reorderLevel: 75,
      expiryDate: '2026-03-20',
      price: 320.00,
      category: 'Antidiabetic'
    }
  ]);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: '1',
      qrCode: 'RX-2025-001',
      patientName: 'John Doe',
      patientNIC: '199512345678',
      doctorName: 'Dr. Sarah Johnson',
      medications: [
        { name: 'Amoxicillin 500mg', dosage: '500mg', quantity: 21 }
      ],
      status: 'pending',
      issueDate: '2025-11-27'
    },
    {
      id: '2',
      qrCode: 'RX-2025-002',
      patientName: 'Jane Smith',
      patientNIC: '199823456789',
      doctorName: 'Dr. Mike Wilson',
      medications: [
        { name: 'Metformin 850mg', dosage: '850mg', quantity: 60 }
      ],
      status: 'verified',
      issueDate: '2025-11-27'
    }
  ]);

  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([
    {
      id: '1',
      medicineName: 'Paracetamol 500mg',
      currentStock: 35,
      reorderLevel: 100,
      priority: 'high'
    },
    {
      id: '2',
      medicineName: 'Aspirin 100mg',
      currentStock: 55,
      reorderLevel: 80,
      priority: 'medium'
    }
  ]);

  const [showScanModal, setShowScanModal] = useState(false);
  const [showStockUpdateModal, setShowStockUpdateModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [stockUpdateValue, setStockUpdateValue] = useState('');

  useEffect(() => {
    loadPharmacistData();
  }, []);

  const loadPharmacistData = async () => {
    try {
      const user = await storageService.getUser();
      setPharmacistUser(user);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading pharmacist data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPharmacistData();
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
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleScanQR = () => {
    setActiveNav('qr-scanner');
  };

  const handleVerifyPrescription = (prescription: Prescription) => {
    Alert.alert(
      'Verify Prescription',
      `Verify prescription ${prescription.qrCode} for ${prescription.patientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          onPress: () => {
            setPrescriptions(prev => 
              prev.map(p => p.id === prescription.id ? { ...p, status: 'verified' as const } : p)
            );
            Alert.alert('Success', 'Prescription verified successfully!');
          }
        }
      ]
    );
  };

  const handleDispenseMedicine = (prescription: Prescription) => {
    Alert.alert(
      'Dispense Medicine',
      `Mark prescription ${prescription.qrCode} as dispensed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispense',
          onPress: () => {
            setPrescriptions(prev => 
              prev.map(p => p.id === prescription.id ? { ...p, status: 'dispensed' as const } : p)
            );
            Alert.alert('Success', 'Medicine dispensed successfully!');
          }
        }
      ]
    );
  };

  const handleUpdateStock = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setStockUpdateValue(medicine.stockLevel.toString());
    setShowStockUpdateModal(true);
  };

  const handleSaveStockUpdate = () => {
    if (!selectedMedicine) return;
    
    const newStock = parseInt(stockUpdateValue);
    if (isNaN(newStock) || newStock < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid stock quantity');
      return;
    }

    setMedicines(prev => 
      prev.map(m => m.id === selectedMedicine.id ? { ...m, stockLevel: newStock } : m)
    );
    
    Alert.alert('Success', 'Stock level updated successfully!');
    setShowStockUpdateModal(false);
    setSelectedMedicine(null);
    setStockUpdateValue('');
  };

  const handleReorderMedicine = (medicine: Medicine) => {
    Alert.alert(
      'Reorder Medicine',
      `Place reorder for ${medicine.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reorder',
          onPress: () => {
            Alert.alert('Success', 'Reorder request submitted successfully!');
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'verified': return '#3B82F6';
      case 'dispensed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderOverview = () => (
    <View>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Animated.View style={[styles.statCard, stat1Anim]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#3B82F615' }]}>
            <MaterialCommunityIcons name="pill" size={28} color="#3B82F6" />
          </View>
          <RNText style={styles.statValue}>{stats.totalMedicines}</RNText>
          <RNText style={styles.statLabel}>Total Medicines</RNText>
        </Animated.View>

        <Animated.View style={[styles.statCard, stat2Anim]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#EF444415' }]}>
            <MaterialCommunityIcons name="alert-circle" size={28} color="#EF4444" />
          </View>
          <RNText style={styles.statValue}>{stats.lowStockItems}</RNText>
          <RNText style={styles.statLabel}>Low Stock</RNText>
        </Animated.View>

        <Animated.View style={[styles.statCard, stat3Anim]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
            <MaterialCommunityIcons name="clipboard-text" size={28} color="#10B981" />
          </View>
          <RNText style={styles.statValue}>{stats.prescriptionsToday}</RNText>
          <RNText style={styles.statLabel}>Today's Rx</RNText>
        </Animated.View>

        <Animated.View style={[styles.statCard, stat4Anim]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B15' }]}>
            <MaterialCommunityIcons name="refresh-circle" size={28} color="#F59E0B" />
          </View>
          <RNText style={styles.statValue}>{stats.pendingReorders}</RNText>
          <RNText style={styles.statLabel}>Reorders</RNText>
        </Animated.View>
      </View>

      {/* Quick Actions */}
      <Animated.View style={[styles.section, contentAnim]}>
        <RNText style={styles.sectionTitle}>Quick Actions</RNText>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleScanQR}>
            <MaterialCommunityIcons name="qrcode-scan" size={32} color="#3B82F6" />
            <RNText style={styles.actionText}>Scan QR</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('inventory')}>
            <MaterialCommunityIcons name="package-variant" size={32} color="#10B981" />
            <RNText style={styles.actionText}>Inventory</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('prescriptions')}>
            <MaterialCommunityIcons name="file-document" size={32} color="#8B5CF6" />
            <RNText style={styles.actionText}>Prescriptions</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('alerts')}>
            <MaterialCommunityIcons name="bell-alert" size={32} color="#F59E0B" />
            <RNText style={styles.actionText}>Alerts</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveNav('history')}>
            <MaterialCommunityIcons name="history" size={32} color="#8B5CF6" />
            <RNText style={styles.actionText}>History</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveNav('appointments')}>
            <MaterialCommunityIcons name="calendar-check" size={32} color="#35c6eb" />
            <RNText style={styles.actionText}>Appointments</RNText>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Recent Stock Alerts */}
      <View style={styles.section}>
        <RNText style={styles.sectionTitle}>Recent Alerts</RNText>
        {stockAlerts.slice(0, 3).map(alert => (
          <View key={alert.id} style={styles.alertItem}>
            <View style={[styles.alertIndicator, { backgroundColor: getPriorityColor(alert.priority) }]} />
            <View style={styles.alertContent}>
              <RNText style={styles.alertMedicine}>{alert.medicineName}</RNText>
              <RNText style={styles.alertDetail}>
                Current: {alert.currentStock} | Reorder: {alert.reorderLevel}
              </RNText>
            </View>
            <TouchableOpacity 
              style={styles.alertButton}
              onPress={() => {
                const medicine = medicines.find(m => m.name === alert.medicineName);
                if (medicine) handleReorderMedicine(medicine);
              }}
            >
              <RNText style={styles.alertButtonText}>Reorder</RNText>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderInventory = () => (
    <View style={styles.section}>
      <RNText style={styles.sectionTitle}>Medicine Inventory</RNText>
      {medicines.map(medicine => (
        <View key={medicine.id} style={styles.inventoryCard}>
          <View style={styles.inventoryHeader}>
            <View style={styles.inventoryInfo}>
              <RNText style={styles.medicineName}>{medicine.name}</RNText>
              <RNText style={styles.medicineGeneric}>{medicine.genericName}</RNText>
              <View style={styles.medicineDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
                  <RNText style={styles.detailText}>Rs. {medicine.price.toFixed(2)}</RNText>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <RNText style={styles.detailText}>Exp: {medicine.expiryDate}</RNText>
                </View>
              </View>
            </View>
            <View style={styles.stockBadge}>
              <RNText style={styles.stockLevel}>{medicine.stockLevel}</RNText>
              <RNText style={styles.stockLabel}>in stock</RNText>
            </View>
          </View>
          
          <View style={styles.stockBar}>
            <View 
              style={[
                styles.stockProgress, 
                { 
                  width: `${Math.min((medicine.stockLevel / medicine.reorderLevel) * 100, 100)}%`,
                  backgroundColor: medicine.stockLevel < medicine.reorderLevel ? '#EF4444' : '#10B981'
                }
              ]} 
            />
          </View>
          
          <View style={styles.inventoryActions}>
            <TouchableOpacity 
              style={styles.inventoryButton}
              onPress={() => handleUpdateStock(medicine)}
            >
              <Ionicons name="create-outline" size={16} color="#3B82F6" />
              <RNText style={styles.inventoryButtonText}>Update Stock</RNText>
            </TouchableOpacity>
            
            {medicine.stockLevel < medicine.reorderLevel && (
              <TouchableOpacity 
                style={[styles.inventoryButton, styles.reorderButton]}
                onPress={() => handleReorderMedicine(medicine)}
              >
                <Ionicons name="refresh-outline" size={16} color="#F59E0B" />
                <RNText style={[styles.inventoryButtonText, { color: '#F59E0B' }]}>Reorder</RNText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderPrescriptions = () => (
    <View style={styles.section}>
      <RNText style={styles.sectionTitle}>Prescriptions</RNText>
      {prescriptions.map(prescription => (
        <View key={prescription.id} style={styles.prescriptionCard}>
          <View style={styles.prescriptionHeader}>
            <View>
              <RNText style={styles.prescriptionQR}>{prescription.qrCode}</RNText>
              <RNText style={styles.prescriptionPatient}>{prescription.patientName}</RNText>
              <RNText style={styles.prescriptionDoctor}>By {prescription.doctorName}</RNText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(prescription.status)}15` }]}>
              <RNText style={[styles.statusText, { color: getStatusColor(prescription.status) }]}>
                {prescription.status.toUpperCase()}
              </RNText>
            </View>
          </View>

          <View style={styles.medicationsList}>
            {prescription.medications.map((med, index) => (
              <View key={index} style={styles.medicationItem}>
                <MaterialCommunityIcons name="pill" size={16} color="#6B7280" />
                <RNText style={styles.medicationText}>
                  {med.name} - {med.dosage} × {med.quantity}
                </RNText>
              </View>
            ))}
          </View>

          <View style={styles.prescriptionActions}>
            {prescription.status === 'pending' && (
              <TouchableOpacity 
                style={[styles.prescriptionButton, styles.verifyButton]}
                onPress={() => handleVerifyPrescription(prescription)}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <RNText style={styles.prescriptionButtonText}>Verify</RNText>
              </TouchableOpacity>
            )}
            
            {prescription.status === 'verified' && (
              <TouchableOpacity 
                style={[styles.prescriptionButton, styles.dispenseButton]}
                onPress={() => handleDispenseMedicine(prescription)}
              >
                <Ionicons name="cube-outline" size={18} color="#fff" />
                <RNText style={styles.prescriptionButtonText}>Dispense</RNText>
              </TouchableOpacity>
            )}

            {prescription.status === 'dispensed' && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-done-circle" size={18} color="#10B981" />
                <RNText style={styles.completedText}>Completed</RNText>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderAlerts = () => (
    <View style={styles.section}>
      <RNText style={styles.sectionTitle}>Stock Alerts & Notifications</RNText>
      {stockAlerts.map(alert => (
        <View key={alert.id} style={styles.alertCard}>
          <View style={styles.alertCardHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(alert.priority)}15` }]}>
              <MaterialCommunityIcons 
                name="alert-circle" 
                size={20} 
                color={getPriorityColor(alert.priority)} 
              />
              <RNText style={[styles.priorityText, { color: getPriorityColor(alert.priority) }]}>
                {alert.priority.toUpperCase()}
              </RNText>
            </View>
          </View>

          <RNText style={styles.alertCardMedicine}>{alert.medicineName}</RNText>
          
          <View style={styles.alertCardStats}>
            <View style={styles.alertStat}>
              <RNText style={styles.alertStatLabel}>Current Stock</RNText>
              <RNText style={styles.alertStatValue}>{alert.currentStock}</RNText>
            </View>
            <View style={styles.alertStat}>
              <RNText style={styles.alertStatLabel}>Reorder Level</RNText>
              <RNText style={styles.alertStatValue}>{alert.reorderLevel}</RNText>
            </View>
            <View style={styles.alertStat}>
              <RNText style={styles.alertStatLabel}>Needed</RNText>
              <RNText style={[styles.alertStatValue, { color: '#EF4444' }]}>
                {alert.reorderLevel - alert.currentStock}
              </RNText>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.reorderActionButton}
            onPress={() => {
              const medicine = medicines.find(m => m.name === alert.medicineName);
              if (medicine) handleReorderMedicine(medicine);
            }}
          >
            <RNText style={styles.reorderActionText}>Place Reorder</RNText>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#35c6ebff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
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
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View>
              <RNText style={styles.greeting}>Welcome Back, Pharmacist</RNText>
              <RNText style={styles.userName}>{pharmacistUser?.fullName || 'Pharmacist'}</RNText>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'overview', label: 'Overview', icon: 'home-outline' },
              { key: 'inventory', label: 'Inventory', icon: 'cube-outline' },
              { key: 'prescriptions', label: 'Prescriptions', icon: 'document-text-outline' },
              { key: 'alerts', label: 'Alerts', icon: 'notifications-outline' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={20} 
                  color={activeTab === tab.key ? '#10B981' : '#6B7280'} 
                />
                <RNText style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive
                ]}>
                  {tab.label}
                </RNText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        {activeNav === 'qr-scanner' ? (
          <QRScanner />
        ) : activeNav === 'history' ? (
          <DispensingHistory />
        ) : activeNav === 'appointments' ? (
          <AppointmentsView userRole="pharmacist" userId={pharmacistUser?.id} />
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'inventory' && renderInventory()}
            {activeTab === 'prescriptions' && renderPrescriptions()}
            {activeTab === 'alerts' && renderAlerts()}
          </ScrollView>
        )}

        {/* QR Scan Modal */}
        <Modal visible={showScanModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.scanModal}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <RNText style={styles.scanText}>Scanning QR Code...</RNText>
            </View>
          </View>
        </Modal>

        {/* Stock Update Modal */}
        <Modal visible={showStockUpdateModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.updateModal}>
              <RNText style={styles.modalTitle}>Update Stock Level</RNText>
              {selectedMedicine && (
                <>
                  <RNText style={styles.modalMedicine}>{selectedMedicine.name}</RNText>
                  <RNText style={styles.modalLabel}>Current Stock: {selectedMedicine.stockLevel}</RNText>
                  
                  <TextInput
                    style={styles.input}
                    value={stockUpdateValue}
                    onChangeText={setStockUpdateValue}
                    placeholder="Enter new stock level"
                    keyboardType="numeric"
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setShowStockUpdateModal(false);
                        setSelectedMedicine(null);
                        setStockUpdateValue('');
                      }}
                    >
                      <RNText style={styles.cancelButtonText}>Cancel</RNText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={handleSaveStockUpdate}
                    >
                      <RNText style={styles.saveButtonText}>Save</RNText>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147, 197, 253, 0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  greeting: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  userName: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  tabActive: {
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#10B981',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
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
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
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
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  alertIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMedicine: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inventoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inventoryInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  medicineGeneric: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  medicineDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  stockBadge: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stockLevel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  stockLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  stockBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  stockProgress: {
    height: '100%',
    borderRadius: 3,
  },
  inventoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inventoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  reorderButton: {
    backgroundColor: '#FEF3C7',
  },
  inventoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  prescriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  prescriptionQR: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  prescriptionPatient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  prescriptionDoctor: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  medicationsList: {
    marginBottom: 12,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  medicationText: {
    fontSize: 14,
    color: '#374151',
  },
  prescriptionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  prescriptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  verifyButton: {
    backgroundColor: '#3B82F6',
  },
  dispenseButton: {
    backgroundColor: '#10B981',
  },
  prescriptionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  alertCardHeader: {
    marginBottom: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  alertCardMedicine: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  alertCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  alertStat: {
    alignItems: 'center',
  },
  alertStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  alertStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  reorderActionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  reorderActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  scanText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  updateModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalMedicine: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
