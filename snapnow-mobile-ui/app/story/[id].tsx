import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MOCK_STORIES } from '../../services/mockData'

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [story, setStory] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const found = MOCK_STORIES.find(s => s.id === id)
    setStory(found || null)
    setLoading(false)
  }, [id])

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator /></SafeAreaView>
  if (!story) return <SafeAreaView style={styles.container}><Text>Story not found</Text></SafeAreaView>

  return (
    <Modal visible animationType="slide">
      <SafeAreaView style={styles.container} edges={['top','bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.username}>{story.username}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* For now show avatar as placeholder full screen */}
          <Image source={{ uri: story.avatar }} style={styles.image} />
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  username: { color: '#fff', fontWeight: '700', fontSize: 18 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
})
