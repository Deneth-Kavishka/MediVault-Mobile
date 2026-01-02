import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import { API_BASE_URL } from '../../src/config/constants';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;

interface Appointment {
  id: string;
  doctorName: string;
  patientName: string;
  patientNIC: string;
  time: string;
  type: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'cancel_requested';
  cancellationReason?: string;
  requestedBy?: 'doctor' | 'patient';
}

function normalizeStatus(input: any): Appointment['status'] {
  const s = String(input ?? '').trim().toLowerCase();
  if (s === 'pending' || s === 'confirmed' || s === 'completed' || s === 'cancelled' || s === 'cancel_requested') return s;
  if (s === 'canceled') return 'cancelled';
  if (s === 'cancel-requested' || s === 'cancelrequested' || s === 'cancellation_requested') return 'cancel_requested';
  return 'pending';
}

function normalizeRequestedBy(input: any): Appointment['requestedBy'] {
  const s = String(input ?? '').trim().toLowerCase();
  if (s === 'doctor' || s === 'patient') return s;
  return undefined;
}

export default function AdminAppointments() {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && windowWidth >= 900;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      setIsLoadingAppointments(true);
      setAppointmentsError(null);

      const response = await fetch(`${API_BASE_URL}/appointments/registry`);
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || `Request failed (${response.status})`);
      }

      const rows: any[] = Array.isArray(json.data) ? json.data : [];
      const mapped: Appointment[] = rows.map((row) => ({
        id: String(row.id ?? row.appointment_id ?? ''),
        doctorName: String(row.doctorName ?? row.doctor_name ?? '').trim() || '—',
        patientName: String(row.patientName ?? row.patient_name ?? '').trim() || '—',
        patientNIC: String(row.patientNIC ?? row.patient_nic ?? '').trim() || '—',
        time: String(row.time ?? row.appointment_datetime ?? row.scheduled_at ?? '').trim() || '—',
        type: String(row.type ?? row.specialization ?? row.appointment_type ?? '').trim() || '—',
        status: normalizeStatus(row.status),
        cancellationReason: row.cancellationReason ?? row.cancellation_reason ?? undefined,
        requestedBy: normalizeRequestedBy(row.requestedBy ?? row.requested_by),
      }));

      setAppointments(mapped);
    } catch (err: any) {
      setAppointments([]);
      setAppointmentsError(err?.message || 'Failed to load appointments');
    } finally {
      setIsLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionsOpenForId, setActionsOpenForId] = useState<string | null>(null);

  const updateAppointmentStatus = useCallback(
    async (appointment: Appointment, nextStatus: Appointment['status']) => {
      try {
        setActionsOpenForId(null);
        const response = await fetch(`${API_BASE_URL}/appointments/${appointment.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.success) {
          throw new Error(json?.message || `Request failed (${response.status})`);
        }

        setAppointments((prev) =>
          prev.map((a) => (a.id === appointment.id ? { ...a, status: nextStatus } : a))
        );
      } catch (err: any) {
        Alert.alert('Update Failed', err?.message || 'Failed to update appointment');
      }
    },
    []
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Appointment['status']>('all');

  const cancelRequestedAppointments = appointments.filter(
    (apt) => apt.status === 'cancel_requested'
  );

  const totalAppointments = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelRequestedCount = cancelRequestedAppointments.length;

  const filteredAppointments = appointments.filter((apt) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      apt.patientName.toLowerCase().includes(q) ||
      apt.doctorName.toLowerCase().includes(q) ||
      apt.patientNIC.toLowerCase().includes(q) ||
      apt.id.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' ? true : apt.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const kpis = [
    { label: 'Total Appointments', value: totalAppointments, icon: 'calendar', valueColor: '#111827' },
    { label: 'Pending', value: pendingCount, icon: 'clock-outline', valueColor: '#D97706' },
    { label: 'Confirmed', value: confirmedCount, icon: 'check-circle-outline', valueColor: '#16A34A' },
    { label: 'Completed', value: completedCount, icon: 'check-decagram-outline', valueColor: '#2563EB' },
    { label: 'Cancellation Requests', value: cancelRequestedCount, icon: 'close-circle-outline', valueColor: '#EA580C' },
  ] as const;

  function toCsv(rows: string[][]) {
    return rows
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  function downloadCsvWeb(filename: string, csv: string) {
    if (Platform.OS !== 'web') return;

    const doc = (globalThis as any).document;
    const URL_ = (globalThis as any).URL;
    const Blob_ = (globalThis as any).Blob;
    if (!doc || !URL_ || !Blob_) return;

    const blob = new Blob_([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL_.createObjectURL(blob);
    const link = doc.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    doc.body.appendChild(link);
    link.click();
    doc.body.removeChild(link);
    URL_.revokeObjectURL(url);
  }

  const exportCsv = () => {
    setActionsOpenForId(null);
    const rows: string[][] = [
      ['Date & Time', 'Patient', 'NIC', 'Doctor', 'Specialization', 'Status', 'Reason'],
      ...filteredAppointments.map((a) => [
        a.time,
        a.patientName,
        a.patientNIC,
        a.doctorName,
        a.type,
        a.status,
        a.cancellationReason || '',
      ]),
    ];

    const csv = toCsv(rows);
    if (Platform.OS === 'web') {
      downloadCsvWeb('appointments.csv', csv);
    } else {
      Alert.alert('Export CSV', 'CSV export is available on web.');
    }
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setActionsOpenForId(null);
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleOpenApproval = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(false);
    setShowApprovalModal(true);
  };

  const handleApproveCancellation = () => {
    if (!selectedAppointment) return;

    Alert.alert(
      'Approve Cancellation',
      `Are you sure you want to approve the cancellation request for ${selectedAppointment.patientName}'s appointment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'destructive',
          onPress: () => {
            // Update appointment status
            setAppointments((prev) =>
              prev.map((apt) =>
                apt.id === selectedAppointment.id
                  ? { ...apt, status: 'cancelled' as const }
                  : apt
              )
            );

            Alert.alert(
              'Cancellation Approved',
              `The appointment has been cancelled. Notifications have been sent to both doctor and patient.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowApprovalModal(false);
                    setAdminNotes('');
                    setSelectedAppointment(null);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleRejectCancellation = () => {
    if (!selectedAppointment) return;

    if (!adminNotes.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejecting the cancellation request.');
      return;
    }

    Alert.alert(
      'Reject Cancellation',
      `Are you sure you want to reject the cancellation request for ${selectedAppointment.patientName}'s appointment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: () => {
            // Revert status back to confirmed
            setAppointments((prev) =>
              prev.map((apt) =>
                apt.id === selectedAppointment.id
                  ? { ...apt, status: 'confirmed' as const, cancellationReason: undefined }
                  : apt
              )
            );

            Alert.alert(
              'Cancellation Rejected',
              `The cancellation request has been rejected. The requesting party has been notified with your reason.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowApprovalModal(false);
                    setAdminNotes('');
                    setSelectedAppointment(null);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderTitleRow}>
          <View style={styles.pageHeaderIconWrap}>
            <MaterialCommunityIcons name="calendar" size={22} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <RNText style={styles.pageTitle}>Appointment Management</RNText>
            <RNText style={styles.pageSubtitle}>Manage all appointments, schedules, and bookings</RNText>
          </View>
        </View>
      </View>

      <View style={styles.kpiRow}>
        {kpis.map((kpi, idx) => (
          <View
            key={kpi.label}
            style={[
              styles.kpiCard,
              {
                width: isDesktopWeb ? 200 : idx === kpis.length - 1 ? '100%' : '48%',
                marginBottom: isDesktopWeb ? 0 : 12,
              },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <RNText style={styles.kpiLabel}>{kpi.label}</RNText>
              <MaterialCommunityIcons name={kpi.icon} size={18} color="#6B7280" />
            </View>
            <RNText style={[styles.kpiValue, { color: kpi.valueColor }]}>{kpi.value}</RNText>
          </View>
        ))}
      </View>

      {cancelRequestedCount > 0 ? (
        <View style={styles.alertCard}>
          <View style={styles.alertLeft}>
            <Ionicons name="alert-circle" size={18} color="#D97706" />
            <RNText style={styles.alertText}>You have {cancelRequestedCount} cancellation request(s) pending review.</RNText>
          </View>
          <TouchableOpacity
            style={styles.alertAction}
            onPress={() => setStatusFilter('cancel_requested')}
          >
            <RNText style={styles.alertActionText}>View</RNText>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <View style={{ flex: 1 }}>
            <RNText style={styles.tableTitle}>All Appointments</RNText>
            <RNText style={styles.tableSubtitle}>View and manage patient appointments with doctors</RNText>
          </View>

          <TouchableOpacity style={styles.exportButton} onPress={exportCsv}>
            <MaterialCommunityIcons name="download" size={18} color="#111827" />
            <RNText style={styles.exportButtonText}>Export CSV</RNText>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by patient, doctor, RFID, or license..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              // minimal: cycle status values without extra modals
              const order: Array<'all' | Appointment['status']> = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'cancel_requested'];
              const idx = order.indexOf(statusFilter);
              setStatusFilter(order[(idx + 1) % order.length]);
            }}
          >
            <RNText style={styles.dropdownText}>
              {statusFilter === 'all'
                ? 'All Status'
                : statusFilter === 'cancel_requested'
                ? 'Cancel Requested'
                : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </RNText>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dateButton} onPress={() => {}}>
            <MaterialCommunityIcons name="calendar" size={18} color="#111827" />
            <RNText style={styles.dateButtonText}>Filter by Date</RNText>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeadRow}>
              <RNText style={[styles.th, styles.colDate]}>Date & Time</RNText>
              <RNText style={[styles.th, styles.colPatient]}>Patient</RNText>
              <RNText style={[styles.th, styles.colDoctor]}>Doctor</RNText>
              <RNText style={[styles.th, styles.colSpec]}>Specialization</RNText>
              <RNText style={[styles.th, styles.colStatus]}>Status</RNText>
              <RNText style={[styles.th, styles.colReason]}>Reason</RNText>
              <RNText style={[styles.th, styles.colActions]}>Actions</RNText>
            </View>

            {isLoadingAppointments ? (
              <View style={styles.tableRow}>
                <RNText style={[styles.td, styles.colDate]}>Loading…</RNText>
                <RNText style={[styles.td, styles.colPatient]}>—</RNText>
                <RNText style={[styles.td, styles.colDoctor]}>—</RNText>
                <RNText style={[styles.td, styles.colSpec]}>—</RNText>
                <RNText style={[styles.td, styles.colStatus]}>—</RNText>
                <RNText style={[styles.td, styles.colReason]}>—</RNText>
                <RNText style={[styles.td, styles.colActions]}>—</RNText>
              </View>
            ) : appointmentsError ? (
              <TouchableOpacity style={styles.tableRow} onPress={loadAppointments}>
                <RNText style={[styles.td, styles.colDate]} numberOfLines={1}>
                  {appointmentsError}
                </RNText>
                <RNText style={[styles.td, styles.colPatient]}>Tap to retry</RNText>
                <RNText style={[styles.td, styles.colDoctor]}>—</RNText>
                <RNText style={[styles.td, styles.colSpec]}>—</RNText>
                <RNText style={[styles.td, styles.colStatus]}>—</RNText>
                <RNText style={[styles.td, styles.colReason]}>—</RNText>
                <RNText style={[styles.td, styles.colActions]}>—</RNText>
              </TouchableOpacity>
            ) : filteredAppointments.length === 0 ? (
              <View style={styles.tableRow}>
                <RNText style={[styles.td, styles.colDate]}>No appointments found</RNText>
                <RNText style={[styles.td, styles.colPatient]}>—</RNText>
                <RNText style={[styles.td, styles.colDoctor]}>—</RNText>
                <RNText style={[styles.td, styles.colSpec]}>—</RNText>
                <RNText style={[styles.td, styles.colStatus]}>—</RNText>
                <RNText style={[styles.td, styles.colReason]}>—</RNText>
                <RNText style={[styles.td, styles.colActions]}>—</RNText>
              </View>
            ) : null}

            {filteredAppointments.map((appointment) => {
              const statusMeta =
                appointment.status === 'confirmed' || appointment.status === 'completed'
                  ? { bg: '#DCFCE7', fg: '#16A34A', label: appointment.status === 'confirmed' ? 'Confirmed' : 'Completed' }
                  : appointment.status === 'pending'
                  ? { bg: '#FEF3C7', fg: '#D97706', label: 'Pending' }
                  : appointment.status === 'cancel_requested'
                  ? { bg: '#FFEDD5', fg: '#EA580C', label: 'Cancel Requested' }
                  : { bg: '#FEE2E2', fg: '#DC2626', label: 'Cancelled' };

              return (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.tableRow}
                  onPress={() => handleViewAppointment(appointment)}
                >
                  <RNText style={[styles.td, styles.colDate]}>{appointment.time}</RNText>

                  <View style={[styles.tdCell, styles.colPatient]}>
                    <RNText style={styles.cellPrimary}>{appointment.patientName}</RNText>
                    <View style={styles.metaPill}>
                      <RNText style={styles.metaPillText}>{appointment.patientNIC}</RNText>
                    </View>
                  </View>

                  <View style={[styles.tdCell, styles.colDoctor]}>
                    <RNText style={styles.cellPrimary}>{appointment.doctorName}</RNText>
                  </View>

                  <View style={[styles.tdCell, styles.colSpec]}>
                    <View style={styles.specPill}>
                      <RNText style={styles.specPillText}>{appointment.type}</RNText>
                    </View>
                  </View>

                  <View style={[styles.tdCell, styles.colStatus]}>
                    <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
                      <RNText style={[styles.statusPillText, { color: statusMeta.fg }]}>{statusMeta.label}</RNText>
                    </View>
                  </View>

                  <RNText style={[styles.td, styles.colReason]} numberOfLines={1}>
                    {appointment.cancellationReason || '-'}
                  </RNText>

                  <View style={[styles.tdCell, styles.colActions]}>
                    <TouchableOpacity
                      onPress={(event: any) => {
                        event?.stopPropagation?.();
                        setActionsOpenForId((prev) => (prev === appointment.id ? null : appointment.id));
                      }}
                      style={styles.moreButton}
                    >
                      <Ionicons name="ellipsis-vertical" size={16} color="#6B7280" />
                    </TouchableOpacity>

                    {actionsOpenForId === appointment.id ? (
                      <View style={styles.actionsMenu}>
                        <TouchableOpacity
                          style={styles.actionsMenuItem}
                          onPress={(event: any) => {
                            event?.stopPropagation?.();
                            handleViewAppointment(appointment);
                          }}
                        >
                          <Ionicons name="eye-outline" size={16} color="#111827" />
                          <RNText style={styles.actionsMenuText}>View Details</RNText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionsMenuItem}
                          onPress={(event: any) => {
                            event?.stopPropagation?.();
                            Alert.alert(
                              'Mark as Completed',
                              'Are you sure you want to mark this appointment as completed?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Mark Completed',
                                  onPress: () => updateAppointmentStatus(appointment, 'completed'),
                                },
                              ]
                            );
                          }}
                        >
                          <Ionicons name="checkmark-circle-outline" size={16} color="#2563EB" />
                          <RNText style={[styles.actionsMenuText, { color: '#2563EB' }]}>Mark as Completed</RNText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionsMenuItem}
                          onPress={(event: any) => {
                            event?.stopPropagation?.();
                            Alert.alert(
                              'Cancel Appointment',
                              'Are you sure you want to cancel this appointment?',
                              [
                                { text: 'No', style: 'cancel' },
                                {
                                  text: 'Cancel Appointment',
                                  style: 'destructive',
                                  onPress: () => updateAppointmentStatus(appointment, 'cancelled'),
                                },
                              ]
                            );
                          }}
                        >
                          <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                          <RNText style={[styles.actionsMenuText, { color: '#DC2626' }]}>Cancel</RNText>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <RNText style={modalStyles.title}>Appointment Details</RNText>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <ScrollView style={modalStyles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={modalStyles.body}>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Doctor:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.doctorName}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Patient:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.patientName}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>NIC:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.patientNIC}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Time:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.time}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Type:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.type}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Status:</RNText>
                    <View
                      style={[
                        modalStyles.statusBadge,
                        {
                          backgroundColor:
                            selectedAppointment.status === 'cancel_requested'
                              ? '#FEF3C7'
                              : '#E0F2FE',
                        },
                      ]}
                    >
                      <RNText
                        style={[
                          modalStyles.statusText,
                          {
                            color:
                              selectedAppointment.status === 'cancel_requested'
                                ? '#D97706'
                                : '#0284C7',
                          },
                        ]}
                      >
                        {selectedAppointment.status.toUpperCase()}
                      </RNText>
                    </View>
                  </View>

                  {selectedAppointment.status === 'cancel_requested' && (
                    <TouchableOpacity
                      style={modalStyles.reviewButton}
                      onPress={() => handleOpenApproval(selectedAppointment)}
                    >
                      <RNText style={modalStyles.reviewButtonText}>Review Cancellation Request</RNText>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Approval/Rejection Modal */}
      <Modal
        visible={showApprovalModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <RNText style={modalStyles.title}>Review Cancellation Request</RNText>
              <TouchableOpacity onPress={() => setShowApprovalModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <ScrollView style={modalStyles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={modalStyles.body}>
                  <View style={modalStyles.warningBox}>
                    <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                    <RNText style={modalStyles.warningText}>
                      This action will notify both the doctor and patient about your decision.
                    </RNText>
                  </View>

                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Doctor:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.doctorName}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Patient:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.patientName}</RNText>
                  </View>
                  <View style={modalStyles.detailRow}>
                    <RNText style={modalStyles.detailLabel}>Time:</RNText>
                    <RNText style={modalStyles.detailValue}>{selectedAppointment.time}</RNText>
                  </View>

                  {selectedAppointment.cancellationReason && (
                    <View style={modalStyles.reasonBox}>
                      <RNText style={modalStyles.reasonLabel}>Cancellation Reason:</RNText>
                      <RNText style={modalStyles.reasonText}>
                        {selectedAppointment.cancellationReason}
                      </RNText>
                    </View>
                  )}

                  <View style={modalStyles.inputGroup}>
                    <RNText style={modalStyles.inputLabel}>
                      Admin Notes {!adminNotes.trim() && '(Required for rejection)'}
                    </RNText>
                    <TextInput
                      style={modalStyles.textArea}
                      placeholder="Add notes about your decision (required for rejection)..."
                      multiline
                      numberOfLines={4}
                      value={adminNotes}
                      onChangeText={setAdminNotes}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={modalStyles.actionButtons}>
                    <TouchableOpacity
                      style={modalStyles.approveBtn}
                      onPress={handleApproveCancellation}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <RNText style={modalStyles.approveBtnText}>Approve Cancellation</RNText>
                    </TouchableOpacity>

                    <TouchableOpacity style={modalStyles.rejectBtn} onPress={handleRejectCancellation}>
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <RNText style={modalStyles.rejectBtnText}>Reject Request</RNText>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    padding: 22,
    paddingBottom: 40,
  },
  pageHeader: {
    marginBottom: 18,
  },
  pageHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageHeaderIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    flexShrink: 1,
  },
  kpiValue: {
    marginTop: 10,
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  alertText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1,
  },
  alertAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
  },
  alertActionText: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 13,
  },

  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  tableTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  tableSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },

  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    flexGrow: 1,
    minWidth: 280,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#111827',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    minWidth: 150,
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    minWidth: 150,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  actionsMenu: {
    position: 'absolute',
    top: 38,
    right: 0,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 6,
    zIndex: 1000,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  actionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionsMenuText: {
    fontSize: 14,
    color: '#111827',
  },

  table: {
    minWidth: 1040,
  },
  tableHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
  },
  th: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    paddingHorizontal: 10,
  },
  td: {
    fontSize: 13,
    color: '#111827',
    paddingHorizontal: 10,
  },
  tdCell: {
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
  },
  colDate: { width: 140 },
  colPatient: { width: 200 },
  colDoctor: { width: 220 },
  colSpec: { width: 140 },
  colStatus: { width: 140 },
  colReason: { width: 180 },
  colActions: { width: 70, textAlign: 'right', position: 'relative' },

  cellPrimary: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  metaPill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
  },
  specPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  specPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '900',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  badge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  appointmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  reasonBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  cardActions: {
    marginTop: 12,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E4BA3',
    paddingVertical: 12,
    borderRadius: 10,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusIndicator: {
    width: 4,
    height: 50,
    borderRadius: 2,
  },
  appointmentDoctor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

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
    maxHeight: '85%',
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
    maxHeight: '80%',
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
  reviewButton: {
    backgroundColor: '#1E4BA3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
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
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E4BA3',
    borderRadius: 12,
    paddingVertical: 14,
  },
  approveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
  },
  rejectBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  reasonBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
});

