import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LogoHeader } from '../../components/LogoHeader';

const mockPosts = [
  {
    id: '1',
    username: 'admin',
    userImage: 'https://via.placeholder.com/50',
    postImage: 'https://via.placeholder.com/400x400',
    likes: 128,
    caption: 'Beautiful sunset in the mountains 🌅 #nature #photography',
    timeAgo: '2h',
    isLiked: false,
  },
  {
    id: '2', 
    username: 'user_demo',
    userImage: 'https://via.placeholder.com/50',
    postImage: 'https://via.placeholder.com/400x400',
    likes: 89,
    caption: 'Coffee time ☕️ #coffee #morning',
    timeAgo: '5h',
    isLiked: true,
  },
];

const PostCard = ({ post }: { post: any }) => {
  return (
    <View className="bg-white mb-4">
      <View className="flex-row items-center px-4 py-3">
        <Image 
          source={{ uri: post.userImage }}
          className="w-8 h-8 rounded-full mr-3"
        />
        <Text className="font-semibold text-instagram-dark flex-1">
          {post.username}
        </Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#262626" />
        </TouchableOpacity>
      </View>

      <Image 
        source={{ uri: post.postImage }}
        className="w-full aspect-square"
        resizeMode="cover"
      />

      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity className="mr-4">
          <Ionicons 
            name={post.isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={post.isLiked ? "#FF3040" : "#262626"} 
          />
        </TouchableOpacity>
        <TouchableOpacity className="mr-4">
          <Ionicons name="chatbubble-outline" size={24} color="#262626" />
        </TouchableOpacity>
        <TouchableOpacity className="mr-4">
          <Ionicons name="paper-plane-outline" size={24} color="#262626" />
        </TouchableOpacity>
        <View className="flex-1" />
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      <Text className="font-semibold text-instagram-dark px-4 mb-1">
        {post.likes} likes
      </Text>

      <View className="px-4 mb-1">
        <Text className="text-instagram-dark">
          <Text className="font-semibold">{post.username}</Text>{' '}
          {post.caption}
        </Text>
      </View>

      <Text className="text-xs text-instagram-gray px-4 pb-2">
        {post.timeAgo}
      </Text>
    </View>
  );
};

export default function HomeScreen() {
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

        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        <View className="items-center py-8">
          <Text className="text-instagram-gray">Loading more posts...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}