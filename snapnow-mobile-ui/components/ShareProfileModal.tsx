import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface ShareProfileModalProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
}

export default function ShareProfileModal({
  visible,
  onClose,
  username,
  displayName,
}: ShareProfileModalProps) {
  const profileUrl = `https://snapnow.app/${username}`;

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(profileUrl);
    Alert.alert('Copied!', 'Profile link copied to clipboard');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#262626" />
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.title}>Share Profile</Text>
            <Text style={styles.subtitle}>{displayName}</Text>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <QRCode
                value={profileUrl}
                size={200}
                backgroundColor="white"
                color="#262626"
              />
            </View>

            {/* Profile Link */}
            <View style={styles.linkContainer}>
              <View style={styles.linkBox}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {profileUrl}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.copyButton} 
                onPress={handleCopyLink}
              >
                <Ionicons name="copy-outline" size={20} color="#0095F6" />
                <Text style={styles.copyText}>Copy</Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <Text style={styles.instructions}>
              Scan this QR code or share the link to view this profile
            </Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  linkContainer: {
    width: '100%',
    marginBottom: 16,
  },
  linkBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 13,
    color: '#262626',
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F3FF',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  copyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0095F6',
  },
  instructions: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 16,
  },
});
