import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function ThemeSelector({ visible, onClose }: ThemeSelectorProps) {
  const { themeMode, setThemeMode, colors } = useTheme();

  const handleSelectTheme = (mode: 'light' | 'dark' | 'auto') => {
    setThemeMode(mode);
    onClose();
  };

  const options: Array<{ key: 'light' | 'dark' | 'auto'; label: string; icon: string; subtitle?: string }> = [
    { key: 'light', label: 'Light', icon: 'sunny' },
    { key: 'dark', label: 'Dark', icon: 'moon' },
    { key: 'auto', label: 'Auto', icon: 'phone-portrait', subtitle: 'Use device theme' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable
          style={[styles.content, { backgroundColor: colors.backgroundWhite }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Theme</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose theme mode
            </Text>
          </View>

          <View style={styles.options}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.option,
                  { borderBottomColor: colors.borderLight },
                  themeMode === option.key && { backgroundColor: colors.backgroundGray },
                ]}
                onPress={() => handleSelectTheme(option.key)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: themeMode === option.key ? colors.blue : colors.backgroundGray },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={themeMode === option.key ? '#FFFFFF' : colors.textSecondary}
                    />
                  </View>
                  <View>
                    <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                      {option.label}
                    </Text>
                    {option.subtitle && (
                      <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                        {option.subtitle}
                      </Text>
                    )}
                  </View>
                </View>
                {themeMode === option.key && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.blue} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.backgroundGray }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>
              Close
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  options: {
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
  },
  closeButton: {
    margin: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
