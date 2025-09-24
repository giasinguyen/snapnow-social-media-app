import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

interface InstagramInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
}

export const InstagramInput: React.FC<InstagramInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
}) => {
  return (
    <View className="mb-3">
      <TextInput
        className={`border rounded-md px-4 py-3.5 text-base ${
          value 
            ? 'border-gray-400 bg-white' 
            : 'border-instagram-border bg-instagram-light-gray'
        } text-instagram-dark`}
        placeholder={placeholder}
        placeholderTextColor="#8E8E8E"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete as any}
      />
    </View>
  );
};

interface InstagramButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export const InstagramButton: React.FC<InstagramButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  loading = false,
}) => {
  const buttonClasses = `rounded-md py-3.5 items-center justify-center mb-3 ${
    variant === 'primary'
      ? disabled 
        ? 'bg-instagram-light-blue' 
        : 'bg-instagram-blue'
      : 'bg-transparent border border-instagram-border'
  }`;

  const textClasses = `text-base font-semibold ${
    variant === 'primary'
      ? 'text-white'
      : 'text-instagram-dark'
  }`;

  return (
    <TouchableOpacity
      className={buttonClasses}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Text className={textClasses}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};