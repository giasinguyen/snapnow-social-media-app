import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { auth, db } from '../../config/firebase';
import { AuthService, UserProfile } from '../../services/authService';
import { uploadToStorage } from '../../services/storage';

const MAX_BIO_LENGTH = 150;
const MAX_DISPLAYNAME_LENGTH = 50;
const MAX_USERNAME_LENGTH = 30;

export default function EditProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const p = await AuthService.getCurrentUserProfile()
      if (mounted && p) {
        setProfile(p)
        setDisplayName(p.displayName || "")
        setUsername(p.username || "")
        setBio(p.bio || "")
        setAvatarUri(p.profileImage || null)
      }
      if (mounted) setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert("Permission required", "Permission to access photos is required.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ['images'], 
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1]
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission to access camera is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1]
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const validateInputs = (): boolean => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return false;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, underscores, and periods');
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!profile) return;
    if (!validateInputs()) return;

    setSaving(true);
    try {
      let photoURL = profile.profileImage || null;

      // Upload avatar to Cloudinary if new image selected
      if (avatarUri && avatarUri.startsWith('file')) {
        console.log('📤 Uploading avatar to Cloudinary...');
        photoURL = await uploadAvatar(avatarUri, profile.id);
        console.log('✅ Avatar uploaded:', photoURL);
      }

      // update firestore
      const userRef = doc(db, 'users', profile.id);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        profileImage: photoURL,
      });

      // update firebase auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { 
          displayName: displayName.trim(), 
          photoURL 
        });
      }

      Alert.alert('Success', 'Your profile was updated successfully.');
      router.back();
    } catch (err: any) {
      console.error('Failed to save profile', err);
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
    if (!username.trim()) {
      Alert.alert("Error", "Username is required")
      return
    }

    if (!profile) return
    setSaving(true)
    try {
      let photoURL = profile.profileImage || null

      if (avatarUri && avatarUri.startsWith("file")) {
        const res = await fetch(avatarUri)
        const blob = await res.blob()
        const path = `users/${profile.id}/avatar.jpg`
        photoURL = await uploadToStorage(path, blob as any)
      }

      const userRef = doc(db, "users", profile.id)
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        profileImage: photoURL,
      })

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL,
        })
      }

      Alert.alert("Success", "Your profile was updated successfully.")
      router.back()
    } catch (err: any) {
      console.error("Failed to save profile", err)
      Alert.alert("Error", err.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      </SafeAreaView>
    )
  }

  const bioLength = bio.length;
  const displayNameLength = displayName.length;
  const usernameLength = username.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={28} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={save} 
          style={styles.headerButton}
          disabled={saving}
        >
          <Ionicons 
            name="checkmark" 
            size={28} 
            color={saving ? '#8E8E8E' : '#0095F6'} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#0095F6', '#E91E63', '#9C27B0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarInner}>
                <Image
                  source={
                    avatarUri 
                      ? { uri: avatarUri } 
                      : { uri: 'https://i.pravatar.cc/150?img=1' }
                  }
                  style={styles.avatar}
                />
              </View>
            </LinearGradient>
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={showImageOptions}
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={showImageOptions}>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Display Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name</Text>
            <View style={styles.inputWrapper}>
              <Input
                value={displayName}
                onChangeText={(text) => {
                  if (text.length <= MAX_DISPLAYNAME_LENGTH) {
                    setDisplayName(text);
                  }
                }}
                placeholder="Enter your display name"
                autoCapitalize="words"
                maxLength={MAX_DISPLAYNAME_LENGTH}
              />
              <Text style={styles.charCount}>
                {displayNameLength}/{MAX_DISPLAYNAME_LENGTH}
              </Text>
            </View>
          </View>

          {/* Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Input
                value={username}
                onChangeText={(text) => {
                  if (text.length <= MAX_USERNAME_LENGTH) {
                    setUsername(text.toLowerCase());
                  }
                }}
                placeholder="Enter your username"
                autoCapitalize="none"
                maxLength={MAX_USERNAME_LENGTH}
              />
              <Text style={styles.charCount}>
                {usernameLength}/{MAX_USERNAME_LENGTH}
              </Text>
            </View>
            <Text style={styles.helperText}>
              Username can only contain letters, numbers, underscores, and periods
            </Text>
          </View>

          {/* Bio */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio</Text>
            <View style={styles.inputWrapper}>
              <Input
                value={bio}
                onChangeText={(text) => {
                  if (text.length <= MAX_BIO_LENGTH) {
                    setBio(text);
                  }
                }}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
                style={styles.bioInput}
                maxLength={MAX_BIO_LENGTH}
              />
              <Text style={[styles.charCount, styles.bioCharCount]}>
                {bioLength}/{MAX_BIO_LENGTH}
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.privacySection}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#262626" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Private Account</Text>
                <Text style={styles.settingDescription}>
                  Only approved followers can see your posts
                </Text>
              </View>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#DBDBDB', true: '#0095F6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="time-outline" size={22} color="#262626" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Activity Status</Text>
                <Text style={styles.settingDescription}>
                  Show when you&apos;re active
                </Text>
              </View>
            </View>
            <Switch
              value={showActivityStatus}
              onValueChange={setShowActivityStatus}
              trackColor={{ false: '#DBDBDB', true: '#0095F6' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* SnapNow Features */}
        <View style={styles.snapSection}>
          <Text style={styles.sectionTitle}>SnapNow Features</Text>
          
          <TouchableOpacity style={styles.featureItem}>
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: '#0095F6' }]}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureLabel}>Camera Settings</Text>
                <Text style={styles.featureDescription}>
                  Customize your snap experience
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E8E" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureItem}>
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: '#E91E63' }]}>
                <Ionicons name="trophy" size={20} color="#fff" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureLabel}>Achievements</Text>
                <Text style={styles.featureDescription}>
                  View your photo milestones
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E8E" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureItem}>
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="albums" size={20} color="#fff" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureLabel}>Manage Albums</Text>
                <Text style={styles.featureDescription}>
                  Organize your photo collections
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Your profile information will be visible to all users. Choose a unique username 
            and write a bio that represents you.
          </Text>
        </View>

        {/* Save Button */}
        <View style={styles.buttonSection}>
          <Button
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={save}
            loading={saving}
            disabled={saving}
            variant="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  headerButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
  },

  scrollView: {
    flex: 1,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 8,
    borderBottomColor: '#FAFAFA',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarGradient: {
    width: 106,
    height: 106,
    borderRadius: 53,
    padding: 3,
  },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    padding: 2,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  changePhotoText: {
    color: '#0095F6',
    fontWeight: '600',
    fontSize: 15,
  },

  // Form Section
  formSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#FAFAFA',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E8E',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
  },
  charCount: {
    position: 'absolute',
    right: 12,
    top: 14,
    fontSize: 12,
    color: '#8E8E8E',
  },
  bioCharCount: {
    top: 12,
    right: 12,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingRight: 60,
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 6,
    lineHeight: 16,
  },

  // Privacy Settings
  privacySection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#FAFAFA',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#262626',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E8E',
  },

  // SnapNow Features
  snapSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#FAFAFA',
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#262626',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#8E8E8E',
  },

  // Info Section
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#8E8E8E',
    lineHeight: 18,
    textAlign: 'center',
  },

  // Button Section
  buttonSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
