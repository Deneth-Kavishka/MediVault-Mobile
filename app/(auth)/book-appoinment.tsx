
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../src/config/constants";


// ---------------- Doctor Types ----------------

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
}

interface Appointment {
  id: string;
  doctor_id?: string;
  appointment_date?: string;
  appointment_time?: string;
  reason?: string;
}

// ---------------- MOCK DOCTORS ----------------
// Updated with real doctor IDs from the database
const DOCTORS: Doctor[] = [
  { id: "d1b751c0-faf5-47ad-8c97-5f45dc16fab1", name: "Dr. Silva", specialty: "Cardiology", hospital: "Lanka Hospital" },
  { id: "a9ef9f57-9ceb-4d6a-b392-9da3b69c9dcc", name: "Dr. Perera", specialty: "Pediatrics", hospital: "Asiri Hospital" },
  { id: "2a3bdc64-69eb-4cbb-ba90-fc11c0a72935", name: "Dr. Nimal", specialty: "General Medicine", hospital: "Hemas Hospital" },
  { id: "ce138882-45ee-40f4-bfc8-9794ed4ea00d", name: "Dr. Ruwan", specialty: "Neurology", hospital: "Nawaloka Hospital" },
];



export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [visibleAdd, setVisibleAdd] = useState(false);
  const [visibleDoctorList, setVisibleDoctorList] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");


  // ---------------- BOOK APPOINTMENT (FIXED) ----------------
  const getApiBase = () => {
    try {
      let base = API_BASE_URL.replace(/\/api\/?$/i, "") || API_BASE_URL;
      if (Platform.OS === "android") {
        base = base.replace("localhost", "10.0.2.2");
      }
      return base;
    } catch (e) {
      return API_BASE_URL;
    }
  };

  const toISODateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr) return new Date().toISOString();
    const t = String(timeStr || "").trim();
    const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    let hh = "00", mm = "00";
    if (m) {
      let h = parseInt(m[1], 10);
      mm = m[2];
      const ampm = m[3];
      if (ampm) {
        if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
        if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
      }
      hh = String(h).padStart(2, "0");
    } else if (t.includes(":")) {
      const parts = t.split(":");
      hh = String(parseInt(parts[0], 10) || 0).padStart(2, "0");
      mm = (parts[1] || "00").slice(0, 2).padStart(2, "0");
    }
    return `${dateStr}T${hh}:${mm}:00`;
  };

  const bookAppointment = async () => {
    console.log("🔵 bookAppointment called");
    console.log("Selected Doctor:", selectedDoctor);
    console.log("Date:", date);
    console.log("Time:", time);
    console.log("Reason:", reason);

    if (!selectedDoctor || !date || !time || !reason) {
      Alert.alert("Missing data", "Please fill all fields");
      return;
    }

    try {
      const patient_id = "f0bb7913-6e31-4187-97db-5edede61b1c9";
      const base = getApiBase();
      const appointment_date = toISODateTime(date, time);
      
      console.log("Formatted appointment_date:", appointment_date);

      const requestBody = {
        patient_id,
        doctor_id: selectedDoctor.id,
        appointment_date,
        appointment_time: time,
        reason,
      };

      console.log("POST /appointments ->", requestBody, "base=", base);

      const response = await fetch(`${base}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { raw: text };
      }

      console.log("POST /appointments response:", response.status, data);

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || "Server error";
        console.error("Booking failed:", errorMsg);
        Alert.alert("Booking Failed", errorMsg + "\n\nCheck backend console for details.");
        return;
      }

      if (!data.data) {
        console.error("No data returned from server", data);
        Alert.alert("Booking Error", "Server did not return appointment data");
        return;
      }

      console.log("✅ Booking successful, adding to list:", data.data);
      
      setAppointments((prev) => [
        ...prev,
        {
          id: data.data.id || String(Date.now()),
          doctor_id: data.data.doctor_id,
          appointment_date: data.data.appointment_date || appointment_date,
          appointment_time: data.data.appointment_time || time,
          reason: data.data.reason || reason,
        },
      ]);

      setDate("");
      setTime("");
      setReason("");
      setSelectedDoctor(null);
      setVisibleAdd(false);
      
      Alert.alert("Success!", "Appointment booked successfully ✓");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not connect to server");
    }
  };

  // ---------------- LOAD APPOINTMENTS ----------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getApiBase()}/appointments`);
        const json = await res.json();
        if (res.ok && json.data) {
          setAppointments(json.data);
        }
      } catch (err) {
        console.warn("Failed to load appointments", err);
      }
    })();
  }, []);

  // Delete appointment (sends request to backend)
  const deleteAppointment = (id: string) => {
    (async () => {
      try {
        const res = await fetch(`${getApiBase()}/appointments/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          console.warn('Could not delete', j);
          Alert.alert('Delete failed', j?.error || 'Could not delete appointment');
          return;
        }
        setAppointments((prev) => prev.filter((x) => x.id !== id));
      } catch (err) {
        console.error('Delete error', err);
        Alert.alert('Delete error', String(err));
      }
    })();
  };

  const filteredDoctors = DOCTORS.filter((d) =>
    d.specialty.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const findDoctor = (id?: string) => DOCTORS.find((d) => d.id === id);

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const doc = findDoctor(item.doctor_id);
    return (
      <View style={styles.card}>
        <Text style={styles.docName}>{doc?.name || "Unknown Doctor"}</Text>
        <Text style={styles.label}>Specialty: {doc?.specialty || "-"}</Text>
        <Text style={styles.label}>Hospital: {doc?.hospital || "-"}</Text>
        <Text style={styles.label}>Date: {item.appointment_date?.slice(0, 10)}</Text>
        <Text style={styles.label}>Time: {item.appointment_time}</Text>
        <Text style={styles.reason}>Reason: {item.reason}</Text>
        <View style={styles.rowBetween}>
          <View />
          <TouchableOpacity onPress={() => deleteAppointment(item.id)}>
            <Ionicons name="trash-outline" size={22} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ---------------- UI ----------------
  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Appointments</Text>

      <TouchableOpacity style={styles.addBtn} onPress={() => setVisibleAdd(true)}>
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.addBtnText}>Add Appointment</Text>
      </TouchableOpacity>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
        ListEmptyComponent={<Text style={styles.empty}>No Appointments Found</Text>}
      />

      {/* BOOK MODAL */}
      <Modal visible={visibleAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>Book Appointment</Text>

              <TouchableOpacity
                style={styles.selectDoctorBtn}
                onPress={() => setVisibleDoctorList(true)}
              >
                <Text style={styles.selectDoctorText}>
                  {selectedDoctor
                    ? `${selectedDoctor.name} (${selectedDoctor.specialty})`
                    : "Select Doctor"}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
              />

              <TextInput
                style={styles.input}
                placeholder="Time (HH:MM)"
                value={time}
                onChangeText={setTime}
              />

              <TextInput
                style={styles.input}
                placeholder="Reason"
                value={reason}
                onChangeText={setReason}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={bookAppointment}>
                <Text style={styles.saveBtnText}>Confirm Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setVisibleAdd(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DOCTOR LIST MODAL */}
      <Modal visible={visibleDoctorList} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TextInput
              style={styles.input}
              placeholder="Search specialty"
              value={doctorSearch}
              onChangeText={setDoctorSearch}
            />

            <ScrollView>
              {filteredDoctors.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.doctorItem}
                  onPress={() => {
                    setSelectedDoctor(doc);
                    setVisibleDoctorList(false);
                  }}
                >
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.label}>{doc.specialty}</Text>
                  <Text style={styles.label}>{doc.hospital}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push("/patient-dashboard")}>
          <Ionicons name="home-outline" size={26} />
          <Text>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="calendar-outline" size={26} color="#0277BD" />
          <Text style={{ color: "#0277BD" }}>Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/medicine")}>
          <Ionicons name="medkit-outline" size={26} />
          <Text>Medicine</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#E8F3FF" },
  header: { fontSize: 28, fontWeight: "800", marginBottom: 15 },
  const filteredDoctors = DOCTORS.filter((d) =>
    d.specialty.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const bookAppointment = () => {
    if (!selectedDoctor || !date || !time || !reason) return;

    const newAppointment: Appointment = {
      id: Math.random().toString(),
      doctor: selectedDoctor,
      date,
      time,
      reason,
    };

    setAppointments([...appointments, newAppointment]);

    setDate("");
    setTime("");
    setReason("");
    setSelectedDoctor(null);
    setVisibleAdd(false);
  };

  const deleteAppointment = (id: string) => {
    setAppointments(appointments.filter((x) => x.id !== id));
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
      <Text style={styles.docName}>{item.doctor.name}</Text>
      <Text style={styles.label}>Specialty: {item.doctor.specialty}</Text>
      <Text style={styles.label}>Hospital: {item.doctor.hospital}</Text>
      <Text style={styles.label}>Date: {item.date}</Text>
      <Text style={styles.label}>Time: {item.time}</Text>

      <View style={styles.rowBetween}>
        <Text style={styles.reason}>Reason: {item.reason}</Text>

        <TouchableOpacity onPress={() => deleteAppointment(item.id)}>
          <Ionicons name="trash-outline" size={22} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
      <View style={styles.container}>
        <Text style={styles.header}>My Appointments</Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setVisibleAdd(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addBtnText}>Add Appointment</Text>
        </TouchableOpacity>

        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.empty}>No Appointments Found</Text>
          }
        />

        {/* Add Appointment Modal */}
        <Modal visible={visibleAdd} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <ScrollView>
                <Text style={styles.modalTitle}>Book Appointment</Text>

                <TouchableOpacity
                  style={styles.selectDoctorBtn}
                  onPress={() => setVisibleDoctorList(true)}
                >
                  <Text style={styles.selectDoctorText}>
                    {selectedDoctor
                      ? selectedDoctor.name + " (" + selectedDoctor.specialty + ")"
                      : "Select Doctor"}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder="Select Date (Ex: 2025-12-05)"
                  value={date}
                  onChangeText={setDate}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Select Time (Ex: 10:30 AM)"
                  value={time}
                  onChangeText={setTime}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Reason For Appointment"
                  value={reason}
                  onChangeText={setReason}
                />

                <TouchableOpacity style={styles.saveBtn} onPress={bookAppointment}>
                  <Text style={styles.saveBtnText}>Confirm Booking</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setVisibleAdd(false)}
                >
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Doctor Selection Modal */}
        <Modal visible={visibleDoctorList} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Search Doctors</Text>

              <TextInput
                style={styles.input}
                placeholder="Search specialty (cardio, skin...)"
                value={doctorSearch}
                onChangeText={setDoctorSearch}
              />

              <ScrollView style={{ maxHeight: 300 }}>
                {filteredDoctors.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.doctorItem}
                    onPress={() => {
                      setSelectedDoctor(doc);
                      setVisibleDoctorList(false);
                    }}
                  >
                    <Text style={styles.docName}>{doc.name}</Text>
                    <Text style={styles.label}>{doc.specialty}</Text>
                    <Text style={styles.label}>{doc.hospital}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setVisibleDoctorList(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/patient-dashboard")}
          >
            <Ionicons name="home-outline" size={26} color="#333" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="calendar-outline" size={28} color="#0277BD" />
            <Text style={[styles.navLabel, { color: "#0277BD" }]}>
              Appointments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/(auth)/medicine")}
          >
            <Ionicons name="medkit-outline" size={26} color="#333" />
            <Text style={styles.navLabel}>Medicine</Text>
          </TouchableOpacity>
        </View>
      </View>
  );
}

// -------------------------------------------------
// STYLES
// -------------------------------------------------
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: "#E8F3FF",  // ✅ Light Blue Background
  },

  header: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0D47A1",
    marginBottom: 15,
  },


  addBtn: {
    flexDirection: "row",
    backgroundColor: "#0277BD",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  addBtnText: { color: "#fff", marginLeft: 8, fontWeight: "700" },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 14, marginBottom: 10 },
  docName: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 14, color: "#555" },
  reason: { marginTop: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  empty: { textAlign: "center", marginTop: 30 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000AA",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: { width: "85%", backgroundColor: "#fff", padding: 15, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  input: {
    backgroundColor: "#E3F2FD",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: "#0277BD",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  saveBtnText: { color: "#fff", textAlign: "center", fontWeight: "800" },
  closeBtn: { backgroundColor: "#B71C1C", padding: 10, marginTop: 10, borderRadius: 10 },
  closeText: { color: "#fff", textAlign: "center" },
  selectDoctorBtn: { padding: 12, backgroundColor: "#BBDEFB", borderRadius: 10, marginTop: 10 },
  selectDoctorText: { fontWeight: "600" },
  doctorItem: { padding: 12, backgroundColor: "#E3F2FD", borderRadius: 10, marginTop: 8 },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
});
