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

interface AdminAddUserProps {
  onBack?: () => void;
  onUserAdded?: (user: any) => void;
}

export default function AdminAddUser({ onBack, onUserAdded }: AdminAddUserProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'patient' as 'admin' | 'doctor' | 'patient' | 'pharmacist' | 'lab_technician',
    specialization: '',
    username: '',
    password: '',
    confirmPassword: '',
    nic: '',
    address: '',
    dateOfBirth: '',
  });

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(new Date().getDate());
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const roles = [
    { value: 'patient', label: 'Patient', icon: 'account', color: '#3B82F6' },
    { value: 'doctor', label: 'Doctor', icon: 'doctor', color: '#10B981' },
    { value: 'pharmacist', label: 'Pharmacist', icon: 'pill', color: '#8B5CF6' },
    { value: 'lab_technician', label: 'Lab Technician', icon: 'flask', color: '#F59E0B' },
    { value: 'admin', label: 'Administrator', icon: 'shield-account', color: '#EF4444' },
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'doctor' && !formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required for doctors';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    Alert.alert(
      'Confirm User Creation',
      `Create new ${formData.role} account for ${formData.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: () => {
            // In production, this would call your API
            const newUser = {
              id: Date.now().toString(),
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              role: formData.role,
              status: 'active',
              createdAt: new Date().toISOString(),
              specialization: formData.specialization || undefined,
              nic: formData.nic || undefined,
              address: formData.address || undefined,
              dateOfBirth: formData.dateOfBirth || undefined,
            };

            Alert.alert('Success', 'User created successfully!');
            onUserAdded?.(newUser);
            
            // Reset form
            setFormData({
              fullName: '',
              email: '',
              phone: '',
              role: 'patient',
              specialization: '',
              username: '',
              password: '',
              confirmPassword: '',
              nic: '',
              address: '',
              dateOfBirth: '',
            });
            setErrors({});
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Form',
      'Are you sure you want to clear all fields?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setFormData({
              fullName: '',
              email: '',
              phone: '',
              role: 'patient',
              specialization: '',
              username: '',
              password: '',
              confirmPassword: '',
              nic: '',
              address: '',
              dateOfBirth: '',
            });
            setErrors({});
          },
        },
      ]
    );
  };

  const selectedRole = roles.find(r => r.value === formData.role);

  return (
    <ImageBackground 
      source={require('../../assets/images/Background-image.jpg')} 
      style={styles.container} 
      resizeMode="cover"
    >
      <View style={styles.gradientOverlay} />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Role Selection Card */}
        <View style={styles.card}>
          <RNText style={styles.cardTitle}>User Role</RNText>
          <TouchableOpacity 
            style={styles.roleSelector}
            onPress={() => setShowRoleMenu(!showRoleMenu)}
          >
            <View style={styles.roleDisplay}>
              <MaterialCommunityIcons 
                name={selectedRole?.icon as any} 
                size={24} 
                color={selectedRole?.color} 
              />
              <RNText style={styles.roleText}>{selectedRole?.label}</RNText>
            </View>
            <Ionicons 
              name={showRoleMenu ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>

          {showRoleMenu && (
            <View style={styles.roleMenu}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleOption,
                    formData.role === role.value && styles.roleOptionActive
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, role: role.value as any });
                    setShowRoleMenu(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name={role.icon as any} 
                    size={24} 
                    color={role.color} 
                  />
                  <RNText style={styles.roleOptionText}>{role.label}</RNText>
                  {formData.role === role.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#3B82F6" />
            <RNText style={styles.cardTitle}>Personal Information</RNText>
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Full Name *</RNText>
            <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor="#9CA3AF"
                value={formData.fullName}
                onChangeText={(text) => {
                  setFormData({ ...formData, fullName: text });
                  if (errors.fullName) setErrors({ ...errors, fullName: '' });
                }}
              />
            </View>
            {errors.fullName && <RNText style={styles.errorText}>{errors.fullName}</RNText>}
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Email Address *</RNText>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
              />
            </View>
            {errors.email && <RNText style={styles.errorText}>{errors.email}</RNText>}
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Phone Number *</RNText>
            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: text });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
              />
            </View>
            {errors.phone && <RNText style={styles.errorText}>{errors.phone}</RNText>}
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>NIC Number</RNText>
            <View style={styles.inputContainer}>
              <Ionicons name="card-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter NIC number"
                placeholderTextColor="#9CA3AF"
                value={formData.nic}
                onChangeText={(text) => setFormData({ ...formData, nic: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Date of Birth</RNText>
            <TouchableOpacity 
              style={styles.inputContainer}
              activeOpacity={0.7}
              onPress={() => {
                if (formData.dateOfBirth) {
                  const date = new Date(formData.dateOfBirth);
                  setTempYear(date.getFullYear());
                  setTempMonth(date.getMonth());
                  setTempDay(date.getDate());
                } else {
                  const today = new Date();
                  setTempYear(today.getFullYear() - 20);
                  setTempMonth(today.getMonth());
                  setTempDay(today.getDate());
                }
                setShowDatePicker(true);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <RNText style={[styles.input, !formData.dateOfBirth && { color: '#9CA3AF' }]}>
                {formData.dateOfBirth || 'Select date of birth'}
              </RNText>
            </TouchableOpacity>
          </View>

          {/* Custom Date Picker Modal */}
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={styles.datePickerModal}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <RNText style={styles.datePickerCancel}>Cancel</RNText>
                  </TouchableOpacity>
                  <RNText style={styles.datePickerTitle}>Select Date of Birth</RNText>
                  <TouchableOpacity onPress={() => {
                    const formattedDate = `${tempYear}-${String(tempMonth + 1).padStart(2, '0')}-${String(tempDay).padStart(2, '0')}`;
                    setFormData({ ...formData, dateOfBirth: formattedDate });
                    setShowDatePicker(false);
                  }}>
                    <RNText style={styles.datePickerDone}>Done</RNText>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.datePickerContent}>
                  {/* Year Picker */}
                  <View style={styles.pickerColumn}>
                    <RNText style={styles.pickerLabel}>Year</RNText>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <TouchableOpacity
                          key={year}
                          style={[styles.pickerItem, tempYear === year && styles.pickerItemSelected]}
                          onPress={() => setTempYear(year)}
                        >
                          <RNText style={[styles.pickerItemText, tempYear === year && styles.pickerItemTextSelected]}>
                            {year}
                          </RNText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Month Picker */}
                  <View style={styles.pickerColumn}>
                    <RNText style={styles.pickerLabel}>Month</RNText>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.pickerItem, tempMonth === index && styles.pickerItemSelected]}
                          onPress={() => setTempMonth(index)}
                        >
                          <RNText style={[styles.pickerItemText, tempMonth === index && styles.pickerItemTextSelected]}>
                            {month}
                          </RNText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Day Picker */}
                  <View style={styles.pickerColumn}>
                    <RNText style={styles.pickerLabel}>Day</RNText>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: new Date(tempYear, tempMonth + 1, 0).getDate() }, (_, i) => i + 1).map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[styles.pickerItem, tempDay === day && styles.pickerItemSelected]}
                          onPress={() => setTempDay(day)}
                        >
                          <RNText style={[styles.pickerItemText, tempDay === day && styles.pickerItemTextSelected]}>
                            {day}
                          </RNText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Address</RNText>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter address"
                placeholderTextColor="#9CA3AF"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
              />
            </View>
          </View>
        </View>

        {/* Professional Information (for doctors) */}
        {formData.role === 'doctor' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="medical-bag" size={24} color="#10B981" />
              <RNText style={styles.cardTitle}>Professional Information</RNText>
            </View>

            <View style={styles.inputGroup}>
              <RNText style={styles.label}>Specialization *</RNText>
              <View style={[styles.inputContainer, errors.specialization && styles.inputError]}>
                <MaterialCommunityIcons name="stethoscope" size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Cardiologist, Neurologist"
                  placeholderTextColor="#9CA3AF"
                  value={formData.specialization}
                  onChangeText={(text) => {
                    setFormData({ ...formData, specialization: text });
                    if (errors.specialization) setErrors({ ...errors, specialization: '' });
                  }}
                />
              </View>
              {errors.specialization && <RNText style={styles.errorText}>{errors.specialization}</RNText>}
            </View>
          </View>
        )}

        {/* Account Security */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lock-outline" size={24} color="#8B5CF6" />
            <RNText style={styles.cardTitle}>Account Security</RNText>
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Username *</RNText>
            <View style={[styles.inputContainer, errors.username && styles.inputError]}>
              <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                value={formData.username}
                onChangeText={(text) => {
                  setFormData({ ...formData, username: text });
                  if (errors.username) setErrors({ ...errors, username: '' });
                }}
              />
            </View>
            {errors.username && <RNText style={styles.errorText}>{errors.username}</RNText>}
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Password *</RNText>
            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Enter password (min. 8 characters)"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
              />
            </View>
            {errors.password && <RNText style={styles.errorText}>{errors.password}</RNText>}
          </View>

          <View style={styles.inputGroup}>
            <RNText style={styles.label}>Confirm Password *</RNText>
            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  setFormData({ ...formData, confirmPassword: text });
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
              />
            </View>
            {errors.confirmPassword && <RNText style={styles.errorText}>{errors.confirmPassword}</RNText>}
          </View>

          <View style={styles.passwordHint}>
            <Ionicons name="information-circle" size={16} color="#6B7280" />
            <RNText style={styles.passwordHintText}>
              Password must be at least 8 characters long
            </RNText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={20} color="#EF4444" />
            <RNText style={styles.resetButtonText}>Reset</RNText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <RNText style={styles.submitButtonText}>Create User</RNText>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    backgroundColor: '#1E4BA3',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
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
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  roleMenu: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  roleOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  roleOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  passwordHintText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  datePickerContent: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerScroll: {
    maxHeight: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

