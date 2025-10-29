import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecurityIndex() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.title}>Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push('/settings/security/change-password')}
          activeOpacity={0.7}
        >
          <View style={styles.left}>
            <Ionicons name="key-outline" size={22} color="#262626" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.rowTitle}>Change password</Text>
              <Text style={styles.rowSubtitle}>Update your account password</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E8E" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push('/settings/security/two-factor')}
          activeOpacity={0.7}
        >
          <View style={styles.left}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#262626" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.rowTitle}>Two‑factor authentication</Text>
              <Text style={styles.rowSubtitle}>Manage PIN and 2FA options</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E8E" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: '#262626' },
  container: { paddingTop: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '500', color: '#262626' },
  rowSubtitle: { fontSize: 13, color: '#8E8E8E' },
});
