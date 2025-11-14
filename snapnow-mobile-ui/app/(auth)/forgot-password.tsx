import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { sendPasswordReset } from '../../services/authService';

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
  red500: '#EF4444',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address or mobile number');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
      Alert.alert(
        'Success',
        'Password reset email has been sent to your email. Please check your inbox and follow the instructions.'
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'An error occurred. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={handleBackToLogin}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={28} color={COLORS.blue600} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Find Your Account</Text>
            </View>

            {/* Logo/Icon */}
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={['#0095F6', '#E91E63']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGrad}
              >
                <Ionicons name="mail" size={48} color="#fff" />
              </LinearGradient>
            </View>

            {!resetSent ? (
              <>
                {/* Description */}
                <View style={styles.descriptionWrap}>
                  <Text style={styles.descriptionTitle}>
                    Find Your Account
                  </Text>
                  <Text style={styles.descriptionText}>
                    Please enter your email address or mobile number to search for your account.
                  </Text>
                </View>

                {/* Input Form */}
                <View style={styles.form}>
                  <View style={styles.inputWrap}>
                    <Ionicons name="mail-outline" size={20} color="#8E8E8E" />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address or mobile number"
                      placeholderTextColor="#8E8E8E"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>

                  {/* Buttons */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                      style={styles.cancelBtn}
                      onPress={handleBackToLogin}
                      disabled={isLoading}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={handleSearch} 
                      disabled={isLoading}
                      style={styles.mb0}
                    >
                      <LinearGradient
                        colors={isLoading ? ['#8E8E8E', '#666666'] : ['#0095F6', '#0075C4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.searchBtn}
                      >
                        <Text style={styles.searchBtnText}>
                          {isLoading ? 'Searching...' : 'Search'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Success Message */}
                <View style={styles.successWrap}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={64} color={COLORS.blue600} />
                  </View>
                  <Text style={styles.successTitle}>Reset Email Sent</Text>
                  <Text style={styles.successText}>
                    We've sent a password reset link to:
                  </Text>
                  <Text style={styles.emailText}>{email}</Text>
                  <Text style={styles.successText}>
                    Please check your email and follow the instructions to reset your password.
                  </Text>

                  <TouchableOpacity 
                    onPress={handleBackToLogin}
                    style={styles.backButtonWrapper}
                  >
                    <LinearGradient
                      colors={['#0095F6', '#0075C4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.backBtn}
                    >
                      <Text style={styles.backBtnText}>Back to Login</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gray900,
  },

  // Icon
  iconWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGrad: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  // Description
  descriptionWrap: {
    marginBottom: 32,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray900,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: COLORS.gray600,
    lineHeight: 24,
  },

  // Form
  form: {
    marginBottom: 32,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.gray900,
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.gray700,
    fontWeight: '600',
    fontSize: 16,
  },
  searchBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  searchBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  mb0: { flex: 1 },

  // Success
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 12,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue600,
    marginBottom: 16,
  },
  backButtonWrapper: {
    marginTop: 32,
    width: '100%',
  },
  backBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  backBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
