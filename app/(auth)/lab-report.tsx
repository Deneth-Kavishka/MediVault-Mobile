// app/(auth)/lab-reports.tsx
// Includes:
// ✔ Back Button → navigate to patient-dashbord
// ✔ Bottom Navigation Bar
// ✔ Tabs, Search, Modal, PDF Download
// ✔ Full working screen

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
import { useRouter } from "expo-router";

/* -----------------------
   Types
   ----------------------- */
interface Report {
  id: number;
  title: string;
  date: string;
  doctor: string;
  hospital: string;
  status: "Pending" | "Available";
  summary: string;
  details: string;
}

/* -----------------------
   Mock API
   ----------------------- */
const mockFetchLabReports = (): Promise<Report[]> =>
  new Promise<Report[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 201,
          title: "Full Blood Count (CBC)",
          date: "2025-11-10",
          doctor: "Dr. Silva",
          hospital: "City Hospital",
          status: "Available",
          summary:
            "HB: 13.6 g/dL, WBC: 6.4 x10^3/µL, Platelets: 250 x10^3/µL.",
          details:
            "Hemoglobin, white cells and platelets are within reference ranges.",
        },
        {
          id: 202,
          title: "Lipid Profile",
          date: "2025-10-20",
          doctor: "Dr. Perera",
          hospital: "Green Valley Lab",
          status: "Available",
          summary: "Cholesterol normal range.",
          details: "Borderline LDL.",
        },
        {
          id: 203,
          title: "Chest X-Ray Report",
          date: "2025-12-02",
          doctor: "Dr. Jayasuriya",
          hospital: "Sunrise Imaging",
          status: "Pending",
          summary: "Report is being processed.",
          details: "Awaiting radiologist interpretation.",
        },
      ]);
    }, 700);
  });

/* -----------------------
   PDF Generator
   ----------------------- */
function generateReportHTML(report: Report) {
  return `
  <html>
    <body style="font-family: Arial; padding: 18px;">
      <h1>${report.title}</h1>
      <p><b>Doctor:</b> ${report.doctor}</p>
      <p><b>Hospital:</b> ${report.hospital}</p>
      <p><b>Date:</b> ${report.date}</p>
      <h3>Summary</h3>
      <p>${report.summary}</p>
      <h3>Details</h3>
      <p>${report.details}</p>
    </body>
  </html>`;
}

/* -----------------------
   Main Component
   ----------------------- */
export default function LabReportsScreen() {
  const router = useRouter();

  const tabs: Array<"Pending" | "Available"> = ["Pending", "Available"];
  const [tab, setTab] = useState<"Pending" | "Available">("Available");
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Load
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mockFetchLabReports();
      setData(res);
    } catch (e) {
      setError("Failed to load lab reports.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = data
    .filter((r) => r.status === tab)
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.doctor.toLowerCase().includes(q) ||
        r.hospital.toLowerCase().includes(q)
      );
    });

  const openDetails = (item: Report) => {
    setSelected(item);
    setModalVisible(true);
  };

  const closeDetails = () => {
    setSelected(null);
    setModalVisible(false);
  };

  /* -----------------------
     Download PDF
     ----------------------- */
  const handleDownload = async (report: Report) => {
    if (report.status !== "Available") {
      Alert.alert("Not Ready", "Report is still pending.");
      return;
    }

    setDownloadingId(report.id);
    try {
      const html = generateReportHTML(report);
      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS !== "web" && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      } else {
        Alert.alert("Saved", "PDF generated successfully.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  /* -----------------------
     Render Card
     ----------------------- */
  const renderItem = ({ item }: { item: Report }) => (
    <TouchableOpacity onPress={() => openDetails(item)} style={styles.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.doctor} • {item.hospital}</Text>
          <Text style={styles.cardDate}>{item.date}</Text>
        </View>

        {/* Status + Download */}
        <View style={{ alignItems: "flex-end" }}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: item.status === "Available" ? "#2ECC71" : "#F8C851" }
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>

          <TouchableOpacity
            onPress={() => handleDownload(item)}
            style={styles.downloadBtn}
          >
            {downloadingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="download" size={16} color="#fff" />
                <Text style={styles.downloadText}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  /* -----------------------
     UI
     ----------------------- */
  return (
    <View style={styles.root}>
      
      {/* HEADER WITH BACK BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/patient-dashboard")}>
          <Ionicons name="arrow-back" size={24} color="#133E7A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Reports</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Search + Tabs */}
      <View style={styles.controls}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {["Pending", "Available"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t as any)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#1E4BA3" />
        ) : error ? (
          <Text>{error}</Text>
        ) : filtered.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>No {tab} reports</Text>
        ) : (
          <FlatList data={filtered} renderItem={renderItem} keyExtractor={(i) => i.id.toString()} />
        )}
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.modalTitle}>{selected?.title}</Text>
              <TouchableOpacity onPress={closeDetails}>
                <Ionicons name="close" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 10 }}>
              <Text>Doctor: {selected?.doctor}</Text>
              <Text>Hospital: {selected?.hospital}</Text>
              <Text>Date: {selected?.date}</Text>

              <Text style={{ marginTop: 10, fontWeight: "700" }}>Summary</Text>
              <Text>{selected?.summary}</Text>

              <Text style={{ marginTop: 10, fontWeight: "700" }}>Details</Text>
              <Text>{selected?.details}</Text>

              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => handleDownload(selected!)}
              >
                <MaterialCommunityIcons name="download" size={18} color="#fff" />
                <Text style={styles.modalBtnText}>Download PDF</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/patient-dashboard")}>
          <Ionicons name="home-outline" size={26} color="#133E7A" />
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="document-text-outline" size={26} color="#1E4BA3" />
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="person-outline" size={26} color="#133E7A" />
        </TouchableOpacity>

       
      </View>
    </View>
  );
}

/* -----------------------
   Styles
   ----------------------- */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F6FAFF" },

  header: {
    paddingTop: 42,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#EDEDED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: { fontSize: 20, fontWeight: "800", color: "#133E7A" },

  controls: { paddingHorizontal: 16, paddingTop: 12 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EDEFF6",
  },
  searchInput: { marginLeft: 8, flex: 1 },

  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EDEFF6",
    marginRight: 8,
  },
  tabActive: { backgroundColor: "#1E4BA3", borderColor: "#1E4BA3" },
  tabText: { color: "#333", fontWeight: "700" },
  tabTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#133E7A" },
  cardMeta: { color: "#666", marginTop: 6 },
  cardDate: { color: "#999", marginTop: 4, fontSize: 12 },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: { color: "#fff", fontWeight: "700" },

  downloadBtn: {
    marginTop: 6,
    backgroundColor: "#1E4BA3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  downloadText: { color: "#fff", marginLeft: 6, fontWeight: "700" },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    maxHeight: "90%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#133E7A" },

  modalBtn: {
    marginTop: 16,
    backgroundColor: "#1E4BA3",
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  modalBtnText: { color: "#fff", marginLeft: 8, fontWeight: "700" },

  bottomNav: {
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#EDEDED",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
});
