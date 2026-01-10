/**
 * Login Screen
 * Sign in with Face ID - Creates or restores smart wallet via LazorKit SDK
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { convertWalletInfo, LAZORKIT_REDIRECT_URL } from '@/lib/lazorkit';
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
    
    // If already connected, navigate to events
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
      // Connect to wallet using LazorKit SDK
      // This will open the portal for passkey creation/login
      await connect({
        redirectUrl: `${LAZORKIT_REDIRECT_URL}?screen=events`,
        onSuccess: (walletInfo) => {
          console.log('Connected successfully:', walletInfo.smartWallet);
          setLoading(false);
          // Navigate to events screen on success
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

      // Note: The onSuccess callback will handle navigation
      // If connection is immediate, we'll navigate in useEffect
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Checking biometric availability...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>LazorKit Ticket Demo</Text>
        <Text style={styles.subtitle}>
          Sign in with Face ID to get started
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            • No wallet address to manage{'\n'}
            • No seed phrases to remember{'\n'}
            • Secure biometric authentication{'\n'}
            • Gasless transactions
          </Text>
        </View>

        {!biometricAvailable && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Biometric authentication is not available on this device.
              Please enable Face ID / Touch ID in settings.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (!biometricAvailable || loading) && styles.buttonDisabled,
          ]}
          onPress={handleSignIn}
          disabled={!biometricAvailable || loading || isConnected}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in with Face ID</Text>
          )}
        </TouchableOpacity>

        {isConnected && (
          <View style={styles.connectedBox}>
            <Text style={styles.connectedText}>
              Connected ✓
            </Text>
          </View>
        )}

        {/* Testing/Demo Mode Button - For Local Development Only */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={async () => {
            // Enable test mode for local testing
            // This bypasses authentication for quick testing
            try {
              await AsyncStorage.setItem('test_mode', 'enabled');
              router.replace('/events');
            } catch (error) {
              console.error('Error enabling test mode:', error);
              router.replace('/events');
            }
          }}
        >
          <Text style={styles.testButtonText}>🚀 Test Mode: Go to Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.testInfoBox}>
          <Text style={styles.testInfoText}>
            ⚠️ Test mode skips authentication for local development
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 24,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  connectedBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    width: '100%',
  },
  connectedText: {
    fontSize: 12,
    color: '#065f46',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
  testButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#059669',
    borderStyle: 'dashed',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  testInfoBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    width: '100%',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  testInfoText: {
    fontSize: 11,
    color: '#92400e',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});