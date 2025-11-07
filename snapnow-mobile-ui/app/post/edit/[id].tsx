import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../../services/authService';
import { uploadPostImage } from '../../../services/cloudinary';
import { extractHashtags, getPost, updatePost } from '../../../services/posts';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../src/constants/theme';
import { Post } from '../../../types';

const { width: screenWidth } = Dimensions.get('window');

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [caption, setCaption] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const postData = await getPost(id);
      
      if (!postData) {
        Alert.alert('Error', 'Post not found');
        router.back();
        return;
      }

      // Check if user owns this post
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || postData.userId !== currentUser.uid) {
        Alert.alert('Error', 'You can only edit your own posts');
        router.back();
        return;
      }

      setPost(postData);
      setCaption(postData.caption || '');
      
      // Initialize image URLs
      if (postData.imageUrls && postData.imageUrls.length > 0) {
        setImageUrls(postData.imageUrls);
      } else if (postData.imageUrl) {
        setImageUrls([postData.imageUrl]);
      } else {
        setImageUrls([]);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const selectImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets) {
        setUploadingImages(true);
        const uploadPromises = result.assets.map(asset => uploadPostImage(asset.uri, 'post'));
        const uploadedUrls = await Promise.all(uploadPromises);
        
        // Add new images to existing ones
        setImageUrls(prev => [...prev, ...uploadedUrls]);
        setUploadingImages(false);
      }
    } catch (error) {
      console.error('Error selecting images:', error);
      Alert.alert('Error', 'Failed to select images');
      setUploadingImages(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!post) return;

    if (imageUrls.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    try {
      setSaving(true);
      
      // Extract hashtags from caption
      const hashtags = extractHashtags(caption);
      
      await updatePost(post.id, {
        caption: caption.trim(),
        hashtags,
        imageUrls: imageUrls,
        imageUrl: imageUrls[0], // Keep backward compatibility
      });

      Alert.alert('Success', 'Post updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (caption !== (post?.caption || '')) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Post</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.headerButton, styles.saveButton]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Post Images Preview */}
          <View style={styles.imageContainer}>
            <View style={styles.imageHeader}>
              <Text style={styles.imageLabel}>Images ({imageUrls.length})</Text>
              <TouchableOpacity 
                onPress={selectImages} 
                style={styles.addImageButton}
                disabled={uploadingImages}
              >
                {uploadingImages ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="add" size={20} color={COLORS.primary} />
                    <Text style={styles.addImageText}>Add Images</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {imageUrls.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imageList}
                contentContainerStyle={styles.imageListContent}
              >
                {imageUrls.map((imageUrl, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.accent} />
                    </TouchableOpacity>
                    {imageUrls.length > 1 && (
                      <View style={styles.imageIndex}>
                        <Text style={styles.imageIndexText}>{index + 1}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noImagesContainer}>
                <Ionicons name="image-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.noImagesText}>No images selected</Text>
                <Text style={styles.noImagesSubtext}>Add at least one image to your post</Text>
              </View>
            )}
          </View>

          {/* Caption Editor */}
          <View style={styles.captionContainer}>
            <Text style={styles.captionLabel}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={2200}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {caption.length}/2200
            </Text>
          </View>

          {/* Hashtags Preview */}
          {caption && extractHashtags(caption).length > 0 && (
            <View style={styles.hashtagsContainer}>
              <Text style={styles.hashtagsLabel}>Hashtags</Text>
              <View style={styles.hashtagsList}>
                {extractHashtags(caption).map((hashtag, index) => (
                  <View key={index} style={styles.hashtag}>
                    <Text style={styles.hashtagText}>{hashtag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundWhite,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: SPACING.xs,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  imageLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.blue + '20',
    borderRadius: 8,
    gap: SPACING.xs,
  },
  addImageText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  imageList: {
    maxHeight: 200,
  },
  imageListContent: {
    gap: SPACING.md,
    paddingRight: SPACING.md,
  },
  imageItem: {
    position: 'relative',
    width: 150,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundGray,
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 12,
  },
  imageIndex: {
    position: 'absolute',
    bottom: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  imageIndexText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textWhite,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  noImagesContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  noImagesText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  noImagesSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  imageViewer: {
    height: 300,
    borderRadius: 8,
  },
  captionContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  captionLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    minHeight: 100,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  hashtagsContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  hashtagsLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  hashtagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  hashtag: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  hashtagText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});