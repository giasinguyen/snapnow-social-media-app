import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../../../contexts/ThemeContext';

export default function AboutScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>About SnapNow</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>About SnapNow</Text>
                <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                    Welcome to <Text style={[styles.bold, { color: colors.textPrimary }]}>SnapNow</Text> — a modern social
                    media experience built for the new generation of creators, thinkers,
                    and dreamers. We believe that every moment deserves to be captured,
                    shared, and remembered in the most authentic way possible.
                </Text>

                <Text style={styles.paragraph}>
                    Founded with a passion for simplicity and creativity, SnapNow brings
                    together the essence of storytelling and technology. Our platform
                    allows users to post images, connect with friends, explore
                    communities, and discover inspiring content — all within a clean,
                    distraction-free interface.
                </Text>

                <Text style={[styles.subtitle, { color: colors.textPrimary }]}>Our Vision</Text>
                <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                    We aim to create a global community where authenticity thrives. In a
                    world overloaded with content, SnapNow focuses on genuine connections,
                    empowering individuals to express themselves freely, share their
                    experiences, and celebrate their creativity.
                </Text>

                <Text style={[styles.subtitle, { color: colors.textPrimary }]}>Our Features</Text>
                <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                    • Capture and share moments instantly{"\n"}
                    • Discover trending content tailored to your interests{"\n"}
                    • Interact with friends through likes, comments, and threads{"\n"}
                    • Explore personalized recommendations curated for you{"\n"}
                    • Protect your privacy with strong account and data controls
                </Text>

                <Text style={[styles.subtitle, { color: colors.textPrimary }]}>Our Team</Text>
                <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                    The SnapNow team consists of passionate engineers, designers, and
                    storytellers from around the world. We work together every day to
                    improve performance, enhance user experience, and bring new
                    innovations to your fingertips.
                </Text>

                <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                    We are committed to transparency, creativity, and the freedom to
                    express yourself without barriers. Whether you're a photographer, a
                    content creator, or someone who loves to stay connected, SnapNow is
                    built for you.
                </Text>

                <Text style={[styles.footer, { color: colors.textSecondary }]}>Version 1.0.0 — Made with ❤️ by the SnapNow Team</Text>
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
    footer: { fontSize: 13, color: "#888", marginTop: 30, textAlign: "center" },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee',},
    backBtn: { marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
});
