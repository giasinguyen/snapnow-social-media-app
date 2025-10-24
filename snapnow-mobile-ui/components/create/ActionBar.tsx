import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type Props = { onPickImage: () => void; };

const ActionBar: React.FC<Props> = ({ onPickImage }) => {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btn} onPress={onPickImage}>
        <Ionicons name="image-outline" size={24} color="#8e8e8e" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn}>
        <Ionicons name="git-compare-outline" size={24} color="#8e8e8e" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn}>
        <Ionicons name="list-outline" size={24} color="#8e8e8e" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn}>
        <Ionicons name="ellipsis-horizontal" size={24} color="#8e8e8e" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginTop: 'auto', paddingBottom: 10 },
  btn: { padding: 5, marginRight: 15 },
});

export default ActionBar;
