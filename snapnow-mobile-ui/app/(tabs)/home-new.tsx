import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoHeader } from '../../components/LogoHeader';
import PostCard from '../../components/PostCard';
import { fetchPosts, Post } from '../../services/posts';

// using Firestore-backed posts

// PostCard moved to components/PostCard.tsx

export default function HomeScreenComponent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchPosts();
        if (mounted) setPosts(data);
      } catch (err) {
        console.error('Failed to fetch posts', err);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LogoHeader />
      
      <ScrollView className="flex-1">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="py-4 border-b border-instagram-border"
        >
          <View className="flex-row px-4 space-x-4">
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
                <View className="w-full h-full rounded-full bg-white items-center justify-center">
                  <Ionicons name="add" size={24} color="#0095F6" />
                </View>
              </View>
              <Text className="text-xs text-instagram-dark mt-1">Your Story</Text>
            </View>

            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} className="items-center">
                <View className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
                  <View className="w-full h-full rounded-full bg-white p-0.5">
                    <Image 
                      source={{ uri: 'https://via.placeholder.com/60' }}
                      className="w-full h-full rounded-full"
                    />
                  </View>
                </View>
                <Text className="text-xs text-instagram-dark mt-1">user_{i}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {!loading && posts.map((post) => (
          <PostCard key={post.id} post={{
            id: post.id,
            username: post.username || 'user',
            userImage: post.userImage,
            imageUrl: post.imageUrl || '',
            likes: post.likes || 0,
            caption: post.caption || ''
          }} onLike={async (id, liked) => {
            // naive local like handling; server updates should be handled in service
            console.log('like toggled', id, liked);
          }} />
        ))}

        <View className="items-center py-8">
          <Text className="text-instagram-gray">Loading more posts...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}