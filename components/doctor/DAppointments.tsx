import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Modal,
    Text as RNText,
    StyleSheet,
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
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
  return (
    <>
      <View style={styles.section}>
        <RNText style={styles.sectionTitle}>All Appointments</RNText>
        {appointments.map(appointment => (
          <TouchableOpacity 
            key={appointment.id} 
            style={styles.appointmentCard}
            onPress={() => handleViewAppointment(appointment)}
          >
            <View style={styles.appointmentLeft}>
              <View style={[styles.appointmentStatus, { 
                backgroundColor: appointment.status === 'confirmed' ? '#35c6eb' : 
                               appointment.status === 'completed' ? '#35c6eb' : 
                               appointment.status === 'cancelled' ? '#EF4444' : '#F59E0B'
              }]} />
              <View style={{ flex: 1 }}>
                <RNText style={styles.appointmentPatient}>{appointment.patientName}</RNText>
                <RNText style={styles.appointmentTime}>{appointment.time} • {appointment.type}</RNText>
                <RNText style={styles.appointmentNIC}>NIC: {appointment.patientNIC}</RNText>
              </View>
            </View>
            <View style={styles.appointmentActions}>
              <TouchableOpacity style={styles.actionIconButton}>
                <Ionicons name="checkmark-circle" size={24} color="#35c6eb" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIconButton}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
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
                  <View style={[modalStyles.statusBadge, { backgroundColor: selectedAppointment.status === 'confirmed' ? 'rgba(53, 198, 235, 0.15)' : '#F59E0B20' }]}>
                    <RNText style={[modalStyles.statusText, { color: selectedAppointment.status === 'confirmed' ? '#35c6eb' : '#F59E0B' }]}>
                      {selectedAppointment.status.toUpperCase()}
                    </RNText>
                  </View>
                </View>

                <View style={modalStyles.modalActions}>
                  <TouchableOpacity style={modalStyles.primaryButton}>
                    <RNText style={modalStyles.primaryButtonText}>Start Consultation</RNText>
                  </TouchableOpacity>
                  <TouchableOpacity style={modalStyles.secondaryButton}>
                    <RNText style={modalStyles.secondaryButtonText}>Reschedule</RNText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
    backgroundColor: '#35c6eb',
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
  appointmentCard: {
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
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  appointmentStatus: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  appointmentNIC: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    padding: 4,
  },
});
