import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // 👈 thêm

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>

        <Text style={styles.p}>
          At <Text style={styles.bold}>SnapNow</Text>, we value your privacy and are committed to
          protecting your personal information. This Privacy Policy explains how we collect, use,
          and safeguard your data when you use our app.
        </Text>

        <Text style={styles.section}>1. Information We Collect</Text>
        <Text style={styles.p}>
          We may collect information you provide directly (e.g., name, email, photos) and
          information automatically collected from your device such as IP address, app usage, and
          device identifiers.
        </Text>

        <Text style={styles.section}>2. How We Use Your Information</Text>
        <Text style={styles.p}>
          SnapNow uses this data to provide and improve our services, personalize your experience,
          display relevant content, and ensure safety within the community.
        </Text>

        <Text style={styles.section}>3. Sharing of Information</Text>
        <Text style={styles.p}>
          We do not sell or rent your data. We may share limited information with trusted service
          providers (like analytics or cloud storage) under strict confidentiality agreements.
        </Text>

        <Text style={styles.section}>4. Data Security</Text>
        <Text style={styles.p}>
          We implement strong encryption and secure storage systems to protect your data against
          unauthorized access, alteration, or disclosure.
        </Text>

        <Text style={styles.section}>5. Your Rights</Text>
        <Text style={styles.p}>
          You may access, modify, or delete your personal data anytime via Settings → Edit Profile.
          You may also request account deletion by contacting our support team.
        </Text>

        <Text style={styles.section}>6. Policy Updates</Text>
        <Text style={styles.p}>
          We may update this Privacy Policy from time to time. We encourage you to review it
          periodically to stay informed about how we protect your data.
        </Text>

        <Text style={styles.section}>7. Contact Us</Text>
        <Text style={styles.p}>
          For privacy concerns or questions, contact us at privacy@snapnow.app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' }, // 👈 nền trắng + safe area
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backBtn: { marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#111' },
  section: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 15, lineHeight: 22, color: '#444' },
  bold: { fontWeight: '700' },
});
