import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface StoryProgressBarProps {
  duration: number;
  isActive: boolean;
  onComplete: () => void;
}

export default function StoryProgressBar({ duration, isActive, onComplete }: StoryProgressBarProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const currentValue = (progress as any).__getValue();
    console.log('StoryProgressBar: isActive changed to', isActive, 'current progress:', currentValue);
    
    if (isActive) {
      // Resume or start animation
      const remainingProgress = 1 - currentValue;
      const remainingDuration = duration * remainingProgress;
      
      console.log('Starting/resuming animation - remaining progress:', remainingProgress, 'duration:', remainingDuration);
      
      animation.current = Animated.timing(progress, {
        toValue: 1,
        duration: remainingDuration,
        useNativeDriver: false,
      });
      
      animation.current.start(({ finished }) => {
        console.log('Animation finished:', finished);
        if (finished) {
          onComplete();
        }
      });
    } else {
      // Pause animation - stop but don't reset
      console.log('Pausing animation at:', currentValue);
      if (animation.current) {
        animation.current.stop();
      }
    }
    
    return () => {
      if (animation.current) {
        animation.current.stop();
      }
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