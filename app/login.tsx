/**
 * Login Screen
 * Black background with white text and yellow accents
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { LAZORKIT_REDIRECT_URL } from '@/lib/lazorkit';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const { connect, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkBiometric();
    
    if (isConnected) {
      router.replace('/events');
    }
  }, [isConnected]);

  async function checkBiometric() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Error checking biometric:', error);
      setBiometricAvailable(false);
    } finally {
      setChecking(false);
    }
  }

  async function handleSignIn() {
    if (!biometricAvailable) {
      Alert.alert(
        'Biometric Not Available',
        'Please enable Face ID / Touch ID in your device settings.'
      );
      return;
    }

    setLoading(true);

    try {
      await connect({
        redirectUrl: `${LAZORKIT_REDIRECT_URL}?screen=events`,
        onSuccess: (walletInfo) => {
          console.log('Connected successfully:', walletInfo.smartWallet);
          setLoading(false);
          router.replace('/events');
        },
        onFail: (error) => {
          console.error('Connection failed:', error);
          setLoading(false);
          Alert.alert(
            'Connection Failed',
            error.message || 'Failed to connect wallet. Please try again.'
          );
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      setLoading(false);
      Alert.alert(
        'Login Failed',
        error.message || 'An error occurred during login. Please try again.'
      );
    }
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FCFC65" />
        <Text style={styles.loadingText}>Checking biometric availability...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🎫</Text>
          </View>
          <View style={styles.logoGlow} />
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in with Face ID to access your tickets{'\n'}
          No wallet, no seed phrases, just your face
        </Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔐</Text>
            <Text style={styles.featureText}>Secure biometric authentication</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>Gasless transactions</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Smart wallet auto-created</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!biometricAvailable || loading) && styles.buttonDisabled,
          ]}
          onPress={handleSignIn}
          disabled={!biometricAvailable || loading || isConnected}
        >
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>🔐</Text>
              <Text style={styles.buttonText}>Sign in with Face ID</Text>
            </>
          )}
        </TouchableOpacity>

        {!biometricAvailable && (
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Biometric authentication is not available. Please enable Face ID / Touch ID in settings.
            </Text>
          </View>
        )}

        {/* Test Mode Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={async () => {
            try {
              await AsyncStorage.setItem('test_mode', 'enabled');
              router.replace('/events');
            } catch (error) {
              console.error('Error enabling test mode:', error);
              router.replace('/events');
            }
          }}
        >
          <Text style={styles.testButtonText}>🚀 Test Mode</Text>
          <Text style={styles.testButtonSubtext}>Skip authentication for testing</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    position: 'relative',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FCFC65',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FCFC65',
    opacity: 0.2,
    top: -10,
  },
  logoText: {
    fontSize: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FCFC65',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  warningBox: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#CCCCCC',
    flex: 1,
    lineHeight: 18,
  },
  testButton: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FCFC65',
    borderStyle: 'dashed',
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  testButtonText: {
    color: '#FCFC65',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  testButtonSubtext: {
    color: '#999999',
    fontSize: 12,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
