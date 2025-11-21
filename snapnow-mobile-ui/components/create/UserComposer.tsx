import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../../components/ui/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import MentionInput from '../MentionInput';

type Props = {
  avatarUri: any;
  username: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

const UserComposer: React.FC<Props> = ({ avatarUri, username, value, onChangeText, placeholder }) => {
  const inputRef = useRef<any>(null);
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => inputRef.current?.focus()}>
        <Avatar uri={avatarUri} size="small" />
      </TouchableOpacity>
      <View style={styles.right}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{username}</Text>
        <MentionInput
          // @ts-ignore
          ref={inputRef}
          style={[styles.input, { color: colors.textPrimary }]}
          multiline
          textAlignVertical="top"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          autoFocus={false}
          suggestionsPosition="below"
          // @ts-ignore
          returnKeyType="default"
          blurOnSubmit={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 10,
    paddingVertical: 8,
  },
  right: { flex: 1, marginLeft: 12 },
  name: { 
    fontWeight: '700', 
    fontSize: 15, 
    marginBottom: 8, 
  },
  input: { 
    minHeight: 100, 
    fontSize: 16, 
    paddingVertical: 0, 
    paddingLeft: 0,
    lineHeight: 22,
  },
});

export default UserComposer;
