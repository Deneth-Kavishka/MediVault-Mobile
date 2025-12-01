import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Text as RNText,
    StyleSheet,
    View
} from 'react-native';

export default function DMessages() {
  return (
    <View style={styles.section}>
      <RNText style={styles.sectionTitle}>Messages</RNText>
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="message-outline" size={48} color="#9CA3AF" />
        <RNText style={styles.emptyText}>No messages yet</RNText>
        <RNText style={styles.emptySubtext}>Start a conversation with your patients</RNText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});
