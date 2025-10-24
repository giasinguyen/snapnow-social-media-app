import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { MockUser, formatFollowers } from '../services/mockData';

interface SuggestionCardProps {
  user: MockUser;
  onFollow?: (userId: string) => void;
  onDismiss?: (userId: string) => void;
}

export default function SuggestionCard({ 
  user, 
  onFollow, 
  onDismiss 
}: SuggestionCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = () => {
    setIsFollowing(true);
    onFollow?.(user.id);
  };

  const handleDismiss = () => {
    onDismiss?.(user.id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <View style={styles.usernameRow}>
            <Text style={styles.username} numberOfLines={1}>
              {user.username}
            </Text>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {user.displayName}
          </Text>
          <Text style={styles.mutualText}>
            Followed by john_doe + {Math.floor(Math.random() * 20)} others
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.followButton,
          isFollowing && styles.followingButton
        ]}
        onPress={handleFollow}
        disabled={isFollowing}
      >
        <Text style={[
          styles.followButtonText,
          isFollowing && styles.followingButtonText
        ]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginRight: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  mutualText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#EFEFEF',
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#262626',
  },
});
