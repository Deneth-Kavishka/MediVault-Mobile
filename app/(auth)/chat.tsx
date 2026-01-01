import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

// ---------- Types ----------
interface Message {
  id: string;
  text: string;
  sender: "patient" | "doctor";
}

// ---------- Mock Data ----------
const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    text: "Hello Doctor, I've been experiencing a sharp pain in my knee since yesterday.",
    sender: "patient",
  },
  {
    id: "2",
    text: "I see. Does the pain increase when you move?",
    sender: "doctor",
  },
  {
    id: "3",
    text: "Yes, especially when standing or bending.",
    sender: "patient",
  },
  {
    id: "4",
    text: "Alright, I recommend an X-ray. I will arrange it.",
    sender: "doctor",
  },
];

const DOCTOR_NAME = "Dr. Emily Hayes";
const DOCTOR_SPECIALTY = "Orthopedic Specialist";

export default function DoctorChatScreen() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // ---------- Actions ----------
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "patient",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
  };

  // ✅ BACK TO PATIENT DASHBOARD
  const handleBack = () => {
    router.push("/patient-dashboard");
  };

  // ---------- UI ----------
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backIcon}>‹ Back</Text>
      </TouchableOpacity>

      <View style={styles.headerInfo}>
        <Text style={styles.doctorName}>{DOCTOR_NAME}</Text>
        <Text style={styles.doctorSpecialty}>{DOCTOR_SPECIALTY}</Text>
      </View>

      <View style={{ width: 40 }} />
    </View>
  );

  const renderMessage = (msg: Message) => {
    const isPatient = msg.sender === "patient";

    return (
      <View
        key={msg.id}
        style={[
          styles.messageRow,
          isPatient ? styles.patientRow : styles.doctorRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isPatient ? styles.patientBubble : styles.doctorBubble,
          ]}
        >
          <Text style={isPatient ? styles.patientText : styles.doctorText}>
            {msg.text}
          </Text>
        </View>
      </View>
    );
  };

  const renderInput = () => (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={inputText}
        onChangeText={setInputText}
        placeholder="Type your message..."
        placeholderTextColor="#9CA3AF"
        multiline
      />

      <TouchableOpacity
        style={[
          styles.sendButton,
          !inputText.trim() && { opacity: 0.5 },
        ]}
        onPress={handleSendMessage}
        disabled={!inputText.trim()}
      >
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {renderHeader()}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messageList}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {renderInput()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 16,
    color: "#0EA5E9",
    fontWeight: "600",
  },

  headerInfo: {
    alignItems: "center",
  },
  doctorName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1F2937",
  },
  doctorSpecialty: {
    fontSize: 13,
    color: "#6B7280",
  },

  messageList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  messageRow: {
    marginVertical: 4,
    maxWidth: width * 0.8,
  },
  patientRow: {
    alignSelf: "flex-end",
  },
  doctorRow: {
    alignSelf: "flex-start",
  },

  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  patientBubble: {
    backgroundColor: "#0EA5E9",
    borderBottomRightRadius: 4,
  },
  doctorBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  patientText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  doctorText: {
    color: "#1F2937",
    fontSize: 15,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#0EA5E9",
    width: 60,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
