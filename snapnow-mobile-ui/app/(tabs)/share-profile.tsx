import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share as RNShare, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { AuthService, UserProfile } from '../../services/authService';
import Header from '../../components/ui/Header';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';

interface ShareOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

function ShareOption({ icon, label, onPress, color = '#262626' }: ShareOptionProps) {
  return (
    <TouchableOpacity
      style={styles.shareOptionContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.shareOptionIconContainer}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.shareOptionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ShareProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const p = await AuthService.getCurrentUserProfile();
    if (p) {
      setProfile(p);
      // Generate profile URL (in production, this would be your actual domain)
      const url = `https://snapnow.app/@${p.username}`;
      setProfileUrl(url);
    }
  };

  const handleCopyLink = async () => {
    if (profileUrl) {
      await Clipboard.setStringAsync(profileUrl);
      Alert.alert('Copied!', 'Profile link copied to clipboard');
    }
  };

  const handleShareViaSystem = async () => {
    try {
      if (profileUrl) {
        await RNShare.share({
          message: `Check out my SnapNow profile: ${profileUrl}`,
          url: profileUrl,
          title: 'Share Profile',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareToStory = () => {
    Alert.alert('Coming Soon', 'Share to story feature will be available soon');
  };

  const handleShareToFeed = () => {
    Alert.alert('Coming Soon', 'Share to feed feature will be available soon');
  };

  const handleShareViaDM = () => {
    Alert.alert('Coming Soon', 'Share via Direct Message will be available soon');
  };

  const handleShareViaEmail = async () => {
    if (profileUrl) {
      // In a real app, you'd use Linking.openURL with mailto:
      Alert.alert('Share via Email', `Profile link: ${profileUrl}`);
    }
  };

  const handleShareViaSMS = async () => {
    if (profileUrl) {
      // In a real app, you'd use Linking.openURL with sms:
      Alert.alert('Share via SMS', `Profile link: ${profileUrl}`);
    }
  };

  const handleQRCode = () => {
    Alert.alert('Coming Soon', 'QR Code feature will be available soon');
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Header title="Share Profile" showBack />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Share Profile" showBack />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Preview */}
        <View style={styles.profilePreview}>
          <Avatar uri={profile.profileImage} size="large" showGradient />
          <Text style={styles.displayName}>
            {profile.displayName || profile.username}
          </Text>
          <Text style={styles.username}>
            @{profile.username}
          </Text>
          {profile.bio && (
            <Text style={styles.bio}>
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Profile Link */}
        <View style={styles.linkSection}>
          <Text style={styles.sectionTitle}>
            Profile Link
          </Text>
          <View style={styles.linkContainer}>
            <Text style={styles.linkText} numberOfLines={1}>
              {profileUrl}
            </Text>
            <TouchableOpacity
              onPress={handleCopyLink}
              style={styles.copyButton}
            >
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Options */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>
            Share via
          </Text>
          
          <View style={styles.shareOptionsRow}>
            <ShareOption
              icon="share-social"
              label="More"
              onPress={handleShareViaSystem}
              color="#0095F6"
            />
            <ShareOption
              icon="copy-outline"
              label="Copy Link"
              onPress={handleCopyLink}
            />
            <ShareOption
              icon="qr-code-outline"
              label="QR Code"
              onPress={handleQRCode}
            />
            <ShareOption
              icon="newspaper-outline"
              label="Story"
              onPress={handleShareToStory}
            />
          </View>

          <View style={[styles.shareOptionsRow, styles.shareOptionsRowMargin]}>
            <ShareOption
              icon="image-outline"
              label="Feed"
              onPress={handleShareToFeed}
            />
            <ShareOption
              icon="chatbubble-outline"
              label="Direct"
              onPress={handleShareViaDM}
            />
            <ShareOption
              icon="mail-outline"
              label="Email"
              onPress={handleShareViaEmail}
            />
            <ShareOption
              icon="chatbox-outline"
              label="SMS"
              onPress={handleShareViaSMS}
            />
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Share your profile with friends and family. They can follow you to see your posts and stories.
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <Button
            title="Share via System"
            onPress={handleShareViaSystem}
            variant="primary"
          />
          <View style={styles.buttonSpacing}>
            <Button
              title="Copy Profile Link"
              onPress={handleCopyLink}
              variant="outline"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Share Option Styles
  shareOptionContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  shareOptionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareOptionLabel: {
    fontSize: 12,
    color: '#262626',
    textAlign: 'center',
  },
  // Loading Styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8E8E8E',
  },
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  // Profile Preview
  profilePreview: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#262626',
    marginTop: 16,
  },
  username: {
    fontSize: 14,
    color: '#8E8E8E',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: '#262626',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Link Section
  linkSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 12,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#262626',
  },
  copyButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#0095F6',
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Share Section
  shareSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  shareOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  shareOptionsRowMargin: {
    marginTop: 8,
  },
  // Info Section
  infoSection: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#8E8E8E',
    lineHeight: 18,
    textAlign: 'center',
  },
  // Button Section
  buttonSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  buttonSpacing: {
    marginTop: 12,
  },
});
