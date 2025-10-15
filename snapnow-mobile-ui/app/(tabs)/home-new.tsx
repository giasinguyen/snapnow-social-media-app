"use client"

import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import CommentsModal from "../../components/CommentsModal"
import { LogoHeader } from "../../components/LogoHeader"
import PostCard from "../../components/PostCard"
import { auth } from "../../config/firebase"
import { hasUserLikedPost, likePost, unlikePost } from "../../services/likes"
import { fetchPosts, type Post } from "../../services/posts"

export default function HomeScreenComponent() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const router = useRouter()

  const loadPosts = async () => {
    try {
      const data = await fetchPosts()
      setPosts(data)

      // Check which posts the user has liked
      if (auth.currentUser) {
        const likedSet = new Set<string>()
        for (const post of data) {
          const isLiked = await hasUserLikedPost(auth.currentUser.uid, post.id)
          if (isLiked) {
            likedSet.add(post.id)
          }
        }
        setLikedPosts(likedSet)
      }
    } catch (err) {
      console.error("Failed to fetch posts", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadPosts()
  }

  const handleLike = async (postId: string, liked: boolean) => {
    if (!auth.currentUser) return

    try {
      if (liked) {
        await likePost(
          auth.currentUser.uid,
          postId,
          auth.currentUser.displayName || auth.currentUser.email || "user",
          auth.currentUser.photoURL || undefined,
        )
        setLikedPosts((prev) => new Set(prev).add(postId))
      } else {
        await unlikePost(auth.currentUser.uid, postId)
        setLikedPosts((prev) => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
      }

      // Update local post likes count
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: (post.likes || 0) + (liked ? 1 : -1),
            }
          }
          return post
        }),
      )
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleComment = (postId: string) => {
    setSelectedPostId(postId)
  }

  const handleShare = (postId: string) => {
    console.log(" Share post:", postId)
  }

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LogoHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#262626" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LogoHeader />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stories Section */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer}>
          <View style={styles.storiesContent}>
            {/* Your Story */}
            <View style={styles.storyItem}>
              <View style={styles.addStoryBorder}>
                <View style={styles.addStoryInner}>
                  <Ionicons name="add" size={24} color="#0095F6" />
                </View>
              </View>
              <Text style={styles.storyText}>Your Story</Text>
            </View>

            {/* Other Stories - Placeholder */}
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.storyItem}>
                <View style={styles.storyBorder}>
                  <View style={styles.storyInner}>
                    <Image source={{ uri: "https://via.placeholder.com/60" }} style={styles.storyImage} />
                  </View>
                </View>
                <Text style={styles.storyText}>user_{i}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#c7c7c7" />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtitle}>Follow users to see their posts in your feed</Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLiked={likedPosts.has(post.id)}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onUserPress={handleUserPress}
            />
          ))
        )}

        {posts.length > 0 && (
          <View style={styles.endMessage}>
            <Text style={styles.endMessageText}>You're all caught up!</Text>
          </View>
        )}
      </ScrollView>

      {/* Comments Modal */}
      {selectedPostId && (
        <CommentsModal visible={!!selectedPostId} postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  storiesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
    paddingVertical: 12,
  },
  storiesContent: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 12,
  },
  storyItem: {
    alignItems: "center",
    marginRight: 4,
  },
  addStoryBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbdbdb",
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  addStoryInner: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
  },
  storyBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    borderWidth: 2,
    borderColor: "#e1306c",
  },
  storyInner: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    backgroundColor: "#fff",
    padding: 2,
  },
  storyImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  storyText: {
    fontSize: 12,
    color: "#262626",
    marginTop: 4,
    maxWidth: 68,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#262626",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8e8e8e",
    textAlign: "center",
    lineHeight: 20,
  },
  endMessage: {
    alignItems: "center",
    paddingVertical: 32,
  },
  endMessageText: {
    color: "#8e8e8e",
    fontSize: 14,
  },
})