import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../../services/authService';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  isSwitch?: boolean;
  isDanger?: boolean;
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
  isDanger = false,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.6}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, isDanger && styles.iconDanger]}>
          <Ionicons
            name={icon}
            size={22}
            color={isDanger ? '#ED4956' : '#262626'}
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, isDanger && styles.dangerText]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#DBDBDB', true: '#0095F6' }}
          thumbColor="#fff"
        />
      ) : (
        showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#8E8E8E" />
        )
      )}
    </TouchableOpacity>
  );
}

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [storySharingEnabled, setStorySharingEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const current = await AuthService.getCurrentUserProfile();
        setPrivateAccount(!!(current as any)?.isPrivate);
      } catch (err) {
        console.warn('Could not load user privacy setting', err);
      }
    })();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Account deletion is not implemented yet.');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Settings */}
        <SettingSection title="Account">
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Change your profile information"
            onPress={() => router.push('/(tabs)/edit-profile')}
          />
          <SettingItem
            icon="lock-closed-outline"
            title="Privacy"
            subtitle="Manage your privacy settings"
            onPress={() => console.log('Privacy')}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Security"
            subtitle="Password, two-factor authentication"
            onPress={() => router.push('/(tabs)/settings/security')}
          />
          <SettingItem
            icon="key-outline"
            title="Account Access"
            subtitle="Review logins and sessions"
            onPress={() => console.log('Account Access')}
          />
        </SettingSection>

        {/* Privacy Settings */}
        <SettingSection title="Privacy">
          <SettingItem
            icon="lock-closed-outline"
            title="Private Account"
            subtitle="Only approved followers can see your posts"
            isSwitch
            value={privateAccount}
            onValueChange={async (val?: boolean) => {
              const value = !!val;
              setPrivateAccount(value);
              try {
                const uid = auth.currentUser?.uid;
                if (!uid) {
                  console.warn('No authenticated user to update privacy setting');
                  return;
                }
                await updateDoc(doc(db, 'users', uid), { isPrivate: value });
              } catch (err) {
                console.error('Failed to update privacy setting:', err);
              }
            }}
          />
          <SettingItem
            icon="time-outline"
            title="Activity Status"
            subtitle="Show when you're active"
            isSwitch
            value={activityStatus}
            onValueChange={setActivityStatus}
          />
          <SettingItem
            icon="chatbubble-outline"
            title="Story Sharing"
            subtitle="Allow sharing of your stories"
            isSwitch
            value={storySharingEnabled}
            onValueChange={setStorySharingEnabled}
          />
          <SettingItem
            icon="eye-off-outline"
            title="Blocked Accounts"
            subtitle="Manage blocked users"
            onPress={() => console.log('Blocked Accounts')}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive push notifications"
              isSwitch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
          />
          <SettingItem
            icon="mail-outline"
            title="Email Notifications"
            subtitle="Manage email preferences"
              onPress={() => router.push('/(tabs)/settings/email-notifications')}
          />
          <SettingItem
            icon="megaphone-outline"
            title="SMS Notifications"
            subtitle="Manage SMS preferences"
            onPress={() => console.log('SMS Notifications')}
          />
        </SettingSection>

        {/* Content Preferences */}
        <SettingSection title="Content">
          <SettingItem
            icon="bookmark-outline"
            title="Saved"
            subtitle="View your saved posts"
            onPress={() => console.log('Saved')}
          />
          <SettingItem
            icon="archive-outline"
            title="Archive"
            subtitle="View archived stories and posts"
            onPress={() => console.log('Archive')}
          />
          <SettingItem
            icon="heart-outline"
            title="Your Activity"
            subtitle="See your activity history"
            onPress={() => console.log('Activity')}
          />
          <SettingItem
            icon="time-outline"
            title="Time Management"
            subtitle="Manage your time on SnapNow"
            onPress={() => router.push('/(tabs)/settings/time-spent')}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support">
          <SettingItem
            icon="help-circle-outline"
            title="Help Center"
            subtitle="Get help and support"
            onPress={() => router.push('/(tabs)/settings/help-center')}
          />
          <SettingItem
            icon="information-circle-outline"
            title="About"
            subtitle="App version and information"
            onPress={() => router.push('/(tabs)/settings/about')}
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => router.push('/(tabs)/settings/term')}
          />
          <SettingItem
            icon="shield-outline"
            title="Privacy Policy"
            onPress={() => router.push('/(tabs)/settings/privacy')}
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="Account Actions">
          <SettingItem
            icon="log-out-outline"
            title="Log Out"
            onPress={handleLogout}
            showArrow={false}
            isDanger={false}
          />
          <SettingItem
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            showArrow={false}
            isDanger
          />
        </SettingSection>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>SnapNow v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ by The Challengers
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E8E',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconDanger: {
    backgroundColor: '#FEE',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#262626',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8E8E8E',
    marginTop: 2,
  },
  dangerText: {
    color: '#ED4956',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E8E',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#BDBDBD',
    marginTop: 4,
  },
});
