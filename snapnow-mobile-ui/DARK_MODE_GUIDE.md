# Dark Mode Implementation Guide

## Overview
Dark mode has been implemented using a ThemeContext that provides theme colors throughout the app.

## How to Use Dark Mode in Components

### 1. Import the hook
```typescript
import { useTheme } from '../contexts/ThemeContext'; // adjust path as needed
```

### 2. Use the theme in your component
```typescript
export default function MyComponent() {
  const { isDark, colors } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.textPrimary }}>Hello World</Text>
    </View>
  );
}
```

### 3. Available Theme Properties

#### `isDark` (boolean)
- `true` when dark mode is active
- `false` when light mode is active

#### `colors` (object)
All color values automatically switch based on theme:

**Backgrounds:**
- `colors.background` - Main app background (#FAFAFA / #000000)
- `colors.backgroundWhite` - Card/container background (#FFFFFF / #1C1C1E)
- `colors.backgroundGray` - Secondary background (#F8F8F8 / #2C2C2E)

**Text:**
- `colors.textPrimary` - Primary text (#262626 / #FFFFFF)
- `colors.textSecondary` - Secondary text (#8E8E8E / #A8A8A8)
- `colors.textLight` - Light/disabled text (#C7C7C7 / #6C6C6E)
- `colors.textWhite` - Always white (#FFFFFF)

**Borders:**
- `colors.border` - Main borders (#DBDBDB / #38383A)
- `colors.borderLight` - Light borders (#EFEFEF / #2C2C2E)

**UI Elements:**
- `colors.card` - Card backgrounds (#FFFFFF / #1C1C1E)
- `colors.inputBackground` - Input field backgrounds (#FAFAFA / #2C2C2E)
- `colors.inputBorder` - Input field borders (#DBDBDB / #38383A)
- `colors.tabBarBackground` - Tab bar background (#FFFFFF / #1C1C1E)
- `colors.tabBarBorder` - Tab bar border (#EFEFEF / #38383A)

**Brand Colors (same in both themes):**
- `colors.blue` - Instagram blue (#0095F6)
- `colors.accentOrange` - Orange accent (#fc8727ff)
- `colors.accent` - Red accent (#FF3040)
- `colors.success` - Success green
- `colors.error` - Error red
- `colors.warning` - Warning yellow

## Example Conversions

### Before (hardcoded colors):
```typescript
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#262626',
  },
});
```

### After (with theme):
```typescript
const { colors } = useTheme();

<View style={[styles.container, { backgroundColor: colors.backgroundWhite }]}>
  <Text style={[styles.title, { color: colors.textPrimary }]}>Hello</Text>
</View>

const styles = StyleSheet.create({
  container: {
    // Keep non-color styles
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
```

## User Settings

Users can change the theme in: **Settings → Appearance → Theme**

Options:
- **Light** - Always light mode
- **Dark** - Always dark mode  
- **Auto (System)** - Follows device system preference

The theme preference is saved and persists across app restarts.

## Component Update Checklist

To add dark mode support to a component:

1. ✅ Import `useTheme` hook
2. ✅ Replace hardcoded background colors with `colors.background/backgroundWhite/backgroundGray`
3. ✅ Replace hardcoded text colors with `colors.textPrimary/textSecondary/textLight`
4. ✅ Replace hardcoded borders with `colors.border/borderLight`
5. ✅ Test in both light and dark modes

## Priority Components to Update

High priority (user-facing screens):
- [ ] Feed/Home screen (app/(tabs)/index.tsx)
- [ ] Profile screen (app/(tabs)/profile.tsx)
- [ ] Post cards (components/PostCard.tsx)
- [ ] Story components (components/feed/Stories.tsx)
- [ ] Messages list (app/messages/index.tsx)
- [ ] Chat screen (app/messages/[conversationId].tsx)
- [ ] Comments modal (components/CommentsModal.tsx)
- [ ] Create post screen (app/(tabs)/create.tsx)

Medium priority:
- [ ] Search screen
- [ ] Activity/Notifications screen
- [ ] Edit profile screen
- [ ] All settings screens

## Notes

- Brand colors (blue, orange) stay the same in both themes
- Images and gradients work in both themes
- StatusBar color can be controlled with `isDark` flag
- Consider using `colors.card` for elevated surfaces
