import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Post } from '../services/posts';

export default function PostCard({ post, onLike }:{ post: Post, onLike?: (id: string, liked: boolean)=>void }){
  const [liked, setLiked] = useState(false);

  const toggleLike = () => {
    setLiked((s)=>{
      const next = !s;
      onLike?.(post.id, next);
      return next;
    });
  };

  return (
    <View style={{ backgroundColor: '#fff', marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
        <Image source={{ uri: post.userImage || 'https://via.placeholder.com/50' }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 8 }} />
        <Text style={{ fontWeight: '700', flex: 1 }}>{post.username}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#262626" />
        </TouchableOpacity>
      </View>

      <Image source={{ uri: post.imageUrl }} style={{ width: '100%', aspectRatio: 1 }} resizeMode='cover' />

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
        <TouchableOpacity onPress={toggleLike} style={{ marginRight: 12 }}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? '#FF3040' : '#262626'} />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginRight: 12 }}>
          <Ionicons name="chatbubble-outline" size={24} color="#262626" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="paper-plane-outline" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      <Text style={{ fontWeight: '700', paddingHorizontal: 12 }}>{post.likes + (liked ? 1 : 0)} likes</Text>

      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text><Text style={{ fontWeight: '700' }}>{post.username}</Text> {post.caption}</Text>
      </View>
    </View>
  );
}
