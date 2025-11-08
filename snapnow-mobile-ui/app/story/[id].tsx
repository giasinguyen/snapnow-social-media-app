import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
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
  const [fadeAnim] = useState(new Animated.Value(1))
  const [showSticker, setShowSticker] = useState(true)
  const [reaction, setReaction] = useState<string | null>(null)

  useEffect(() => {
    // Find the index of the story with the given id
    const index = MOCK_STORIES.findIndex(s => s.id === id)
    if (index !== -1) {
      setStories(MOCK_STORIES)
      setCurrentIndex(index)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fadeAnim.setValue(0)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()
  }, [currentIndex])

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
            <LinearGradient
              key={index}
              colors={[index === currentIndex ? '#fff' : '#888', '#ff0080']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.progressBar}
            >
              <StoryProgressBar
                duration={STORY_DURATION}
                isActive={index === currentIndex && !isPaused}
                onComplete={handleNext}
              />
            </LinearGradient>
          ))}
        </View>

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: currentStory.avatar }} 
              style={styles.avatarSmall} 
            />
            <View>
              <Text style={styles.username}>{currentStory.username}</Text>
              <Text style={styles.time}>2 giờ trước</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Story content */}
        <View style={styles.content}>
          <Animated.View style={{flex:1, width:'100%', height:'100%', opacity: fadeAnim}}>
            <Image 
              source={{ uri: currentStory.image }} 
              style={styles.image}
              onLoadStart={() => setIsPaused(true)}
              onLoad={() => setIsPaused(false)}
            />
            {/* Sticker mẫu */}
            {showSticker && (
              <View style={styles.sticker}>
                <Text style={{fontSize:32}}>🔥</Text>
              </View>
            )}
            {/* Reaction hiển thị */}
            {reaction && (
              <View style={styles.reactionPopup}>
                <Text style={{fontSize:32}}>{reaction}</Text>
              </View>
            )}
          </Animated.View>
          {/* Overlay gradient bottom */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.bottomGradient}
          >
            <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.directButton}>
                <Ionicons name="send" size={24} color="#fff" />
                <Text style={styles.directText}>Gửi tin nhắn</Text>
              </TouchableOpacity>
              <View style={styles.reactionBar}>
                {['😍','😂','👍','🔥','😮'].map(r => (
                  <TouchableOpacity key={r} onPress={()=>setReaction(r)}>
                    <Text style={styles.reaction}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextText}>Xem tiếp</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
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
    height: 3,
    borderRadius: 2,
    marginHorizontal: 2,
    overflow: 'hidden',
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
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 17,
  },
  time: {
    color: '#ccc',
    fontSize: 12,
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    margin: 8,
  },
  image: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover',
    borderRadius: 18,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    justifyContent: 'flex-end',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  directButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  directText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff0080',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nextText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
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
  touchMiddle: {
    flex: 1,
  },
  sticker: {
    position: 'absolute',
    top: 40,
    left: 30,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 30,
    padding: 8,
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reaction: {
    fontSize: 28,
    marginHorizontal: 4,
  },
  reactionPopup: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 12,
  },
})
