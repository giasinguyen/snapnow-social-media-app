import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import StoryProgressBar from '../../components/StoryProgressBar'
import { MOCK_STORIES } from '../../services/mockData'

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    // Find the index of the story with the given id
    const index = MOCK_STORIES.findIndex(s => s.id === id)
    if (index !== -1) {
      setStories(MOCK_STORIES)
      setCurrentIndex(index)
    }
    setLoading(false)
  }, [id])

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      router.back() // Close story view when reaching the end
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handlePress = (event: any) => {
    const screenWidth = event.nativeEvent.layoutMeasure.width;
    const touchX = event.nativeEvent.pageX;

    if (touchX < screenWidth * 0.3) {
      // Left side - go to previous story
      handlePrevious();
    } else if (touchX > screenWidth * 0.7) {
      // Right side - go to next story
      handleNext();
    }
  }

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator /></SafeAreaView>
  if (!stories.length) return <SafeAreaView style={styles.container}><Text>Story not found</Text></SafeAreaView>

  const currentStory = stories[currentIndex]

  return (
    <Modal visible animationType="slide">
      <SafeAreaView style={styles.container} edges={['top','bottom']}>
        {/* Progress bars */}
        <View style={styles.progressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={styles.progressBar}>
              <StoryProgressBar
                duration={STORY_DURATION}
                isActive={index === currentIndex && !isPaused}
                onComplete={handleNext}
              />
            </View>
          ))}
        </View>

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: currentStory.avatar }} 
              style={styles.avatar} 
            />
            <Text style={styles.username}>{currentStory.username}</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Story content */}
        <View style={styles.content}>
          <Image 
            source={{ uri: currentStory.avatar }} 
            style={styles.image}
            onLoadStart={() => setIsPaused(true)}
            onLoad={() => setIsPaused(false)}
          />

          {/* Touch areas for navigation */}
          <View style={styles.touchContainer}>
            <TouchableOpacity 
              style={styles.touchLeft} 
              onPress={handlePrevious}
              activeOpacity={1}
            />
            <View style={styles.touchMiddle} />
            <TouchableOpacity 
              style={styles.touchRight} 
              onPress={handleNext}
              activeOpacity={1}
            />
          </View>
        </View>

        {/* Story content */}
        <View style={styles.content}>
          <Image 
            source={{ uri: currentStory.avatar }} 
            style={styles.image}
            onLoadStart={() => setIsPaused(true)}
            onLoad={() => setIsPaused(false)}
          />
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
  },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16,
    marginTop: 8,
  },
  closeButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  username: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 16,
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  image: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover',
  },
  touchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 1,
  },
})
