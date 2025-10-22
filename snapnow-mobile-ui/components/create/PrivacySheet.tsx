import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type PrivacyOption = { key: 'anyone'|'followers'|'following'|'mentions'; label: string; };

type Props = {
  visible: boolean;
  options: PrivacyOption[];
  currentKey: PrivacyOption['key'];
  onClose: () => void;
  onSelect: (opt: PrivacyOption) => void;
};

const PrivacySheet: React.FC<Props> = ({ visible, options, currentKey, onClose, onSelect }) => {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          {options.map(opt => {
            const selected = opt.key === currentKey;
            return (
              <TouchableOpacity key={opt.key} style={styles.item} onPress={() => onSelect(opt)}>
                <Ionicons
                  name={selected ? 'checkmark-sharp' : 'radio-button-off-outline'}
                  size={20}
                  color={selected ? '#000' : '#8e8e8e'}
                />
                <Text style={styles.text}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 15, borderTopRightRadius: 15, padding: 10 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10 },
  text: { marginLeft: 15, fontSize: 16, color: '#000' },
});

export default PrivacySheet;
