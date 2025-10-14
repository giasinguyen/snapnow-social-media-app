import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogoHeader } from '../../components/LogoHeader';
import { AuthService, UserProfile } from '../../services/auth';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const p = await AuthService.getCurrentUserProfile();
        if (mounted) setProfile(p);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.placeholderText}>No profile found</Text>
          <Text style={styles.subText}>Please login or register to see your profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LogoHeader />
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Image
            source={profile.profileImage ? { uri: profile.profileImage } : require('../../assets/images/default-avatar.jpg')}
            style={styles.avatar}
          />
          <View style={styles.stats}>
            <Text style={styles.statNumber}>{profile.postsCount ?? 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.stats}>
            <Text style={styles.statNumber}>{profile.followersCount ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stats}>
            <Text style={styles.statNumber}>{profile.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push({ pathname: '/(tabs)/edit-profile' })}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Additional profile content could go here (posts grid, highlights, etc.) */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, marginRight: 16, backgroundColor: '#eee' },
  stats: { alignItems: 'center', marginHorizontal: 8 },
  statNumber: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#666' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  displayName: { fontSize: 16, fontWeight: '700' },
  username: { color: '#666', marginTop: 2 },
  bio: { marginTop: 8, color: '#333' },
  editButton: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 6 },
  editButtonText: { fontSize: 14 },
  placeholderText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  subText: { fontSize: 14, color: '#666', textAlign: 'center' },
});