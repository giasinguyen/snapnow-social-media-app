import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

type Props = { uri: string | null; onClear: () => void; };

const SelectedImage: React.FC<Props> = ({ uri, onClear }) => {
  if (!uri) return null;
  return (
    <View style={styles.wrap}>
      <Image source={{ uri }} style={styles.img} />
      <TouchableOpacity style={styles.close} onPress={onClear}>
        <Ionicons name="close-circle" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: 12, marginBottom: 12, position: 'relative', alignSelf: 'flex-start' },
  img: { width: 150, height: 150, borderRadius: 8 },
  close: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12 },
});

export default SelectedImage;
