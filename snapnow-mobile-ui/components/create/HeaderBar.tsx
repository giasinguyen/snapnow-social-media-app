import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type Props = {
  title: string;
  left?: ReactNode;
  right?: ReactNode; // có thể là <>...</>
  onPressLeft?: () => void;
};

const HeaderBar: React.FC<Props> = ({ title, left, right, onPressLeft }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.side}>
        {left ? (
          <TouchableOpacity onPress={onPressLeft} style={styles.iconBtn}>
            {left}
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6, paddingVertical: 8,
  },
  side: { width: 84, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  iconBtn: { padding: 8 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

export default HeaderBar;
