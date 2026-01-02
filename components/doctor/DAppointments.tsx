import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

interface Appointment {
  id: string;
  patientName: string;
  patientNIC: string;
  time: string;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'cancel_requested';
  cancellationReason?: string;
}

interface DAppointmentsProps {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  showAppointmentModal: boolean;
  setShowAppointmentModal: (show: boolean) => void;
  handleViewAppointment: (appointment: Appointment) => void;
}

export default function DAppointments({
  appointments,
  selectedAppointment,
  showAppointmentModal,
  setShowAppointmentModal,
  handleViewAppointment,
}: DAppointmentsProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedCancelAppointment, setSelectedCancelAppointment] = useState<Appointment | null>(null);

  const handleRequestCancel = (appointment: Appointment) => {
    setSelectedCancelAppointment(appointment);
    setShowCancelModal(true);
  };

  const submitCancelRequest = () => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for cancellation');
      return;
    }

    // In real app, this would send request to admin
    Alert.alert(
      'Request Submitted',
      `Cancellation request for ${selectedCancelAppointment?.patientName}'s appointment has been sent to admin for approval.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowCancelModal(false);
            setCancelReason('');
            setSelectedCancelAppointment(null);
          }
        }
      ]
    );
  };

  return (
    <>
      <View style={styles.section}>
        <RNText style={styles.sectionTitle}>Today's Appointments</RNText>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.appointmentsScroll}
        >
          {appointments.map(appointment => {
            const statusColors = {
              pending: { bg: 'rgba(251, 191, 36, 0.2)', text: '#D97706', label: 'Pending' },
              confirmed: { bg: 'rgba(34, 197, 94, 0.2)', text: '#16A34A', label: 'Confirmed' },
              completed: { bg: 'rgba(59, 130, 246, 0.2)', text: '#2563EB', label: 'Completed' },
              cancelled: { bg: 'rgba(239, 68, 68, 0.2)', text: '#DC2626', label: 'Cancelled' },
              cancel_requested: { bg: 'rgba(245, 158, 11, 0.2)', text: '#F59E0B', label: 'Cancel Requested' },
            };
            const statusConfig = statusColors[appointment.status] || statusColors.pending;

            return (
              <TouchableOpacity 
                key={appointment.id} 
                style={styles.appointmentCard}
                onPress={() => handleViewAppointment(appointment)}
              >
                <View style={styles.cardHeader}>
                  <RNText style={styles.patientName}>{appointment.patientName}</RNText>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <RNText style={[styles.statusText, { color: statusConfig.text }]}>
                      {statusConfig.label}
                    </RNText>
                  </View>
                </View>

                <RNText style={styles.roleLabel}>Patient</RNText>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <RNText style={styles.infoText}>{appointment.time.split(' - ')[0] || appointment.time}</RNText>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <RNText style={styles.infoText}>{appointment.time.split(' - ')[1] || 'Not set'}</RNText>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color="#6B7280" />
                  <RNText style={styles.infoText}>{appointment.type}</RNText>
                </View>

                {appointment.cancellationReason && (
                  <View style={styles.reasonBox}>
                    <RNText style={styles.reasonText} numberOfLines={2}>
                      {appointment.cancellationReason}
                    </RNText>
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.completeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert('Mark Complete', `Mark appointment with ${appointment.patientName} as completed?`);
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <RNText style={styles.completeButtonText}>Mark Complete</RNText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRequestCancel(appointment);
                    }}
                  >
                    <RNText style={styles.cancelButtonText}>Request Cancel</RNText>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Appointment Details Modal */}
      <Modal visible={showAppointmentModal} animationType="slide" transparent onRequestClose={() => setShowAppointmentModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <RNText style={modalStyles.title}>Appointment Details</RNText>
              <TouchableOpacity onPress={() => setShowAppointmentModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={modalStyles.scrollView} showsVerticalScrollIndicator={false}>
              {selectedAppointment && (
                <View style={modalStyles.body}>
                {[
                  ['Patient:', selectedAppointment.patientName],
                  ['NIC:', selectedAppointment.patientNIC],
                  ['Time:', selectedAppointment.time],
                  ['Type:', selectedAppointment.type]
                ].map(([label, value], i) => (
                  <View key={i} style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>{label}</RNText>
                    <RNText style={modalStyles.detailValue}>{value}</RNText>
                  </View>
                ))}
                
                <View style={modalStyles.detailRow}>
                  <RNText style={modalStyles.detailLabel}>Status:</RNText>
                  <View style={[modalStyles.statusBadge, { backgroundColor: selectedAppointment.status === 'confirmed' ? 'rgba(30, 75, 163, 0.15)' : '#F59E0B20' }]}>
                    <RNText style={[modalStyles.statusText, { color: selectedAppointment.status === 'confirmed' ? '#1E4BA3' : '#F59E0B' }]}>
                      {selectedAppointment.status.toUpperCase()}
                    </RNText>
                  </View>
                </View>

                <View style={modalStyles.modalActions}>
                  {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'cancel_requested' && selectedAppointment.status !== 'completed' && (
                    <TouchableOpacity style={modalStyles.primaryButton}>
                      <RNText style={modalStyles.primaryButtonText}>Start Consultation</RNText>
                    </TouchableOpacity>
                  )}
                  
                  {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'cancel_requested' && selectedAppointment.status !== 'completed' && (
                    <TouchableOpacity 
                      style={modalStyles.cancelButton}
                      onPress={() => {
                        setShowAppointmentModal(false);
                        handleRequestCancel(selectedAppointment);
                      }}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                      <RNText style={modalStyles.cancelButtonText}>Request to Cancel</RNText>
                    </TouchableOpacity>
                  )}

                  {selectedAppointment.status === 'cancel_requested' && (
                    <View style={modalStyles.pendingNotice}>
                      <Ionicons name="time-outline" size={20} color="#F59E0B" />
                      <RNText style={modalStyles.pendingText}>
                        Cancellation request pending admin approval
                      </RNText>
                    </View>
                  )}
                </View>
              </View>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cancel Request Modal */}
      <Modal visible={showCancelModal} animationType="slide" transparent onRequestClose={() => setShowCancelModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <RNText style={modalStyles.title}>Request Cancellation</RNText>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.body}>
              {selectedCancelAppointment && (
                <>
                  <View style={modalStyles.infoBox}>
                    <Ionicons name="information-circle" size={24} color="#3B82F6" />
                    <RNText style={modalStyles.infoText}>
                      Cancellation requests require admin approval. The patient will be notified once approved.
                    </RNText>
                  </View>

                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Patient:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedCancelAppointment.patientName}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Time:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedCancelAppointment.time}</RNText>
                  </View>

                  <View style={modalStyles.inputGroup}>
                    <RNText style={modalStyles.inputLabel}>Reason for Cancellation *</RNText>
                    <TextInput
                      style={modalStyles.textArea}
                      placeholder="Please provide a reason for canceling this appointment..."
                      multiline
                      numberOfLines={4}
                      value={cancelReason}
                      onChangeText={setCancelReason}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={modalStyles.modalActions}>
                    <TouchableOpacity 
                      style={modalStyles.submitButton}
                      onPress={submitCancelRequest}
                    >
                      <RNText style={modalStyles.primaryButtonText}>Submit Request</RNText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={modalStyles.secondaryButton}
                      onPress={() => {
                        setShowCancelModal(false);
                        setCancelReason('');
                      }}
                    >
                      <RNText style={modalStyles.secondaryButtonText}>Cancel</RNText>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollView: {
    maxHeight: '75%',
  },
  body: {
    padding: 20,
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
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalActions: {
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: '#1E4BA3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  appointmentsScroll: {
    paddingRight: 16,
    gap: 16,
  },
  appointmentCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  roleLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  reasonBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  reasonText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#06B6D4',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  completeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCA5A5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

