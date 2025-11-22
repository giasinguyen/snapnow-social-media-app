import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../../../contexts/ThemeContext';
import {
    forceUpdateSession,
    getDailyLimit,
    getLast7DaysUsage,
    getSleepMode,
    getTodayUsage,
    getWeeklyAverage,
    setDailyLimit as saveDailyLimit,
    setSleepMode as saveSleepMode,
    type SleepModeConfig
} from "../../../services/timeTracking";

const screenWidth = Dimensions.get("window").width;

export default function TimeSpentScreen() {
    const { colors } = useTheme();
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [dailyLimit, setDailyLimit] = useState<number | null>(null);
    const [showSleepModal, setShowSleepModal] = useState(false);
    const [sleepEnabled, setSleepEnabled] = useState(false);
    const [startTime, setStartTime] = useState('12:00AM');
    const [endTime, setEndTime] = useState('12:00AM');
    const [selectedDays, setSelectedDays] = useState<boolean[]>([false,false,false,false,false,false,false]);
    const [showTimePicker, setShowTimePicker] = useState<null | 'start' | 'end'>(null);
    const [loading, setLoading] = useState(true);
    const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
    const [dailyAverage, setDailyAverage] = useState(0);
    const [todayUsage, setTodayUsage] = useState(0);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Force update current session before loading data
            await forceUpdateSession();
            
            // Load usage data
            const last7Days = await getLast7DaysUsage();
            const weeklyDataArray = last7Days.map(day => day.minutes);
            setWeeklyData(weeklyDataArray);
            
            // Load average
            const avg = await getWeeklyAverage();
            setDailyAverage(avg);
            
            // Load today's usage
            const today = await getTodayUsage();
            setTodayUsage(today);
            
            // Load daily limit
            const limit = await getDailyLimit();
            setDailyLimit(limit);
            
            // Load sleep mode config
            const sleepConfig = await getSleepMode();
            if (sleepConfig) {
                setSleepEnabled(sleepConfig.enabled);
                setStartTime(sleepConfig.startTime);
                setEndTime(sleepConfig.endTime);
                setSelectedDays(sleepConfig.selectedDays);
            }
        } catch (error) {
            console.error('Error loading time tracking data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDayLabels = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            if (i === 0) {
                labels.push('Today');
            } else {
                labels.push(days[date.getDay()]);
            }
        }
        return labels;
    };

    const data = {
        labels: getDayLabels(),
        datasets: [{ data: weeklyData.length > 0 ? weeklyData : [0, 0, 0, 0, 0, 0, 0] }],
    };

    const maxValue = Math.max(...weeklyData);
    const useHourFormat = maxValue >= 60;

    const chartConfig = {
        backgroundColor: "#fff",
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        decimalPlaces: useHourFormat ? 1 : 0,
        color: (opacity = 1) => `rgba(160, 32, 240, ${opacity})`, // màu cột
        labelColor: () => "#555",
        barPercentage: 0.5,
        formatYLabel: (value: string) => {
            const numValue = parseFloat(value);
            if (useHourFormat) {
                return `${(numValue / 60).toFixed(1)}h`;
            }
            return `${Math.round(numValue)}m`;
        },
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Time Management</Text>
                <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#A020F0" />
                    </View>
                ) : (
                    <>
                <View style={styles.summary}>
                    <Text style={[styles.timeText, { color: colors.textPrimary }]}>
                        {dailyAverage >= 60 
                            ? `${Math.floor(dailyAverage / 60)} hr ${dailyAverage % 60 > 0 ? `${dailyAverage % 60} min` : ''}`.trim()
                            : `${dailyAverage} min`}
                    </Text>
                    <Text style={[styles.avgLabel, { color: colors.textPrimary }]}>Daily Average</Text>
                    <Text style={[styles.desc, { color: colors.textSecondary }]}>
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
                    yAxisSuffix=""                    
                    chartConfig={chartConfig}
                    fromZero
                    showBarTops={false}
                    withInnerLines={false}
                    style={styles.chart}
                />

                {/* Time Management Options */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Time Management</Text>

                    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.borderLight }]} onPress={() => setShowLimitModal(true)}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="timer-outline" size={20} color={colors.textSecondary} />
                            <Text style={[styles.rowText, { color: colors.textPrimary }]}>Daily Limit</Text>
                        </View>
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                            {dailyLimit ? `${dailyLimit} hr${dailyLimit > 1 ? "s" : ""}` : "Off"}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>


                    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.borderLight }]} onPress={() => setShowSleepModal(true)}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
                            <Text style={[styles.rowText, { color: colors.textPrimary }]}>Quiet Mode</Text>
                        </View>
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>{sleepEnabled ? 'On' : 'Off'}</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                    </>
                )}
            </ScrollView>
            {/* Sleep Mode Modal (full screen white UI) */}
            <Modal visible={showSleepModal} animationType="slide" onRequestClose={() => setShowSleepModal(false)}>
                <SafeAreaView style={sleepStyles.safe}>
                    <View style={sleepStyles.headerRow}>
                        <TouchableOpacity onPress={() => setShowSleepModal(false)} style={{ padding: 8 }}>
                            <Ionicons name="arrow-back" size={22} color="#111" />
                        </TouchableOpacity>
                        <Text style={sleepStyles.headerTitle}>Sleep mode</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={sleepStyles.content}>
                        <View style={sleepStyles.topRow}>
                            <Text style={sleepStyles.topLabel}>Sleep mode</Text>
                            <Switch value={sleepEnabled} onValueChange={setSleepEnabled} trackColor={{ true: '#0095f6' }} />
                        </View>

                        <Text style={sleepStyles.description}>Your notifications will be muted during the times you choose. People will see that you're in sleep mode.</Text>

                        <View style={sleepStyles.timeRow}>
                            <Text style={sleepStyles.timeLabel}>Start time</Text>
                            <TouchableOpacity style={sleepStyles.timeBtn} onPress={() => setShowTimePicker('start')}>
                                <Text style={sleepStyles.timeBtnText}>{startTime}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={sleepStyles.timeRow}>
                            <Text style={sleepStyles.timeLabel}>End time</Text>
                            <TouchableOpacity style={sleepStyles.timeBtn} onPress={() => setShowTimePicker('end')}>
                                <Text style={sleepStyles.timeBtnText}>{endTime}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[sleepStyles.timeLabel, { marginTop: 14 }]}>Choose days</Text>
                        <View style={sleepStyles.daysRow}>
                            {['S','M','T','W','T','F','S'].map((d, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[sleepStyles.dayBtn, selectedDays[i] && sleepStyles.dayBtnActive]}
                                    onPress={() => {
                                        const next = [...selectedDays];
                                        next[i] = !next[i];
                                        setSelectedDays(next);
                                    }}
                                >
                                    <Text style={[sleepStyles.dayText, selectedDays[i] && sleepStyles.dayTextActive]}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={sleepStyles.hint}>{sleepEnabled ? '' : 'Sleep mode is off.'}</Text>

                        <TouchableOpacity 
                            style={[sleepStyles.saveBtn, !sleepEnabled && { opacity: 0.6 }]} 
                            disabled={!sleepEnabled} 
                            onPress={async () => {
                                const config: SleepModeConfig = {
                                    enabled: sleepEnabled,
                                    startTime,
                                    endTime,
                                    selectedDays,
                                };
                                await saveSleepMode(config);
                                setShowSleepModal(false);
                            }}
                        >
                            <Text style={sleepStyles.saveBtnText}>Save</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Time picker modal for start/end (simple hour + AM/PM) */}
            <Modal visible={!!showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(null)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.backgroundWhite }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select hour</Text>
                        <ScrollView contentContainerStyle={styles.hourList}>
                            {Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i).map((hour) => (
                                <TouchableOpacity
                                    key={hour}
                                    style={[styles.hourItem, { borderBottomColor: colors.borderLight }]}
                                    onPress={() => {
                                        const ampm = 'AM';
                                        const t = `${hour}:00${ampm}`;
                                        if (showTimePicker === 'start') setStartTime(t);
                                        else setEndTime(t);
                                        setShowTimePicker(null);
                                    }}
                                >
                                    <Text style={[styles.hourText, { color: colors.textPrimary }]}>{hour}:00 AM</Text>
                                </TouchableOpacity>
                            ))}
                            {Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i).map((hour) => (
                                <TouchableOpacity
                                    key={'pm' + hour}
                                    style={[styles.hourItem, { borderBottomColor: colors.borderLight }]}
                                    onPress={() => {
                                        const ampm = 'PM';
                                        const t = `${hour}:00${ampm}`;
                                        if (showTimePicker === 'start') setStartTime(t);
                                        else setEndTime(t);
                                        setShowTimePicker(null);
                                    }}
                                >
                                    <Text style={[styles.hourText, { color: colors.textPrimary }]}>{hour}:00 PM</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShowTimePicker(null)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {/* Daily Limit Modal */}
            <Modal
                visible={showLimitModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowLimitModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.backgroundWhite }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Set Daily Limit</Text>
                        <ScrollView contentContainerStyle={styles.hourList}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                <TouchableOpacity
                                    key={hour}
                                    style={[
                                        styles.hourItem,
                                        { borderBottomColor: colors.borderLight },
                                        dailyLimit === hour && styles.hourItemSelected,
                                    ]}
                                    onPress={async () => {
                                        setDailyLimit(hour);
                                        await saveDailyLimit(hour);
                                        setShowLimitModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.hourText,
                                            { color: colors.textPrimary },
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
    safe: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
    },
    backBtn: { marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", flex: 1 },
    content: { padding: 16 },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
    },
    summary: { marginBottom: 24 },
    timeText: { fontSize: 48, fontWeight: "700" },
    avgLabel: { fontSize: 16, fontWeight: "500", marginTop: 4 },
    desc: { fontSize: 14, marginTop: 8, lineHeight: 20 },
    linkText: { color: "#4B7BE5", fontWeight: "600" },
    chart: { borderRadius: 8, marginVertical: 16 },
    section: { marginTop: 20 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        textTransform: "uppercase",
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    rowText: { fontSize: 16 },
    statusText: { fontSize: 15, marginRight: 4 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "80%",
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
    },
    hourItemSelected: {
        backgroundColor: "#EFE7FB",
    },
    hourText: {
        fontSize: 16,
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

const sleepStyles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111', flex: 1, textAlign: 'center' },
    content: { padding: 16 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    topLabel: { fontSize: 16, fontWeight: '600', color: '#111' },
    description: { color: '#666', marginBottom: 12, lineHeight: 20 },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    timeLabel: { fontSize: 14, color: '#666' },
    timeBtn: { backgroundColor: '#f6f6f6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, minWidth: 110, alignItems: 'center' },
    timeBtnText: { color: '#111', fontWeight: '600' },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    dayBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#fff', borderWidth: StyleSheet.hairlineWidth, borderColor: '#eee', alignItems: 'center', justifyContent: 'center' },
    dayBtnActive: { backgroundColor: '#111' },
    dayText: { color: '#333', fontWeight: '600' },
    dayTextActive: { color: '#fff' },
    hint: { color: '#888', marginTop: 12 },
    saveBtn: { marginTop: 24, backgroundColor: '#0095f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700' },
});
