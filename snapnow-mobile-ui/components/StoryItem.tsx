import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';

interface StoryItemProps {
  id: string;
  username: string;
  avatar: string;
  isYourStory?: boolean;
  hasStory?: boolean;
  onPress?: () => void;
}

export default function StoryItem({ 
  username, 
  avatar, 
  isYourStory = false,
  hasStory = true,
  onPress 
}: StoryItemProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[
        styles.avatarContainer,
        hasStory && !isYourStory && styles.storyGradient,
        isYourStory && styles.yourStoryBorder
      ]}>
        <Image 
          source={{ uri: avatar }}
          style={styles.avatar}
        />
        {isYourStory && (
          <View style={styles.addButton}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {isYourStory ? 'Your story' : username}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 72,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyGradient: {
    borderWidth: 2,
    borderColor: '#E91E63',
  },
  yourStoryBorder: {
    borderWidth: 2,
    borderColor: '#DBDBDB',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0095F6',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontSize: 12,
    color: '#262626',
    marginTop: 4,
    textAlign: 'center',
  },
});
