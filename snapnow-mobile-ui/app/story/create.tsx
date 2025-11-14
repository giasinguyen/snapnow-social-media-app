import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary'
import { uploadToCloudinary } from '../../services/cloudinary'
import { createStory } from '../../services/stories'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const TEXT_COLORS = ['#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D']
const FONT_SIZES = [24, 32, 40, 48]
const BG_COLORS = ['transparent', 'rgba(0,0,0,0.5)', 'rgba(255,255,255,0.5)', '#FF6B6B', '#4ECDC4', '#45B7D1']

export default function CreateStoryScreen() {
  const router = useRouter()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [fontSize, setFontSize] = useState(32)
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('bold')
  const [textBgColor, setTextBgColor] = useState('transparent')
  const [textPosition, setTextPosition] = useState({ x: SCREEN_WIDTH / 2 - 100, y: SCREEN_HEIGHT / 3 - 50 })
  const [uploading, setUploading] = useState(false)
  const [showTextOptions, setShowTextOptions] = useState(false)

  // Animation for text options panel
  const slideAnim = useRef(new Animated.Value(0)).current
  const textPosX = useRef(new Animated.Value(0)).current
  const textPosY = useRef(new Animated.Value(0)).current

  // Pan responder for draggable text
  const textPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        textPosX.setOffset(textPosition.x)
        textPosY.setOffset(textPosition.y)
        textPosX.setValue(0)
        textPosY.setValue(0)
      },
      onPanResponderMove: Animated.event(
        [
          null,
          {
            dx: textPosX,
            dy: textPosY,
          },
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        textPosX.flattenOffset()
        textPosY.flattenOffset()
        
        const newX = (textPosX as any)._value
        const newY = (textPosY as any)._value
        
        setTextPosition({
          x: newX,
          y: newY,
        })
      },
    })
  ).current

  // Pan responder for swipe down to close text options
  const optionsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5 // Only respond to downward swipes
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // If swiped down more than 100px, close the options
          Animated.timing(slideAnim, {
            toValue: 400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowTextOptions(false)
            slideAnim.setValue(0)
          })
        } else {
          // Otherwise, snap back
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  // Animate text options opening
  React.useEffect(() => {
    if (showTextOptions) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start()
    }
  }, [showTextOptions])

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow multiple aspect ratios
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync()
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your camera')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Allow multiple aspect ratios
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const handleCreateStory = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first')
      return
    }

    setUploading(true)

    try {
      // Upload image to Cloudinary
      console.log('📤 Uploading story image to Cloudinary...')
      const uploadResult = await uploadToCloudinary(imageUri, {
        folder: CLOUDINARY_FOLDERS.stories || 'stories',
        tags: ['story'],
      })

      const imageUrl = uploadResult.secure_url
      console.log('✅ Story image uploaded:', imageUrl)

      // Create story with text and style
      // Get the actual current position from animated values
      const currentX = (textPosX as any)._value
      const currentY = (textPosY as any)._value
      
      const textStyle = text ? {
        color: textColor,
        fontSize,
        fontWeight,
        backgroundColor: textBgColor,
        position: { x: currentX, y: currentY },
      } : undefined

      const storyId = await createStory(imageUrl, text, textStyle)
      console.log('✅ Story created successfully:', storyId)

      // Navigate back and show success
      router.back()
      
      // Small delay to allow navigation, then show alert
      setTimeout(() => {
        Alert.alert('Success', 'Your story has been posted!')
      }, 300)
    } catch (error) {
      console.error('Error creating story:', error)
      Alert.alert('Error', 'Failed to create story. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (!imageUri) {
    return (
      <SafeAreaView style={styles.emptyStateContainer} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Story</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={100} color="#DBDBDB" />
          <Text style={styles.emptyText}>Select a photo or take one</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={32} color="#0095f6" />
              <Text style={styles.actionButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={32} color="#0095f6" />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setImageUri(null)}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Create Story</Text>
        <TouchableOpacity onPress={handleCreateStory} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={28} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      <View style={styles.previewContainer}>
        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />

        {/* Draggable Text Overlay */}
        {text && (
          <Animated.View
            {...textPanResponder.panHandlers}
            style={[
              styles.textOverlay,
              {
                left: Animated.add(textPosition.x, textPosX),
                top: Animated.add(textPosition.y, textPosY),
              },
            ]}
          >
            <View style={styles.dragHandle}>
              <Ionicons name="move-outline" size={16} color="rgba(255,255,255,0.5)" />
            </View>
            <Text
              style={[
                styles.overlayText,
                {
                  color: textColor,
                  fontSize,
                  fontWeight,
                  backgroundColor: textBgColor,
                  paddingHorizontal: textBgColor !== 'transparent' ? 12 : 0,
                  paddingVertical: textBgColor !== 'transparent' ? 8 : 0,
                  borderRadius: textBgColor !== 'transparent' ? 8 : 0,
                },
              ]}
            >
              {text}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Text Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Add text to your story..."
            placeholderTextColor="#999"
            value={text}
            onChangeText={setText}
            maxLength={100}
          />
          <TouchableOpacity onPress={() => setShowTextOptions(!showTextOptions)}>
            <Ionicons name="color-palette-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Text Options with Swipe Down */}
        {showTextOptions && (
          <Animated.View
            {...optionsPanResponder.panHandlers}
            style={[
              styles.textOptions,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Drag Indicator */}
            <View style={styles.dragIndicator} />
            
            {/* Color Picker */}
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Text Color</Text>
              <View style={styles.colorRow}>
                {TEXT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      textColor === color && styles.selectedColor,
                    ]}
                    onPress={() => setTextColor(color)}
                  />
                ))}
              </View>
            </View>

            {/* Background Color */}
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Background</Text>
              <View style={styles.colorRow}>
                {BG_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      {
                        backgroundColor: color === 'transparent' ? '#fff' : color,
                        borderWidth: color === 'transparent' ? 1 : 0,
                        borderColor: '#ddd',
                      },
                      textBgColor === color && styles.selectedColor,
                    ]}
                    onPress={() => setTextBgColor(color)}
                  />
                ))}
              </View>
            </View>

            {/* Font Size */}
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Font Size</Text>
              <View style={styles.colorRow}>
                {FONT_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      fontSize === size && styles.selectedSize,
                    ]}
                    onPress={() => setFontSize(size)}
                  >
                    <Text style={styles.sizeButtonText}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Font Weight */}
            <View style={styles.optionSection}>
              <Text style={styles.optionLabel}>Style</Text>
              <View style={styles.colorRow}>
                <TouchableOpacity
                  style={[
                    styles.styleButton,
                    fontWeight === 'normal' && styles.selectedStyle,
                  ]}
                  onPress={() => setFontWeight('normal')}
                >
                  <Text style={styles.styleButtonText}>Normal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.styleButton,
                    fontWeight === 'bold' && styles.selectedStyle,
                  ]}
                  onPress={() => setFontWeight('bold')}
                >
                  <Text style={[styles.styleButtonText, { fontWeight: 'bold' }]}>Bold</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  emptyStateContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginLeft: 12,
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  textOverlay: {
    position: 'absolute',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    padding: 4,
    marginBottom: 4,
  },
  overlayText: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomControls: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  textOptions: {
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 12,
    padding: 16,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  optionSection: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 8,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginRight: 8,
  },
  selectedSize: {
    backgroundColor: '#0095f6',
  },
  sizeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  styleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginRight: 8,
  },
  selectedStyle: {
    backgroundColor: '#0095f6',
  },
  styleButtonText: {
    color: '#fff',
    fontSize: 14,
  },
})
