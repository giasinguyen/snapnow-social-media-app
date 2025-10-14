import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../config/firebase';
import { AuthService, UserProfile } from '../../services/auth';
import { uploadToStorage } from '../../services/storage';

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
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
          <Image source={avatarUri ? { uri: avatarUri } : require('../../assets/images/default-avatar.jpg')} style={styles.avatar} />
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>

        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Display name" />
        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" autoCapitalize="none" />
        <TextInput style={[styles.input, { height: 100 }]} value={bio} onChangeText={setBio} placeholder="Bio" multiline />

        <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarWrap: { alignItems: 'center', marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee' },
  changeText: { marginTop: 8, color: '#0066cc' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 12 },
  saveButton: { backgroundColor: '#111', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
