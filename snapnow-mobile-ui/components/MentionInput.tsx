import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import React, { forwardRef, useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../config/firebase';

interface User {
  id: string;
  username: string;
  displayName: string;
  profileImage?: string;
}

interface MentionInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  style?: any;
}

const MentionInput = forwardRef<TextInput, MentionInputProps>(({
  value,
  onChangeText,
  style,
  ...props
}, ref) => {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Detect @ mentions and search users
  useEffect(() => {
    const detectMention = () => {
      const cursorPos = value.length;
      const beforeCursor = value.substring(0, cursorPos);
      
      // Find last @ before cursor
      const lastAtIndex = beforeCursor.lastIndexOf('@');
      
      if (lastAtIndex === -1) {
        setShowSuggestions(false);
        return;
      }

      // Check if @ is at start or after space
      const charBeforeAt = lastAtIndex > 0 ? beforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt !== ' ' && lastAtIndex !== 0) {
        setShowSuggestions(false);
        return;
      }

      // Get text after @
      const afterAt = beforeCursor.substring(lastAtIndex + 1);
      
      // Check if there's a space after @ (means mention is complete)
      if (afterAt.includes(' ')) {
        setShowSuggestions(false);
        return;
      }

      // Valid mention query
      setShowSuggestions(true);
      searchUsers(afterAt);
    };

    detectMention();
  }, [value]);

  const searchUsers = async (searchQuery: string) => {
    if (!auth.currentUser) {
      setSuggestions([]);
      return;
    }

    try {
      // Get current user's following list
      const followingQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', auth.currentUser.uid)
      );
      const followingSnapshot = await getDocs(followingQuery);
      const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

      if (followingIds.length === 0) {
        setSuggestions([]);
        return;
      }

      if (!searchQuery || searchQuery.length < 1) {
        // Show users you follow when @ is typed without query
        const usersQuery = query(
          collection(db, 'users'),
          limit(20)
        );
        const snapshot = await getDocs(usersQuery);
        
        const users: User[] = [];
        snapshot.forEach((doc) => {
          if (followingIds.includes(doc.id)) {
            const data = doc.data();
            users.push({
              id: doc.id,
              username: data.username,
              displayName: data.displayName || data.username,
              profileImage: data.profileImage,
            });
          }
        });
        
        setSuggestions(users.slice(0, 5));
      } else {
        // Search users you follow by username
        const searchLower = searchQuery.toLowerCase();
        
        // Query users where username starts with search query
        const usersQuery = query(
          collection(db, 'users'),
          where('username', '>=', searchLower),
          where('username', '<=', searchLower + '\uf8ff'),
          limit(20)
        );
        
        const snapshot = await getDocs(usersQuery);
        
        const users: User[] = [];
        snapshot.forEach((doc) => {
          if (followingIds.includes(doc.id)) {
            const data = doc.data();
            users.push({
              id: doc.id,
              username: data.username,
              displayName: data.displayName || data.username,
              profileImage: data.profileImage,
            });
          }
        });
        
        setSuggestions(users.slice(0, 5));
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
    }
  };

  const insertMention = (user: User) => {
    // Find the last @ position
    const lastAtIndex = value.lastIndexOf('@');
    
    if (lastAtIndex === -1) return;

    // Replace text from @ to cursor with @username
    const beforeMention = value.substring(0, lastAtIndex);
    const afterCursor = value.substring(value.length);
    
    const newText = `${beforeMention}@${user.username} ${afterCursor}`;
    onChangeText(newText);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, style]}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionsList}
            nestedScrollEnabled={true}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => insertMention(item)}
              >
                <Image
                  source={
                    item.profileImage
                      ? { uri: item.profileImage }
                      : require('../assets/images/default-avatar.jpg')
                  }
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.username}>@{item.username}</Text>
                  <Text style={styles.displayName}>{item.displayName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

MentionInput.displayName = 'MentionInput';

export default MentionInput;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    // Inherit from parent
  },
  suggestionsContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  displayName: {
    fontSize: 13,
    color: '#8E8E8E',
  },
});
