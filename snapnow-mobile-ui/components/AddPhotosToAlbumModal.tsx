import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { fetchUserPosts, createPost } from '../services/posts';
import { addPostToAlbum } from '../services/albums';
import { Post } from '../types';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 3; // 3 columns with spacing

interface AddPhotosToAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  albumId: string;
  userId: string;
  onPhotosAdded: () => void;
}

export default function AddPhotosToAlbumModal({
  visible,
  onClose,
  albumId,
  userId,
  onPhotosAdded,
}: AddPhotosToAlbumModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'posts'>('upload');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadUserPosts = useCallback(async () => {
    try {
      setLoading(true);
      const posts = await fetchUserPosts(userId);
      setUserPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible && activeTab === 'posts') {
      loadUserPosts();
    }
  }, [visible, activeTab, loadUserPosts]);

  const handleUploadPhotos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        setUploading(true);

        // Upload each photo as a new post and add to album
        for (const asset of result.assets) {
          const postId = await createPost({
            userId,
            username: '',
            imageUrl: asset.uri,
            caption: '',
            userImage: '',
          });

          if (postId) {
            await addPostToAlbum(albumId, postId);
          }
        }

        setUploading(false);
        onPhotosAdded();
        Alert.alert('Success', `${result.assets.length} photo(s) added to album`);
        onClose();
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      setUploading(false);
      Alert.alert('Error', 'Failed to upload photos');
    }
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const handleAddSelectedPosts = async () => {
    if (selectedPostIds.length === 0) {
      Alert.alert('No Selection', 'Please select at least one photo');
      return;
    }

    try {
      setLoading(true);

      for (const postId of selectedPostIds) {
        await addPostToAlbum(albumId, postId);
      }

      setLoading(false);
      onPhotosAdded();
      Alert.alert('Success', `${selectedPostIds.length} photo(s) added to album`);
      setSelectedPostIds([]);
      onClose();
    } catch (error) {
      console.error('Error adding posts to album:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to add photos to album');
    }
  };

  const handleClose = () => {
    setSelectedPostIds([]);
    setActiveTab('upload');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Photos</Text>
          {activeTab === 'posts' && selectedPostIds.length > 0 ? (
            <TouchableOpacity onPress={handleAddSelectedPosts} disabled={loading}>
              <Text style={styles.doneButton}>
                Add ({selectedPostIds.length})
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upload' && styles.activeTab]}
            onPress={() => setActiveTab('upload')}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={24}
              color={activeTab === 'upload' ? '#000' : '#666'}
            />
            <Text style={[styles.tabText, activeTab === 'upload' && styles.activeTabText]}>
              Upload New
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons
              name="grid-outline"
              size={24}
              color={activeTab === 'posts' ? '#000' : '#666'}
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Your Posts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'upload' ? (
          <View style={styles.uploadContainer}>
            <Ionicons name="image-outline" size={80} color="#ccc" />
            <Text style={styles.uploadTitle}>Upload Photos</Text>
            <Text style={styles.uploadSubtitle}>
              Select photos from your gallery to add to this album
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadPhotos}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color="#fff" />
                  <Text style={styles.uploadButtonText}>Choose Photos</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
              </View>
            ) : userPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={80} color="#ccc" />
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubtext}>
                  Create some posts first to add them to albums
                </Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.postsGrid}>
                {userPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postItem}
                    onPress={() => togglePostSelection(post.id)}
                  >
                    <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                    {selectedPostIds.includes(post.id) && (
                      <View style={styles.selectedOverlay}>
                        <View style={styles.checkCircle}>
                          <Ionicons name="checkmark" size={20} color="#fff" />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  uploadContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  postsGrid: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  postItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderRadius: 4,
    alignItems: 'flex-end',
    padding: 8,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
