import { Ionicons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'
import React from 'react'
import {
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { StoryView } from '../services/stories'

interface StoryViewersModalProps {
  visible: boolean
  onClose: () => void
  viewers: StoryView[]
  reactions: { [userId: string]: string }
}

export default function StoryViewersModal({
  visible,
  onClose,
  viewers,
  reactions,
}: StoryViewersModalProps) {
  const renderViewer = ({ item }: { item: StoryView }) => {
    const reaction = reactions[item.userId]
    
    return (
      <View style={styles.viewerItem}>
        <View style={styles.leftContent}>
          {item.userProfileImage ? (
            <Image
              source={{ uri: item.userProfileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.username.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timeText}>
              {formatDistanceToNow(item.viewedAt, { addSuffix: true })}
            </Text>
          </View>
        </View>

        {reaction && (
          <View style={styles.reactionContainer}>
            <Text style={styles.reactionEmoji}>{reaction}</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Viewers ({viewers.length})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Viewers List */}
          {viewers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="eye-off-outline" size={64} color="#DBDBDB" />
              <Text style={styles.emptyText}>No views yet</Text>
            </View>
          ) : (
            <FlatList
              data={viewers}
              keyExtractor={(item) => item.userId}
              renderItem={renderViewer}
              contentContainerStyle={styles.listContent}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    paddingVertical: 8,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#DBDBDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    color: '#8E8E8E',
  },
  reactionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E8E',
    marginTop: 16,
  },
})
