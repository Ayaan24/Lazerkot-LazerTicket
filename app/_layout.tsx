/**
 * Root layout for Expo Router
 * Sets up navigation, routing, and LazorKit provider
 */

// Polyfills for React Native (must be at the very top)
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';

// LazorKit configuration for Devnet
const LAZORKIT_CONFIG = {
  rpcUrl: 'https://api.devnet.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  configPaymaster: {
    paymasterUrl: 'https://kora.devnet.lazorkit.com',
    // apiKey: 'YOUR_API_KEY' // Optional - add if you have one
  },
};

export default function RootLayout() {
  return (
    <LazorKitProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      configPaymaster={LAZORKIT_CONFIG.configPaymaster}
    >
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="login" 
          options={{ 
            title: 'Login',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="events" 
          options={{ 
            title: 'Events',
            headerBackVisible: false,
          }} 
        />
        <Stack.Screen 
          name="buy-ticket" 
          options={{ 
            title: 'Buy Ticket',
          }} 
        />
        <Stack.Screen 
          name="my-ticket" 
          options={{ 
            title: 'My Ticket',
          }} 
        />
        <Stack.Screen 
          name="entry" 
          options={{ 
            title: 'Entry Verification',
          }} 
        />
      </Stack>
    </LazorKitProvider>
  );
}

