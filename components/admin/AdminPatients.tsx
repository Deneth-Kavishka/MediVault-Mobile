import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

interface PatientRegistryRow {
  patientId: string;
  userId: string;
  fullName: string;
  email: string;
  username?: string;
  nic?: string | null;
  rfid?: string | null;
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | string | null;
  contactInfo?: string | null;
  address?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  isActive: boolean;
  patientCreatedAt?: string | null;
  userCreatedAt?: string | null;
}

type StatusFilter = 'all' | 'active' | 'inactive';
type GenderFilter = 'all' | 'male' | 'female' | 'other';

export default function AdminPatients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<GenderFilter>('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');

  const [patients, setPatients] = useState<PatientRegistryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRegistryRow | null>(null);

  const normalizeText = (value: unknown) => String(value ?? '').trim().toLowerCase();

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/patients/registry`, {
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
        throw new Error(json?.message || `HTTP ${res.status} while loading patients`);
      }

      setPatients(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      setLoadError(String(e?.message || e));
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        normalizeText(p.fullName).includes(normalizeText(searchQuery)) ||
        normalizeText(p.email).includes(normalizeText(searchQuery)) ||
        normalizeText(p.nic).includes(normalizeText(searchQuery));

      const g = normalizeText(p.gender);
      const matchesGender = filterGender === 'all' || g === filterGender;

      const s: StatusFilter = p.isActive ? 'active' : 'inactive';
      const matchesStatus = filterStatus === 'all' || s === filterStatus;

      return matchesSearch && matchesGender && matchesStatus;
    });
  }, [patients, searchQuery, filterGender, filterStatus]);

  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const activeAccounts = patients.filter((p) => p.isActive).length;
    const inactiveAccounts = totalPatients - activeAccounts;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const registeredThisMonth = patients.filter((p) => {
      const createdRaw = p.patientCreatedAt || p.userCreatedAt;
      if (!createdRaw) return false;
      const d = new Date(createdRaw);
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    }).length;

    return { totalPatients, activeAccounts, inactiveAccounts, registeredThisMonth };
  }, [patients]);

  const getGenderIcon = (gender: string) => {
    switch (normalizeText(gender)) {
      case 'male':
        return 'gender-male';
      case 'female':
        return 'gender-female';
      default:
        return 'gender-male-female';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (normalizeText(gender)) {
      case 'male':
        return '#3B82F6';
      case 'female':
        return '#EC4899';
      default:
        return '#8B5CF6';
    }
  };

  const shortId = (id: string | null | undefined) => {
    const raw = String(id || '').trim();
    return raw ? raw.slice(0, 8) : '';
  };

  const maskRfid = (rfid: string | null | undefined) => {
    const raw = String(rfid || '').trim();
    if (!raw) return '';
    const last = raw.slice(-4);
    return `****${last}`;
  };

  const viewPatientDetails = (patient: PatientRegistryRow) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const exportCsv = () => {
    const header = ['Patient ID', 'Full Name', 'Email', 'NIC', 'Contact', 'Gender', 'RFID (Masked)', 'Status'];
    const rows = filteredPatients.map((p) => [
      shortId(p.patientId),
      p.fullName,
      p.email,
      p.nic || '',
      p.contactInfo || '',
      String(p.gender || ''),
      maskRfid(p.rfid),
      p.isActive ? 'Active' : 'Inactive',
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
    link.setAttribute('download', 'patients.csv');
    doc.body.appendChild(link);
    link.click();
    doc.body.removeChild(link);
    URL_.revokeObjectURL(url);
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <RNText style={styles.pageTitle}>Patient Management</RNText>
          <RNText style={styles.pageSubtitle}>View and manage patient registration and account status</RNText>
        </View>

        <View style={styles.noticeCard}>
          <MaterialCommunityIcons name="shield-account" size={18} color="#1E4BA3" />
          <RNText style={styles.noticeText}>
            <RNText style={styles.noticeTextBold}>Admin Access Notice:</RNText> As an administrator, you have access to basic patient information only. Medical records, lab reports, prescriptions, and diagnosis history are restricted to authorized medical personnel.
          </RNText>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Total Patients</RNText>
            <RNText style={styles.statValue}>{stats.totalPatients}</RNText>
          </View>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Active Accounts</RNText>
            <RNText style={[styles.statValue, styles.statValueGreen]}>{stats.activeAccounts}</RNText>
          </View>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Inactive Accounts</RNText>
            <RNText style={styles.statValue}>{stats.inactiveAccounts}</RNText>
          </View>
          <View style={styles.statCard}>
            <RNText style={styles.statLabel}>Registered This Month</RNText>
            <RNText style={styles.statValue}>{stats.registeredThisMonth}</RNText>
          </View>
        </View>

        <View style={styles.registryCard}>
          <View style={styles.registryHeader}>
            <View style={styles.registryHeaderText}>
              <RNText style={styles.registryTitle}>Patient Registry</RNText>
              <RNText style={styles.registrySubtitle}>Basic patient information and account management</RNText>
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
                placeholder="Search by name, NIC, or email..."
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
              <TouchableOpacity
                style={styles.select}
                onPress={() =>
                  setFilterGender((prev) =>
                    prev === 'all' ? 'male' : prev === 'male' ? 'female' : prev === 'female' ? 'other' : 'all'
                  )
                }
              >
                <RNText style={styles.selectText}>
                  {filterGender === 'all'
                    ? 'All Genders'
                    : filterGender.charAt(0).toUpperCase() + filterGender.slice(1)}
                </RNText>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.select}
                onPress={() =>
                  setFilterStatus((prev) => (prev === 'all' ? 'active' : prev === 'active' ? 'inactive' : 'all'))
                }
              >
                <RNText style={styles.selectText}>
                  {filterStatus === 'all' ? 'All Status' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                </RNText>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#1E4BA3" />
              <RNText style={styles.loadingText}>Loading patients...</RNText>
            </View>
          ) : loadError ? (
            <View style={styles.errorBox}>
              <RNText style={styles.errorText}>{loadError}</RNText>
              <TouchableOpacity style={styles.retryButton} onPress={fetchPatients}>
                <RNText style={styles.retryButtonText}>Retry</RNText>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <RNText style={[styles.th, styles.colPatientId]}>Patient ID</RNText>
                  <RNText style={[styles.th, styles.colFullName]}>Full Name</RNText>
                  <RNText style={[styles.th, styles.colNic]}>NIC</RNText>
                  <RNText style={[styles.th, styles.colContact]}>Contact</RNText>
                  <RNText style={[styles.th, styles.colGender]}>Gender</RNText>
                  <RNText style={[styles.th, styles.colRfid]}>RFID (Masked)</RNText>
                  <RNText style={[styles.th, styles.colStatus]}>Status</RNText>
                  <RNText style={[styles.th, styles.colAction]}>Action</RNText>
                </View>

                {filteredPatients.map((p) => {
                  const genderLabelRaw = String(p.gender || '—');
                  const genderLabel =
                    genderLabelRaw === '—' ? '—' : genderLabelRaw.charAt(0).toUpperCase() + genderLabelRaw.slice(1);

                  return (
                    <View key={p.patientId} style={styles.tableRow}>
                      <View style={[styles.td, styles.colPatientId]}>
                        <View style={styles.patientIdPill}>
                          <RNText style={styles.patientIdText}>{shortId(p.patientId)}</RNText>
                        </View>
                      </View>

                      <View style={[styles.td, styles.colFullName]}>
                        <View style={styles.nameCell}>
                          <View style={[styles.avatar, { backgroundColor: `${getGenderColor(String(p.gender || 'other'))}15` }]}>
                            <MaterialCommunityIcons
                              name={getGenderIcon(String(p.gender || 'other')) as any}
                              size={18}
                              color={getGenderColor(String(p.gender || 'other'))}
                            />
                          </View>
                          <View style={styles.nameTextWrap}>
                            <RNText style={styles.nameText}>{p.fullName || '—'}</RNText>
                            <RNText style={styles.emailText}>{p.email || ''}</RNText>
                          </View>
                        </View>
                      </View>

                      <RNText style={[styles.tdText, styles.td, styles.colNic]}>{p.nic || '—'}</RNText>
                      <RNText style={[styles.tdText, styles.td, styles.colContact]}>{p.contactInfo || '—'}</RNText>
                      <RNText style={[styles.tdText, styles.td, styles.colGender]}>{genderLabel}</RNText>
                      <View style={[styles.td, styles.colRfid]}>
                        <View style={styles.rfidPill}>
                          <RNText style={styles.rfidText}>{maskRfid(p.rfid) || '—'}</RNText>
                        </View>
                      </View>
                      <View style={[styles.td, styles.colStatus]}>
                        <View style={[styles.statusPill, p.isActive ? styles.statusPillActive : styles.statusPillInactive]}>
                          <RNText style={styles.statusPillText}>{p.isActive ? 'Active' : 'Inactive'}</RNText>
                        </View>
                      </View>
                      <View style={[styles.td, styles.colAction]}>
                        <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => viewPatientDetails(p)}>
                          <Ionicons name="document-text-outline" size={16} color="#111827" />
                          <RNText style={styles.viewDetailsText}>View Details</RNText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {filteredPatients.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <RNText style={styles.emptyRowText}>No patients found</RNText>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <Modal visible={showDetailsModal} animationType="slide" transparent onRequestClose={() => setShowDetailsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>Patient Details</RNText>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedPatient ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailsHeader}>
                  <View style={[styles.detailsAvatar, { backgroundColor: `${getGenderColor(String(selectedPatient.gender || 'other'))}15` }]}>
                    <MaterialCommunityIcons
                      name={getGenderIcon(String(selectedPatient.gender || 'other')) as any}
                      size={48}
                      color={getGenderColor(String(selectedPatient.gender || 'other'))}
                    />
                  </View>
                  <RNText style={styles.detailsName}>{selectedPatient.fullName || '—'}</RNText>
                  <RNText style={styles.detailsSub}>{selectedPatient.email || ''}</RNText>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Basic Information</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Patient ID</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.patientId}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>NIC</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.nic || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>RFID (Masked)</RNText>
                    <RNText style={styles.detailValue}>{maskRfid(selectedPatient.rfid) || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Gender</RNText>
                    <RNText style={styles.detailValue}>
                      {String(selectedPatient.gender || '—').charAt(0).toUpperCase() + String(selectedPatient.gender || '').slice(1)}
                    </RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Blood Type</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.bloodType || '—'}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Contact</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Contact</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.contactInfo || '—'}</RNText>
                  </View>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Address</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.address || '—'}</RNText>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <RNText style={styles.detailsSectionTitle}>Account</RNText>
                  <View style={styles.detailRow}>
                    <RNText style={styles.detailLabel}>Status</RNText>
                    <RNText style={styles.detailValue}>{selectedPatient.isActive ? 'Active' : 'Inactive'}</RNText>
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
  noticeCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    marginBottom: 14,
    alignItems: 'flex-start',
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
  noticeText: {
    flex: 1,
    color: '#1F2937',
    fontSize: 13,
    lineHeight: 18,
  },
  noticeTextBold: {
    fontWeight: '800',
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
  statValueGreen: {
    color: '#10B981',
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
    minWidth: 150,
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
    fontWeight: '800',
  },
  tableScroll: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  table: {
    minWidth: 980,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  th: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
  },
  td: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  tdText: {
    color: '#111827',
    fontSize: 13,
  },
  colPatientId: { width: 110 },
  colFullName: { width: 260 },
  colNic: { width: 160 },
  colContact: { width: 160 },
  colGender: { width: 100 },
  colRfid: { width: 150 },
  colStatus: { width: 110 },
  colAction: { width: 160 },
  patientIdPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  patientIdText: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 12,
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameTextWrap: {
    flex: 1,
  },
  nameText: {
    fontWeight: '800',
    color: '#111827',
    fontSize: 13,
  },
  emailText: {
    marginTop: 2,
    color: '#6B7280',
    fontSize: 12,
  },
  rfidPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  rfidText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 12,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillActive: {
    backgroundColor: '#22C55E',
  },
  statusPillInactive: {
    backgroundColor: '#9CA3AF',
  },
  statusPillText: {
    fontWeight: '800',
    fontSize: 12,
    color: '#fff',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  viewDetailsText: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 13,
  },
  emptyRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyRowText: {
    color: '#6B7280',
    fontWeight: '700',
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
  detailsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailsName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  detailsSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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

