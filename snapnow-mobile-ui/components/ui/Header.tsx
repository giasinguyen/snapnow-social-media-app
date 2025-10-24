import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: {
    icon?: keyof typeof Ionicons.glyphMap;
    text?: string;
    onPress: () => void;
  };
}

export default function Header({ title, showBack = true, rightAction }: HeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#262626" />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <Text style={styles.title}>
        {title}
      </Text>

      {rightAction ? (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          {rightAction.icon ? (
            <Ionicons name={rightAction.icon} size={24} color="#0095F6" />
          ) : rightAction.text ? (
            <Text style={styles.rightText}>
              {rightAction.text}
            </Text>
          ) : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    flex: 1,
    textAlign: 'center',
  },
  rightText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095F6',
  },
});
