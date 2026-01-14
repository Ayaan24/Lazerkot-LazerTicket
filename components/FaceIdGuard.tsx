/**
 * Face ID Guard Component
 * Requires Face ID authentication before allowing access
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  AppState,
  AppStateStatus,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { authenticateWithBiometric, isBiometricAvailable, getBiometricPromptMessage } from '@/lib/biometric-auth';
import { getWalletAddress } from '@/lib/secure-storage';

interface FaceIdGuardProps {
  children: React.ReactNode;
}

// Routes that don't require Face ID
const PUBLIC_ROUTES = ['/splash', '/onboarding', '/login'];

export default function FaceIdGuard({ children }: FaceIdGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);
  const walletHook = useWallet() as any;
  const { isConnected, wallet } = walletHook || {};
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Refs to prevent infinite loops
  const hasCheckedRef = useRef(false);
  const currentRouteRef = useRef<string>('');
  const isCheckingRef = useRef(false);

  // Get current route
  const currentRoute = segments.length > 0 ? `/${segments.join('/')}` : '/';

  // Only check once on mount or when route actually changes
  useEffect(() => {
    // If route changed, reset check flag
    if (currentRouteRef.current !== currentRoute) {
      hasCheckedRef.current = false;
      currentRouteRef.current = currentRoute;
    }
    
    // Skip if already checked for this route
    if (hasCheckedRef.current) {
      return;
    }
    
    // Skip if already authenticated (unless route changed)
    if (isAuthenticated && !PUBLIC_ROUTES.includes(currentRoute)) {
      hasCheckedRef.current = true;
      return;
    }
    
    // Skip if currently checking
    if (isCheckingRef.current) {
      return;
    }
    
    let mounted = true;
    isCheckingRef.current = true;
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && isChecking) {
        console.warn('Face ID guard timeout - allowing access');
        setIsChecking(false);
        setIsAuthenticated(true);
        isCheckingRef.current = false;
      }
    }, 8000); // 8 second timeout

    checkBiometricAndAuthenticate().finally(() => {
      if (mounted) {
        hasCheckedRef.current = true;
        isCheckingRef.current = false;
      }
    });
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.remove();
    };
  }, [currentRoute]); // Only re-run when route actually changes

  // If wallet becomes connected, allow access
  useEffect(() => {
    if (isConnected && wallet?.smartWallet && !PUBLIC_ROUTES.includes(currentRoute)) {
      if (!isAuthenticated) {
        setIsAuthenticated(true);
        setIsChecking(false);
        hasCheckedRef.current = true;
      }
    }
  }, [isConnected, wallet?.smartWallet]); // Removed currentRoute from deps to prevent loops

  function handleAppStateChange(nextAppState: AppStateStatus) {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      !PUBLIC_ROUTES.includes(currentRoute)
    ) {
      // App has come to the foreground, re-authenticate
      checkAndReauthenticate();
    }
    appState.current = nextAppState;
  }

  async function checkBiometricAndAuthenticate() {
    // Prevent multiple simultaneous calls
    if (isCheckingRef.current) {
      return;
    }
    
    try {
      isCheckingRef.current = true;
      setIsChecking(true);
      setAuthError(null);
      
      // Get current route at time of check
      const route = currentRouteRef.current || currentRoute;
      
      // If on public route, skip authentication
      if (PUBLIC_ROUTES.includes(route) || route === '/') {
        setIsAuthenticated(true);
        setIsChecking(false);
        isCheckingRef.current = false;
        return;
      }

      // Check if wallet is already connected via SDK
      if (isConnected && wallet?.smartWallet) {
        setIsAuthenticated(true);
        setIsChecking(false);
        isCheckingRef.current = false;
        return;
      }

      // Check if wallet exists in secure storage
      const walletAddress = await getWalletAddress();
      
      // If no wallet stored, allow access to login/onboarding
      if (!walletAddress) {
        setIsAuthenticated(true);
        setIsChecking(false);
        isCheckingRef.current = false;
        return;
      }

      // Check if biometric is available
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);

      // Wallet exists in storage but not connected - require Face ID to restore
      if (!available) {
        setAuthError('Biometric authentication is not available. Please enable Face ID / Touch ID in your device settings.');
        setIsChecking(false);
        // Still allow access if biometric not available (graceful degradation)
        setIsAuthenticated(true);
        isCheckingRef.current = false;
        return;
      }

      // Authenticate with Face ID to access wallet
      const promptMessage = await getBiometricPromptMessage();
      const authenticated = await authenticateWithBiometric(promptMessage);
      
      if (authenticated) {
        // Face ID successful - wallet should be restored by SDK automatically
        setIsAuthenticated(true);
        setIsChecking(false);
      } else {
        // User cancelled or failed - don't allow access but don't block either
        setAuthError('Face ID authentication is required to access your wallet.');
        setIsChecking(false);
        // Set authenticated to false so user sees the error screen
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      console.error('Face ID guard error:', error);
      setAuthError(error.message || 'Failed to authenticate. Please try again.');
      setIsChecking(false);
      setIsAuthenticated(false);
    } finally {
      isCheckingRef.current = false;
    }
  }

  async function checkAndReauthenticate() {
    try {
      const walletAddress = await getWalletAddress();
      if (!walletAddress) return;

      const available = await isBiometricAvailable();
      if (!available) return;

      const promptMessage = await getBiometricPromptMessage();
      const authenticated = await authenticateWithBiometric(promptMessage);
      
      if (!authenticated) {
        // User failed authentication, redirect to login
        setIsAuthenticated(false);
        router.replace('/login');
      }
    } catch (error) {
      console.error('Re-authentication error:', error);
    }
  }

  // Show loading screen while checking
  if (isChecking) {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/lt.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#FCFC65" style={styles.loader} />
        <Text style={styles.loadingText}>
          {biometricAvailable ? 'Authenticating with Face ID...' : 'Checking...'}
        </Text>
      </View>
    );
  }

  // If not authenticated and not on public route, show authentication screen
  if (!isAuthenticated && !PUBLIC_ROUTES.includes(currentRoute)) {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/lt.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.message}>Authentication Required</Text>
        <Text style={styles.subMessage}>
          {authError || 'Please authenticate with Face ID to access your wallet'}
        </Text>
        {authError && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              hasCheckedRef.current = false;
              currentRouteRef.current = '';
              checkBiometricAndAuthenticate();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render children if authenticated or on public route
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  subMessage: {
    color: '#999999',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#FCFC65',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
    minWidth: 150,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  loginButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FCFC65',
    minWidth: 150,
  },
  loginButtonText: {
    color: '#FCFC65',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
