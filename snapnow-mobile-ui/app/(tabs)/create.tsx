import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ActionBar from "../../components/create/ActionBar";
import HeaderBar from "../../components/create/HeaderBar";
import PrivacySheet, {
  PrivacyOption,
} from "../../components/create/PrivacySheet";
import SelectedImages from "../../components/create/SelectedImages";
import UserComposer from "../../components/create/UserComposer";
import { auth } from "../../config/firebase";
import type { UserProfile } from "../../services/authService";
import { getCurrentUserProfile } from "../../services/authService";
import { uploadPostImage } from "../../services/cloudinary";
import { createPost, extractHashtags } from "../../services/posts";

const privacyOptions: PrivacyOption[] = [
  { key: "anyone", label: "Anyone" },
  { key: "followers", label: "Your followers" },
  { key: "following", label: "Profiles you follow" },
  { key: "mentions", label: "Mentioned only" },
];

const CreateSnapScreen: React.FC = () => {
  const router = useRouter();

  const [snapContent, setSnapContent] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacyOption>(privacyOptions[0]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posting, setPosting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const animatedBottom = useRef(new Animated.Value(0)).current;

  const isPostEnabled =
    snapContent.trim().length > 0 && imageUris.length > 0 && !posting;

  useEffect(() => {
    loadUserProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  useEffect(() => {
    const onShow = (e: any) => setKeyboardHeight(e.endCoordinates?.height || 0);

    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener("keyboardDidShow", onShow);
    const hideSub = Keyboard.addListener("keyboardDidHide", onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(animatedBottom, {
      toValue: keyboardHeight,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [keyboardHeight]);

  const loadUserProfile = async () => {
    try {
      const profile = await getCurrentUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow gallery access.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });

    if (!res.canceled && res.assets) {
      setImageUris(res.assets.map((a) => a.uri));
    }
  };

  const removeImage = (i: number) => {
    setImageUris((prev) => prev.filter((_, idx) => idx !== i));
  };

  const clearAllImages = () => setImageUris([]);

  const post = async () => {
    if (!userProfile || !auth.currentUser) {
      Alert.alert("Error", "You must be logged in to create a post");
      return;
    }

    if (imageUris.length === 0 && !snapContent.trim()) {
      Alert.alert("Error", "Add an image or write something.");
      return;
    }

    Keyboard.dismiss();
    setPosting(true);

    try {
      let uploadedImageUrls: string[] = [];

      if (imageUris.length > 0) {
        const uploadTasks = imageUris.map((uri) =>
          uploadPostImage(uri, auth.currentUser!.uid)
        );
        uploadedImageUrls = await Promise.all(uploadTasks);
      }

      const hashtags = extractHashtags(snapContent);

      const postId = await createPost({
        userId: userProfile.id,
        username: userProfile.username,
        userImage: userProfile.profileImage,
        imageUrls: uploadedImageUrls,
        imageUrl: uploadedImageUrls[0] || "",
        caption: snapContent.trim(),
        hashtags,
      });

      // Extract mentions and send notifications
      const mentionRegex = /@(\w+)/g;
      const mentions = snapContent.match(mentionRegex);
      
      if (mentions && mentions.length > 0) {
        const { UserService } = await import('../../services/user');
        const { createNotification } = await import('../../services/notifications');
        
        for (const mention of mentions) {
          const username = mention.substring(1); // Remove @
          try {
            const mentionedUser = await UserService.getUserByUsername(username);
            if (mentionedUser && mentionedUser.id !== auth.currentUser!.uid) {
              // Send notification to mentioned user
              await createNotification(
                mentionedUser.id,
                'mention',
                auth.currentUser!.uid,
                userProfile.username,
                userProfile.profileImage,
                postId,
                uploadedImageUrls[0] || ''
              );
            }
          } catch (error) {
            console.error(`Failed to notify @${username}:`, error);
          }
        }
      }

      Alert.alert("Success", "Post created!", [
        {
          text: "OK",
          onPress: () => {
            setSnapContent("");
            setImageUris([]);
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to create post.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingBottom: 56 + keyboardHeight,
              }}
            >
              <UserComposer
                avatarUri={userProfile?.profileImage}
                username={
                  userProfile?.displayName ||
                  userProfile?.username ||
                  "Loading..."
                }
                value={snapContent}
                onChangeText={setSnapContent}
                placeholder="What's new?"
              />

              <SelectedImages
                imageUris={imageUris}
                onRemoveImage={removeImage}
                onClearAll={clearAllImages}
              />

              <ActionBar onPickImage={pickImage} />
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => setPrivacyOpen(true)}
                style={styles.leftRow}
              >
                <Text style={styles.footerText}>
                  {privacy.label} can reply & quote
                </Text>
                <Ionicons name="chevron-down" size={12} color="#8e8e8e" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={post}
                disabled={!isPostEnabled}
                style={[
                  styles.postBtn,
                  !isPostEnabled && styles.postBtnDisabled,
                ]}
              >
                {posting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.postTxt}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <PrivacySheet
        visible={privacyOpen}
        options={privacyOptions}
        currentKey={privacy.key}
        onClose={() => setPrivacyOpen(false)}
        onSelect={(opt) => {
          setPrivacy(opt);
          setPrivacyOpen(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  body: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },

  leftRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { color: "#8e8e8e", fontSize: 13 },

  postBtn: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnDisabled: {
    backgroundColor: "#b2dffc",
    opacity: 0.6,
  },
  postTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default CreateSnapScreen;
