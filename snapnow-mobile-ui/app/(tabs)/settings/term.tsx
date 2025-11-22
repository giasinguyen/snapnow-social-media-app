import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';

export default function TermsOfServiceScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Terms of Service</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Terms of Service</Text>

        <Text style={[styles.p, { color: colors.textPrimary }]}>
          Welcome to <Text style={styles.bold}>SnapNow</Text>. By accessing or using our app,
          you agree to be bound by these Terms of Service. Please read them carefully before
          continuing to use the application.
        </Text>

        <Text style={[styles.section, { color: colors.textPrimary }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.p, { color: colors.textPrimary }]}>
          By creating an account or using SnapNow, you confirm that you are at least 13 years old
          and that you agree to comply with these Terms. If you do not agree, you must stop using
          the app immediately.
        </Text>

        <Text style={[styles.section, { color: colors.textPrimary }]}>2. User Content</Text>
        <Text style={[styles.p, { color: colors.textPrimary }]}>
          You are responsible for any photos, videos, or text you share on SnapNow. You retain
          ownership of your content but grant us a limited, non-exclusive license to display and
          distribute it within the app to provide our services.
        </Text>

        <Text style={[styles.section, { color: colors.textPrimary }]}>3. Prohibited Activities</Text>
        <Text style={[styles.p, { color: colors.textPrimary }]}>
          You agree not to use SnapNow for unlawful purposes, harassment, impersonation, or to
          share content that violates intellectual property laws. Violation of these terms may
          result in suspension or termination of your account.
        </Text>

        <Text style={[styles.section, { color: colors.textPrimary }]}>4. Termination</Text>
        <Text style={[styles.p, { color: colors.textPrimary }]}>
          SnapNow reserves the right to suspend or terminate your access if you violate our rules
          or engage in harmful activities. You can also delete your account at any time via
          Settings → Edit Profile.
        </Text>

        <Text style={[styles.section, { color: colors.textPrimary }]}>5. Updates</Text>
        <Text style={[styles.p, { color: colors.textPrimary }]}>
          We may modify these Terms periodically. Continued use of SnapNow after changes indicates
          your acceptance of the updated Terms.
        </Text>

        <Text style={[styles.section, { color: colors.textPrimary }]}>6. Contact</Text>
        <Text style={[styles.p, { color: colors.textPrimary }]}>
          For questions about our Terms, please reach out via Help Center or email us at
          support@snapnow.app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 15, lineHeight: 22 },
  bold: { fontWeight: '700' },
});
