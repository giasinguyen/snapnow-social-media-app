import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface StoryProgressBarProps {
  duration: number;
  isActive: boolean;
  onComplete: () => void;
}

export default function StoryProgressBar({ duration, isActive, onComplete }: StoryProgressBarProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.timing(progress, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          onComplete();
        }
      });
    } else {
      progress.setValue(0);
    }
    return () => {
      progress.setValue(0);
    };
  }, [isActive]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bar,
          {
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#fff',
  },
});