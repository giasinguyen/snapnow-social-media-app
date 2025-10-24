import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  title: string;
  left?: ReactNode;
  right?: ReactNode; // có thể là <>...</>
  onPressLeft?: () => void;
};

const HeaderBar: React.FC<Props> = ({ title, left, right, onPressLeft }) => {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {left ? (
          <TouchableOpacity onPress={onPressLeft} style={styles.iconBtn}>
            {left}
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={[styles.side, { alignItems: 'flex-end' }]}>
        <View style={styles.rightRow}>
          {right}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee',
    paddingHorizontal: 6, paddingVertical: 8,
  },
  side: { width: 84, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  iconBtn: { padding: 8 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

export default HeaderBar;
