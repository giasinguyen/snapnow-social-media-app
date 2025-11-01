import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

interface MultiImageViewerProps {
  imageUrls: string[];
  onDoublePress?: () => void;
  onSinglePress?: (currentIndex?: number) => void; // Pass current index to parent
}

const { width: screenWidth } = Dimensions.get('window');

const MultiImageViewer: React.FC<MultiImageViewerProps> = ({ imageUrls, onDoublePress, onSinglePress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastTap = useRef<number>(0);
  
  if (!imageUrls || imageUrls.length === 0) return null;

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentIndex(index);
  };

  const handleImagePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap
      onDoublePress?.();
    } else {
      // Single tap - wait to see if another tap comes
      setTimeout(() => {
        if (Date.now() - lastTap.current >= DOUBLE_TAP_DELAY) {
          onSinglePress?.(currentIndex);
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTap.current = now;
  };

  // Single image case - no swipe needed
  if (imageUrls.length === 1) {
    return (
      <TouchableWithoutFeedback onPress={handleImagePress}>
        <View style={styles.singleImageContainer}>
          <Image
            source={{ uri: imageUrls[0] }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Multiple images case - with swipe and indicators
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        bounces={false} // Prevent bouncing at the edges
        decelerationRate="fast" // Make snapping feel more responsive
        // Remove the outer TouchableWithoutFeedback and handle touch directly on images
      >
        {imageUrls.map((imageUrl, index) => (
          <TouchableWithoutFeedback key={index} onPress={handleImagePress}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </TouchableWithoutFeedback>
        ))}
      </ScrollView>

      {/* Image counter indicator (like Instagram) */}
      <View style={styles.indicator}>
        <Text style={styles.indicatorText}>
          {currentIndex + 1}/{imageUrls.length}
        </Text>
      </View>

      {/* Dots indicator */}
      <View style={styles.dotsContainer}>
        {imageUrls.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* Navigation arrows (optional - hidden by default like Instagram) */}
      {imageUrls.length > 1 && (
        <>
          {currentIndex > 0 && (
            <View style={styles.leftArrow}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
            </View>
          )}
          {currentIndex < imageUrls.length - 1 && (
            <View style={styles.rightArrow}>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  singleImageContainer: {
    position: 'relative',
  },
  scrollView: {
    width: screenWidth,
  },
  postImage: {
    width: screenWidth,
    height: screenWidth, // Square aspect ratio like Instagram
  },
  indicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  leftArrow: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MultiImageViewer;