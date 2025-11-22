import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Last Updated: November 22, 2025
        </Text>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>1. Introduction</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            Welcome to SnapNow. We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>2. Information We Collect</Text>
          
          <Text style={[styles.subheading, { color: colors.textPrimary }]}>2.1 Information You Provide</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            • Account information (username, email, password, profile picture){'\n'}
            • Profile information (bio, display name, location){'\n'}
            • Content you create (posts, photos, videos, stories, comments){'\n'}
            • Messages and communications with other users{'\n'}
            • Information provided when contacting support
          </Text>

          <Text style={[styles.subheading, { color: colors.textPrimary }]}>2.2 Information Automatically Collected</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            • Device information (model, operating system, unique identifiers){'\n'}
            • Log data (IP address, browser type, access times){'\n'}
            • Usage data (features used, interactions, time spent){'\n'}
            • Location information (with your permission){'\n'}
            • Camera and photo library access (with your permission)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>3. How We Use Your Information</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            We use the collected information to:{'\n\n'}
            • Provide, maintain, and improve our services{'\n'}
            • Create and manage your account{'\n'}
            • Personalize your experience and content recommendations{'\n'}
            • Process your requests and transactions{'\n'}
            • Send you notifications and updates{'\n'}
            • Detect and prevent fraud, abuse, and security issues{'\n'}
            • Comply with legal obligations{'\n'}
            • Analyze usage patterns and improve our platform
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>4. Information Sharing and Disclosure</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            We do not sell your personal information. We may share information in the following circumstances:{'\n\n'}
            • With other users (based on your privacy settings){'\n'}
            • With service providers who assist our operations{'\n'}
            • To comply with legal requirements or protect rights{'\n'}
            • In connection with a business transaction (merger, acquisition){'\n'}
            • With your consent or at your direction
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>5. Data Security</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            We implement appropriate technical and organizational measures to protect your information. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>6. Your Privacy Rights</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            You have the right to:{'\n\n'}
            • Access your personal information{'\n'}
            • Update or correct your information{'\n'}
            • Delete your account and data{'\n'}
            • Control your privacy settings{'\n'}
            • Opt-out of promotional communications{'\n'}
            • Request a copy of your data{'\n'}
            • Object to certain processing activities
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>7. Children's Privacy</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            SnapNow is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>8. Cookies and Tracking Technologies</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can control cookie preferences through your device settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>9. Third-Party Services</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            Our app may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>10. Data Retention</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. You can request deletion of your account at any time through the app settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>11. International Data Transfers</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>12. Changes to This Privacy Policy</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Continued use of the app after changes constitutes acceptance of the updated policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>13. Contact Us</Text>
          <Text style={[styles.paragraph, { color: colors.textPrimary }]}>
            If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact us at:{'\n\n'}
            Email: privacy@snapnow.app{'\n'}
            Support: support@snapnow.app
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.paragraph, { color: colors.textSecondary, fontStyle: 'italic' }]}>
            By using SnapNow, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
  },
});
