
// app/(auth)/lab-report.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


/* -----------------------
   Types
   ----------------------- */
interface Report {

  id: string | number;
  title: string;
  testType: string;
  date: string;
  completionDate?: string;
  doctor: string;
  labFacility: string;
  status: "pending" | "approved" | "in_progress" | "completed";
  urgency: "normal" | "high" | "urgent" | "abnormal";
  summary: string;
  details: string;
  resultFileUrl?: string;

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
          title: "Complete Blood Count (CBC)",
          testType: "Blood Test",
          date: "2025-12-30",
          doctor: "Nimal Fernando",
          labFacility: "Not assigned",
          status: "pending",
          urgency: "normal",
          summary: "HB: 13.6 g/dL, WBC: 6.4 x10^3/µL, Platelets: 250 x10^3/µL.",
          details: "Hemoglobin, white cells and platelets are within reference ranges.",
        },
        {
          id: 202,
          title: "Lipid Profile",

          testType: "Blood Test",
          date: "2025-12-30",
          doctor: "Nimal Fernando",
          labFacility: "Not assigned",
          status: "pending",
          urgency: "normal",
          summary: "Cholesterol normal range.",
          details: "Borderline LDL.",
        },
        {
          id: 203,

          title: "Fasting Blood Glucose",
          testType: "Blood Test",
          date: "2025-12-30",
          doctor: "Nimal Fernando",
          labFacility: "Not assigned",
          status: "pending",
          urgency: "high",
          summary: "Blood sugar test.",
          details: "Fasting glucose measurement.",
        },
        {
          id: 204,
          title: "Urinalysis - Complete",
          testType: "Urine Test",
          date: "2025-12-30",
          doctor: "Nimal Fernando",
          labFacility: "Not assigned",
          status: "pending",
          urgency: "normal",
          summary: "Complete urine analysis.",
          details: "Check for infection and kidney function.",
        },
        {
          id: 205,
          title: "Thyroid Function Test (TSH, T3, T4)",
          testType: "Blood Test",
          date: "2025-12-30",
          doctor: "Nimal Fernando",
          labFacility: "Not assigned",
          status: "pending",
          urgency: "normal",
          summary: "Thyroid hormone levels.",
          details: "Assessment of thyroid function.",
        },
        {
          id: 206,
          title: "Blood report",
          testType: "Blood Test",
          date: "2025-12-17",
          doctor: "Nimal Fernando",
          labFacility: "Not assigned",
          status: "pending",
          urgency: "normal",
          summary: "General blood analysis.",
          details: "Complete blood work.",
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

      <p><b>Lab Facility:</b> ${report.labFacility}</p>
      <p><b>Test Type:</b> ${report.testType}</p>
      <p><b>Date:</b> ${report.date}</p>
      <p><b>Status:</b> ${report.status}</p>
      <p><b>Urgency:</b> ${report.urgency}</p>
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

  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("All Urgency Levels");
  const [resultsFilter, setResultsFilter] = useState<string>("All Results");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [urgencyModalVisible, setUrgencyModalVisible] = useState(false);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);


  // Load
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {

      const response = await fetch('http://localhost:4000/lab-reports');
      const json = await response.json();
      
      if (json.ok && json.data) {
        // Format dates from database
        const formattedData = json.data.map((item: any) => ({
          ...item,
          date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
          completionDate: item.completionDate ? new Date(item.completionDate).toISOString().split('T')[0] : undefined,
        }));
        setData(formattedData);
      } else {
        setError(json.error || 'Failed to load lab reports.');
      }
    } catch (e) {
      console.error('Error loading lab reports:', e);

      setError("Failed to load lab reports.");
    } finally {
      setLoading(false);
    }
  };


  const statusOptions = ["All Statuses", "pending", "approved", "in_progress", "completed"];
  const urgencyOptions = ["All Urgency Levels", "normal", "high", "urgent", "abnormal"];
  const resultsOptions = ["All Results", "Normal", "Abnormal"];

  const getStatusCounts = () => {
    const total = data.length;
    const pending = data.filter(r => r.status === "pending").length;
    const approved = data.filter(r => r.status === "approved").length;
    const inProgress = data.filter(r => r.status === "in_progress").length;
    const completed = data.filter(r => r.status === "completed").length;
    const abnormal = data.filter(r => r.urgency === "abnormal").length;
    const urgent = data.filter(r => r.urgency === "urgent").length;
    
    return { total, pending, approved, inProgress, completed, abnormal, urgent };
  };

  const counts = getStatusCounts();

  const clearFilters = () => {
    setStatusFilter("All Statuses");
    setUrgencyFilter("All Urgency Levels");
    setResultsFilter("All Results");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  const hasActiveFilters = statusFilter !== "All Statuses" || urgencyFilter !== "All Urgency Levels" || 
                           resultsFilter !== "All Results" || dateFrom !== "" || dateTo !== "" || search !== "";

  const filtered = data.filter((r) => {
    // Status filter
    if (statusFilter !== "All Statuses" && r.status !== statusFilter) return false;
    
    // Urgency filter  
    if (urgencyFilter !== "All Urgency Levels" && r.urgency !== urgencyFilter) return false;
    
    // Results filter
    if (resultsFilter !== "All Results") {
      if (resultsFilter === "Normal" && (r.urgency === "abnormal" || r.urgency === "high")) return false;
      if (resultsFilter === "Abnormal" && r.urgency === "normal") return false;
    }
    
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.title.toLowerCase().includes(q) &&
        !r.doctor.toLowerCase().includes(q) &&
        !r.labFacility.toLowerCase().includes(q) &&
        !r.testType.toLowerCase().includes(q)
      ) return false;
    }
    
    return true;
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


  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#F8C851";
      case "approved": return "#4D9EF6";
      case "in_progress": return "#9B59B6";
      case "completed": return "#2ECC71";
      default: return "#999";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "normal": return "#4D9EF6";
      case "high": return "#F8C851";
      case "urgent": return "#FF6B6B";
      case "abnormal": return "#E74C3C";
      default: return "#999";
    }
  };

  /* -----------------------
     UI
     ----------------------- */
  return (
    <View style={styles.root}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Lab Results</Text>
            <Text style={styles.headerSubtitle}>View all your lab tests, find matching labs, and download reports</Text>
          </View>
          <View style={styles.totalBadge}>
            <MaterialCommunityIcons name="flask" size={18} color="#1E4BA3" />
            <Text style={styles.totalBadgeText}>{counts.total} Total Tests</Text>
          </View>
        </View>

      {/* STATISTICS CARDS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={[styles.statValue, { color: "#333" }]}>{counts.total}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={[styles.statValue, { color: "#F8C851" }]}>{counts.pending}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Approved</Text>
          <Text style={[styles.statValue, { color: "#4D9EF6" }]}>{counts.approved}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>In Progress</Text>
          <Text style={[styles.statValue, { color: "#9B59B6" }]}>{counts.inProgress}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={[styles.statValue, { color: "#2ECC71" }]}>{counts.completed}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Abnormal</Text>
          <Text style={[styles.statValue, { color: "#E74C3C" }]}>{counts.abnormal}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Urgent</Text>
          <Text style={[styles.statValue, { color: "#FF6B6B" }]}>{counts.urgent}</Text>
        </View>
      </ScrollView>

      {/* FILTERS & SEARCH */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons name="filter-variant" size={20} color="#333" />
            <Text style={styles.filtersTitle}>Filters & Search</Text>
          </View>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Dropdowns Row 1 */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Status</Text>
            <TouchableOpacity style={styles.filterDropdown} onPress={() => setStatusModalVisible(true)}>
              <Text style={styles.filterValue}>{statusFilter}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Urgency</Text>
            <TouchableOpacity style={styles.filterDropdown} onPress={() => setUrgencyModalVisible(true)}>
              <Text style={styles.filterValue}>{urgencyFilter}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Results</Text>
            <TouchableOpacity style={styles.filterDropdown} onPress={() => setResultsModalVisible(true)}>
              <Text style={styles.filterValue}>{resultsFilter}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Range Row */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Date From</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="mm/dd/yyyy"
              value={dateFrom}
              onChangeText={setDateFrom}
            />
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Date To</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="mm/dd/yyyy"
              value={dateTo}
              onChangeText={setDateTo}
            />
          </View>
        </View>

        {/* Search Box */}
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            placeholder="Search by test name, doctor, lab..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* LAB TEST RESULTS TABLE */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>Lab Test Results</Text>
          <Text style={styles.tableSubtitle}>Showing {filtered.length} of {data.length} tests</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E4BA3" />
            <Text style={{ marginTop: 8 }}>Loading lab tests...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: "#E74C3C", fontWeight: "700" }}>Error</Text>
            <Text style={{ marginTop: 6 }}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="flask-empty-outline" size={48} color="#999" />
            <Text style={{ marginTop: 12, color: "#666" }}>No lab tests found</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={{ flex: 1 }}
          >
            <View style={{ minWidth: 1300 }}>
              {/* Table Header Row */}
              <View style={styles.tableRowHeader}>
                <Text style={[styles.tableCellHeader, { width: 220 }]}>Test Name</Text>
                <Text style={[styles.tableCellHeader, { width: 150 }]}>Doctor</Text>
                <Text style={[styles.tableCellHeader, { width: 150 }]}>Lab Facility</Text>
                <Text style={[styles.tableCellHeader, { width: 120 }]}>Status</Text>
                <Text style={[styles.tableCellHeader, { width: 120 }]}>Urgency</Text>
                <Text style={[styles.tableCellHeader, { width: 140 }]}>Request Date</Text>
                <Text style={[styles.tableCellHeader, { width: 140 }]}>Completion</Text>
                <Text style={[styles.tableCellHeader, { width: 260 }]}>Actions</Text>
              </View>

              {/* Table Body */}
              {filtered.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, { width: 220 }]}>
                    <View>
                      <Text style={styles.testTitle}>{item.title}</Text>
                      <View style={styles.testTypeBadge}>
                        <Text style={styles.testTypeText}>{item.testType}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.tableCell, { width: 150 }]}>
                    <MaterialCommunityIcons name="account" size={16} color="#666" style={{ marginRight: 6 }} />
                    <Text style={styles.tableCellText}>{item.doctor}</Text>
                  </View>

                  <View style={[styles.tableCell, { width: 150 }]}>
                    <Text style={styles.tableCellText}>{item.labFacility}</Text>
                  </View>

                  <View style={[styles.tableCell, { width: 120 }]}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.badgeText}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={[styles.tableCell, { width: 120 }]}>
                    <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
                      <Text style={styles.badgeText}>{item.urgency}</Text>
                    </View>
                  </View>

                  <View style={[styles.tableCell, { width: 140 }]}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#666" style={{ marginRight: 4 }} />
                    <Text style={styles.tableCellText}>{item.date}</Text>
                  </View>

                  <View style={[styles.tableCell, { width: 140 }]}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#666" style={{ marginRight: 4 }} />
                    <Text style={styles.tableCellText}>{item.status === "pending" ? "Pending" : item.date}</Text>
                  </View>

                  <View style={[styles.tableCell, { width: 260, gap: 8 }]}>
                    <TouchableOpacity style={styles.selectLabButton}>
                      <MaterialCommunityIcons name="flask" size={16} color="#fff" />
                      <Text style={styles.selectLabText}>Select Lab</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => openDetails(item)}>
                      <MaterialCommunityIcons name="eye-outline" size={22} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDownload(item)}>
                      {downloadingId === item.id ? (
                        <ActivityIndicator size="small" color="#1E4BA3" />
                      ) : (
                        <MaterialCommunityIcons name="download-outline" size={22} color="#666" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Filter Modals */}
      <Modal visible={statusModalVisible} animationType="fade" transparent onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterModalScroll}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterOption, statusFilter === status && styles.filterOptionActive]}
                  onPress={() => {
                    setStatusFilter(status);
                    setStatusModalVisible(false);
                  }}
                >
                  <Text style={[styles.filterOptionText, statusFilter === status && styles.filterOptionTextActive]}>{status}</Text>
                  {statusFilter === status && <Ionicons name="checkmark-circle" size={22} color="#1E4BA3" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={urgencyModalVisible} animationType="fade" transparent onRequestClose={() => setUrgencyModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Select Urgency</Text>
              <TouchableOpacity onPress={() => setUrgencyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterModalScroll}>
              {urgencyOptions.map((urgency) => (
                <TouchableOpacity
                  key={urgency}
                  style={[styles.filterOption, urgencyFilter === urgency && styles.filterOptionActive]}
                  onPress={() => {
                    setUrgencyFilter(urgency);
                    setUrgencyModalVisible(false);
                  }}
                >
                  <Text style={[styles.filterOptionText, urgencyFilter === urgency && styles.filterOptionTextActive]}>{urgency}</Text>
                  {urgencyFilter === urgency && <Ionicons name="checkmark-circle" size={22} color="#1E4BA3" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={resultsModalVisible} animationType="fade" transparent onRequestClose={() => setResultsModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Select Results</Text>
              <TouchableOpacity onPress={() => setResultsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterModalScroll}>
              {resultsOptions.map((result) => (
                <TouchableOpacity
                  key={result}
                  style={[styles.filterOption, resultsFilter === result && styles.filterOptionActive]}
                  onPress={() => {
                    setResultsFilter(result);
                    setResultsModalVisible(false);
                  }}
                >
                  <Text style={[styles.filterOptionText, resultsFilter === result && styles.filterOptionTextActive]}>{result}</Text>
                  {resultsFilter === result && <Ionicons name="checkmark-circle" size={22} color="#1E4BA3" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>


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

              <Text>Lab Facility: {selected?.labFacility}</Text>
              <Text>Date: {selected?.date}</Text>
              <Text>Status: {selected?.status}</Text>
              <Text>Urgency: {selected?.urgency}</Text>

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

      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/patient-dashboard")}>
          <Ionicons name="home-outline" size={26} color="#000000ff" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="flask-outline" size={26} color="#1E4BA3" />
          <Text style={[styles.navText, { color: "#1E4BA3" }]}>Lab Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/profile")}>
          <Ionicons name="person-circle-outline" size={26} color="#333" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

/* -----------------------
   Styles
   ----------------------- */
const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: "#F5F7FA", paddingTop: 40 },

  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#1A1A1A", marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  totalBadgeText: { fontSize: 13, fontWeight: "600", color: "#1E4BA3" },

  statsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
  },
  statCard: {
    backgroundColor: "#F9FAFB",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 100,
  },
  statLabel: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: "700" },

  filtersContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filtersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filtersTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },
  clearButtonText: { fontSize: 13, fontWeight: "600", color: "#1E4BA3" },

  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  filterItem: {
    flex: 1,
    minWidth: 100,
  },
  filterLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "500",
  },
  filterDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterValue: {
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  dateInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 13,
    color: "#333",
  },


  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },

  tableContainer: {
    minHeight: 500,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeader: {
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  tableSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },

  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },
  tableCellHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  tableCell: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  tableCellText: {
    fontSize: 13,
    color: "#374151",
  },

  testTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  testTypeBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  testTypeText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  selectLabButton: {
    backgroundColor: "#1E4BA3",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectLabText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#1E4BA3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "80%",
    maxHeight: "70%",
    padding: 16,
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  filterModalScroll: {
    maxHeight: 400,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 6,
  },
  filterOptionActive: {
    backgroundColor: "#EEF2FF",
  },
  filterOptionText: {
    fontSize: 15,
    color: "#374151",
  },
  filterOptionTextActive: {
    fontWeight: "600",
    color: "#1E4BA3",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  modalBtn: {
    marginTop: 16,
    backgroundColor: "#1E4BA3",
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  modalBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  bottomNav: {
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,

    borderColor: "#E8EAED",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",

   
  },
});
