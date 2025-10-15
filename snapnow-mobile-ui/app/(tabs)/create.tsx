"use client"

import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { auth, db } from "../../config/firebase"
import { extractHashtags } from "../../services/posts"
import { uploadToStorage } from "../../services/storage"
import { UserService } from "../../services/user"

export default function CreateScreen() {
  const [image, setImage] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert("Permission required", "Gallery access required")
      return
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setImage(res.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert("Permission required", "Camera access required")
      return
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setImage(res.assets[0].uri)
    }
  }

  const submit = async () => {
    if (!image) {
      Alert.alert("No image", "Please pick or take a photo")
      return
    }
    if (!auth.currentUser) {
      Alert.alert("Not signed in", "Please sign in first")
      return
    }

    setUploading(true)
    try {
      // Upload image
      const res = await fetch(image)
      const blob = await res.blob()
      const path = `posts/${auth.currentUser.uid}/${Date.now()}.jpg`
      const url = await uploadToStorage(path, blob as any)

      // Extract hashtags from caption
      const hashtags = extractHashtags(caption)

      // Create post
      await addDoc(collection(db, "posts"), {
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || auth.currentUser.email || "user",
        userImage: auth.currentUser.photoURL || null,
        imageUrl: url,
        caption: caption.trim(),
        hashtags,
        likes: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      })

      // Increment user's post count
      await UserService.incrementPostCount(auth.currentUser.uid)

      Alert.alert("Success", "Your post was created successfully!")
      setImage(null)
      setCaption("")
      router.replace("/(tabs)/home-new")
    } catch (err: any) {
      console.error("Failed to create post", err)
      Alert.alert("Error", err.message || "Failed to create post")
    } finally {
      setUploading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity onPress={submit} disabled={uploading || !image}>
          <Text style={[styles.postText, (!image || uploading) && styles.postTextDisabled]}>
            {uploading ? "Posting..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {!image ? (
          <View style={styles.selectImageContainer}>
            <Ionicons name="images-outline" size={80} color="#c7c7c7" />
            <Text style={styles.selectImageText}>Select a photo to share</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.selectButton} onPress={pickFromGallery}>
                <Ionicons name="images" size={24} color="#fff" />
                <Text style={styles.selectButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.selectButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.selectButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.imagePreview}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity style={styles.changeImageButton} onPress={pickFromGallery}>
                <Text style={styles.changeImageText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.captionSection}>
              <TextInput
                style={styles.captionInput}
                placeholder="Write a caption... (use #hashtags)"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={2200}
                textAlignVertical="top"
              />
              <Text style={styles.captionCount}>{caption.length}/2200</Text>
            </View>
          </>
        )}
      </ScrollView>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.uploadingText}>Uploading your post...</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelText: {
    fontSize: 16,
    color: "#666",
  },
  postText: {
    fontSize: 16,
    color: "#0095f6",
    fontWeight: "600",
  },
  postTextDisabled: {
    opacity: 0.3,
  },
  content: {
    flex: 1,
  },
  selectImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  selectImageText: {
    fontSize: 18,
    color: "#8e8e8e",
    marginTop: 16,
    marginBottom: 32,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 16,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#262626",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imagePreview: {
    padding: 16,
  },
  previewImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  changeImageButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  changeImageText: {
    color: "#0095f6",
    fontSize: 14,
    fontWeight: "600",
  },
  captionSection: {
    padding: 16,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: "#dbdbdb",
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    fontSize: 15,
    backgroundColor: "#fafafa",
  },
  captionCount: {
    textAlign: "right",
    color: "#8e8e8e",
    fontSize: 12,
    marginTop: 8,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
})
