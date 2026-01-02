import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    name: "Saduni Himasha",
    email: "sadunihimasha@gmail.com",
    phone: "0771234567",
    age: "22",
    gender: "Female",
  });

  // ---------- Image Picker ----------
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow gallery access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // ---------- Save Profile ----------
  const saveProfile = () => {
    setIsEditing(false);
    Alert.alert("Success", "Profile updated successfully");
  };

  // ---------- Back ----------
  const handleBack = () => {
    router.push("/patient-dashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* -------- HEADER -------- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#0EA5E9" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Profile</Text>

        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editText}>
            {isEditing ? "Cancel" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* -------- PROFILE IMAGE -------- */}
        <View style={styles.imageContainer}>
         <Image
  source={{
    uri: profileImage
      ? profileImage
      : "https://cdn-icons-png.flaticon.com/512/2922/2922561.png",

  }}
  style={styles.profileImage}
/>




          {isEditing && (
            <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* -------- DETAILS -------- */}
        <View style={styles.card}>
          {renderField("Full Name", profile.name, isEditing, (v) =>
            setProfile({ ...profile, name: v })
          )}

          {renderField("Email", profile.email, isEditing, (v) =>
            setProfile({ ...profile, email: v })
          )}

          {renderField("Phone", profile.phone, isEditing, (v) =>
            setProfile({ ...profile, phone: v })
          )}

          {renderField("Age", profile.age, isEditing, (v) =>
            setProfile({ ...profile, age: v })
          )}

          {renderField("Gender", profile.gender, isEditing, (v) =>
            setProfile({ ...profile, gender: v })
          )}

          {isEditing && (
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveText}>Save Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- FIELD COMPONENT ----------
function renderField(
  label: string,
  value: string,
  editable: boolean,
  onChange: (v: string) => void
) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          style={styles.input}
        />
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  editText: {
    color: "#0EA5E9",
    fontWeight: "600",
  },

  imageContainer: {
    alignItems: "center",
    marginVertical: 25,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E5E7EB",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 5,
    right: widthPercent(38),
    backgroundColor: "#0EA5E9",
    padding: 8,
    borderRadius: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 15,
    borderRadius: 14,
    padding: 15,
    elevation: 2,
  },

  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
  },

  saveBtn: {
    backgroundColor: "#0EA5E9",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
});

// ---------- Helper ----------
function widthPercent(percent: number) {
  return (percent / 100) * 360;
}
