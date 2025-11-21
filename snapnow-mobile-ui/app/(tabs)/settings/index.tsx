import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import ThemeSelector from '../../../components/ThemeSelector';
import { useTheme } from '../../../contexts/ThemeContext';
import { AuthService } from '../../../services/authService';
import { checkNotificationPermissions } from '../../../services/notificationPermissions';

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
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.6}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, isDanger && styles.iconDanger, { backgroundColor: colors.backgroundGray }]}>
          <Ionicons
            name={icon}
            size={22}
            color={isDanger ? '#ED4956' : colors.textPrimary}
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, isDanger && styles.dangerText, { color: colors.textPrimary }]}>
            {title}
          </Text>
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
        showArrow && (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
  const { colors } = useTheme();
  
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.backgroundWhite, borderColor: colors.borderLight }]}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const { isDark, themeMode, colors } = useTheme();

  const getThemeLabel = () => {
    if (themeMode === 'light') return 'Light';
    if (themeMode === 'dark') return 'Dark';
    return 'Auto (System)';
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundWhite, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <SettingSection title="Appearance">
          <SettingItem
            icon="color-palette-outline"
            title="Theme"
            subtitle={getThemeLabel()}
            onPress={() => setShowThemeSelector(true)}
          />
        </SettingSection>

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
            onPress={() => router.push('/(tabs)/settings/privacy')}
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
            icon="information-circle-outline"
            title="Check Notification Permissions"
            subtitle="View current permission status"
            onPress={async () => {
              await checkNotificationPermissions();
              Alert.alert(
                'Permissions Check',
                'Check console logs for detailed permission status'
              );
            }}
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
            onPress={() => router.push('/(tabs)/settings/saved')}
          />
          <SettingItem
            icon="archive-outline"
            title="Archive"
            subtitle="View archived stories"
            onPress={() => router.push('/(tabs)/settings/archive')}
          />
          <SettingItem
            icon="heart-outline"
            title="Your Activity"
            subtitle="See your activity history"
            onPress={() => router.push('/(tabs)/settings/activity-history')}
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

      <ThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
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
