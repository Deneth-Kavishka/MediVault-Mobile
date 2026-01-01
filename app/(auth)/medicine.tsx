import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

// ---------------- Medicine Type ----------------
interface Medicine {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  meal: string;
  buy: string;
  doctorNote: string;
  status: "Pending" | "Active" | "Completed";
}

// ---------------- Medicine Data ----------------
const MEDICINES: Medicine[] = [
  {
    id: "1",
    name: "Paracetamol 500mg",
    dosage: "1 tablet",
    times: ["Morning", "Night"],
    meal: "After Meal",
    buy: "10 tablets",
    doctorNote: "Use for fever and body aches.",
    status: "Active",
  },
  {
    id: "2",
    name: "Amoxicillin 250mg",
    dosage: "1 capsule",
    times: ["Morning", "Afternoon", "Night"],
    meal: "Before Meal",
    buy: "21 capsules",
    doctorNote: "Complete the full course.",
    status: "Pending",
  },
  {
    id: "3",
    name: "Vitamin C",
    dosage: "1 tablet",
    times: ["Morning"],
    meal: "After Meal",
    buy: "30 tablets",
    doctorNote: "Boosts immunity.",
    status: "Completed",
  },
];

export default function MyMedicine() {
  const [selected, setSelected] = useState<Medicine | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const statusColors = {
    Pending: "#FFA726",
    Active: "#29B6F6",
    Completed: "#66BB6A",
  };

  const openDetails = (item: Medicine) => {
    setSelected(item);
    setDetailVisible(true);
  };

  const openQR = (item: Medicine) => {
    setSelected(item);
    setQrVisible(true);
  };

  const qrValue = selected
    ? `
Medicine: ${selected.name}
Dosage: ${selected.dosage}
Times: ${selected.times.join(", ")}
Meal: ${selected.meal}
Buy: ${selected.buy}
Doctor Note: ${selected.doctorNote}
Status: ${selected.status}
`
    : "";

  const renderCard = ({ item }: { item: Medicine }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.medicineName}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[item.status] },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.label}>Dosage: {item.dosage}</Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.buttonSmall}>
          <Text style={styles.buttonSmallText}>Mark Taken</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSmall}
          onPress={() => openQR(item)}
        >
          <Text style={styles.buttonSmallText}>QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSmall}
          onPress={() => openDetails(item)}
        >
          <Text style={styles.buttonSmallText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Medicine</Text>

      <FlatList
        data={MEDICINES}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      {/* -------- DETAILS MODAL -------- */}
      <Modal visible={detailVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>{selected?.name}</Text>

              <Text style={styles.modalText}><Text style={styles.bold}>Dosage:</Text> {selected?.dosage}</Text>
              <Text style={styles.modalText}><Text style={styles.bold}>Times:</Text> {selected?.times.join(", ")}</Text>
              <Text style={styles.modalText}><Text style={styles.bold}>Meal:</Text> {selected?.meal}</Text>
              <Text style={styles.modalText}><Text style={styles.bold}>Buy:</Text> {selected?.buy}</Text>
              <Text style={styles.modalText}><Text style={styles.bold}>Doctor Notes:</Text> {selected?.doctorNote}</Text>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDetailVisible(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* -------- QR CODE MODAL -------- */}
      <Modal visible={qrVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { alignItems: "center" }]}>
            <Text style={styles.modalTitle}>Medicine QR Code</Text>

            <QRCode value={qrValue} size={200} />

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setQrVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* -------- BOTTOM NAV -------- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/patient-dashboard")}
        >
          <Ionicons name="home-outline" size={24} color="#333" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="medkit-outline" size={26} color="#0277BD" />
          <Text style={[styles.navLabel, { color: "#0277BD" }]}>
            My Medicine
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-circle-outline" size={26} color="#333" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#E3EEF8" },
  header: { fontSize: 26, fontWeight: "800", color: "#0D47A1", marginBottom: 15 },

  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 15,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 5,
  },

  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  medicineName: { fontSize: 18, fontWeight: "700", color: "#0A3D62" },
  label: { fontSize: 14, marginTop: 4 },

  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusText: { color: "#fff", fontWeight: "700" },

  buttonsRow: { flexDirection: "row", marginTop: 12 },
  buttonSmall: {
    flex: 1,
    marginHorizontal: 4,
    padding: 8,
    backgroundColor: "#0277BD",
    borderRadius: 8,
  },
  buttonSmallText: { color: "#fff", textAlign: "center", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
  },

  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  modalText: { fontSize: 15, marginBottom: 8 },
  bold: { fontWeight: "700" },

  closeBtn: {
    backgroundColor: "#0277BD",
    padding: 10,
    borderRadius: 10,
    marginTop: 15,
  },
  closeText: { textAlign: "center", color: "#fff", fontWeight: "700" },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
    elevation: 12,
  },
  navItem: { alignItems: "center" },
  navLabel: { fontSize: 12, marginTop: 2 },
});
