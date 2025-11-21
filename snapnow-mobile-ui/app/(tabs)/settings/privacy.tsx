import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../../config/firebase';
import { useTheme } from '../../../contexts/ThemeContext';
import { AuthService } from '../../../services/authService';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  isSwitch?: boolean;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  value,
  onValueChange,
  isSwitch = false,
}: SettingItemProps) {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.6}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.backgroundGray }]}>
          <Ionicons name={icon} size={22} color={colors.textPrimary} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: '#0095F6' }}
          thumbColor="#fff"
        />
      ) : (
        showArrow && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [storySharingEnabled, setStorySharingEnabled] = useState(true);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const user = await AuthService.getCurrentUserProfile();
      if (user) {
        setPrivateAccount(!!(user as any)?.isPrivate);
        setActivityStatus((user as any)?.activityStatus !== false);
        setStorySharingEnabled((user as any)?.storySharingEnabled !== false);
      }
    } catch (err) {
      console.warn('Could not load privacy settings', err);
    }
  };

  const updatePrivacySetting = async (field: string, value: boolean) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.warn('No authenticated user');
        return;
      }
      await updateDoc(doc(db, 'users', uid), { [field]: value });
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account Privacy</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="lock-closed-outline"
              title="Private Account"
              subtitle="Only approved followers can see your posts"
              isSwitch
              value={privateAccount}
              onValueChange={(val) => {
                setPrivateAccount(val);
                updatePrivacySetting('isPrivate', val);
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Activity</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="time-outline"
              title="Activity Status"
              subtitle="Show when you're active or recently active"
              isSwitch
              value={activityStatus}
              onValueChange={(val) => {
                setActivityStatus(val);
                updatePrivacySetting('activityStatus', val);
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Sharing</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="chatbubble-outline"
              title="Story Sharing"
              subtitle="Allow others to share your stories"
              isSwitch
              value={storySharingEnabled}
              onValueChange={(val) => {
                setStorySharingEnabled(val);
                updatePrivacySetting('storySharingEnabled', val);
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Blocked</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="eye-off-outline"
              title="Blocked Accounts"
              subtitle="Manage blocked users"
              onPress={() => router.push('/(tabs)/settings/blocked-accounts')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#262626',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#262626',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8E8E8E',
  },
});
