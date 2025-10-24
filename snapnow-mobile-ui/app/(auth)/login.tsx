import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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
import { loginUser } from '../../services/authService';
// import {loginBypass } from '../../services/authService';

const COLORS = {
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray900: '#111827',
  blue50: '#EFF6FF',
  blue200: '#BFDBFE',
  blue500: '#3B82F6',
  blue600: '#2563EB',
};

export default function LoginScreen() {
  const [username, setUsername] = useState('admin@snapnow.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      // Nếu nhập "admin" thì tự động convert sang email
      let email = username;
      if (username.toLowerCase() === 'admin' || username === 'admin@admin.com') {
        email = 'admin@snapnow.com';
      } else if (!username.includes('@')) {
        email = `${username}@snapnow.com`;
      }
      
      console.log('Attempting login with:', email);
      await loginUser(email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setUsername('admin@snapnow.com');
    setPassword('admin123');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Logo */}
            <View style={styles.logoWrap}>
              <LinearGradient
                colors={['#0095F6', '#E91E63', '#9C27B0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGrad}
              >
                <Ionicons name="camera" size={64} color="#fff" />
              </LinearGradient>

              <Text style={styles.appTitle}>SnapNow</Text>
              <Text style={styles.appSubtitle}>Capture & Share Your Moments</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Username */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Username or Email</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={20} color="#8E8E8E" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter username or email"
                    placeholderTextColor="#8E8E8E"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoComplete="username"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color="#8E8E8E" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#8E8E8E"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.ml2}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#8E8E8E"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Login */}
              <TouchableOpacity onPress={handleQuickLogin} style={styles.quickTip}>
                <Ionicons name="information-circle" size={20} color="#0095F6" />
                <Text style={styles.quickText}>
                  Default: <Text style={styles.quickTextBold}>admin@snapnow.com / admin123</Text>
                </Text>
                <Text style={styles.quickRight}>Tap to fill</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={styles.mb4}>
                <LinearGradient
                  colors={isLoading ? ['#8E8E8E', '#666666'] : ['#0095F6', '#0075C4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <View style={styles.rowCenter}>
                    {isLoading && <View style={styles.mr2}><Ionicons name="sync" size={20} color="#fff" /></View>}
                    <Text style={styles.primaryBtnText}>
                      {isLoading ? 'Logging in...' : 'Log In'}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.centerMb6}>
                <Text style={styles.linkBlueSemibold}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Socials */}
              <TouchableOpacity style={styles.socialBtn}>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.socialText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.socialBtn, styles.mb0]}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                <Text style={styles.socialText}>Continue with Facebook</Text>
              </TouchableOpacity>

              {/* Dev-only bypass login */}
              {/* {typeof __DEV__ !== 'undefined' && __DEV__ && (
                <TouchableOpacity
                  onPress={async () => {
                    setIsLoading(true);
                    try {
                      await loginBypass();
                    } catch (error: any) {
                      Alert.alert('Bypass Failed', error?.message || 'Unable to bypass login');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  style={[styles.socialBtn, styles.mb0, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
                >
                  <Ionicons name="code-slash-outline" size={20} color="#92400E" />
                  <Text style={[styles.socialText, { color: '#92400E' }]}>Bypass Login (Dev)</Text>
                </TouchableOpacity>
              )} */}


            </View>

            {/* Sign Up */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  safe: { flex: 1, backgroundColor: COLORS.white },
  scrollContent: { flexGrow: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,   // px-6
    paddingVertical: 48,     // py-12
    justifyContent: 'center',
  },

  // Logo
  logoWrap: { alignItems: 'center', marginBottom: 48 }, // items-center mb-12
  logoGrad: {
    width: 128, height: 128, borderRadius: 24, // w-32 h-32 rounded-3xl
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, // mb-6
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8, // shadow-lg
  },
  appTitle: { fontSize: 48, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 8 }, // text-5xl
  appSubtitle: { fontSize: 18, color: COLORS.gray500 }, // text-lg

  // Form
  form: { marginBottom: 32 }, // mb-8
  formGroup: { marginBottom: 24 }, // mb-6 / mb-4
  label: { fontSize: 14, fontWeight: '600', color: COLORS.gray700, marginBottom: 8 }, // text-sm semibold
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderWidth: 1, borderColor: COLORS.gray200,
    borderRadius: 12, // rounded-xl
    paddingHorizontal: 16, paddingVertical: 12, // px-4 py-3
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.gray900 }, // text-base
  ml2: { marginLeft: 8 },

  // Quick login
  quickTip: {
    marginBottom: 24,
    backgroundColor: COLORS.blue50,
    borderWidth: 1, borderColor: COLORS.blue200,
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  quickText: { fontSize: 14, color: COLORS.blue600, marginLeft: 8, flex: 1 },
  quickTextBold: { fontWeight: '700' },
  quickRight: { fontSize: 12, fontWeight: '600', color: COLORS.blue500 },

  // Primary button
  mb4: { marginBottom: 16 },
  primaryBtn: {
    borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 4, // shadow-md
  },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  mr2: { marginRight: 8 },
  primaryBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },

  // Forgot
  centerMb6: { alignItems: 'center', marginBottom: 24 },
  linkBlueSemibold: { fontSize: 14, color: COLORS.blue600, fontWeight: '600' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.gray200 },
  dividerText: { marginHorizontal: 16, fontSize: 14, color: COLORS.gray400, fontWeight: '600' },

  // Social buttons
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2, borderColor: COLORS.gray200,
    borderRadius: 12, paddingVertical: 12, marginBottom: 12,
  },
  socialText: { marginLeft: 12, color: COLORS.gray700, fontWeight: '600' },
  mb0: { marginBottom: 0 },

  // Signup
  signupRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: 24, borderTopWidth: 1, borderTopColor: COLORS.gray200,
  },
  signupText: { fontSize: 14, color: COLORS.gray600 },
  signupLink: { fontSize: 14, color: COLORS.blue600, fontWeight: '700' },
});