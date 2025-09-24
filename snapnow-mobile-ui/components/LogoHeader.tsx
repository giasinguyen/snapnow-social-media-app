import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoHeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
  title?: string;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({ 
  showBackButton = false, 
  onBackPress, 
  title 
}) => {
  return (
    <View style={styles.container}>
      {showBackButton ? (
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#262626" />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      
      <View style={styles.centerContainer}>
        {title ? (
          <Text style={styles.titleText}>{title}</Text>
        ) : (
          <Image 
            source={require('../assets/images/logo-snapnow.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
      </View>
      
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
  },
  logo: {
    height: 32,
    width: 120,
  },
});