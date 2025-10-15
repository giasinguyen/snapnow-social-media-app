"use client"

import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { updateProfile } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { auth, db } from "../../config/firebase"
import { AuthService, type UserProfile } from "../../services/auth"
import { uploadToStorage } from "../../services/storage"

export default function EditProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  const save = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name is required")
      return
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
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>No profile found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={save} disabled={saving}>
          <Text style={[styles.doneText, saving && { opacity: 0.5 }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
          <Image
            source={avatarUri ? { uri: avatarUri } : require("../../assets/images/default-avatar.jpg")}
            style={styles.avatar}
          />
          <Text style={styles.changeText}>Change Photo</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  cancelText: { fontSize: 16, color: "#666" },
  doneText: { fontSize: 16, color: "#0095f6", fontWeight: "600" },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarWrap: { alignItems: "center", paddingVertical: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#eee" },
  changeText: { marginTop: 12, color: "#0095f6", fontSize: 14, fontWeight: "600" },
  form: { paddingHorizontal: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#666", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#dbdbdb",
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: "#fafafa",
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
})
