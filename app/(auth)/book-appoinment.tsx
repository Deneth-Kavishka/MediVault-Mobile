// app/appointments.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// ---------------- Doctor Types ----------------
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
}

interface Appointment {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  reason: string;
}

// ---------------- Mock Doctor List ----------------
const DOCTORS: Doctor[] = [
  { id: "1", name: "Dr. Silva", specialty: "Cardiologist", hospital: "Lanka Hospital" },
  { id: "2", name: "Dr. Perera", specialty: "Dermatologist", hospital: "Asiri Hospital" },
  { id: "3", name: "Dr. Nimal", specialty: "Neurologist", hospital: "Hemas Hospital" },
  { id: "4", name: "Dr. Ruwan", specialty: "ENT Specialist", hospital: "Nawaloka Hospital" },
];

// -------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------
export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [visibleAdd, setVisibleAdd] = useState(false);
  const [visibleDoctorList, setVisibleDoctorList] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");

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
    alignItems: "center",
    marginBottom: 15,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 15,
    marginBottom: 15,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    elevation: 6,
  },

  docName: { fontSize: 18, fontWeight: "700", color: "#0A3D62" },
  label: { fontSize: 14, marginTop: 3, color: "#444" },
  reason: { fontSize: 14, flex: 1 },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },

  empty: { textAlign: "center", marginTop: 40, color: "#777" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000AA",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    maxHeight: "85%",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },

  saveBtn: {
    backgroundColor: "#0277BD",
    padding: 12,
    marginTop: 15,
    borderRadius: 10,
  },
  saveBtnText: { textAlign: "center", color: "#fff", fontWeight: "800" },

  closeBtn: {
    backgroundColor: "#B71C1C",
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
  },
  closeText: { textAlign: "center", color: "#fff", fontWeight: "700" },

  selectDoctorBtn: {
    padding: 12,
    backgroundColor: "#BBDEFB",
    borderRadius: 10,
    marginTop: 10,
  },
  selectDoctorText: { fontSize: 16, fontWeight: "600", color: "#0D47A1" },

  doctorItem: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    backgroundColor: "#E3F2FD",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 10,
    justifyContent: "space-around",
    elevation: 10,
  },
  navItem: { alignItems: "center" },
  navLabel: { fontSize: 12, marginTop: 3, color: "#333" },
});
