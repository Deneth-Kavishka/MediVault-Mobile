// app/(auth)/patient-dashboard.tsx

import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


type Appointment = {
  id: string;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  hospital: string;
};

const SAMPLE_APPOINTMENTS: Appointment[] = [
  { id: "1", date: "2025-07-12", time: "10:00 AM", doctor: "Dr. Rohan Perera", specialty: "Cardiology", status: "Completed", hospital: "City Hospital" },
  { id: "2", date: "2025-11-23", time: "09:00 AM", doctor: "Dr. Kavitha Frendo", specialty: "Dermatology", status: "Scheduled", hospital: "Green Valley Clinic" },
  { id: "3", date: "2025-12-05", time: "02:30 PM", doctor: "Dr. Sunil Kumar", specialty: "General Medicine", status: "Scheduled", hospital: "City Hospital" },
  { id: "4", date: "2025-06-15", time: "11:00 AM", doctor: "Dr. Meera Jayasuriya", specialty: "Pediatrics", status: "Completed", hospital: "Sunrise Medical Center" },
];

const HOSPITALS = [" Hospital", "City Hospital", "Green Valley Clinic", "Sunrise Medical Center"];
const SPECIALIZATIONS = ["speaclist", "Cardiology", "Dermatology", "General Medicine", "Pediatrics"];

export default function PatientDashboard() {
  const router = useRouter();

  const [selectedHospital, setSelectedHospital] = useState<string>(HOSPITALS[0]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(SPECIALIZATIONS[0]);
  const [searchText, setSearchText] = useState<string>("");
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [appointments] = useState<Appointment[]>(SAMPLE_APPOINTMENTS);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (selectedHospital !== " Hospital" && a.hospital !== selectedHospital) return false;
      if (selectedSpecialty !== "speaclist" && a.specialty !== selectedSpecialty) return false;

      if (date) {
        const d = date.toISOString().slice(0, 10);
        if (a.date !== d) return false;
      }

      if (searchText.trim().length > 0) {
        const q = searchText.toLowerCase();
        if (!(a.doctor.toLowerCase().includes(q) || a.specialty.toLowerCase().includes(q))) return false;
      }

      return true;
    });
  }, [appointments, selectedHospital, selectedSpecialty, date, searchText]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
  };

  const clearFilters = () => {
    setSelectedHospital(HOSPITALS[0]);
    setSelectedSpecialty(SPECIALIZATIONS[0]);
    setDate(null);
    setSearchText("");
  };

  const formatStatusStyle = (status: Appointment["status"]) => {
    switch (status) {
      case "Completed": return [styles.statusBadge, { backgroundColor: "#2ECC71" }];
      case "Scheduled": return [styles.statusBadge, { backgroundColor: "#F8C851" }];
      case "Cancelled": return [styles.statusBadge, { backgroundColor: "#E74C3C" }];
      default: return styles.statusBadge;
    }
  };

  return (

    <View style={styles.bg}>
   
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.logoCircle}>
              <Ionicons name="medkit" size={20} color="#1E4BA3" />
            </View>
            <Text style={styles.headerTitle}>Patient Dashboard</Text>
          </View>

          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push("/profile")}>
            <Ionicons name="person-circle" size={32} color="#1E4BA3" />
          </TouchableOpacity>
        </View>

        {/* Channel Card */}
        <View style={styles.channelCard}>
          <Text style={styles.cardHeading}>Channel Your Doctor</Text>

          <View style={styles.inputRow}>
            <Ionicons name="person" size={18} color="#555" style={styles.inputIcon} />
            <TextInput placeholder="Doctor" placeholderTextColor="#777" value={searchText} onChangeText={setSearchText} style={styles.inputFlex} />
          </View>

          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="hospital-building" size={18} color="#555" style={styles.inputIcon} />
            <Picker selectedValue={selectedHospital} onValueChange={(v) => setSelectedHospital(String(v))} style={styles.picker} mode="dropdown">
              {HOSPITALS.map((h) => <Picker.Item label={h} value={h} key={h} />)}
            </Picker>
          </View>

          <View style={styles.inputRow}>
            <FontAwesome5 name="stethoscope" size={16} color="#555" style={styles.inputIcon} />
            <Picker selectedValue={selectedSpecialty} onValueChange={(v) => setSelectedSpecialty(String(v))} style={styles.picker} mode="dropdown">
              {SPECIALIZATIONS.map((s) => <Picker.Item label={s} value={s} key={s} />)}
            </Picker>
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="calendar" size={18} color="#555" style={styles.inputIcon} />
            <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{date ? date.toISOString().slice(0, 10) : "Any Date"}</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker value={date ?? new Date()} mode="date" display={Platform.OS === "ios" ? "spinner" : "calendar"} onChange={onDateChange} />
            )}
          </View>

          <View style={styles.searchRow}>
            <TouchableOpacity style={styles.searchBtn}>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.searchBtnText}> Search</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.sectionTitle}>Appointments</Text>

        {/* Horizontal Scroll Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={[styles.tableCard, { minWidth: 700 }]}>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: 100 }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { width: 100 }]}>Time</Text>
              <Text style={[styles.tableHeaderText, { width: 180 }]}>Doctor</Text>
              <Text style={[styles.tableHeaderText, { width: 180 }]}>Specialty</Text>
              <Text style={[styles.tableHeaderText, { width: 120, textAlign: "center" }]}>Status</Text>
            </View>

            {/* Table List */}
            <FlatList
              data={filtered}
              keyExtractor={(i) => i.id}
              style={{ maxHeight: 260 }}
              nestedScrollEnabled={true}
              renderItem={({ item }) => (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: 100 }]}>{item.date}</Text>
                  <Text style={[styles.tableCell, { width: 100 }]}>{item.time}</Text>
                  <Text style={[styles.tableCell, { width: 180 }]}>{item.doctor}</Text>
                  <Text style={[styles.tableCell, { width: 180 }]}>{item.specialty}</Text>
                  <View style={{ width: 120, alignItems: "center" }}>
                    <View style={formatStatusStyle(item.status)}>
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>
                </View>
              )}
            />

          </View>
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(auth)/prescription")}>
            <MaterialCommunityIcons name="prescription" size={28} color="#1E4BA3" />
            <Text style={styles.quickLabel}>Prescription</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(auth)/lab-report")}>
            <MaterialCommunityIcons name="file-document-outline" size={28} color="#1E4BA3" />
            <Text style={styles.quickLabel}>Lab Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(auth)/medicine")}>
            <MaterialCommunityIcons name="pill" size={28} color="#1E4BA3" />
            <Text style={styles.quickLabel}>Medicine</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(auth)/payment-history")}>
            <MaterialCommunityIcons name="cash" size={28} color="#1E4BA3" />
            <Text style={styles.quickLabel}>Payment</Text>
          </TouchableOpacity>
        </View>

        {/* CTA Buttons */}
        <View style={{ width: "100%", marginTop: 14, marginBottom: 36 }}>
          <TouchableOpacity style={styles.primaryCTABtn} onPress={() => router.push("/(auth)/book-appoinment")}>
            <Text style={styles.primaryCTAText}>Book Appointment</Text>
          </TouchableOpacity>

          <View style={styles.rowSplit}>
            <TouchableOpacity style={styles.secondaryCTABtn} onPress={() => router.push("/profile")}>
              <Text style={styles.secondaryCTAText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryCTABtn} onPress={() => router.push("/chat")}>
              <Text style={styles.secondaryCTAText}>Chat with Doctor</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

    </View>

  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#F6FAFF" },
  container: { padding: 18, paddingBottom: 40 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  logoCircle: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#E6F0FF", alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1E4BA3" },
  profileBtn: { padding: 4 },

  channelCard: { backgroundColor: "#eef6ff", padding: 18, borderRadius: 14, marginBottom: 20 },
  cardHeading: { fontSize: 18, fontWeight: "700", color: "#133e7a", marginBottom: 12, alignSelf: "center" },

  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#E0E6F2", paddingHorizontal: 10, height: 46 },
  inputIcon: { marginRight: 8 },
  inputFlex: { flex: 1 },
  picker: { flex: 1, height: 44 },

  dateButton: { flex: 1, justifyContent: "center", height: 46 },
  dateText: { color: "#444" },

  searchRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  searchBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E4BA3", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  searchBtnText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
  clearBtn: { justifyContent: "center", paddingHorizontal: 12 },
  clearBtnText: { color: "#1E4BA3", fontWeight: "600" },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1E4BA3", marginBottom: 10 },

  tableCard: { backgroundColor: "#fff", borderRadius: 12, padding: 10, marginBottom: 14 },
  tableHeader: { flexDirection: "row", paddingVertical: 8, borderBottomColor: "#EEF2F6", borderBottomWidth: 1, marginBottom: 6 },
  tableHeaderText: { fontSize: 13, fontWeight: "700", color: "#556" },

  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, backgroundColor: "#fbfdff", borderRadius: 6, marginBottom: 8 },
  tableCell: { fontSize: 13, color: "#333", paddingHorizontal: 6 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, minWidth: 86, alignItems: "center" },
  statusText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  quickRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  quickCard: { width: "23%", alignItems: "center", paddingVertical: 12, backgroundColor: "#fff", borderRadius: 10 },
  quickLabel: { fontSize: 12, marginTop: 6, color: "#1E4BA3", fontWeight: "600" },

  primaryCTABtn: { backgroundColor: "#1E4BA3", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  primaryCTAText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  rowSplit: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  secondaryCTABtn: { flex: 1, backgroundColor: "#fff", paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E1E7F6", alignItems: "center" },
  secondaryCTAText: { color: "#1E4BA3", fontWeight: "700" },
});
