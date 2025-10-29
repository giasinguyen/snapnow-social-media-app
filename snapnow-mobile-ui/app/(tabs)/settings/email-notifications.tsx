import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmailNotifications() {
  const router = useRouter();

  const [pushAll, setPushAll] = useState(false);
  const [postNotif, setPostNotif] = useState(true);
  const [newFollower, setNewFollower] = useState(true);
  const [featureNews, setFeatureNews] = useState(true);

  // when pushAll toggled, turn all other switches accordingly
  useEffect(() => {
    if (pushAll) {
      setPostNotif(true);
      setNewFollower(true);
      setFeatureNews(true);
    }
  }, [pushAll]);

  // if any individual is turned off, ensure pushAll is false
  useEffect(() => {
    if (!(postNotif && newFollower && featureNews) && pushAll) {
      setPushAll(false);
    }
    if (postNotif && newFollower && featureNews && !pushAll) {
      setPushAll(true);
    }
  }, [postNotif, newFollower, featureNews]);

  // common switch props to make the circular thumb white when ON
  const switchProps = (enabled: boolean) => ({
    trackColor: { true: '#24a6fcff', false: '#e6e6e6' },
    thumbColor: enabled ? '#ffffff' : '#f4f3f4',
    ios_backgroundColor: '#e6e6e6',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.title}>Email notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.rowTitle}>Push all</Text>
            <Text style={styles.rowSubtitle}>Enable or disable all notifications</Text>
          </View>
          <Switch
            value={pushAll}
            onValueChange={setPushAll}
            {...switchProps(pushAll)}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.rowTitle}>Posts</Text>
            <Text style={styles.rowSubtitle}>Receive notifications for posts</Text>
          </View>
          <Switch
            value={postNotif}
            onValueChange={setPostNotif}
            {...switchProps(postNotif)}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.rowTitle}>New follower</Text>
            <Text style={styles.rowSubtitle}>Get notified when someone follows you</Text>
          </View>
          <Switch
            value={newFollower}
            onValueChange={setNewFollower}
            {...switchProps(newFollower)}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.rowTitle}>SnapNow features</Text>
            <Text style={styles.rowSubtitle}>Learn about new SnapNow features</Text>
          </View>
          <Switch
            value={featureNews}
            onValueChange={setFeatureNews}
            {...switchProps(featureNews)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: '#262626' },
  container: { paddingTop: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  left: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: '#262626' },
  rowSubtitle: { fontSize: 13, color: '#8E8E8E' },
});
