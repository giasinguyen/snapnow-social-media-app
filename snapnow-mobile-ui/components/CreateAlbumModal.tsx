import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface CreateAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateAlbum: (title: string, description: string) => Promise<void>;
}

export default function CreateAlbumModal({
  visible,
  onClose,
  onCreateAlbum,
}: CreateAlbumModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an album title');
      return;
    }

    try {
      setCreating(true);
      await onCreateAlbum(title.trim(), description.trim());
      
      // Reset and close
      setTitle('');
      setDescription('');
      onClose();
      Alert.alert('Success', 'Album created successfully!');
    } catch (error) {
      console.error('Error creating album:', error);
      Alert.alert('Error', 'Failed to create album. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Album</Text>
            <TouchableOpacity 
              onPress={handleCreate}
              disabled={creating || !title.trim()}
            >
              <Text style={[
                styles.createButton,
                (!title.trim() || creating) && styles.createButtonDisabled
              ]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Album Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter album title"
                placeholderTextColor="#8E8E8E"
                maxLength={50}
                autoFocus
              />
              <Text style={styles.charCount}>{title.length}/50</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your album..."
                placeholderTextColor="#8E8E8E"
                multiline
                numberOfLines={4}
                maxLength={150}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/150</Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#0095F6" />
              <Text style={styles.infoText}>
                Create albums to organize your photos and memories
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DBDBDB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
  },
  cancelButton: {
    fontSize: 16,
    color: '#262626',
  },
  createButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0095F6',
  },
  createButtonDisabled: {
    color: '#8E8E8E',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#262626',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'right',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#262626',
    lineHeight: 18,
  },
});
