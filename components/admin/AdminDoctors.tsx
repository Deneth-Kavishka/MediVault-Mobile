import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    Modal,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { API_BASE_URL } from '../../src/config/constants';

interface DoctorRegistryRow {
  doctorId: string;
  userId: string;
  fullName: string;
  email: string;
  username?: string;
  specialization?: string | null;
  licenseNumber?: string | null;
  qualifications?: string | null;
  experience?: number | null;
  isActive: boolean;
  doctorCreatedAt?: string | null;
  userCreatedAt?: string | null;
}

type StatusFilter = 'all' | 'active' | 'inactive';

type SpecializationFilter = 'all' | string;

export default function AdminDoctors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [filterSpecialization, setFilterSpecialization] = useState<SpecializationFilter>('all');

  const [doctors, setDoctors] = useState<DoctorRegistryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRegistryRow | null>(null);

  const normalizeText = (value: unknown) => String(value ?? '').trim().toLowerCase();

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/registry`, {
        headers: { Accept: 'application/json' },
      });

      const rawText = await res.text();
      const json = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `HTTP ${res.status} while loading doctors`);
      }

      setDoctors(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      setLoadError(String(e?.message || e));
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const specializationOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        doctors
          .map((d) => String(d.specialization ?? '').trim())
          .filter((s) => s.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    return ['all', ...unique] as const;
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        normalizeText(d.fullName).includes(normalizeText(searchQuery)) ||
        normalizeText(d.email).includes(normalizeText(searchQuery)) ||
        normalizeText(d.licenseNumber).includes(normalizeText(searchQuery)) ||
        normalizeText(d.specialization).includes(normalizeText(searchQuery));

      const matchesStatus =
        filterStatus === 'all' || (d.isActive ? 'active' : 'inactive') === filterStatus;

      const spec = String(d.specialization ?? '').trim();
      const matchesSpec = filterSpecialization === 'all' || spec === filterSpecialization;

      return matchesSearch && matchesStatus && matchesSpec;
    });
  }, [doctors, searchQuery, filterStatus, filterSpecialization]);

  const stats = useMemo(() => {
    const totalDoctors = doctors.length;
    const specializationCount = new Set(
      doctors
        .map((d) => String(d.specialization ?? '').trim())
        .filter((s) => s.length > 0)
    ).size;

    const availableToday = 0;
    const totalAppointments = 0;

    return { totalDoctors, specializationCount, availableToday, totalAppointments };
  }, [doctors]);

  const shortId = (id: string | null | undefined) => {
    const raw = String(id || '').trim();
    return raw ? raw.slice(0, 8) : '';
  };

  const viewDoctorDetails = (doctor: DoctorRegistryRow) => {
    setSelectedDoctor(doctor);
    setShowDetailsModal(true);
  };

  const exportCsv = () => {
    const header = [
      'Doctor ID',
      'Full Name',
      'Email',
      'License No.',
      'Specialization',
      'Experience (Years)',
      'Qualifications',
      'Status',
      'Availability',
    ];

    const rows = filteredDoctors.map((d) => [
      shortId(d.doctorId),
      d.fullName,
      d.email,
      String(d.licenseNumber ?? ''),
      String(d.specialization ?? ''),
      d.experience ?? '',
      String(d.qualifications ?? ''),
      d.isActive ? 'Active' : 'Inactive',
      'Not specified',
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    if (Platform.OS !== 'web') return;

    const doc = (globalThis as any).document;
    const URL_ = (globalThis as any).URL;
    const Blob_ = (globalThis as any).Blob;
    if (!doc || !URL_ || !Blob_) return;

    const blob = new Blob_([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL_.createObjectURL(blob);
    const link = doc.createElement('a');
    link.href = url;
    link.setAttribute('download', 'doctors.csv');
    doc.body.appendChild(link);
    link.click();
    doc.body.removeChild(link);
    URL_.revokeObjectURL(url);
  };

  const cycleSpecialization = () => {
    const options = specializationOptions;
    const currentIndex = options.findIndex((x) => x === filterSpecialization);
    const next = options[(currentIndex + 1) % options.length];
    setFilterSpecialization(next);
  };

  const cycleStatus = () => {
    setFilterStatus((prev) => (prev === 'all' ? 'active' : prev === 'active' ? 'inactive' : 'all'));
  };

  const specializationLabel =
    filterSpecialization === 'all' ? 'All Specializations' : String(filterSpecialization);
  const statusLabel = filterStatus === 'all' ? 'All Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1);

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <RNText style={styles.pageTitle}>Doctor Management</RNText>
          <RNText style={styles.pageSubtitle}>Manage medical staff, schedules, and performance metrics</RNText>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Total Doctors</RNText>
            <RNText style={styles.statValue}>{stats.totalDoctors}</RNText>
          </View>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Specializations</RNText>
            <RNText style={styles.statValue}>{stats.specializationCount}</RNText>
          </View>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Available Today</RNText>
            <RNText style={styles.statValue}>{stats.availableToday}</RNText>
          </View>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Total Appointments</RNText>
            <RNText style={styles.statValue}>{stats.totalAppointments}</RNText>
          </View>
        </View>

        <View style={styles.registryCard}>
          <View style={styles.registryHeader}>
            <View style={styles.registryHeaderText}>
              <RNText style={styles.registryTitle}>All Doctors</RNText>
              <RNText style={styles.registrySubtitle}>View and manage doctor profiles and schedules</RNText>
            </View>

            <View style={styles.registryHeaderActions}>
              <TouchableOpacity style={styles.exportButton} onPress={exportCsv}>
                <Ionicons name="download-outline" size={16} color="#111827" />
                <RNText style={styles.exportButtonText}>Export CSV</RNText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, license, specialization, or email..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filterRow}>
              <TouchableOpacity style={styles.select} onPress={cycleSpecialization}>
                <RNText style={styles.selectText} numberOfLines={1}>
                  {specializationLabel}
                </RNText>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.select} onPress={cycleStatus}>
                <RNText style={styles.selectText}>{statusLabel}</RNText>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#1E4BA3" />
              <RNText style={styles.loadingText}>Loading doctors...</RNText>
            </View>
          ) : loadError ? (
            <View style={styles.errorBox}>
              <RNText style={styles.errorText}>{loadError}</RNText>
              <TouchableOpacity style={styles.retryButton} onPress={fetchDoctors}>
                <RNText style={styles.retryButtonText}>Retry</RNText>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <RNText style={[styles.th, styles.colDoctorName]}>Doctor Name</RNText>
                  <RNText style={[styles.th, styles.colLicense]}>License No.</RNText>
                  <RNText style={[styles.th, styles.colSpecialization]}>Specialization</RNText>
                  <RNText style={[styles.th, styles.colExperience]}>Experience</RNText>
                  <RNText style={[styles.th, styles.colQualifications]}>Qualifications</RNText>
                  <RNText style={[styles.th, styles.colAvailability]}>Availability</RNText>
                  <RNText style={[styles.th, styles.colAction]}>Action</RNText>
                </View>

                {filteredDoctors.map((d) => (
                  <View key={d.doctorId} style={styles.tableRow}>
                    <View style={[styles.td, styles.colDoctorName]}>
                      <View style={styles.nameCell}>
                        <View style={styles.avatar}>
                          <Ionicons name="medical" size={18} color="#1E4BA3" />
                        </View>
                        <View style={styles.nameTextWrap}>
                          <RNText style={styles.nameText}>{d.fullName || '—'}</RNText>
                          <RNText style={styles.emailText}>{d.email || ''}</RNText>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.td, styles.colLicense]}>
                      <View style={styles.pill}>
                        <RNText style={styles.pillText}>{String(d.licenseNumber ?? '—') || '—'}</RNText>
                      </View>
                    </View>

                    <View style={[styles.td, styles.colSpecialization]}>
                      <View style={styles.badge}>
                        <RNText style={styles.badgeText}>{String(d.specialization ?? '—') || '—'}</RNText>
                      </View>
                    </View>

                    <RNText style={[styles.tdText, styles.td, styles.colExperience]}>
                      {typeof d.experience === 'number' ? `${d.experience} years` : '—'}
                    </RNText>

                    <RNText style={[styles.tdText, styles.td, styles.colQualifications]} numberOfLines={1}>
                      {String(d.qualifications ?? '—') || '—'}
                    </RNText>

                    <View style={[styles.td, styles.colAvailability]}>
                      <View style={styles.pillLight}>
                        <RNText style={styles.pillLightText}>Not specified</RNText>
                      </View>
                    </View>

                    <View style={[styles.td, styles.colAction]}>
                      <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => viewDoctorDetails(d)}>
                        <Ionicons name="document-text-outline" size={16} color="#111827" />
                        <RNText style={styles.viewDetailsText}>View Details</RNText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {filteredDoctors.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <RNText style={styles.emptyRowText}>No doctors found</RNText>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>Doctor Details</RNText>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedDoctor ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailsHeader}>
                  <View style={styles.detailsAvatar}>
                    <Ionicons name="medical" size={48} color="#1E4BA3" />
                  </View>
                  <RNText style={styles.detailsName}>{selectedDoctor.fullName || '—'}</RNText>
                  <RNText style={styles.detailsSub}>{selectedDoctor.email || ''}</RNText>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Professional</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Doctor ID</RNText>
                    <RNText style={styles.detailValue}>{selectedDoctor.doctorId}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>License No.</RNText>
                    <RNText style={styles.detailValue}>{String(selectedDoctor.licenseNumber ?? '—') || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Specialization</RNText>
                    <RNText style={styles.detailValue}>{String(selectedDoctor.specialization ?? '—') || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Experience</RNText>
                    <RNText style={styles.detailValue}>
                      {typeof selectedDoctor.experience === 'number' ? `${selectedDoctor.experience} years` : '—'}
                    </RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Qualifications</RNText>
                    <RNText style={styles.detailValue}>{String(selectedDoctor.qualifications ?? '—') || '—'}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Account</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Status</RNText>
                    <RNText style={styles.detailValue}>{selectedDoctor.isActive ? 'Active' : 'Inactive'}</RNText>
                  </View>
                </View>
              </ScrollView>
            ) : null}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowDetailsModal(false)}>
                <RNText style={styles.closeButtonText}>Close</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  page: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pageHeader: {
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 180,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  statValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  registryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  registryHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  registryHeaderText: {
    flexShrink: 1,
    minWidth: 200,
  },
  registryHeaderActions: {
    marginLeft: 'auto',
  },
  registryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  registrySubtitle: {
    marginTop: 2,
    color: '#6B7280',
    fontSize: 13,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  exportButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 170,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  selectText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 13,
    maxWidth: 140,
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  errorBox: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: '#B91C1C',
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1E4BA3',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  tableScroll: {
    marginTop: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    minWidth: 980,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  th: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  td: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  tdText: {
    color: '#111827',
    fontSize: 13,
  },
  colDoctorName: { width: 280 },
  colLicense: { width: 160 },
  colSpecialization: { width: 180 },
  colExperience: { width: 140 },
  colQualifications: { width: 240 },
  colAvailability: { width: 160 },
  colAction: { width: 170 },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameTextWrap: {
    flexShrink: 1,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  emailText: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  pillLight: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  pillLightText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  emptyRow: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyRowText: {
    color: '#6B7280',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailsHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  detailsName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  detailsSub: {
    marginTop: 4,
    color: '#6B7280',
    textAlign: 'center',
  },
  detailsSection: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  detailLabel: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 12,
    flex: 1,
  },
  detailValue: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E4BA3',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
