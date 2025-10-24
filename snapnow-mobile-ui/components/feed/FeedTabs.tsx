import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../src/constants/theme';

export type FeedTab = 'for-you' | 'following';

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

const FeedTabs: React.FC<FeedTabsProps> = React.memo(({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'for-you' && styles.activeTab]}
        onPress={() => onTabChange('for-you')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'for-you' && styles.activeTabText]}>
          For You
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'following' && styles.activeTab]}
        onPress={() => onTabChange('following')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
          Following
        </Text>
      </TouchableOpacity>
    </View>
  );
});

FeedTabs.displayName = 'FeedTabs';

export default FeedTabs;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundWhite,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.textPrimary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.textPrimary,
  },
});
