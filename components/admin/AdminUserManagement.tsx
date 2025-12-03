import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ImageBackground,
    Modal,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'admin' | 'doctor' | 'patient' | 'pharmacist' | 'lab_technician';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  specialization?: string;
}

export default function AdminUserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'patient' as User['role'],
    specialization: '',
    password: '',
  });

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      fullName: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@medivault.com',
      phone: '+1 234-567-8901',
      role: 'doctor',
      status: 'active',
      createdAt: '2024-01-15',
      specialization: 'Cardiologist'
    },
    {
      id: '2',
      fullName: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 234-567-8902',
      role: 'patient',
      status: 'active',
      createdAt: '2024-02-20'
    },
    {
      id: '3',
      fullName: 'Dr. Michael Chen',
      email: 'michael.chen@medivault.com',
      phone: '+1 234-567-8903',
      role: 'doctor',
      status: 'active',
      createdAt: '2024-01-10',
      specialization: 'Neurologist'
    },
    {
      id: '4',
      fullName: 'Emily Wilson',
      email: 'emily.wilson@email.com',
      phone: '+1 234-567-8904',
      role: 'patient',
      status: 'inactive',
      createdAt: '2024-03-05'
    },
    {
      id: '5',
      fullName: 'Robert Brown',
      email: 'robert.brown@medivault.com',
      phone: '+1 234-567-8905',
      role: 'pharmacist',
      status: 'active',
      createdAt: '2024-02-01'
    },
    {
      id: '6',
      fullName: 'Dr. Lisa Anderson',
      email: 'lisa.anderson@medivault.com',
      phone: '+1 234-567-8906',
      role: 'doctor',
      status: 'pending',
      createdAt: '2024-11-28',
      specialization: 'Pediatrician'
    },
    {
      id: '7',
      fullName: 'David Martinez',
      email: 'david.martinez@medivault.com',
      phone: '+1 234-567-8907',
      role: 'lab_technician',
      status: 'active',
      createdAt: '2024-01-20'
    },
    {
      id: '8',
      fullName: 'Admin User',
      email: 'admin@medivault.com',
      phone: '+1 234-567-8900',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-01'
    }
  ]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchQuery === '' ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#EF4444';
      case 'doctor': return '#10B981';
      case 'patient': return '#3B82F6';
      case 'pharmacist': return '#8B5CF6';
      case 'lab_technician': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return 'shield-account';
      case 'doctor': return 'doctor';
      case 'patient': return 'account';
      case 'pharmacist': return 'pill';
      case 'lab_technician': return 'flask';
      default: return 'account';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'patient',
      specialization: '',
      password: '',
    });
  };

  const handleAddUser = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newUser: User = {
      id: (users.length + 1).toString(),
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      ...(formData.specialization && { specialization: formData.specialization })
    };

    setUsers([...users, newUser]);
    setShowAddModal(false);
    resetForm();
    Alert.alert('Success', 'User added successfully');
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    if (!formData.fullName || !formData.email || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const updatedUsers = users.map(user => 
      user.id === selectedUser.id 
        ? {
            ...user,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            ...(formData.specialization && { specialization: formData.specialization })
          }
        : user
    );

    setUsers(updatedUsers);
    setShowEditModal(false);
    setSelectedUser(null);
    resetForm();
    Alert.alert('Success', 'User updated successfully');
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUsers(users.filter(u => u.id !== user.id));
            Alert.alert('Success', 'User deleted successfully');
          }
        }
      ]
    );
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      specialization: user.specialization || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const toggleUserStatus = (user: User) => {
    const newStatus: User['status'] = user.status === 'active' ? 'inactive' : 'active';
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, status: newStatus } : u
    );
    setUsers(updatedUsers);
    Alert.alert('Success', `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
  };

  const renderUserModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        isEdit ? setShowEditModal(false) : setShowAddModal(false);
        resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <RNText style={styles.modalTitle}>{isEdit ? 'Edit User' : 'Add New User'}</RNText>
            <TouchableOpacity
              onPress={() => {
                isEdit ? setShowEditModal(false) : setShowAddModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <RNText style={styles.inputLabel}>Full Name *</RNText>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <RNText style={styles.inputLabel}>Email *</RNText>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <RNText style={styles.inputLabel}>Phone Number *</RNText>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#9CA3AF"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Role */}
            <View style={styles.inputGroup}>
              <RNText style={styles.inputLabel}>Role *</RNText>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowRoleMenu(true)}
              >
                <MaterialCommunityIcons name="account-cog" size={20} color="#6B7280" />
                <View style={styles.pickerContainer}>
                  <RNText style={styles.pickerText}>
                    {formData.role.charAt(0).toUpperCase() + formData.role.slice(1).replace('_', ' ')}
                  </RNText>
                </View>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Specialization (for doctors) */}
            {formData.role === 'doctor' && (
              <View style={styles.inputGroup}>
                <RNText style={styles.inputLabel}>Specialization</RNText>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="stethoscope" size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter specialization"
                    placeholderTextColor="#9CA3AF"
                    value={formData.specialization}
                    onChangeText={(text) => setFormData({ ...formData, specialization: text })}
                  />
                </View>
              </View>
            )}

            {/* Password (only for add) */}
            {!isEdit && (
              <View style={styles.inputGroup}>
                <RNText style={styles.inputLabel}>Password *</RNText>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#9CA3AF"
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    secureTextEntry
                  />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                isEdit ? setShowEditModal(false) : setShowAddModal(false);
                resetForm();
              }}
            >
              <RNText style={styles.cancelButtonText}>Cancel</RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={isEdit ? handleEditUser : handleAddUser}
            >
              <RNText style={styles.saveButtonText}>{isEdit ? 'Update' : 'Add User'}</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <RNText style={styles.headerTitle}>User Management</RNText>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <RNText style={styles.addButtonText}>Add User</RNText>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or phone..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, filterRole === 'all' && styles.filterChipActive]}
              onPress={() => setFilterRole('all')}
            >
              <RNText style={[styles.filterChipText, filterRole === 'all' && styles.filterChipTextActive]}>
                All Roles
              </RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterRole === 'doctor' && styles.filterChipActive]}
              onPress={() => setFilterRole('doctor')}
            >
              <RNText style={[styles.filterChipText, filterRole === 'doctor' && styles.filterChipTextActive]}>
                Doctors
              </RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterRole === 'patient' && styles.filterChipActive]}
              onPress={() => setFilterRole('patient')}
            >
              <RNText style={[styles.filterChipText, filterRole === 'patient' && styles.filterChipTextActive]}>
                Patients
              </RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterRole === 'pharmacist' && styles.filterChipActive]}
              onPress={() => setFilterRole('pharmacist')}
            >
              <RNText style={[styles.filterChipText, filterRole === 'pharmacist' && styles.filterChipTextActive]}>
                Pharmacists
              </RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterRole === 'lab_technician' && styles.filterChipActive]}
              onPress={() => setFilterRole('lab_technician')}
            >
              <RNText style={[styles.filterChipText, filterRole === 'lab_technician' && styles.filterChipTextActive]}>
                Lab Techs
              </RNText>
            </TouchableOpacity>
            <View style={styles.filterDivider} />
            <TouchableOpacity
              style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
              onPress={() => setFilterStatus('all')}
            >
              <RNText style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
                All Status
              </RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterStatus === 'active' && styles.filterChipActive]}
              onPress={() => setFilterStatus('active')}
            >
              <RNText style={[styles.filterChipText, filterStatus === 'active' && styles.filterChipTextActive]}>
                Active
              </RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]}
              onPress={() => setFilterStatus('pending')}
            >
              <RNText style={[styles.filterChipText, filterStatus === 'pending' && styles.filterChipTextActive]}>
                Pending
              </RNText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* User List */}
      <ScrollView
        style={styles.usersList}
        contentContainerStyle={styles.usersContent}
        showsVerticalScrollIndicator={false}
      >
        <RNText style={styles.resultCount}>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
        </RNText>

        {filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userLeft}>
              <View style={[styles.userAvatar, { backgroundColor: `${getRoleColor(user.role)}15` }]}>
                <MaterialCommunityIcons
                  name={getRoleIcon(user.role) as any}
                  size={28}
                  color={getRoleColor(user.role)}
                />
              </View>
            </View>

            <View style={styles.userContent}>
              <View style={styles.userHeader}>
                <RNText style={styles.userName}>{user.fullName}</RNText>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(user.status)}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(user.status) }]} />
                  <RNText style={[styles.statusText, { color: getStatusColor(user.status) }]}>
                    {user.status}
                  </RNText>
                </View>
              </View>

              <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(user.role)}15` }]}>
                <RNText style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                </RNText>
              </View>

              {user.specialization && (
                <RNText style={styles.specialization}>
                  <MaterialCommunityIcons name="stethoscope" size={12} color="#6B7280" /> {user.specialization}
                </RNText>
              )}

              <View style={styles.userInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={14} color="#6B7280" />
                  <RNText style={styles.infoText}>{user.email}</RNText>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={14} color="#6B7280" />
                  <RNText style={styles.infoText}>{user.phone}</RNText>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <RNText style={styles.infoText}>Joined {user.createdAt}</RNText>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openEditModal(user)}
                >
                  <Ionicons name="create-outline" size={16} color="#3B82F6" />
                  <RNText style={styles.editButtonText}>Edit</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.toggleButton]}
                  onPress={() => toggleUserStatus(user)}
                >
                  <Ionicons
                    name={user.status === 'active' ? 'pause-outline' : 'play-outline'}
                    size={16}
                    color="#F59E0B"
                  />
                  <RNText style={styles.toggleButtonText}>
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteUser(user)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <RNText style={styles.deleteButtonText}>Delete</RNText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={64} color="#D1D5DB" />
            <RNText style={styles.emptyText}>No users found</RNText>
            <RNText style={styles.emptySubtext}>Try adjusting your search or filters</RNText>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderUserModal(false)}
      {renderUserModal(true)}

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRoleMenu(false)}
      >
        <TouchableOpacity 
          style={styles.roleModalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleMenu(false)}
        >
          <View style={styles.roleModalContent}>
            <RNText style={styles.roleModalTitle}>Select User Role</RNText>
            
            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => {
                setFormData({ ...formData, role: 'patient' });
                setShowRoleMenu(false);
              }}
            >
              <MaterialCommunityIcons name="account" size={24} color="#3B82F6" />
              <RNText style={styles.roleOptionText}>Patient</RNText>
              {formData.role === 'patient' && <Ionicons name="checkmark" size={24} color="#35c6eb" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => {
                setFormData({ ...formData, role: 'doctor' });
                setShowRoleMenu(false);
              }}
            >
              <MaterialCommunityIcons name="doctor" size={24} color="#10B981" />
              <RNText style={styles.roleOptionText}>Doctor</RNText>
              {formData.role === 'doctor' && <Ionicons name="checkmark" size={24} color="#35c6eb" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => {
                setFormData({ ...formData, role: 'pharmacist' });
                setShowRoleMenu(false);
              }}
            >
              <MaterialCommunityIcons name="pill" size={24} color="#8B5CF6" />
              <RNText style={styles.roleOptionText}>Pharmacist</RNText>
              {formData.role === 'pharmacist' && <Ionicons name="checkmark" size={24} color="#35c6eb" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => {
                setFormData({ ...formData, role: 'lab_technician' });
                setShowRoleMenu(false);
              }}
            >
              <MaterialCommunityIcons name="flask" size={24} color="#F59E0B" />
              <RNText style={styles.roleOptionText}>Lab Technician</RNText>
              {formData.role === 'lab_technician' && <Ionicons name="checkmark" size={24} color="#35c6eb" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => {
                setFormData({ ...formData, role: 'admin' });
                setShowRoleMenu(false);
              }}
            >
              <MaterialCommunityIcons name="shield-account" size={24} color="#EF4444" />
              <RNText style={styles.roleOptionText}>Admin</RNText>
              {formData.role === 'admin' && <Ionicons name="checkmark" size={24} color="#35c6eb" />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: 16,
    paddingBottom: 12,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#35c6eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filtersContainer: {
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#35c6eb15',
    borderWidth: 1,
    borderColor: '#35c6eb',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#35c6eb',
    fontWeight: '600',
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  usersList: {
    flex: 1,
  },
  usersContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  userLeft: {
    marginRight: 12,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userContent: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  specialization: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  userInfo: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#3B82F615',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  toggleButton: {
    backgroundColor: '#F59E0B15',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#EF444415',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },

  // Modal Styles
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  pickerContainer: {
    flex: 1,
  },
  pickerText: {
    fontSize: 14,
    color: '#1F2937',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#35c6eb',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Role Selection Modal
  roleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  roleModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  roleModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    gap: 12,
  },
  roleOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
});
