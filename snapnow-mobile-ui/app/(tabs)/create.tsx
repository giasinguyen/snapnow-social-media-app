import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoHeader } from '../../components/LogoHeader';
import { auth, db } from '../../config/firebase';
import { uploadToStorage } from '../../services/storage';

export default function CreateScreen(){
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Gallery access required'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) setImage(res.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Camera access required'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) setImage(res.assets[0].uri);
  };

  const submit = async () => {
    if (!image) { Alert.alert('No image', 'Please pick or take a photo'); return; }
    if (!auth.currentUser) { Alert.alert('Not signed in', 'Please sign in first'); return; }

    setUploading(true);
    try {
      const res = await fetch(image);
      const blob = await res.blob();
      const path = `posts/${auth.currentUser.uid}/${Date.now()}.jpg`;
      const url = await uploadToStorage(path, blob as any);

      await addDoc(collection(db, 'posts'), {
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || auth.currentUser.email || 'user',
        userImage: auth.currentUser.photoURL || null,
        imageUrl: url,
        caption,
        likes: 0,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Posted', 'Your post was created');
      router.replace('/(tabs)');
    } catch (err:any) {
      console.error('Failed to create post', err);
      Alert.alert('Error', err.message || 'Failed to create post');
    } finally { setUploading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LogoHeader />
      <br></br>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={pickFromGallery}><Text>Gallery</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}><Text>Camera</Text></TouchableOpacity>
      </View>

      <View style={styles.preview}>
        {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : <Text style={styles.placeholderText}>No image selected</Text>}
      </View>

      <TextInput style={styles.caption} placeholder="Write a caption..." value={caption} onChangeText={setCaption} multiline />

      <TouchableOpacity style={[styles.postBtn, uploading && { opacity: 0.6 }]} onPress={submit} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.postText}>Post</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  actionBtn: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  preview: { height: 320, borderWidth: 1, borderColor: '#eee', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  previewImage: { width: '100%', height: '100%', borderRadius: 8 },
  placeholderText: { color: '#666' },
  caption: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, minHeight: 80, marginBottom: 12 },
  postBtn: { backgroundColor: '#111', padding: 12, borderRadius: 8, alignItems: 'center' },
  postText: { color: '#fff', fontWeight: '700' },
});