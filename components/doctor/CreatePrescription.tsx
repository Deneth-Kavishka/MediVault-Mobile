import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  ImageBackground,
  Platform,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionData {
  patientName: string;
  patientNIC: string;
  patientAge: string;
  patientPhone: string;
  medications: Medication[];
  diagnosis: string;
  notes: string;
}

export default function CreatePrescription() {
  const [prescriptionData, setPrescriptionData] = React.useState<PrescriptionData>({
    patientName: '',
    patientNIC: '',
    patientAge: '',
    patientPhone: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    diagnosis: '',
    notes: ''
  });

  const [generatedQRCode, setGeneratedQRCode] = React.useState<string>('');
  const [showQRPreview, setShowQRPreview] = React.useState(false);
  const [prescriptionCode, setPrescriptionCode] = React.useState<string>('');

  const addMedication = () => {
    setPrescriptionData({
      ...prescriptionData,
      medications: [...prescriptionData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMeds = [...prescriptionData.medications];
    updatedMeds[index] = { ...updatedMeds[index], [field]: value };
    setPrescriptionData({ ...prescriptionData, medications: updatedMeds });
  };

  const removeMedication = (index: number) => {
    if (prescriptionData.medications.length > 1) {
      setPrescriptionData({
        ...prescriptionData,
        medications: prescriptionData.medications.filter((_, i) => i !== index)
      });
    }
  };

  const generatePrescriptionQRCode = () => {
    // Validate required fields
    if (!prescriptionData.patientName || !prescriptionData.patientNIC) {
      Alert.alert('Validation Error', 'Patient name and NIC are required');
      return false;
    }

    const hasValidMedication = prescriptionData.medications.some(med => 
      med.name && med.dosage && med.frequency && med.duration
    );

    if (!hasValidMedication) {
      Alert.alert('Validation Error', 'Please add at least one complete medication');
      return false;
    }

    // Generate unique prescription code
    const code = `RX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setPrescriptionCode(code);
    
    // Create prescription data object
    const qrCodeData = {
      code: code,
      patientNIC: prescriptionData.patientNIC,
      patientName: prescriptionData.patientName,
      patientAge: prescriptionData.patientAge,
      patientPhone: prescriptionData.patientPhone,
      diagnosis: prescriptionData.diagnosis,
      doctorName: 'Dr. [Current Doctor]', // In real app, get from auth context
      issueDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      medications: prescriptionData.medications.filter(m => m.name && m.dosage),
      notes: prescriptionData.notes
    };

    // Convert to JSON string for QR code
    const qrData = JSON.stringify(qrCodeData);
    setGeneratedQRCode(qrData);
    setShowQRPreview(true);
    return true;
  };

  const handleSavePrescription = () => {
    const success = generatePrescriptionQRCode();
    if (success) {
      Alert.alert(
        'Success',
        `Prescription ${prescriptionCode} created successfully with QR code!`,
        [
          {
            text: 'Create New',
            onPress: () => {
              setPrescriptionData({
                patientName: '',
                patientNIC: '',
                patientAge: '',
                patientPhone: '',
                medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
                diagnosis: '',
                notes: ''
              });
              setShowQRPreview(false);
              setGeneratedQRCode('');
              setPrescriptionCode('');
            }
          },
          { text: 'OK', style: 'default' }
        ]
      );
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/Background-image.jpg')} 
      style={styles.container} 
      resizeMode="cover"
    >
      {/* Header */}
      <ImageBackground 
        source={require('../../assets/images/Background-image.jpg')} 
        style={styles.headerBackground} 
        resizeMode="cover"
      >
        <View style={styles.header}>
          <View style={styles.headerCard}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="file-document-edit" size={28} color="#1E4BA3" />
            </View>
            <RNText style={styles.headerTitle}>Create Prescription</RNText>
            <RNText style={styles.headerSubtitle}>Complete patient medical information</RNText>
          </View>
        </View>
      </ImageBackground>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Patient Information Section */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Patient Information</RNText>
          
          <RNText style={styles.label}>Patient Name *</RNText>
          <TextInput
            style={styles.input}
            placeholder="Enter patient full name"
            placeholderTextColor="#9CA3AF"
            value={prescriptionData.patientName}
            onChangeText={(text) => setPrescriptionData({ ...prescriptionData, patientName: text })}
          />

          <RNText style={styles.label}>Patient NIC *</RNText>
          <TextInput
            style={styles.input}
            placeholder="Enter patient NIC number"
            placeholderTextColor="#9CA3AF"
            value={prescriptionData.patientNIC}
            onChangeText={(text) => setPrescriptionData({ ...prescriptionData, patientNIC: text })}
          />

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <RNText style={styles.label}>Age</RNText>
              <TextInput
                style={styles.input}
                placeholder="Age"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={prescriptionData.patientAge}
                onChangeText={(text) => setPrescriptionData({ ...prescriptionData, patientAge: text })}
              />
            </View>

            <View style={styles.halfInput}>
              <RNText style={styles.label}>Phone</RNText>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={prescriptionData.patientPhone}
                onChangeText={(text) => setPrescriptionData({ ...prescriptionData, patientPhone: text })}
              />
            </View>
          </View>

          <RNText style={styles.label}>Diagnosis</RNText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter diagnosis"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={prescriptionData.diagnosis}
            onChangeText={(text) => setPrescriptionData({ ...prescriptionData, diagnosis: text })}
          />
        </View>

        {/* Medications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <RNText style={styles.sectionTitle}>Medications</RNText>
            <TouchableOpacity style={styles.addButton} onPress={addMedication}>
              <Ionicons name="add-circle" size={24} color="#1E4BA3" />
              <RNText style={styles.addButtonText}>Add Medication</RNText>
            </TouchableOpacity>
          </View>

          {prescriptionData.medications.map((medication, index) => (
            <View key={index} style={styles.medicationCard}>
              <View style={styles.medicationHeader}>
                <View style={styles.medicationNumber}>
                  <RNText style={styles.medicationNumberText}>{index + 1}</RNText>
                </View>
                <RNText style={styles.medicationTitle}>Medication {index + 1}</RNText>
                {prescriptionData.medications.length > 1 && (
                  <TouchableOpacity onPress={() => removeMedication(index)} style={styles.removeButton}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <RNText style={styles.label}>Medicine Name *</RNText>
              <TextInput
                style={styles.input}
                placeholder="e.g., Amoxicillin 500mg"
                placeholderTextColor="#9CA3AF"
                value={medication.name}
                onChangeText={(text) => updateMedication(index, 'name', text)}
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <RNText style={styles.label}>Dosage *</RNText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 500mg"
                    placeholderTextColor="#9CA3AF"
                    value={medication.dosage}
                    onChangeText={(text) => updateMedication(index, 'dosage', text)}
                  />
                </View>

                <View style={styles.halfInput}>
                  <RNText style={styles.label}>Frequency *</RNText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 3 times/day"
                    placeholderTextColor="#9CA3AF"
                    value={medication.frequency}
                    onChangeText={(text) => updateMedication(index, 'frequency', text)}
                  />
                </View>
              </View>

              <RNText style={styles.label}>Duration *</RNText>
              <TextInput
                style={styles.input}
                placeholder="e.g., 7 days"
                placeholderTextColor="#9CA3AF"
                value={medication.duration}
                onChangeText={(text) => updateMedication(index, 'duration', text)}
              />

              <RNText style={styles.label}>Instructions</RNText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Take with food, after meals"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                value={medication.instructions}
                onChangeText={(text) => updateMedication(index, 'instructions', text)}
              />
            </View>
          ))}
        </View>

        {/* Additional Notes Section */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Additional Notes</RNText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special instructions or precautions..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={prescriptionData.notes}
            onChangeText={(text) => setPrescriptionData({ ...prescriptionData, notes: text })}
          />
        </View>

        {/* QR Code Preview */}
        {showQRPreview && generatedQRCode && (
          <View style={styles.qrPreviewSection}>
            <View style={styles.qrPreviewHeader}>
              <MaterialCommunityIcons name="qrcode" size={28} color="#1E4BA3" />
              <RNText style={styles.qrPreviewTitle}>Generated QR Code</RNText>
            </View>
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={generatedQRCode}
                size={220}
                backgroundColor="white"
                color="black"
              />
              <RNText style={styles.prescriptionCode}>{prescriptionCode}</RNText>
            </View>
            <View style={styles.qrInfoCard}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <RNText style={styles.qrInfoText}>
                This QR code contains the complete prescription details and can be scanned by pharmacists
              </RNText>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.previewButton} onPress={generatePrescriptionQRCode}>
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#1E4BA3" />
            <RNText style={styles.previewButtonText}>Generate QR Code</RNText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSavePrescription}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <RNText style={styles.saveButtonText}>Save Prescription</RNText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  headerBackground: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  header: { 
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 }
    })
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#1F2937', 
    marginBottom: 6,
    textAlign: 'center'
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: '#6B7280',
    textAlign: 'center'
  },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  section: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 }
    })
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addButtonText: { fontSize: 14, fontWeight: '600', color: '#1E4BA3' },
  medicationCard: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  medicationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  medicationNumber: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#1E4BA3', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12
  },
  medicationNumberText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  medicationTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1 },
  removeButton: { padding: 4 },
  qrPreviewSection: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#1E4BA3',
    ...Platform.select({
      ios: { shadowColor: '#1E4BA3', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  qrPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  qrPreviewTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  qrCodeContainer: { alignItems: 'center', paddingVertical: 20 },
  prescriptionCode: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E4BA3', 
    marginTop: 16,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  qrInfoCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: '#EFF6FF', 
    padding: 12, 
    borderRadius: 10,
    marginTop: 16
  },
  qrInfoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  previewButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#fff', 
    paddingVertical: 16, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E4BA3'
  },
  previewButtonText: { fontSize: 15, fontWeight: '700', color: '#1E4BA3' },
  saveButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#1E4BA3', 
    paddingVertical: 16, 
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#1E4BA3', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  saveButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

