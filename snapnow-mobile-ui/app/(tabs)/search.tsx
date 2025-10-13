import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchPostsByQuery, searchUsersByUsernamePrefix } from '../../services/search';
// small debounce helper to avoid adding lodash dependency
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

  const doSearch = async (q: string) => {
    if (!q) { setResults([]); return; }
    setLoading(true);
    try {
      let res: any[] = [];
      if (mode === 'users') res = await searchUsersByUsernamePrefix(q.toLowerCase());
      else res = await searchPostsByQuery(q);
      setResults(res);
      // save recent
      const next = [q, ...recent.filter(r => r !== q)].slice(0, 10);
      setRecent(next);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(next));
    } catch (err) {
      console.error('Search error', err);
    } finally { setLoading(false); }
  };

  // debounce to avoid too many queries
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounceFn((q: string) => doSearch(q), 350), []);

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
    setRecent([]);
    await AsyncStorage.removeItem('recentSearches');
  };

  const refresh = () => {
    // force re-search
    debouncedSearch(query);
  };

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
        <TouchableOpacity onPress={() => router.push(`/(tabs)/home-new?post=${item.id}`)}>
          <Image source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images/default-avatar.jpg')} style={{ width: '100%', height: 220, borderRadius: 8 }} />
          <Text style={{ marginTop: 8 }}>{item.caption}</Text>
          <Text style={{ color: '#666', marginTop: 4 }}>@{item.username}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
        <View style={{ flex: 1 }}>
          <TextInput placeholder={mode === 'users' ? 'Search users' : 'Search posts (hashtag or caption)'} value={query} onChangeText={onChange} style={styles.input} autoCapitalize="none" />
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
  container: { flex: 1, backgroundColor: '#fff' },
  searchBox: { padding: 12 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  name: { fontWeight: '700' },
  username: { color: '#666' },
  noResults: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noResultsText: { color: '#666', fontSize: 16 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  tabActive: { backgroundColor: '#eee' },
});