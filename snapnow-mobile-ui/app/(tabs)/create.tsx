import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionBar from '../../components/create/ActionBar';
import HeaderBar from '../../components/create/HeaderBar';
import PrivacySheet, { PrivacyOption } from '../../components/create/PrivacySheet';
import SelectedImage from '../../components/create/SelectedImage';
import UserComposer from '../../components/create/UserComposer';
import { auth } from '../../config/firebase';
import type { UserProfile } from '../../services/authService';
import { getCurrentUserProfile } from '../../services/authService';
import { createPost, extractHashtags } from '../../services/posts';
import { uploadImageFromUri } from '../../services/storage';

const privacyOptions: PrivacyOption[] = [
  { key: 'anyone',    label: 'Anyone' },
  { key: 'followers', label: 'Your followers' },
  { key: 'following', label: 'Profiles you follow' },
  { key: 'mentions',  label: 'Mentioned only' },
];

const CreateSnapScreen: React.FC = () => {
  const router = useRouter();
  const [snapContent, setSnapContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacyOption>(privacyOptions[0]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posting, setPosting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const animatedBottom = useRef(new Animated.Value(0)).current;

  const isPostEnabled = (snapContent.trim().length > 0 || !!imageUri) && !posting;

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    const onShow = (e: any) => setKeyboardHeight(e.endCoordinates?.height || 0);
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // animate footer when keyboardHeight changes for a smooth transition
  useEffect(() => {
    Animated.timing(animatedBottom, {
      toValue: keyboardHeight,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [keyboardHeight, animatedBottom]);

  const loadUserProfile = async () => {
    try {
      const profile = await getCurrentUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please grant permission to access photo library.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  const post = async () => {
    if (!userProfile || !auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    if (!imageUri && !snapContent.trim()) {
      Alert.alert('Error', 'Please add an image or write something');
      return;
    }

    // Dismiss keyboard first
    Keyboard.dismiss();

    setPosting(true);
    try {
      let uploadedImageUrl = '';

      // Upload image to Firebase Storage if exists
      if (imageUri) {
        const timestamp = Date.now();
        const path = `posts/${auth.currentUser.uid}/${timestamp}.jpg`;
        uploadedImageUrl = await uploadImageFromUri(path, imageUri);
      }

      // Extract hashtags from caption
      const hashtags = extractHashtags(snapContent);

      // Create post in Firestore
      await createPost({
        userId: userProfile.id,
        username: userProfile.username,
        userImage: userProfile.profileImage,
        imageUrl: uploadedImageUrl,
        caption: snapContent.trim(),
        hashtags,
      });

      Alert.alert('Success', 'Your post has been created!', [
        { 
          text: 'OK', 
          onPress: () => {
            setSnapContent('');
            setImageUri(null);
            router.replace('/(tabs)');
          }
        }
      ]);
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
          <HeaderBar
            title="New snap"
            left={<Ionicons name="close" size={26} color="#000" />}
            right={
              <>
                <Ionicons name="folder-open-outline" size={24} color="#000" />
                <Ionicons name="ellipsis-vertical" size={24} color="#000" />
              </>
            }
            onPressLeft={() => {
              Keyboard.dismiss();
              router.back();
            }}
          />

          <ScrollView 
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 + 56 + keyboardHeight }}
          >
            <UserComposer
              avatarUri={userProfile?.profileImage || 'https://via.placeholder.com/150'}
              username={userProfile?.displayName || userProfile?.username || 'Loading...'}
              value={snapContent}
              onChangeText={setSnapContent}
              placeholder="What's new?"
            />

            {imageUri && (
              <SelectedImage uri={imageUri} onClear={() => setImageUri(null)} />
            )}

            <ActionBar onPickImage={pickImage} />
          </ScrollView>

          <Animated.View style={[styles.footer, { marginBottom: animatedBottom } as any] }>
            <TouchableOpacity onPress={() => setPrivacyOpen(true)} style={styles.leftRow}>
              <Text style={styles.footerText}>
                {privacy.label} can reply & quote
              </Text>
              <Ionicons name="chevron-down" size={12} color="#8e8e8e" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={post}
              disabled={!isPostEnabled}
              style={[styles.postBtn, !isPostEnabled && styles.postBtnDisabled]}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postTxt}>Post</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <PrivacySheet
        visible={privacyOpen}
        options={privacyOptions}
        currentKey={privacy.key}
        onClose={() => setPrivacyOpen(false)}
        onSelect={(opt) => { setPrivacy(opt); setPrivacyOpen(false); }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  body: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
  footer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderTopWidth: StyleSheet.hairlineWidth, 
    borderTopColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  footerText: { color: '#8e8e8e', fontSize: 13 },
  postBtn: { 
    backgroundColor: '#0095f6', 
    paddingHorizontal: 20, 
    paddingVertical: 9, 
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnDisabled: { backgroundColor: '#b2dffc', opacity: 0.6 },
  postTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default CreateSnapScreen;
