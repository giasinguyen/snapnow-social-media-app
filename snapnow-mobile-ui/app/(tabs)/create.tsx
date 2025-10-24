import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionBar from '../../components/create/ActionBar';
import HeaderBar from '../../components/create/HeaderBar';
import PrivacySheet, { PrivacyOption } from '../../components/create/PrivacySheet';
import SelectedImage from '../../components/create/SelectedImage';
import UserComposer from '../../components/create/UserComposer';

const privacyOptions: PrivacyOption[] = [
  { key: 'anyone',    label: 'Bất kỳ ai' },
  { key: 'followers', label: 'Người theo dõi bạn' },
  { key: 'following', label: 'Trang cá nhân mà bạn theo dõi' },
  { key: 'mentions',  label: 'Chỉ khi được nhắc đến' },
];

const CreateSnapScreen: React.FC = () => {
  const router = useRouter();
  const [snapContent, setSnapContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacyOption>(privacyOptions[0]);

  const isPostEnabled = snapContent.trim().length > 0 || !!imageUri;

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Vui lòng cấp quyền truy cập thư viện ảnh.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  const post = () => {
    console.log('POST', { text: snapContent, imageUri, privacy: privacy.key });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      <View style={styles.container}>
        <HeaderBar
          title="Snap mới"
          left={<Ionicons name="close" size={26} color="#000" />}
          right={
            <>
              <Ionicons name="folder-open-outline" size={24} color="#000" />
              <Ionicons name="ellipsis-vertical" size={24} color="#000" />
            </>
          }
          onPressLeft={() => router.back()}
        />

        <View style={styles.body}>
          <UserComposer
            avatarUri="https://i.pravatar.cc/150?img=13"
            username="dqctuan9"
            value={snapContent}
            onChangeText={setSnapContent}
            placeholder="Có gì mới?"
          />

          <SelectedImage uri={imageUri} onClear={() => setImageUri(null)} />

          <ActionBar onPickImage={pickImage} />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setPrivacyOpen(true)} style={styles.leftRow}>
            <Text style={styles.footerText}>
              {privacy.label} cũng có thể trả lời và trích dẫn
            </Text>
            <Ionicons name="chevron-down" size={12} color="#8e8e8e" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={post}
            disabled={!isPostEnabled}
            style={[styles.postBtn, !isPostEnabled && styles.postBtnDisabled]}
          >
            <Text style={styles.postTxt}>Đăng</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PrivacySheet
        visible={privacyOpen}
        options={privacyOptions}
        currentKey={privacy.key}
        onClose={() => setPrivacyOpen(false)}
        onSelect={(opt) => { setPrivacy(opt); setPrivacyOpen(false); }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  body: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee',
  },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  footerText: { color: '#8e8e8e', fontSize: 13 },
  postBtn: { backgroundColor: '#0095f6', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  postBtnDisabled: { backgroundColor: '#b2dffc' },
  postTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default CreateSnapScreen;
