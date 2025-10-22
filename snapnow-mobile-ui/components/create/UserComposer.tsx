import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Avatar from '../../components/ui/Avatar';

type Props = {
  avatarUri: string;
  username: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

const UserComposer: React.FC<Props> = ({ avatarUri, username, value, onChangeText, placeholder }) => {
  return (
    <View style={styles.row}>
      <Avatar uri={avatarUri} size="small" />
      <View style={styles.right}>
        <Text style={styles.name}>{username}</Text>
        <TextInput
          style={styles.input}
          multiline
          textAlignVertical="top"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8e8e8e"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  right: { flex: 1, marginLeft: 10 },
  name: { fontWeight: '700', fontSize: 15, marginBottom: 6 },
  input: { minHeight: 80, fontSize: 16, color: '#000', paddingVertical: 0, paddingLeft: 0 },
});

export default UserComposer;
