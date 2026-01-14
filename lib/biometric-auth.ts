/**
 * Biometric Authentication Utility
 * Handles Face ID/Touch ID authentication for app access
 */

import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
}

/**
 * Get available biometric type
 */
export async function getBiometricType(): Promise<BiometricType> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
    return 'none';
  } catch (error) {
    console.error('Error getting biometric type:', error);
    return 'none';
  }
}

/**
 * Authenticate with biometric (Face ID/Touch ID)
 */
export async function authenticateWithBiometric(
  reason: string = 'Authenticate to access your wallet'
): Promise<boolean> {
  try {
    const available = await isBiometricAvailable();
    if (!available) {
      throw new Error('Biometric authentication is not available');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use Passcode',
    });

    return result.success;
  } catch (error: any) {
    console.error('Biometric authentication error:', error);
    // If user cancels, return false
    if (error.message?.includes('cancel') || error.message?.includes('UserCancel')) {
      return false;
    }
    throw error;
  }
}

/**
 * Get biometric authentication prompt message
 */
export async function getBiometricPromptMessage(): Promise<string> {
  const type = await getBiometricType();
  switch (type) {
    case 'face':
      return 'Use Face ID to access your wallet';
    case 'fingerprint':
      return 'Use Touch ID to access your wallet';
    case 'iris':
      return 'Use Iris scan to access your wallet';
    default:
      return 'Authenticate to access your wallet';
  }
}
