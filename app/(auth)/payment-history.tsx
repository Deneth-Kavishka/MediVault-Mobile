import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// --- Mock Data ---
const PENDING_BILLS = [
  { id: "b1", title: "Lab Tests (Pathology)", date: "Dec 09, 2025", amount: 85.0, due: "Due in 3 days" },
  { id: "b2", title: "Cardiologist Co-pay", date: "Dec 05, 2025", amount: 40.0, due: "Overdue" },
];

const SAVED_METHODS = [
  { id: "ins", type: "Insurance", name: "Aetna Health", detail: "ID: 9982-XXXX", icon: "🛡️", primary: true },
  { id: "card1", type: "Visa", name: "Chase Sapphire", detail: "•••• 4242", icon: "💳", primary: false },
];

const HISTORY = [
  { id: "h1", title: "Annual Checkup", date: "Nov 12, 2025", amount: "$150.00", status: "Covered" },
  { id: "h2", title: "Pharmacy Refill", date: "Oct 30, 2025", amount: "$25.50", status: "Paid" },
];

export default function PatientFinanceDashboard() {
  const router = useRouter();
  const [autoPay, setAutoPay] = useState(false);

  // --- Actions ---
  const handlePayBill = (billTitle: string, amount: number) => {
    Alert.alert("Pay Bill", `Process payment of $${amount} for ${billTitle}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Pay Now", onPress: () => console.log("Paid") },
    ]);
  };

  const handleAddMethod = () => {
    Alert.alert("Add Method", "Open form to add Insurance or Credit Card");
  };

  // --- Components ---

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.greeting}>Payment Options</Text>
    </View>
  );

  const renderOverview = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.overviewScroll}
    >
      <View style={[styles.statCard, styles.bgBlue]}>
        <Text style={styles.statLabelLight}>Total Outstanding</Text>
        <Text style={styles.statAmountLight}>$125.00</Text>
        <Text style={styles.statSubLight}>2 Pending Bills</Text>
      </View>

      <View style={[styles.statCard, styles.bgWhite]}>
        <Text style={styles.statLabelDark}>Insurance Status</Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>ACTIVE</Text>
        </View>
        <Text style={styles.statSubDark}>Aetna Gold Plan</Text>
      </View>
    </ScrollView>
  );

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Options</Text>
        <TouchableOpacity onPress={handleAddMethod}>
          <Text style={styles.linkText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {SAVED_METHODS.map((method) => (
        <View key={method.id} style={styles.methodRow}>
          <View style={styles.methodIconBox}>
            <Text style={{ fontSize: 20 }}>{method.icon}</Text>
          </View>

          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>{method.name}</Text>
            <Text style={styles.methodDetail}>{method.detail}</Text>
          </View>

          {method.primary ? (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryText}>Primary</Text>
            </View>
          ) : (
            <TouchableOpacity>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={styles.autoPayRow}>
        <View>
          <Text style={styles.autoPayTitle}>Auto-Pay Bills</Text>
          <Text style={styles.autoPaySub}>Pay automatically on due date</Text>
        </View>
        <Switch
          trackColor={{ false: "#767577", true: "#0EA5E9" }}
          thumbColor="#fff"
          onValueChange={() => setAutoPay(!autoPay)}
          value={autoPay}
        />
      </View>
    </View>
  );

  const renderPendingBills = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pending Bills</Text>

      {PENDING_BILLS.map((bill) => (
        <View key={bill.id} style={styles.billCard}>
          <View style={styles.billRow}>
            <View>
              <Text style={styles.billTitle}>{bill.title}</Text>
              <Text
                style={[
                  styles.billDue,
                  bill.due === "Overdue" ? styles.textRed : styles.textGray,
                ]}
              >
                {bill.due} • {bill.date}
              </Text>
            </View>

            <Text style={styles.billAmount}>${bill.amount.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={() => handlePayBill(bill.title, bill.amount)}
          >
            <Text style={styles.payNowText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      {HISTORY.map((item) => (
        <View key={item.id} style={styles.historyRow}>
          <View style={styles.historyLeft}>
            <Text style={styles.historyTitle}>{item.title}</Text>
            <Text style={styles.historyDate}>{item.date}</Text>
          </View>

          <View style={styles.historyRight}>
            <Text style={styles.historyAmount}>{item.amount}</Text>

            <Text
              style={[
                styles.historyStatus,
                item.status === "Covered" ? styles.textBlue : styles.textGreen,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderHeader()}
        {renderOverview()}
        {renderPaymentMethods()}
        {renderPendingBills()}
        {renderHistory()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ---------------- BOTTOM NAVIGATION BAR ---------------- */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.push("/patient-dashboard")}>
          <Ionicons name="home" size={28} color="#666" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Ionicons name="wallet" size={28} color="#0277FA" />
          <Text style={[styles.navText, { color: "#0277FA" }]}>Finance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="person-circle-outline" size={26} color="#333" />
                    <Text style={styles.navLabel}>Profile</Text>
                  </TouchableOpacity>

        
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: { paddingVertical: 20 },

  header: { paddingHorizontal: 20, marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: "700", color: "#0F172A" },

  overviewScroll: { paddingHorizontal: 20, paddingBottom: 20 },
  statCard: {
    width: width * 0.42,
    height: 110,
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    justifyContent: "space-between",
    elevation: 3,
  },

  bgBlue: { backgroundColor: "#0EA5E9" },
  bgWhite: { backgroundColor: "#FFFFFF" },

  statLabelLight: { color: "#E0F2FE", fontSize: 12, fontWeight: "600" },
  statAmountLight: { color: "#FFFFFF", fontSize: 24, fontWeight: "bold" },
  statSubLight: { color: "#BAE6FD", fontSize: 12 },

  statLabelDark: { color: "#475569", fontSize: 12, fontWeight: "600" },
  statSubDark: { color: "#334155", fontSize: 12 },

  activeBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  activeText: { color: "#166534", fontSize: 10, fontWeight: "bold" },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },
  linkText: { color: "#0EA5E9", fontWeight: "600" },

  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: { fontSize: 15, fontWeight: "600", color: "#334155" },
  methodDetail: { fontSize: 13, color: "#94A3B8" },
  editText: { color: "#0EA5E9", fontWeight: "600" },

  primaryBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryText: { color: "#0284C7", fontSize: 10, fontWeight: "bold" },

  autoPayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  autoPayTitle: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  autoPaySub: { fontSize: 13, color: "#94A3B8", marginTop: 4 },

  billCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    marginBottom: 12,
  },
  billRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  billTitle: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  billDue: { fontSize: 12, marginTop: 4 },
  billAmount: { fontSize: 16, fontWeight: "bold", color: "#0F172A" },
  payNowBtn: {
    backgroundColor: "#1E40AF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  payNowText: { color: "#FFFFFF", fontWeight: "600" },

  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  historyLeft: {},
  historyRight: { alignItems: "flex-end" },
  historyTitle: { fontSize: 14, fontWeight: "500", color: "#334155" },
  historyDate: { fontSize: 12, color: "#94A3B8" },
  historyAmount: { fontSize: 14, fontWeight: "600" },
  historyStatus: { fontSize: 12, fontWeight: "600", marginTop: 3 },

  textRed: { color: "#EF4444" },
  textGray: { color: "#94A3B8" },
  textBlue: { color: "#0EA5E9" },
  textGreen: { color: "#16A34A" },

  /* ---- Bottom Navigation ---- */
  navBar: {
    height: 75,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingBottom: 10,
  },
  navText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 3,
    color: "#555",
  },
  navItem: {
    alignItems: "center",
  },
  navLabel: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 3,
    color: "#333",
  },
});
