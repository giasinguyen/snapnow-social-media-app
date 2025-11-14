import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ActivityIndicator, Alert, Animated, Dimensions, Image, Keyboard, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import StoryProgressBar from '../../components/StoryProgressBar'
import StoryViewersModal from '../../components/StoryViewersModal'
import { auth } from '../../config/firebase'
import { addStoryReaction, deleteStory, getFollowedUsersStories, getStoryViewers, markStoryAsViewed, type Story as StoryType, type StoryView, saveStory, unsaveStory, hasUserSavedStory } from '../../services/stories'

const STORY_DURATION = 5000; // 5 seconds per story
const SCREEN_WIDTH = Dimensions.get('window').width;

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉'];

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [userStories, setUserStories] = useState<StoryType[][]>([])
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(1))
  const [showMenu, setShowMenu] = useState(false)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHolding = useRef(false)
  const isNavigating = useRef(false)
  const [replyText, setReplyText] = useState('')
  const [reaction, setReaction] = useState<string | null>(null)
  const reactionAnim = useRef(new Animated.Value(0)).current
  const reactionScale = useRef(new Animated.Value(0)).current
  const [showReactions, setShowReactions] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const currentUserId = auth.currentUser?.uid
  const [showViewersModal, setShowViewersModal] = useState(false)
  const [viewers, setViewers] = useState<StoryView[]>([])
  const [loadingViewers, setLoadingViewers] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useFocusEffect(
    useCallback(() => {
      const checkSavedStatus = async () => {
        if (currentUserId && userStories.length > 0) {
          const userStoriesArray = userStories[currentUserIndex] || []
          const story = userStoriesArray[currentStoryIndex]
          if (story?.id) {
            const saved = await hasUserSavedStory(currentUserId, story.id)
            setIsSaved(saved)
          }
        }
      }
      checkSavedStatus()
    }, [currentUserId, currentUserIndex, currentStoryIndex, userStories.length])
  )

  useEffect(() => {
    const loadStories = async () => {
      if (!currentUserId) {
        router.back()
        return
      }

      try {
        // Load stories from Firebase
        const stories = await getFollowedUsersStories(currentUserId)
        
        if (stories.length === 0) {
          Alert.alert('No Stories', 'No stories available')
          router.back()
          return
        }

        // Group stories by userId
        const groupedStories: { [key: string]: StoryType[] } = {}
        stories.forEach(story => {
          if (!groupedStories[story.userId]) {
            groupedStories[story.userId] = []
          }
          groupedStories[story.userId].push(story)
        })

        // Convert to array of arrays and find initial user
        const storiesArray = Object.values(groupedStories)
        const initialStory = stories.find(s => s.id === id)
        
        if (initialStory) {
          const userIndex = storiesArray.findIndex(
            userStories => userStories[0].userId === initialStory.userId
          )
          setUserStories(storiesArray)
          setCurrentUserIndex(userIndex !== -1 ? userIndex : 0)
          
          // Find which story within the user's stories
          const storyIndex = storiesArray[userIndex]?.findIndex(s => s.id === id) || 0
          setCurrentStoryIndex(storyIndex)

          // Mark as viewed
          if (currentUserId) {
            await markStoryAsViewed(id, currentUserId)
          }
        } else {
          // If story not found, just show the first one
          setUserStories(storiesArray)
          setCurrentUserIndex(0)
          setCurrentStoryIndex(0)

          if (currentUserId && storiesArray[0]?.[0]) {
            await markStoryAsViewed(storiesArray[0][0].id, currentUserId)
          }
        }
      } catch (error) {
        console.error('Error loading stories:', error)
        Alert.alert('Error', 'Failed to load stories')
        router.back()
      } finally {
        setLoading(false)
      }
    }

    loadStories()
  }, [id, currentUserId])

  useEffect(() => {
    fadeAnim.setValue(0)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [currentUserIndex, currentStoryIndex])

  const handleNextStory = () => {
    const currentUserStoriesCount = userStories[currentUserIndex]?.length || 0
    
    // Hide reactions and blur input when moving to next story
    setShowReactions(false)
    setReplyText('')
    inputRef.current?.blur()
    Keyboard.dismiss()
    
    if (currentStoryIndex < currentUserStoriesCount - 1) {
      // Go to next story of same user
      setCurrentStoryIndex(currentStoryIndex + 1)
    } else {
      // Go to next user
      handleNextUser()
    }
  }

  const handlePreviousStory = () => {
    // Hide reactions and blur input when moving to previous story
    setShowReactions(false)
    setReplyText('')
    inputRef.current?.blur()
    Keyboard.dismiss()
    
    if (currentStoryIndex > 0) {
      // Go to previous story of same user
      setCurrentStoryIndex(currentStoryIndex - 1)
    } else if (currentUserIndex > 0) {
      // Go to last story of previous user
      const prevUserIndex = currentUserIndex - 1
      const prevUserStoriesCount = userStories[prevUserIndex]?.length || 0
      setCurrentUserIndex(prevUserIndex)
      setCurrentStoryIndex(prevUserStoriesCount - 1)
    }
  }

  const handleNextUser = () => {
    if (currentUserIndex < userStories.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1)
      setCurrentStoryIndex(0)
    } else {
      router.back() // Close story view when reaching the end
    }
  }

  const handlePreviousUser = () => {
    if (currentUserIndex > 0) {
      const prevUserIndex = currentUserIndex - 1
      const prevUserStoriesCount = userStories[prevUserIndex]?.length || 0
      setCurrentUserIndex(prevUserIndex)
      setCurrentStoryIndex(prevUserStoriesCount - 1)
    } else {
      // Close story view when trying to go back from the first user
      router.back()
    }
  }

  const handleTapLeft = () => {
    handlePreviousStory()
  }

  const handleTapRight = () => {
    handleNextStory()
  }

  const onSwipeGesture = ({ nativeEvent }: any) => {
    // Detect when gesture starts - set flag immediately to prevent pause
    if (nativeEvent.state === State.BEGAN || nativeEvent.state === State.ACTIVE) {
      const absX = Math.abs(nativeEvent.translationX)
      const absY = Math.abs(nativeEvent.translationY)
      
      // If it looks like a swipe (not just a tap), set navigation flag
      if (absX > 20 || absY > 20) {
        console.log('Swipe detected, setting navigation flag')
        isNavigating.current = true
      }
    }
    
    if (nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX, velocityY } = nativeEvent
      
      // Check for vertical swipes first (prioritize vertical over horizontal)
      const absX = Math.abs(translationX)
      const absY = Math.abs(translationY)
      
      const currentUserStoriesArray = userStories[currentUserIndex] || []
      const currentStory = currentUserStoriesArray[currentStoryIndex]
      const isOwnStory = currentStory?.userId === currentUserId
      
      // Vertical swipe detection (must be significantly more vertical than horizontal)
      if (absY > 80 && absY > absX * 2) {
        // Swipe down
        if (translationY > 100 || velocityY > 500) {
          // If input is focused/reactions are showing, just hide them instead of closing story
          if (showReactions) {
            setShowReactions(false)
            setReplyText('')
            inputRef.current?.blur()
            Keyboard.dismiss()
            isNavigating.current = false
            return
          }
          // If viewers modal is showing, close it
          if (showViewersModal) {
            setShowViewersModal(false)
            isNavigating.current = false
            return
          }
          // Otherwise close the story
          router.back()
          isNavigating.current = false
          return
        }
        // Swipe up
        if (translationY < -100 || velocityY < -500) {
          // For own story - show viewers modal
          if (isOwnStory && !showViewersModal) {
            handleShowViewers()
            isNavigating.current = false
            return
          }
          // For others' stories - show reactions (only if not already showing)
          if (!isOwnStory && !showReactions) {
            setShowReactions(true)
            inputRef.current?.focus()
            isNavigating.current = false
            return
          }
        }
      }
      
      // Horizontal swipe - change stories (needs to be more horizontal than vertical)
      // Reduced thresholds for easier navigation
      if (absX > 50 && absX > absY * 1.5) {
        // Swipe left - go to next story (only need small swipe)
        if (translationX < -50 || velocityX < -300) {
          console.log('Swiping to next story, keeping navigation lock')
          handleNextStory()
          // Reset flag after animation completes
          setTimeout(() => {
            isNavigating.current = false
            console.log('Navigation unlocked')
          }, 800)
          return
        }
        // Swipe right - go to previous story (only need small swipe)
        if (translationX > 50 || velocityX > 300) {
          console.log('Swiping to previous story, keeping navigation lock')
          handlePreviousStory()
          // Reset flag after animation completes
          setTimeout(() => {
            isNavigating.current = false
            console.log('Navigation unlocked')
          }, 800)
          return
        }
      }
      
      // If we got here, it wasn't a recognized swipe - reset flag after a short delay
      setTimeout(() => {
        if (isNavigating.current) {
          console.log('Resetting navigation flag - gesture ended without action')
          isNavigating.current = false
        }
      }, 100)
    }
  }

  const handlePressIn = () => {
    setIsPaused(true)
  }

  const handlePressOut = () => {
    setIsPaused(false)
  }

  const handleTouchStart = (e: any) => {
    // Don't pause if navigation is happening (swipe in progress)
    if (isNavigating.current) {
      console.log('Navigation in progress, ignoring touch start')
      return
    }
    
    // Pause the story on touch
    setIsPaused(true)
    isHolding.current = false
    
    // Set a timer to detect if this is a hold (not a quick tap)
    const timer = setTimeout(() => {
      // If we get here after 500ms, it's a hold
      isHolding.current = true
    }, 500) // 500ms threshold
    
    pressTimer.current = timer
  }

  const handleTouchEnd = (e: any) => {
    // Don't process if navigation is happening
    if (isNavigating.current) {
      console.log('Navigation in progress, ignoring touch end')
      // Clear the timer
      if (pressTimer.current) {
        clearTimeout(pressTimer.current)
        pressTimer.current = null
      }
      isHolding.current = false
      return
    }
    
    // Clear the timer
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    
    // Resume the story
    setIsPaused(false)
    
    // Only navigate if it was a quick tap (not a hold)
    if (!isHolding.current) {
      // Get tap position
      const x = e.nativeEvent.locationX
      const width = SCREEN_WIDTH

      console.log('Tap at x:', x, 'width:', width, 'showReactions:', showReactions)

      if (x < width * 0.3) {
        // Left side tap (30% of screen) - go to previous story
        console.log('Left tap - previous story')
        handleTapLeft()
      } else if (x > width * 0.7) {
        // Right side tap (30% of screen) - go to next story
        console.log('Right tap - next story')
        handleTapRight()
      } else {
        // Center area (40% of screen) - hide reactions when visible
        console.log('Center tap - showReactions:', showReactions)
        if (showReactions) {
          console.log('Hiding reactions')
          setShowReactions(false)
          setReplyText('')
          inputRef.current?.blur()
          Keyboard.dismiss()
        }
        // otherwise do nothing (keeps pause behavior)
      }
    } else {
      console.log('Was holding, no action')
    }

    // Reset holding flag
    isHolding.current = false
  }

  const handleMenuPress = () => {
    setShowMenu(!showMenu)
    setIsPaused(!showMenu)
  }

  const handleShowViewers = async () => {
    const currentUserStoriesArray = userStories[currentUserIndex] || []
    const currentStory = currentUserStoriesArray[currentStoryIndex]
    
    if (!currentStory) return

    setLoadingViewers(true)
    setIsPaused(true)
    
    try {
      const viewersList = await getStoryViewers(currentStory.id)
      setViewers(viewersList)
      setShowViewersModal(true)
    } catch (error) {
      console.error('Error loading viewers:', error)
      Alert.alert('Error', 'Failed to load viewers')
    } finally {
      setLoadingViewers(false)
    }
  }

  const handleDeleteStory = () => {
    const currentUserStoriesArray = userStories[currentUserIndex] || []
    const currentStory = currentUserStoriesArray[currentStoryIndex]
    
    if (!currentStory) return

    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStory(currentStory.id)
              
              // Remove from local state
              const updatedStories = [...userStories]
              const userStoriesCopy = [...updatedStories[currentUserIndex]]
              userStoriesCopy.splice(currentStoryIndex, 1)
              
              if (userStoriesCopy.length === 0) {
                // No more stories for this user, remove user
                updatedStories.splice(currentUserIndex, 1)
                
                if (updatedStories.length === 0) {
                  // No more stories at all, go back
                  router.back()
                  return
                }
                
                // Move to previous or next user
                if (currentUserIndex > 0) {
                  setCurrentUserIndex(currentUserIndex - 1)
                } else {
                  setCurrentUserIndex(0)
                }
                setCurrentStoryIndex(0)
              } else {
                // More stories for this user
                updatedStories[currentUserIndex] = userStoriesCopy
                
                if (currentStoryIndex >= userStoriesCopy.length) {
                  setCurrentStoryIndex(userStoriesCopy.length - 1)
                }
              }
              
              setUserStories(updatedStories)
            } catch (error) {
              console.error('Error deleting story:', error)
              Alert.alert('Error', 'Failed to delete story')
            }
          }
        }
      ]
    )
  }

  const handleReport = () => {
    setShowMenu(false)
    setIsPaused(false)
    Alert.alert('Report', 'Report this story?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => console.log('Reported') }
    ])
  }

  const handleMute = () => {
    setShowMenu(false)
    setIsPaused(false)
    const currentUserStoriesArray = userStories[currentUserIndex] || []
    const currentStory = currentUserStoriesArray[currentStoryIndex]
    Alert.alert('Mute', `Mute ${currentStory?.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mute', style: 'destructive', onPress: () => console.log('Muted') }
    ])
  }

  const handleArchiveStory = async () => {
    const currentUserStoriesArray = userStories[currentUserIndex] || []
    const currentStory = currentUserStoriesArray[currentStoryIndex]
    
    if (!currentStory || !currentUserId) return
    
    try {
      if (isSaved) {
        await unsaveStory(currentStory.id, currentUserId)
        setIsSaved(false)
      } else {
        await saveStory(currentStory.id, currentUserId, {
          imageUrl: currentStory.imageUrl,
          username: currentStory.username,
          caption: currentStory.text || '',
        })
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error toggling archive:', error)
      Alert.alert('Error', 'Failed to toggle archive')
    }
  }

  const handleReaction = async (emoji: string) => {
    setReaction(emoji)
    setIsPaused(true)
    
    // Animate the reaction
    reactionScale.setValue(0)
    reactionAnim.setValue(0)
    
    Animated.parallel([
      Animated.sequence([
        Animated.spring(reactionScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(reactionScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(reactionAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        setReaction(null)
        setIsPaused(false)
      }, 500)
    })

    // Send reaction to backend
    const currentUserStoriesArray = userStories[currentUserIndex] || []
    const currentStory = currentUserStoriesArray[currentStoryIndex]
    
    if (currentStory && currentUserId) {
      try {
        await addStoryReaction(currentStory.id, currentUserId, emoji)
        console.log('Sent reaction:', emoji, 'to', currentStory.username)
      } catch (error) {
        console.error('Error sending reaction:', error)
      }
    }
  }

  const handleSendReply = () => {
    if (replyText.trim()) {
      const currentUserStoriesArray = userStories[currentUserIndex] || []
      const currentStory = currentUserStoriesArray[currentStoryIndex]
      console.log('Sent reply:', replyText, 'to', currentStory?.username)
      setReplyText('')
      setShowReactions(false)
      Keyboard.dismiss()
    }
  }

  const handleInputFocus = () => {
    setShowReactions(true)
    setIsPaused(true)
  }

  const handleInputBlur = () => {
    if (!replyText.trim()) {
      setShowReactions(false)
    }
    setIsPaused(false)
  }

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator /></SafeAreaView>
  if (!userStories.length) return <SafeAreaView style={styles.container}><Text>Story not found</Text></SafeAreaView>

  const currentUserStoriesArray = userStories[currentUserIndex] || []
  const currentStory = currentUserStoriesArray[currentStoryIndex]
  const isOwnStory = currentStory?.userId === currentUserId

  if (!currentStory) return null

  return (
    <Modal visible animationType="slide">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container} edges={['top','bottom']}>
          {/* Progress bars - one for each story of current user */}
          <View style={styles.progressContainer}>
            {currentUserStoriesArray.map((_, index) => (
              <View key={index} style={[
                styles.progressBarWrapper,
                index < currentStoryIndex && { backgroundColor: '#fff' }
              ]}>
                {index === currentStoryIndex && (
                  <StoryProgressBar
                    key={`${currentUserIndex}-${currentStoryIndex}`}
                    duration={STORY_DURATION}
                    isActive={!isPaused}
                    onComplete={handleNextStory}
                  />
                )}
              </View>
            ))}
          </View>

          <View style={styles.topBar}>
            <View style={styles.userInfo}>
              <Image 
                source={{ uri: currentStory.userProfileImage }} 
                style={styles.avatarSmall} 
              />
              <View>
                <Text style={styles.username}>{currentStory.username}</Text>
                <Text style={styles.time}>
                  {currentStory.createdAt ? 
                    new Date(currentStory.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) 
                    : ''}
                </Text>
              </View>
            </View>
            <View style={styles.topBarButtons}>
              {isOwnStory ? (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteStory}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.archiveButton} onPress={handleArchiveStory}>
                    <Ionicons name={isSaved ? "archive" : "archive-outline"} size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.moreButton} onPress={handleMenuPress}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu dropdown */}
          {showMenu && (
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
                <Ionicons name="flag-outline" size={20} color="#fff" />
                <Text style={styles.menuText}>Report</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleMute}>
                <Ionicons name="volume-mute-outline" size={20} color="#fff" />
                <Text style={styles.menuText}>Mute</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Story content with gestures */}
          <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
            <Animated.View style={[styles.content]}>
              <Animated.View style={{flex:1, width:'100%', height:'100%', opacity: fadeAnim}}>
                <Image 
                  source={{ uri: currentStory.imageUrl }} 
                  style={styles.image}
                  resizeMode="contain"
                  onLoadStart={() => setIsPaused(true)}
                  onLoad={() => setIsPaused(false)}
                />
                
                {/* Text overlay if story has text */}
                {currentStory.text && (
                  <View
                    style={[
                      styles.storyTextOverlay,
                      currentStory.textStyle?.position && {
                        left: currentStory.textStyle.position.x,
                        top: currentStory.textStyle.position.y,
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.storyText,
                        currentStory.textStyle && {
                          color: currentStory.textStyle.color,
                          fontSize: currentStory.textStyle.fontSize,
                          fontWeight: currentStory.textStyle.fontWeight as any,
                          backgroundColor: currentStory.textStyle.backgroundColor,
                          paddingHorizontal: currentStory.textStyle.backgroundColor !== 'transparent' ? 12 : 0,
                          paddingVertical: currentStory.textStyle.backgroundColor !== 'transparent' ? 8 : 0,
                          borderRadius: currentStory.textStyle.backgroundColor !== 'transparent' ? 8 : 0,
                        }
                      ]}
                    >
                      {currentStory.text}
                    </Text>
                  </View>
                )}
              </Animated.View>

              {/* Reaction Animation */}
              {reaction && (
                <Animated.View 
                  style={[
                    styles.reactionAnimation,
                    {
                      transform: [
                        { scale: reactionScale },
                        {
                          translateY: reactionAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -100],
                          }),
                        },
                      ],
                      opacity: reactionAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1, 0],
                      }),
                    },
                  ]}
                >
                  <Text style={styles.reactionEmoji}>{reaction}</Text>
                </Animated.View>
              )}
              
              {/* Touch areas for navigation with press and hold support */}
              {/*
                Use responder handlers on the overlay View instead of TouchableWithoutFeedback.
                This prevents gesture-handler from swallowing quick taps and gives us full control.
              */}
              <View
                style={styles.touchOverlay}
                onStartShouldSetResponder={() => {
                  // Don't respond if navigation is in progress
                  if (isNavigating.current) {
                    console.log('onStartShouldSetResponder - navigation in progress, rejecting')
                    return false
                  }
                  console.log('onStartShouldSetResponder called')
                  return true
                }}
                onResponderGrant={(e) => {
                  console.log('onResponderGrant - touch started')
                  handleTouchStart(e)
                }}
                onResponderRelease={(e) => {
                  console.log('onResponderRelease - touch ended, showReactions=', showReactions)
                  handleTouchEnd(e)
                }}
              />
            </Animated.View>
          </PanGestureHandler>

          {/* Reply Input and Reactions - Only show for other users' stories */}
          {!isOwnStory && (
            <View style={styles.bottomContainer}>
              {showReactions && (
                <View style={styles.reactionBar}>
                  {REACTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.reactionButton}
                      onPress={() => handleReaction(emoji)}
                    >
                      <Text style={styles.reactionIcon}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <View style={styles.replyContainer}>
                <TextInput
                  ref={inputRef}
                  style={styles.replyInput}
                  placeholder="Send message"
                  placeholderTextColor="#999"
                  value={replyText}
                  onChangeText={setReplyText}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
                {showReactions && (
                  <TouchableOpacity 
                    style={styles.sendButton}
                    onPress={handleSendReply}
                  >
                    <Ionicons name="send" size={20} color={replyText.trim() ? "#fff" : "#666"} />
                  </TouchableOpacity>
                )}
                {!showReactions && (
                  <TouchableOpacity 
                    style={styles.heartButton}
                    onPress={() => handleReaction('❤️')}
                  >
                    <Ionicons name="heart-outline" size={24} color="#fff"/>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Viewers Modal */}
          <StoryViewersModal
            visible={showViewersModal}
            onClose={() => {
              setShowViewersModal(false)
              setIsPaused(false)
            }}
            viewers={viewers}
            reactions={currentStory.reactions || {}}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
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
    zIndex: 10,
  },
  progressBarWrapper: {
    flex: 1,
    height: 1,
    borderRadius: 2,
    marginHorizontal: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 12,
    marginTop: 8,
    zIndex: 5,
  },
  topBarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    padding: 4,
  },
  moreButton: {
    padding: 4,
  },
  archiveButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 13,
  },
  time: {
    color: '#ccc',
    fontSize: 12,
  },
  menuContainer: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    padding: 8,
    zIndex: 100,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    marginHorizontal: 8,
    marginBottom: 0,
  },
  image: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover',
    borderRadius: 18,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  reactionAnimation: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    zIndex: 1000,
  },
  reactionEmoji: {
    fontSize: 80,
  },
  bottomContainer: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#000',
  },
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  reactionButton: {
    padding: 4,
  },
  reactionIcon: {
    fontSize: 32,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  replyInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendButton: {
    padding: 4,
  },
  heartButton: {
    padding: 4,
  },
  storyTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyText: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
})
