import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Sử dụng Firebase authService thật
import { InstagramButton, InstagramInput } from '../../components/InstagramUI';
import { LogoHeader } from '../../components/LogoHeader';
import { loginAsAdmin, loginUser } from '../../services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Attempting login...');
      await loginUser(email, password);
      console.log('✅ Login completed, should navigate now');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Attempting admin login...');
      await loginAsAdmin();
      console.log('✅ Admin login completed, should navigate now');
      // Alert và navigation sẽ được xử lý trong authService
    } catch (error: any) {
      console.error('Admin login error:', error);
      Alert.alert('Admin Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LogoHeader />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image 
              source={require('../../assets/images/logo-snapnow.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>
              Share your moments
            </Text>
          </View>

          <View style={styles.formContainer}>
            <InstagramInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <InstagramInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <InstagramButton
              title={isLoading ? 'Logging in...' : 'Log In'}
              onPress={handleLogin}
              disabled={isLoading}
            />

            <TouchableOpacity
              style={styles.adminButton}
              onPress={handleAdminLogin}
              disabled={isLoading}
            >
              <Text style={styles.adminButtonText}>
                🔑 Admin Login (admin@snapnow.com/admin123)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={styles.linkText}>
                Sign up
              </Link>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    height: 60,
    width: 200,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E8E',
  },
  formContainer: {
    marginBottom: 32,
  },
  adminButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: '#fef2f2',
  },
  adminButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  linkText: {
    color: '#0095F6',
    fontWeight: '600',
  },
});