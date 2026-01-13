/**
 * Splash Screen
 * Logo in the middle with white background
 */

import { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      
      // Reset onboarding to show it again (remove this line to restore normal behavior)
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      
      const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      
      if (onboardingCompleted === 'true') {
        // Check if wallet exists
        const { restoreWallet } = await import('@/lib/lazorkit');
        const wallet = await restoreWallet();
        router.replace(wallet ? '/events' : '/login');
      } else {
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
