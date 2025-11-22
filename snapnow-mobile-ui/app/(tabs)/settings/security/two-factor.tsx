import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../contexts/ThemeContext';

export default function TwoFactor() {
  const { colors } = useTheme();
  const router = useRouter();
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealPassword, setRevealPassword] = useState('');
  const [revealed, setRevealed] = useState(false);

  const onCreatePin = () => {
    if (pinInput.length === 4) {
      setPin(pinInput);
      setHasPin(true);
      setPinInput('');
    }
  };

  const onRequestReveal = () => {
    setRevealModalOpen(true);
    setRevealPassword('');
  };

  const onConfirmReveal = () => {
    // UI only: accept any password
    setRevealModalOpen(false);
    setRevealed(true);
  };

  const onDeletePin = () => {
    setHasPin(false);
    setPin('');
    setRevealed(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Two‑factor authentication</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>PIN (4 digits)</Text>
          <Text style={[styles.pinDisplay, { color: colors.textPrimary }]}>{hasPin ? (revealed ? pin : '••••') : 'Not set'}</Text>

          {!hasPin ? (
            <>
              <TextInput
                style={[styles.pinInput, { backgroundColor: colors.backgroundWhite, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={4}
                value={pinInput}
                onChangeText={(v) => setPinInput(v.replace(/[^0-9]/g, ''))}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={onCreatePin}>
                <Text style={styles.primaryBtnText}>Create PIN</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ marginTop: 12 }}>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.backgroundWhite, borderColor: colors.border }]} onPress={onRequestReveal}>
                <Text style={[styles.smallBtnText, { color: colors.textPrimary }]}>Reveal PIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn, { backgroundColor: colors.backgroundWhite, borderColor: colors.border }]} onPress={onDeletePin}>
                <Text style={[styles.smallBtnText, styles.deleteBtnText]}>Delete PIN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Modal visible={revealModalOpen} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.backgroundWhite }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Confirm your password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundWhite, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={revealPassword}
                onChangeText={setRevealPassword}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: colors.backgroundGray }]} onPress={() => setRevealModalOpen(false)}>
                  <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={onConfirmReveal}>
                  <Text style={styles.primaryBtnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16 },
  label: { fontSize: 13 },
  pinDisplay: { fontSize: 16, marginTop: 6 },
  pinInput: { width: 180, padding: 12, borderRadius: 8, marginTop: 12, borderWidth: StyleSheet.hairlineWidth },
  input: { padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth },
  primaryBtn: { backgroundColor: '#0095f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', flex: 1, marginRight: 8 },
  secondaryBtnText: { fontWeight: '600' },
  smallBtn: { borderWidth: StyleSheet.hairlineWidth, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, marginBottom: 8 },
  smallBtnText: { fontWeight: '600' },
  deleteBtn: {},
  deleteBtnText: { color: '#d92b2b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', padding: 16, borderRadius: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  modalActions: { flexDirection: 'row', marginTop: 10 },
});
