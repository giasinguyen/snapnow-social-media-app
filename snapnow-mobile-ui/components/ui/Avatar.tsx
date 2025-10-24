import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AvatarProps {
  uri?: string | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  editable?: boolean;
  onPress?: () => void;
  showGradient?: boolean;
}

export default function Avatar({
  uri,
  size = 'medium',
  editable = false,
  onPress,
  showGradient = false,
}: AvatarProps) {
  const sizes = {
    small: { outer: 44, inner: 40, avatar: 36 },
    medium: { outer: 88, inner: 82, avatar: 78 },
    large: { outer: 120, inner: 114, avatar: 110 },
    xlarge: { outer: 150, inner: 144, avatar: 140 },
  };

  const { outer, inner, avatar } = sizes[size];

  const avatarContent = (
    <View className="items-center justify-center">
      {showGradient ? (
        <LinearGradient
          colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: outer,
            height: outer,
            borderRadius: outer / 2,
            padding: 3,
          }}
        >
          <View
            style={{
              width: inner,
              height: inner,
              borderRadius: inner / 2,
              backgroundColor: '#fff',
              padding: 2,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Image
              source={uri ? { uri } : require('../../assets/images/default-avatar.jpg')}
              style={{
                width: avatar,
                height: avatar,
                borderRadius: avatar / 2,
              }}
            />
          </View>
        </LinearGradient>
      ) : (
        <Image
          source={uri ? { uri } : require('../../assets/images/default-avatar.jpg')}
          style={{
            width: outer,
            height: outer,
            borderRadius: outer / 2,
          }}
          className="bg-gray-200"
        />
      )}
      
      {editable && (
        <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
          <Ionicons name="camera" size={20} color="#fff" />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {avatarContent}
      </TouchableOpacity>
    );
  }

  return avatarContent;
}
