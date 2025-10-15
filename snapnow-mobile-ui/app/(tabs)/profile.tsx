"use client"

import { useRouter } from "expo-router"
import { collection, getDocs, orderBy, query, where } from "firebase/firestore"
import { useEffect, useState } from "react"
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LogoHeader } from "../../components/LogoHeader"
import UserProfileHeader from "../../components/UserProfileHeader"
import { db } from "../../config/firebase"
import { AuthService, type UserProfile } from "../../services/auth"
import type { Post } from "../../types"

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const p = await AuthService.getCurrentUserProfile()
        if (mounted) {
          setProfile(p)
          if (p) {
            await loadUserPosts(p.id)
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const loadUserPosts = async (userId: string) => {
    setLoadingPosts(true)
    try {
      const postsRef = collection(db, "posts")
      const q = query(postsRef, where("userId", "==", userId), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const userPosts: Post[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        userPosts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as Post)
      })
      setPosts(userPosts)
    } catch (error) {
      console.error("Error loading user posts:", error)
    } finally {
      setLoadingPosts(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.placeholderText}>No profile found</Text>
          <Text style={styles.subText}>Please login or register to see your profile.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LogoHeader />
      <ScrollView>
        <UserProfileHeader
          user={profile}
          isOwnProfile={true}
          onEditProfile={() => router.push({ pathname: "/(tabs)/edit-profile" })}
          onFollowersPress={() => console.log("Show followers")}
          onFollowingPress={() => console.log("Show following")}
        />

        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {loadingPosts ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Share your first moment!</Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {posts.map((post) => (
                <TouchableOpacity key={post.id} style={styles.gridItem}>
                  <Image source={{ uri: post.imageUrl }} style={styles.gridImage} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 8 },
  subText: { fontSize: 14, color: "#666", textAlign: "center" },
  postsSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  postsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -1 },
  gridItem: { width: "33.33%", aspectRatio: 1, padding: 1 },
  gridImage: { width: "100%", height: "100%", backgroundColor: "#f0f0f0" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#666", marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: "#999" },
})
