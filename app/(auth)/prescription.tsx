// app/(auth)/prescription.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import * as Print from "expo-print";
// @ts-ignore
import * as Sharing from "expo-sharing";

type Status = "Pending" | "Active" | "Expired" | "Completed";

type Prescription = {
  id: number;
  doctor: string;
  doctorContact?: string;
  patientName: string;
  issuedDate: string;
  pharmacy?: string;
  refillDate?: string | null;
  medicines: { name: string; dose?: string; frequency?: string }[];
  notes?: string;
  status: Status;
};


const mockFetchPrescriptions = (): Promise<Prescription[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 101,
          doctor: "Dr. Rohan Perera",
          doctorContact: "tel:+94123456789",
          patientName: "Nethra Sandamini",
          issuedDate: "2025-07-10",
          pharmacy: "City Pharmacy",
          refillDate: "2025-08-10",
          medicines: [
            { name: "Amoxicillin 500mg", dose: "1 capsule", frequency: "3x / day" },
            { name: "Vitamin C 500mg", dose: "1 tablet", frequency: "1x / day" },
          ],
          notes: "Take after food. Finish full course.",
          status: "Active",
        },
        {
          id: 102,
          doctor: "Dr. Kavitha Frendo",
          doctorContact: "mailto:dr.kavitha@example.com",
          patientName: "Saduni Himasha",
          issuedDate: "2024-12-01",
          pharmacy: "Green Valley Pharmacy",
          refillDate: null,
          medicines: [{ name: "Ibuprofen 200mg", dose: "1 tablet", frequency: "2x / day" }],
          notes: "Use only if pain persists.",
          status: "Expired",
        },
        {
          id: 103,
          doctor: "Dr. Sunil Kumar",
          doctorContact: "tel:+94771234567",
          patientName: "Saduni Himasha",
          issuedDate: "2025-11-23",
          pharmacy: "Sunrise Pharmacy",
          refillDate: "2026-02-01",
          medicines: [{ name: "Cetirizine 10mg", dose: "1 tablet", frequency: "1x / day" }],
          notes: "For allergy control.",
          status: "Pending",
        },
        {
          id: 104,
          doctor: "Dr. Meera Jayasuriya",
          doctorContact: "mailto:meera@example.com",
          patientName: "Saduni Himasha",
          issuedDate: "2025-01-15",
          pharmacy: "City Pharmacy",
          refillDate: null,
          medicines: [{ name: "Paracetamol 500mg", dose: "1 tablet", frequency: "3x / day" }],
          notes: "If fever above 38°C.",
          status: "Completed",
        },
      ]);
    }, 900);
  });

const mockRequestRefill = (prescriptionId: number): Promise<{ success: boolean }> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.12) reject(new Error("Refill request failed (network)"));
      else resolve({ success: true });
    }, 800);
  });

export default function PrescriptionScreen() {
  // mark navigation as any to avoid strict route typing errors in this screen
  const navigation = useNavigation<any>();
  const tabs: Status[] = ["Pending", "Active", "Expired", "Completed"];
  const [tab, setTab] = useState<Status>("Pending");
  const [data, setData] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [refillLoadingId, setRefillLoadingId] = useState<number | null>(null);

  const animValsRef = useRef<Record<number, Animated.Value>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mockFetchPrescriptions();
      setData(res);
      const m: Record<number, Animated.Value> = {};
      res.forEach((p) => (m[p.id] = new Animated.Value(0)));
      animValsRef.current = m;
      Animated.stagger(
        80,
        res.map((p) =>
          Animated.timing(animValsRef.current[p.id], {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          })
        )
      ).start();
    } catch (e: any) {
      setError(e.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const filtered = data
    .filter((p) => p.status === tab)
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.doctor.toLowerCase().includes(q) ||
        p.patientName.toLowerCase().includes(q) ||
        p.medicines.some((m) => m.name.toLowerCase().includes(q))
      );
    });

  const openDetails = (pres: Prescription) => {
    setSelected(pres);
    setDetailModalVisible(true);
  };
  const closeDetails = () => {
    setDetailModalVisible(false);
    setSelected(null);
  };

  const handleRequestRefill = async (pres: Prescription) => {
    setRefillLoadingId(pres.id);
    try {
      await mockRequestRefill(pres.id);
      Alert.alert("Refill Requested", "Your refill request has been sent to the pharmacy.");
    } catch (e: any) {
      Alert.alert("Request Failed", e.message || "Unable to request refill.");
    } finally {
      setRefillLoadingId(null);
    }
  };

  const handleContactDoctor = (pres: Prescription) => {
    const contact = pres.doctorContact;
    if (!contact) {
      Alert.alert("No contact", "Doctor contact not provided.");
      return;
    }
    import("react-native").then(({ Linking }) => {
      Linking.openURL(contact).catch(() => {
        Alert.alert("Unable to open contact", contact);
      });
    });
  };

  const getStatusColor = (s: Status) => {
    switch (s) {
      case "Active":
        return "#2ECC71";
      case "Pending":
        return "#F8C851";
      case "Expired":
        return "#E74C3C";
      case "Completed":
        return "#4D9EF6";
      default:
        return "#999";
    }
  };

  const generatePrescriptionHTML = (pres: Prescription) => {
    const medsRows = pres.medicines
      .map(
        (m) =>
          `<tr>
            <td style="padding:8px;border:1px solid #ddd;">${m.name}</td>
            <td style="padding:8px;border:1px solid #ddd;">${m.dose ?? ""}</td>
            <td style="padding:8px;border:1px solid #ddd;">${m.frequency ?? ""}</td>
          </tr>`
      )
      .join("\n");

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 18px; color:#222; }
            h1 { color: #1E4BA3; }
            .meta { margin-bottom: 12px; }
            table { border-collapse: collapse; width: 100%; margin-top:12px; }
            th { text-align:left; padding:8px; background:#f2f2f2; border:1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>Prescription #${pres.id}</h1>
          <div class="meta">
            <div><strong>Doctor:</strong> ${pres.doctor}</div>
            <div><strong>Patient:</strong> ${pres.patientName}</div>
            <div><strong>Issued:</strong> ${pres.issuedDate}</div>
            <div><strong>Pharmacy:</strong> ${pres.pharmacy ?? "-"}</div>
            <div><strong>Status:</strong> ${pres.status}</div>
            <div><strong>Notes:</strong> ${pres.notes ?? "-"}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Medicine</th><th>Dose</th><th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              ${medsRows}
            </tbody>
          </table>

          <div style="margin-top:18px;color:#777;font-size:12px;">
            Generated by MediVault
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPDF = async (pres: Prescription) => {
    try {
      const html = generatePrescriptionHTML(pres);
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === "ios" || (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: `Prescription-${pres.id}.pdf` });
      } else {
        Alert.alert("Saved", `PDF saved at ${uri}`);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to generate PDF");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bg-medical.png")}
      style={styles.root}
      imageStyle={{ opacity: 0.12 }}
      resizeMode="cover"
    >
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 6 }}>
          <Ionicons name="arrow-back" size={24} color="#133E7A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Prescriptions</Text>
      </View>

      {/* Search + Tabs */}
      <View style={styles.controls}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#555" />
          <TextInput
            placeholder="Search doctor, medicine, patient..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {tabs.map((t) => {
            const active = t === tab;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabBtn, active && { backgroundColor: getStatusColor(t), elevation: 2 }]}
              >
                <Text style={[styles.tabText, active && { color: "#fff", fontWeight: "700" }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E4BA3" />
            <Text style={{ marginTop: 8 }}>Loading prescriptions...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: "#E74C3C", fontWeight: "700" }}>Error</Text>
            <Text style={{ marginTop: 6 }}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="document-outline" size={48} color="#999" />
            <Text style={{ marginTop: 12, color: "#666" }}>No {tab} prescriptions</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => {
              const anim = animValsRef.current[item.id] ?? new Animated.Value(1);
              return (
                <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
                  <View style={styles.card}>
                    <View style={styles.cardRow}>
                      <View>
                        <Text style={styles.cardTitle}>#{item.id} — {item.medicines[0]?.name ?? "Prescription"}</Text>
                        <Text style={styles.cardMeta}>{item.doctor} • {item.issuedDate}</Text>
                        <Text style={styles.cardMetaSmall}>{item.pharmacy ?? "No pharmacy"}</Text>
                      </View>

                      <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.badgeText}>{item.status}</Text>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => openDetails(item)}>
                        <MaterialCommunityIcons name="eye-outline" size={18} color="#1E4BA3" />
                        <Text style={styles.actionText}>View Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownloadPDF(item)}>
                        <MaterialCommunityIcons name="download-outline" size={18} color="#1E4BA3" />
                        <Text style={styles.actionText}>Download PDF</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: "#E0E0E0" }]}
                        onPress={() => handleContactDoctor(item)}
                      >
                        <MaterialCommunityIcons name="phone-outline" size={18} color="#1E4BA3" />
                        <Text style={styles.actionText}>Contact</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.refillBtn]}
                        onPress={() => handleRequestRefill(item)}
                        disabled={refillLoadingId === item.id}
                      >
                        {refillLoadingId === item.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.refillText}>Request Refill</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              );
            }}
          />
        )}
      </View>

      {/* Details Modal */}
      <Modal visible={detailModalVisible} animationType="slide" onRequestClose={closeDetails} transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            {selected ? (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700" }}>Prescription #{selected.id}</Text>
                  <TouchableOpacity onPress={closeDetails}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.detailLabel}>Doctor</Text>
                <Text style={styles.detailValue}>{selected.doctor}</Text>

                <Text style={styles.detailLabel}>Issued</Text>
                <Text style={styles.detailValue}>{selected.issuedDate}</Text>

                <Text style={styles.detailLabel}>Pharmacy</Text>
                <Text style={styles.detailValue}>{selected.pharmacy ?? "-"}</Text>

                <Text style={styles.detailLabel}>Medicines</Text>
                {selected.medicines.map((m, i) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <Text style={{ fontWeight: "600" }}>{m.name}</Text>
                    <Text style={{ color: "#555" }}>{m.dose ?? ""} • {m.frequency ?? ""}</Text>
                  </View>
                ))}

                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{selected.notes ?? "-"}</Text>

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
                  <TouchableOpacity style={[styles.modalBtn]} onPress={() => { handleDownloadPDF(selected); }}>
                    <MaterialCommunityIcons name="download" size={18} color="#fff" />
                    <Text style={[styles.modalBtnText]}>Download PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#F39C12" }]} onPress={() => { handleRequestRefill(selected); }}>
                    <MaterialCommunityIcons name="autorenew" size={18} color="#fff" />
                    <Text style={[styles.modalBtnText]}>Request Refill</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/patient-dashboard')}>
          <Ionicons name="home-outline" size={26} color="#000000ff" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="document-text-outline" size={24} color="#1E4BA3" />
          <Text style={[styles.navText, { color: "#1E4BA3" }]}>Prescriptions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <Ionicons name="person-circle-outline" size={26} color="#333" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F7FB" },
  header: { paddingTop: 44, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: "#FFFFFF", borderBottomColor: "#EEF2F6", borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#133E7A" },
  controls: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#EDEFF6", elevation: 1 },
  searchInput: { marginLeft: 8, flex: 1, height: 36 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: "#fff", borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#EDEFF6" },
  tabText: { color: "#333", fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  center: { alignItems: "center", justifyContent: "center", paddingTop: 40 },
  retryBtn: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#1E4BA3", borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "700" },
  card: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#EEF2F6" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#133E7A" },
  cardMeta: { color: "#666", marginTop: 6 },
  cardMetaSmall: { color: "#999", marginTop: 2, fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontWeight: "700" },
  cardActions: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E6EDF9", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  actionText: { marginLeft: 8, color: "#1E4BA3", fontWeight: "700" },
  refillBtn: { marginLeft: "auto", backgroundColor: "#1E4BA3", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  refillText: { color: "#fff", fontWeight: "700" },
  modalBg: { flex: 1, backgroundColor: "rgba(12,12,12,0.45)", justifyContent: "center", padding: 18 },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  detailLabel: { color: "#666", marginTop: 8, fontWeight: "700" },
  detailValue: { color: "#222", marginTop: 4 },
  modalBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E4BA3", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  modalBtnText: { color: "#fff", marginLeft: 8, fontWeight: "700" },
  bottomNav: { height: 60, flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 1, borderColor: "#EDEFF6", backgroundColor: "#fff" },
  navItem: { alignItems: "center", justifyContent: "center" },
    navIcon: { fontSize: 24, marginBottom: 4 },
  navText: { fontSize: 12, color: "#333", marginTop: 2 },
});
