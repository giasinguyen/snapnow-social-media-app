"use client"

import { useEffect, useState } from "react"
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Ionicons } from '@expo/vector-icons';
import { auth } from "../config/firebase"
import { followUser, isFollowing, unfollowUser } from "../services/follow"
import type { User } from "../types"

interface UserProfileHeaderProps {
  user: User
  isOwnProfile: boolean
  onEditProfile?: () => void
  onFollowersPress?: () => void
  onFollowingPress?: () => void
}

export default function UserProfileHeader({
  user,
  isOwnProfile,
  onEditProfile,
  onFollowersPress,
  onFollowingPress,
}: UserProfileHeaderProps) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [followersCount, setFollowersCount] = useState(user.followersCount || 0)
  const [followingCount, setFollowingCount] = useState(user.followingCount || 0)

  useEffect(() => {
    checkFollowStatus()
  }, [user.id])

  const checkFollowStatus = async () => {
    if (!auth.currentUser || isOwnProfile) return

    try {
      const status = await isFollowing(auth.currentUser.uid, user.id)
      setFollowing(status)
    } catch (error) {
      console.error("Error checking follow status:", error)
    }
  }

  const handleFollowToggle = async () => {
    if (!auth.currentUser || isOwnProfile) return

    setLoading(true)
    try {
      if (following) {
        await unfollowUser(auth.currentUser.uid, user.id)
        setFollowing(false)
        setFollowersCount((prev) => prev - 1)
      } else {
        await followUser(
          auth.currentUser.uid,
          user.id,
          auth.currentUser.displayName || auth.currentUser.email || "user",
          auth.currentUser.photoURL || undefined,
        )
        setFollowing(true)
        setFollowersCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Image
          source={user.profileImage ? { uri: user.profileImage } : require("../assets/images/default-avatar.jpg")}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.stat} onPress={onFollowersPress}>
          <Text style={styles.statNumber}>{user.postsCount || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stat} onPress={onFollowersPress}>
          <Text style={styles.statNumber}>{followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stat} onPress={onFollowingPress}>
          <Text style={styles.statNumber}>{followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.username}>
            {(user as any)?.isPrivate ? (
              <Ionicons name="lock-closed-outline" size={14} color="#8E8E8E" />
            ) : null}
            {' '}@{user.username}
          </Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>
      </View>

      <View style={styles.actionRow}>
        {isOwnProfile ? (
          <TouchableOpacity style={styles.editButton} onPress={onEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.followButton, following && styles.followingButton]}
              onPress={handleFollowToggle}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={following ? "#262626" : "#fff"} />
              ) : (
                <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
                  {following ? "Following" : "Follow"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
    backgroundColor: "#fff",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginRight: 24,
    backgroundColor: "#eee",
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#262626",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  infoRow: {
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
    color: "#262626",
  },
  username: {
    color: "#666",
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    marginTop: 4,
    color: "#333",
    fontSize: 14,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
  },
  followButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "#0095f6",
  },
  followingButton: {
    backgroundColor: "#efefef",
    borderWidth: 1,
    borderColor: "#dbdbdb",
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  followingButtonText: {
    color: "#262626",
  },
  messageButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "#efefef",
    borderWidth: 1,
    borderColor: "#dbdbdb",
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
  },
})
