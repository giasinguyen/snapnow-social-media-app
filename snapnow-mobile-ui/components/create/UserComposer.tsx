import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import Avatar from '../../components/ui/Avatar';

type Props = {
  avatarUri: string;
  username: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

const UserComposer: React.FC<Props> = ({ avatarUri, username, value, onChangeText, placeholder }) => {
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => inputRef.current?.focus()}>
        <Avatar uri={avatarUri} size="small" />
      </TouchableOpacity>
      <View style={styles.right}>
        <Text style={styles.name}>{username}</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          multiline
          textAlignVertical="top"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          autoFocus={false}
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
    color: '#262626' 
  },
  input: { 
    minHeight: 100, 
    fontSize: 16, 
    color: '#262626', 
    paddingVertical: 0, 
    paddingLeft: 0,
    lineHeight: 22,
  },
});

export default UserComposer;
