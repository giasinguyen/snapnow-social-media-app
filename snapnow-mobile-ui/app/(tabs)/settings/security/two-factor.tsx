import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TwoFactor() {
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.title}>Two‑factor authentication</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>PIN (4 digits)</Text>
          <Text style={styles.pinDisplay}>{hasPin ? (revealed ? pin : '••••') : 'Not set'}</Text>

          {!hasPin ? (
            <>
              <TextInput
                style={styles.pinInput}
                placeholder="Enter 4-digit PIN"
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
              <TouchableOpacity style={styles.smallBtn} onPress={onRequestReveal}>
                <Text style={styles.smallBtnText}>Reveal PIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn]} onPress={onDeletePin}>
                <Text style={[styles.smallBtnText, styles.deleteBtnText]}>Delete PIN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Modal visible={revealModalOpen} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Confirm your password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry
                value={revealPassword}
                onChangeText={setRevealPassword}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setRevealModalOpen(false)}>
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
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
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1 },
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
  content: { padding: 16 },
  label: { fontSize: 13, color: '#8E8E8E' },
  pinDisplay: { fontSize: 16, color: '#111', marginTop: 6 },
  pinInput: { width: 180, backgroundColor: '#fff', padding: 12, borderRadius: 8, marginTop: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5e5' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5e5' },
  primaryBtn: { backgroundColor: '#0095f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#eee', paddingVertical: 12, borderRadius: 8, alignItems: 'center', flex: 1, marginRight: 8 },
  secondaryBtnText: { color: '#333', fontWeight: '600' },
  smallBtn: { backgroundColor: '#fff', borderWidth: StyleSheet.hairlineWidth, borderColor: '#ddd', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, marginBottom: 8 },
  smallBtnText: { color: '#333', fontWeight: '600' },
  deleteBtn: { backgroundColor: '#fff' },
  deleteBtnText: { color: '#d92b2b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  modalActions: { flexDirection: 'row', marginTop: 10 },
});
