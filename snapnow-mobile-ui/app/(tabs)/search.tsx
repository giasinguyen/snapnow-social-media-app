import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchPostsByQuery, searchUsersByUsernamePrefix } from '../../services/search';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';
function debounceFn<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [mode, setMode] = useState<'users' | 'posts'>('users');
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string }>();

  const doSearch = useCallback(async (q: string, searchMode?: 'users' | 'posts') => {
    if (!q) { setResults([]); return; }
    setLoading(true);
    try {
      let res: any[] = [];
      const currentMode = searchMode || mode;
      if (currentMode === 'users') res = await searchUsersByUsernamePrefix(q.toLowerCase());
      else res = await searchPostsByQuery(q);
      setResults(res);
      // save recent
      setRecent(prev => {
        const next = [q, ...prev.filter(r => r !== q)].slice(0, 10);
        AsyncStorage.setItem('recentSearches', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error('Search error', err);
    } finally { setLoading(false); }
  }, [mode]);

  useEffect(() => {
    // If query param is passed (e.g., from hashtag click), auto-search for posts with that hashtag
    if (params.query) {
      setQuery(params.query);
      setMode('posts');
      doSearch(params.query, 'posts');
    }
  }, [params.query, doSearch]);

  const debouncedSearch = useCallback(debounceFn((q: string) => doSearch(q), 350), [doSearch]);

  const onChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('recentSearches');
      if (raw) setRecent(JSON.parse(raw));
    })();
  }, []);

  const clearRecent = async () => {
    setQuery('');
    await AsyncStorage.removeItem('recentSearches');
  };

  const refresh = () => {
    debouncedSearch(query);
  };

  const renderItem = ({ item }: { item: any }) => {
    if (mode === 'users') return (
      <TouchableOpacity style={styles.row} onPress={() => router.push(`/user/${item.id}` as any)}>
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
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder={mode === 'users' ? 'Search users' : 'Search posts (hashtag or caption)'}
            placeholderTextColor="#999"
            value={query}
            onChangeText={onChange}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={{ marginLeft: 8 }} onPress={refresh}>
          <Text>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8 }}>
        <TouchableOpacity style={[styles.tabBtn, mode === 'users' && styles.tabActive]} onPress={() => setMode('users')}><Text>Users</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, mode === 'posts' && styles.tabActive, { marginLeft: 8 }]} onPress={() => setMode('posts')}><Text>Posts</Text></TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={clearRecent}><Text style={{ color: '#c00' }}>Clear</Text></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}

      {!loading && query.trim() !== '' && results.length === 0 ? (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>Không tìm thấy</Text>
          <Text style={{ marginTop: 8, color: '#666' }}>Thử các từ khóa khác</Text>
        </View>
      ) : (
        <FlatList data={results} keyExtractor={r => r.id} renderItem={renderItem} contentContainerStyle={{ padding: 12 }} />
      )}

      {recent.length > 0 && (
        <View style={{ padding: 12 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Recent searches</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {recent.map(r => (
              <TouchableOpacity key={r} style={{ backgroundColor: '#eee', padding: 8, borderRadius: 16, marginRight: 8, marginBottom: 8 }} onPress={() => { setQuery(r); debouncedSearch(r); }}>
                <Text>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundWhite },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundWhite,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.display,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  searchBox: { padding: SPACING.md },
  input: {
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.backgroundGray },
  name: { fontWeight: TYPOGRAPHY.fontWeight.bold },
  username: { color: COLORS.textSecondary },
  noResults: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noResultsText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xl },
  tabBtn: { 
    paddingVertical: SPACING.sm, 
    paddingHorizontal: SPACING.md, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: COLORS.borderLight 
  },
  tabActive: { backgroundColor: COLORS.backgroundGray },
});