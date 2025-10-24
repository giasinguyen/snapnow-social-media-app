import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;

export default function TimeSpentScreen() {
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [dailyLimit, setDailyLimit] = useState<number | null>(null);
    const router = useRouter();

    const data = {
        labels: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Today"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 12] }],  // 👈 không cần 'color' trong dataset
    };

    const chartConfig = {
        backgroundColor: "#fff",
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(160, 32, 240, ${opacity})`, // màu cột
        labelColor: () => "#555",
        barPercentage: 0.5,
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Time Management</Text>
                <Ionicons name="information-circle-outline" size={22} color="#555" />
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.summary}>
                    <Text style={styles.timeText}>12 min</Text>
                    <Text style={styles.avgLabel}>Daily Average</Text>
                    <Text style={styles.desc}>
                        This is your average daily time spent on SnapNow using this device in the past week.
                        Learn more about{" "}
                        <Text style={styles.linkText}>how to balance your time online.</Text>
                    </Text>
                </View>

                <BarChart
                    data={data}                            
                    width={screenWidth - 40}
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix="m"                    
                    chartConfig={chartConfig}
                    fromZero
                    showBarTops={false}
                    withInnerLines={false}
                    style={styles.chart}
                />

                {/* Time Management Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Time Management</Text>

                    <TouchableOpacity style={styles.row} onPress={() => setShowLimitModal(true)}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="timer-outline" size={20} color="#666" />
                            <Text style={styles.rowText}>Daily Limit</Text>
                        </View>
                        <Text style={styles.statusText}>
                            {dailyLimit ? `${dailyLimit} hr${dailyLimit > 1 ? "s" : ""}` : "Off"}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#bbb" />
                    </TouchableOpacity>


                    <TouchableOpacity style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="moon-outline" size={20} color="#666" />
                            <Text style={styles.rowText}>Quiet Mode</Text>
                        </View>
                        <Text style={styles.statusText}>Off</Text>
                        <Ionicons name="chevron-forward" size={20} color="#bbb" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
            {/* Daily Limit Modal */}
            <Modal
                visible={showLimitModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowLimitModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Set Daily Limit</Text>
                        <ScrollView contentContainerStyle={styles.hourList}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                <TouchableOpacity
                                    key={hour}
                                    style={[
                                        styles.hourItem,
                                        dailyLimit === hour && styles.hourItemSelected,
                                    ]}
                                    onPress={() => {
                                        setDailyLimit(hour);
                                        setShowLimitModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.hourText,
                                            dailyLimit === hour && styles.hourTextSelected,
                                        ]}
                                    >
                                        {hour} hour{hour > 1 ? "s" : ""}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => setShowLimitModal(false)}
                            style={styles.closeBtn}
                        >
                            <Text style={styles.closeBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        backgroundColor: "#fff",
    },
    backBtn: { marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#111", flex: 1 },
    content: { padding: 16 },
    summary: { marginBottom: 24 },
    timeText: { fontSize: 48, fontWeight: "700", color: "#111" },
    avgLabel: { fontSize: 16, fontWeight: "500", color: "#444", marginTop: 4 },
    desc: { fontSize: 14, color: "#666", marginTop: 8, lineHeight: 20 },
    linkText: { color: "#4B7BE5", fontWeight: "600" },
    chart: { borderRadius: 8, marginVertical: 16 },
    section: { marginTop: 20 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#888",
        textTransform: "uppercase",
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    rowText: { fontSize: 16, color: "#111" },
    statusText: { fontSize: 15, color: "#999", marginRight: 4 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 12,
    },
    hourList: {
        paddingVertical: 8,
    },
    hourItem: {
        paddingVertical: 10,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    hourItemSelected: {
        backgroundColor: "#EFE7FB",
    },
    hourText: {
        fontSize: 16,
        color: "#333",
    },
    hourTextSelected: {
        color: "#6C2BB9",
        fontWeight: "600",
    },
    closeBtn: {
        marginTop: 12,
        alignSelf: "center",
    },
    closeBtnText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#6C2BB9",
    },

});
