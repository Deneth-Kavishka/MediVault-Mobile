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
    Switch,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface LabTest {
  id: string;
  patientName: string;
  patientNIC: string;
  testName: string;
  status: 'in_progress';
  priority: 'routine' | 'urgent' | 'stat';
  doctorName: string;
}

export default function UploadResults() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [testResults, setTestResults] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [resultNotes, setResultNotes] = useState('');

  const [testsInProgress] = useState<LabTest[]>([
    {
      id: '1',
      patientName: 'Jane Smith',
      patientNIC: '987654321V',
      testName: 'Urinalysis',
      status: 'in_progress',
      priority: 'routine',
      doctorName: 'Dr. Johnson',
    },
    {
      id: '2',
      patientName: 'Emily Davis',
      patientNIC: '321654987V',
      testName: 'Chest X-Ray',
      status: 'in_progress',
      priority: 'urgent',
      doctorName: 'Dr. Martinez',
    },
    {
      id: '3',
      patientName: 'Robert Wilson',
      patientNIC: '654987321V',
      testName: 'Thyroid Function Test',
      status: 'in_progress',
      priority: 'routine',
      doctorName: 'Dr. Brown',
    },
  ]);

  const handleUpload = (test: LabTest) => {
    setSelectedTest(test);
    setTestResults('');
    setIsAbnormal(false);
    setResultNotes('');
    setShowUploadModal(true);
  };

  const saveResults = () => {
    if (!testResults.trim()) {
      Alert.alert('Error', 'Please enter test results');
      return;
    }

    Alert.alert(
      'Success',
      `Results uploaded successfully!\n${isAbnormal ? 'Abnormal results flagged.\n' : ''}Notifications sent to Dr. ${selectedTest?.doctorName} and ${selectedTest?.patientName}.`
    );

    setShowUploadModal(false);
    setSelectedTest(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return '#EF4444';
      case 'urgent': return '#F59E0B';
      case 'routine': default: return '#10B981';
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.header}>
        <RNText style={styles.headerTitle}>Upload Test Results</RNText>
        <RNText style={styles.headerSubtitle}>{testsInProgress.length} tests ready for results</RNText>
      </View>

      <ScrollView
        style={styles.testsList}
        contentContainerStyle={styles.testsContent}
        showsVerticalScrollIndicator={false}
      >
        {testsInProgress.map(test => (
          <View key={test.id} style={styles.testCard}>
            <View style={styles.testInfo}>
              <View style={styles.testHeader}>
                <MaterialCommunityIcons name="test-tube" size={32} color="#1E4BA3" />
                <View style={styles.testDetails}>
                  <RNText style={styles.testName}>{test.testName}</RNText>
                  <RNText style={styles.patientName}>{test.patientName} • {test.patientNIC}</RNText>
                  <RNText style={styles.doctorName}>Ordered by Dr. {test.doctorName}</RNText>
                </View>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(test.priority) }]}>
                <RNText style={styles.priorityText}>{test.priority.toUpperCase()}</RNText>
              </View>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handleUpload(test)}
            >
              <MaterialCommunityIcons name="upload" size={20} color="#fff" />
              <RNText style={styles.uploadButtonText}>Upload Results</RNText>
            </TouchableOpacity>
          </View>
        ))}

        {testsInProgress.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-all" size={64} color="#9CA3AF" />
            <RNText style={styles.emptyText}>No tests awaiting results</RNText>
            <RNText style={styles.emptySubtext}>All tests have been completed</RNText>
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showUploadModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <RNText style={styles.modalTitle}>Upload Test Results</RNText>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedTest && (
                <>
                  <View style={styles.testInfoCard}>
                    <RNText style={styles.infoTitle}>{selectedTest.testName}</RNText>
                    <RNText style={styles.infoText}>{selectedTest.patientName} • {selectedTest.patientNIC}</RNText>
                  </View>

                  <View style={styles.formGroup}>
                    <RNText style={styles.formLabel}>Test Results *</RNText>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
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
                      style={styles.switchRow}
                      onPress={() => setIsAbnormal(!isAbnormal)}
                    >
                      <RNText style={styles.switchLabel}>Flag as Abnormal Result</RNText>
                      <Switch
                        value={isAbnormal}
                        onValueChange={setIsAbnormal}
                        trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                        thumbColor="#fff"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <RNText style={styles.formLabel}>Additional Notes</RNText>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      placeholder="Enter any additional observations..."
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
              <TouchableOpacity style={styles.saveButton} onPress={saveResults}>
                <MaterialCommunityIcons name="upload" size={20} color="#fff" />
                <RNText style={styles.saveButtonText}>Upload & Notify</RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUploadModal(false)}
              >
                <RNText style={styles.cancelButtonText}>Cancel</RNText>
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  testsList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  testsContent: {
    padding: 16,
  },
  testCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  testInfo: {
    marginBottom: 16,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  testDetails: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
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
    paddingVertical: 20,
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
  testInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
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
  textArea: {
    minHeight: 100,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  switchLabel: {
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

