import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

type Props = { uri: string | null; onClear: () => void; };

const SelectedImage: React.FC<Props> = ({ uri, onClear }) => {
  if (!uri) return null;
  return (
    <View style={styles.wrap}>
      <Image source={{ uri }} style={styles.img} resizeMode="cover" />
      <TouchableOpacity style={styles.close} onPress={onClear} activeOpacity={0.7}>
        <Ionicons name="close-circle" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { 
    marginTop: 16, 
    marginBottom: 16, 
    position: 'relative', 
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  img: { 
    width: '100%', 
    height: width * 0.75, // 4:3 aspect ratio
    borderRadius: 12,
  },
  close: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderRadius: 14,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default SelectedImage;
