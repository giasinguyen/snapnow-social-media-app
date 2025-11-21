import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: typeof lightColors;
}

const lightColors = {
  // Primary
  primary: '#262626',
  primaryLight: '#8E8E8E',
  
  // Instagram Blue
  blue: '#0095F6',
  blueLight: '#E1F5FE',
  
  // Accent
  accent: '#FF3040',
  accentOrange: '#fc8727ff',
  
  // Background
  background: '#FAFAFA',
  backgroundWhite: '#FFFFFF',
  backgroundGray: '#F8F8F8',
  
  // Borders
  border: '#DBDBDB',
  borderLight: '#EFEFEF',
  
  // Text
  textPrimary: '#262626',
  textSecondary: '#8E8E8E',
  textLight: '#C7C7C7',
  textWhite: '#FFFFFF',
  
  // Status
  success: '#00C851',
  error: '#FF4444',
  warning: '#FFBB33',
  
  // Gradients
  gradientPurple: '#E91E63',
  gradientBlue: '#2196F3',
  gradientPurpleAlt: '#9C27B0',

  // Card
  card: '#FFFFFF',
  
  // Input
  inputBackground: '#FAFAFA',
  inputBorder: '#DBDBDB',
  
  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#EFEFEF',
};

const darkColors = {
  // Primary
  primary: '#FFFFFF',
  primaryLight: '#A8A8A8',
  
  // Instagram Blue
  blue: '#0095F6',
  blueLight: '#1C3A52',
  
  // Accent
  accent: '#FF3040',
  accentOrange: '#fc8727ff',
  
  // Background
  background: '#000000',
  backgroundWhite: '#1C1C1E',
  backgroundGray: '#2C2C2E',
  
  // Borders
  border: '#38383A',
  borderLight: '#2C2C2E',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A8A8A8',
  textLight: '#6C6C6E',
  textWhite: '#FFFFFF',
  
  // Status
  success: '#30D158',
  error: '#FF453A',
  warning: '#FFD60A',
  
  // Gradients (keep same for consistency)
  gradientPurple: '#E91E63',
  gradientBlue: '#2196F3',
  gradientPurpleAlt: '#9C27B0',

  // Card
  card: '#1C1C1E',
  
  // Input
  inputBackground: '#2C2C2E',
  inputBorder: '#38383A',
  
  // Tab bar
  tabBarBackground: '#1C1C1E',
  tabBarBorder: '#38383A',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Determine if dark mode should be active
  const isDark =
    themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && ['light', 'dark', 'auto'].includes(saved)) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  // Save theme preference
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
