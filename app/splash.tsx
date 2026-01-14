/**
 * Splash Screen
 * Logo in the middle with white background
 */

import { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWalletAddress } from '@/lib/secure-storage';

const ONBOARDING_STORAGE_KEY = '@onboarding_completed';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    checkOnboarding();
  }, []);

  async function checkOnboarding() {
    try {
      // Wait 2 seconds for splash screen
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      
      // Check if wallet credentials are stored securely
      const walletAddress = await getWalletAddress();
      
      if (onboardingCompleted === 'true' && walletAddress) {
        // Wallet exists - FaceIdGuard will handle Face ID authentication
        // and redirect to appropriate screen
        router.replace('/events');
      } else if (onboardingCompleted === 'true') {
        // Onboarding done but no wallet - go to login
        router.replace('/login');
      } else {
        // First time - show onboarding
        router.replace('/onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
      router.replace('/onboarding');
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/lt.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 200,
  },
});
