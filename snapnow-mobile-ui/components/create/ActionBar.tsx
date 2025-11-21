import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type Props = { onPickImage: () => void; };

const ActionBar: React.FC<Props> = ({ onPickImage }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btn} onPress={onPickImage}>
        <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn}>
        <Ionicons name="git-compare-outline" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn}>
        <Ionicons name="list-outline" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn}>
        <Ionicons name="ellipsis-horizontal" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginTop: 'auto', paddingBottom: 10 },
  btn: { padding: 5, marginRight: 15 },
});

export default ActionBar;
