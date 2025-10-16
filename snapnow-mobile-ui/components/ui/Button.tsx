import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  size = 'medium',
  style,
  textStyle,
}: ButtonProps) {
  const getButtonClasses = () => {
    const base = 'rounded-lg items-center justify-center';
    const width = fullWidth ? 'w-full' : '';
    
    const sizes = {
      small: 'py-2 px-4',
      medium: 'py-3 px-6',
      large: 'py-4 px-8',
    };

    const variants = {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-200',
      outline: 'border-2 border-gray-300 bg-transparent',
      danger: 'bg-red-500',
    };

    const disabledClass = disabled || loading ? 'opacity-50' : '';

    return `${base} ${width} ${sizes[size]} ${variants[variant]} ${disabledClass}`;
  };

  const getTextClasses = () => {
    const base = 'font-semibold';
    
    const sizes = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    };

    const colors = {
      primary: 'text-white',
      secondary: 'text-gray-800',
      outline: 'text-gray-800',
      danger: 'text-white',
    };

    return `${base} ${sizes[size]} ${colors[variant]}`;
  };

  return (
    <TouchableOpacity
      className={getButtonClasses()}
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#333'} />
      ) : (
        <Text className={getTextClasses()} style={textStyle}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
