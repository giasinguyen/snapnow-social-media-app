import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HelpCenterScreen() {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Help Center</Text>
                <Text style={styles.paragraph}>
                    Need help using <Text style={styles.bold}>SnapNow</Text>? You’re in the
                    right place. Our Help Center is designed to guide you through every
                    aspect of the app — from account setup and privacy management to
                    posting your first photo and exploring trending content.
                </Text>

                <Text style={styles.subtitle}>Getting Started</Text>
                <Text style={styles.paragraph}>
                    • To create an account, tap “Sign Up” and provide your email or link
                    your existing social account.{"\n"}
                    • Once logged in, you can edit your profile, upload an avatar, and
                    start following people you love.{"\n"}
                    • Use the “+” button in the navigation bar to create a new post and
                    share your favorite moments.
                </Text>

                <Text style={styles.subtitle}>Managing Your Account</Text>
                <Text style={styles.paragraph}>
                    You can update your profile information anytime by visiting Settings →
                    Edit Profile. If you wish to take a break, you can temporarily disable
                    your account or permanently delete it from the same menu.
                </Text>

                <Text style={styles.subtitle}>Community Guidelines</Text>
                <Text style={styles.paragraph}>
                    SnapNow is a community built on respect and creativity. We encourage
                    users to post original, positive, and meaningful content. Harassment,
                    hate speech, or any form of harmful behavior will not be tolerated.
                    Our moderation team works tirelessly to maintain a safe and inclusive
                    space for everyone.
                </Text>

                <Text style={styles.subtitle}>Privacy & Safety</Text>
                <Text style={styles.paragraph}>
                    Your privacy matters to us. SnapNow never sells your data to third
                    parties. You can adjust who sees your posts and manage comment
                    visibility under your privacy settings. To report a suspicious user or
                    inappropriate content, tap the “...” menu on a post and select
                    “Report”.
                </Text>

                <Text style={styles.subtitle}>Need More Help?</Text>
                <Text style={styles.paragraph}>
                    If you can’t find an answer here, feel free to contact our support
                    team directly at{" "}
                    <Text style={styles.link}>support@snapnow.app</Text>. We aim to
                    respond to all inquiries within 24–48 hours.
                </Text>

                <Text style={styles.footer}>
                    Thank you for being part of the SnapNow community. Together, we’re
                    building a creative, positive, and inspiring space for everyone.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    content: { padding: 20 },
    title: { fontSize: 26, fontWeight: "700", color: "#262626", marginBottom: 12 },
    subtitle: { fontSize: 18, fontWeight: "600", color: "#262626", marginTop: 20, marginBottom: 8 },
    paragraph: { fontSize: 15, color: "#444", lineHeight: 22, marginBottom: 8 },
    bold: { fontWeight: "700", color: "#000" },
    link: { color: "#0095F6", textDecorationLine: "underline" },
    footer: { fontSize: 14, color: "#777", marginTop: 30, textAlign: "center" },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', },
    backBtn: { marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
});
