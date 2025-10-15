"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LogoHeader } from "../../components/LogoHeader"
import { searchPostsByQuery, searchUsersByUsernamePrefix } from "../../services/search"
import type { User } from "../../types"

// Debounce helper
function debounceFn<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), wait)
  }
}

export default function SearchScreen() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [mode, setMode] = useState<"users" | "posts">("users")
  const [recent, setRecent] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      let res: any[] = []
      if (mode === "users") {
        res = await searchUsersByUsernamePrefix(q.toLowerCase())
      } else {
        res = await searchPostsByQuery(q)
      }
      setResults(res)

      // Save to recent searches
      const next = [q, ...recent.filter((r) => r !== q)].slice(0, 10)
      setRecent(next)
      await AsyncStorage.setItem("recentSearches", JSON.stringify(next))
    } catch (err) {
      console.error("Search error", err)
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useCallback(
    debounceFn((q: string) => doSearch(q), 350),
    [mode, recent],
  )

  const onChange = (text: string) => {
    setQuery(text)
    debouncedSearch(text)
  }

  useEffect(() => {
    ;(async () => {
      const raw = await AsyncStorage.getItem("recentSearches")
      if (raw) setRecent(JSON.parse(raw))
    })()
  }, [])

  const clearRecent = async () => {
    setRecent([])
    await AsyncStorage.removeItem("recentSearches")
  }

  const handleRecentSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    doSearch(searchTerm)
  }

  const renderItem = ({ item }: { item: any }) => {
    if (mode === 'users') return (
      <TouchableOpacity style={styles.row} onPress={() => router.push(`/(tabs)/profile?user=${item.id}`)}>
        <Image source={item.profileImage ? { uri: item.profileImage } : require('../../assets/images/default-avatar.jpg')} style={styles.avatar} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.name}>{item.displayName || item.username}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
      </TouchableOpacity>
    );

    // post item
    return (
      <View style={{ paddingVertical: 8 }}>
        <TouchableOpacity onPress={() => router.push(`/(tabs)?post=${item.id}`)}>
          <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/default-avatar.jpg')} style={{ width: '100%', height: 220, borderRadius: 8 }} />
          <Text style={{ marginTop: 8 }}>{item.caption}</Text>
          <Text style={{ color: '#666', marginTop: 4 }}>@{item.username}</Text>
        </TouchableOpacity>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#c7c7c7" />
    </TouchableOpacity>
  )

  const renderPostItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.postItem} onPress={() => console.log("View post:", item.id)}>
      <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <Ionicons name="heart" size={16} color="#fff" />
          <Text style={styles.postStatText}>{item.likes || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <LogoHeader />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#8e8e8e" style={styles.searchIcon} />
          <TextInput
            placeholder={mode === "users" ? "Search users..." : "Search posts..."}
            placeholderTextColor="#8e8e8e"
            value={query}
            onChangeText={onChange}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#8e8e8e" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mode Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, mode === "users" && styles.tabActive]}
          onPress={() => {
            setMode("users")
            setResults([])
            if (query) doSearch(query)
          }}
        >
          <Ionicons name="people" size={20} color={mode === "users" ? "#262626" : "#8e8e8e"} />
          <Text style={[styles.tabText, mode === "users" && styles.tabTextActive]}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, mode === "posts" && styles.tabActive]}
          onPress={() => {
            setMode("posts")
            setResults([])
            if (query) doSearch(query)
          }}
        >
          <Ionicons name="grid" size={20} color={mode === "posts" ? "#262626" : "#8e8e8e"} />
          <Text style={[styles.tabText, mode === "posts" && styles.tabTextActive]}>Posts</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#262626" />
        </View>
      ) : query.trim() === "" ? (
        // Recent Searches
        recent.length > 0 ? (
          <View style={styles.recentContainer}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecent}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentList}>
              {recent.map((r, index) => (
                <TouchableOpacity key={index} style={styles.recentItem} onPress={() => handleRecentSearch(r)}>
                  <Ionicons name="time-outline" size={20} color="#8e8e8e" />
                  <Text style={styles.recentText}>{r}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const newRecent = recent.filter((item) => item !== r)
                      setRecent(newRecent)
                      AsyncStorage.setItem("recentSearches", JSON.stringify(newRecent))
                    }}
                  >
                    <Ionicons name="close" size={20} color="#c7c7c7" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color="#c7c7c7" />
            <Text style={styles.emptyTitle}>Search SnapNow</Text>
            <Text style={styles.emptySubtitle}>Find users and posts by username or hashtag</Text>
          </View>
        )
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sad-outline" size={64} color="#c7c7c7" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try searching for something else</Text>
        </View>
      ) : mode === "users" ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          numColumns={3}
          contentContainerStyle={styles.postsGrid}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#efefef",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: "#262626",
  },
  clearButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#262626",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8e8e8e",
  },
  tabTextActive: {
    color: "#262626",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  recentContainer: {
    padding: 16,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#262626",
  },
  clearText: {
    fontSize: 14,
    color: "#0095f6",
    fontWeight: "600",
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: "#262626",
  },
  listContent: {
    padding: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 2,
  },
  username: {
    fontSize: 13,
    color: "#8e8e8e",
  },
  bio: {
    fontSize: 13,
    color: "#8e8e8e",
    marginTop: 4,
  },
  postsGrid: {
    padding: 1,
  },
  postItem: {
    width: "33.33%",
    aspectRatio: 1,
    padding: 1,
  },
  postImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  postOverlay: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postStatText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
})
