import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

interface Notification {
  id: string;
  type: 'sent' | 'pending';
  recipient: string;
  testName: string;
  sentDate: string;
  status: 'delivered' | 'pending';
}

export default function ManageNotifications() {
  const [notifications] = React.useState<Notification[]>([
    { id: '1', type: 'sent', recipient: 'Dr. Smith & John Doe', testName: 'CBC Results', sentDate: '2024-12-03 10:30', status: 'delivered' },
    { id: '2', type: 'sent', recipient: 'Dr. Johnson & Jane Smith', testName: 'Urinalysis Results', sentDate: '2024-12-03 09:15', status: 'delivered' },
    { id: '3', type: 'pending', recipient: 'Dr. Davis & Sarah Brown', testName: 'Blood Sugar Results', sentDate: '2024-12-03 11:00', status: 'pending' },
  ]);

  return (
    <ImageBackground source={require('../../assets/images/Background-image.jpg')} style={styles.container} resizeMode="cover">
      <View style={styles.header}>
        <RNText style={styles.headerTitle}>Notifications</RNText>
        <RNText style={styles.headerSubtitle}>{notifications.length} total notifications</RNText>
      </View>
      <ScrollView style={styles.notificationsList} contentContainerStyle={styles.notificationsContent}>
        {notifications.map(notif => (
          <View key={notif.id} style={styles.notificationCard}>
            <View style={[styles.statusIndicator, { backgroundColor: notif.status === 'delivered' ? '#10B981' : '#F59E0B' }]} />
            <View style={styles.notificationContent}>
              <RNText style={styles.testName}>{notif.testName}</RNText>
              <RNText style={styles.recipient}>To: {notif.recipient}</RNText>
              <View style={styles.notificationFooter}>
                <Ionicons name={notif.status === 'delivered' ? 'checkmark-circle' : 'time'} size={16} color={notif.status === 'delivered' ? '#10B981' : '#F59E0B'} />
                <RNText style={styles.statusText}>{notif.status.toUpperCase()}</RNText>
                <RNText style={styles.dateText}>{notif.sentDate}</RNText>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#6B7280' },
  notificationsList: { flex: 1, backgroundColor: 'transparent' },
  notificationsContent: { padding: 16 },
  notificationCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }) },
  statusIndicator: { width: 4, borderRadius: 2, marginRight: 12 },
  notificationContent: { flex: 1 },
  testName: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  recipient: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  notificationFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  dateText: { fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' },
});

