import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../config/firebase';
import { AuthService, UserProfile } from '../../services/authService';
import { uploadToStorage } from '../../services/storage';
import Header from '../../components/ui/Header';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

export default function EditProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const p = await AuthService.getCurrentUserProfile();
      if (mounted && p) {
        setProfile(p);
        setDisplayName(p.displayName || '');
        setUsername(p.username || '');
        setBio(p.bio || '');
        setAvatarUri(p.profileImage || null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission to access photos is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    // Newer versions return { canceled: boolean, assets: [{ uri, ... }] }
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      let photoURL = profile.profileImage || null;

        if (avatarUri && avatarUri.startsWith('file')) {
        // fetch as blob
        const res = await fetch(avatarUri);
        const blob = await res.blob();
        const path = `users/${profile.id}/avatar.jpg`;
        photoURL = await uploadToStorage(path, blob as any);
      }

      // update firestore
      const userRef = doc(db, 'users', profile.id);
      await updateDoc(userRef, {
        displayName,
        username,
        bio,
        profileImage: photoURL,
      });

      // update firebase auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName, photoURL });
      }

      Alert.alert('Saved', 'Your profile was updated.');
      router.back();
    } catch (err: any) {
      console.error('Failed to save profile', err);
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Edit Profile"
        showBack
        rightAction={{
          text: 'Done',
          onPress: save,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <Avatar
            uri={avatarUri}
            size="large"
            editable
            onPress={pickImage}
          />
          <Text style={styles.changePhotoText}>
            Change Profile Photo
          </Text>
        </View>

        <View style={styles.formSection}>
          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your display name"
            autoCapitalize="words"
          />
          
          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            autoCapitalize="none"
          />
          
          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
            style={styles.bioInput}
          />

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>
              Profile Information
            </Text>
            <Text style={styles.infoText}>
              Your profile information will be visible to all users. 
              Choose a unique username and write a bio that represents you.
            </Text>
          </View>
        </View>

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
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center' as const,
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  changePhotoText: {
    color: '#0095F6',
    fontWeight: '600' as const,
    fontSize: 16,
    marginTop: 12,
  },
  formSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bioInput: {
    height: 96,
    textAlignVertical: 'top' as const,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#262626',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#8E8E8E',
    lineHeight: 18,
  },
  buttonSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
};
