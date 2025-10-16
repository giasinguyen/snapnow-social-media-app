import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleProp, ViewStyle, TextStyle, StyleSheet } from 'react-native';

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
  const buttonStyle = [
    styles.base,
    fullWidth && styles.fullWidth,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.textBase,
    styles[`textSize_${size}`],
    styles[`textColor_${variant}`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#333'} />
      ) : (
        <Text style={textStyles}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  // Sizes
  size_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  size_medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  size_large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  // Variants
  variant_primary: {
    backgroundColor: '#0095F6',
  },
  variant_secondary: {
    backgroundColor: '#EFEFEF',
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#DBDBDB',
  },
  variant_danger: {
    backgroundColor: '#ED4956',
  },
  disabled: {
    opacity: 0.5,
  },
  // Text styles
  textBase: {
    fontWeight: '600',
  },
  textSize_small: {
    fontSize: 14,
  },
  textSize_medium: {
    fontSize: 16,
  },
  textSize_large: {
    fontSize: 18,
  },
  textColor_primary: {
    color: '#fff',
  },
  textColor_secondary: {
    color: '#262626',
  },
  textColor_outline: {
    color: '#262626',
  },
  textColor_danger: {
    color: '#fff',
  },
});
