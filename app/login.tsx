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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { LAZORKIT_REDIRECT_URL } from '@/lib/lazorkit';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeWalletInfo } from '@/lib/secure-storage';
import { Ionicons } from '@expo/vector-icons';

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

  /**
   * Handle sign in with Face ID
   * 
   * This function:
   * 1. Checks if biometric authentication is available
   * 2. Calls LazorKit SDK connect() method
   * 3. Opens LazorKit portal for passkey creation/login
   * 4. Stores wallet credentials securely on success
   * 5. Navigates to events screen
   * 
   * @see https://docs.lazorkit.com for connect() API documentation
   */
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
      // Connect to LazorKit wallet via portal
      // This will open the LazorKit portal in a browser/webview
      // User authenticates with Face ID, passkey is created/restored
      await connect({
        // Deep link URL to return to app after authentication
        // Must match URL scheme in app.json
        redirectUrl: `${LAZORKIT_REDIRECT_URL}?screen=events`,
        onSuccess: async (walletInfo) => {
          console.log('Connected successfully:', walletInfo.smartWallet);
          
          // Store wallet credentials securely in device secure storage
          // This enables wallet restoration on app restart
          try {
            await storeWalletInfo({
              credentialId: walletInfo.credentialId,      // WebAuthn credential ID
              smartWallet: walletInfo.smartWallet,        // Solana wallet address (PDA)
              passkeyPubkey: walletInfo.passkeyPubkey,    // Passkey public key bytes
              walletDevice: walletInfo.walletDevice,      // Device PDA address
              platform: walletInfo.platform,              // 'ios' or 'android'
            });
            console.log('Wallet credentials stored securely');
          } catch (storageError) {
            console.error('Error storing wallet credentials:', storageError);
            // Continue even if storage fails - wallet is still connected
          }
          
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/lt.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in with Face ID to access your tickets{'\n'}
          No wallet, no seed phrases, just your face
        </Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={24} color="#FCFC65" />
            <Text style={styles.featureText}>  Secure biometric authentication</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={24} color="#FCFC65" />
            <Text style={styles.featureText}>  Gasless transactions</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#FCFC65" />
            <Text style={styles.featureText}>  Smart wallet auto-created</Text>
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
              <Ionicons name="lock-closed" size={24} color="#000000" style={{ marginRight: 12 }} />
              <Text style={styles.buttonText}>Sign in with Face ID</Text>
            </>
          )}
        </TouchableOpacity>

        {!biometricAvailable && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="#FCFC65" style={{ marginRight: 12 }} />
            <Text style={styles.warningText}>
              Biometric authentication is not available. Please enable Face ID / Touch ID in settings.
            </Text>
          </View>
        )}
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
    
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 200,
    height: 100,
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '80%',
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
    width: '90%',
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
  warningText: {
    fontSize: 13,
    color: '#CCCCCC',
    flex: 1,
    lineHeight: 18,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
