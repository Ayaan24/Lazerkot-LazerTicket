/**
 * Secure Storage Utility
 * Uses expo-secure-store for storing sensitive wallet credentials
 */

import * as SecureStore from 'expo-secure-store';

// Storage keys
const WALLET_CREDENTIAL_KEY = 'wallet_credential';
const WALLET_ADDRESS_KEY = 'wallet_address';
const FACE_ID_ENABLED_KEY = 'face_id_enabled';

/**
 * Store wallet credential securely
 */
export async function storeWalletCredential(credentialId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(WALLET_CREDENTIAL_KEY, credentialId);
  } catch (error) {
    console.error('Error storing wallet credential:', error);
    throw error;
  }
}

/**
 * Get stored wallet credential
 */
export async function getWalletCredential(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(WALLET_CREDENTIAL_KEY);
  } catch (error) {
    console.error('Error getting wallet credential:', error);
    return null;
  }
}

/**
 * Store wallet address securely
 */
export async function storeWalletAddress(address: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(WALLET_ADDRESS_KEY, address);
  } catch (error) {
    console.error('Error storing wallet address:', error);
    throw error;
  }
}

/**
 * Get stored wallet address
 */
export async function getWalletAddress(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(WALLET_ADDRESS_KEY);
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
}

/**
 * Store complete wallet info securely
 */
export async function storeWalletInfo(walletInfo: {
  credentialId: string;
  smartWallet: string;
  passkeyPubkey?: number[];
  walletDevice?: string;
  platform?: string;
}): Promise<void> {
  try {
    await storeWalletCredential(walletInfo.credentialId);
    await storeWalletAddress(walletInfo.smartWallet);
    
    // Store additional info if available
    if (walletInfo.passkeyPubkey) {
      await SecureStore.setItemAsync(
        'wallet_passkey_pubkey',
        JSON.stringify(walletInfo.passkeyPubkey)
      );
    }
    if (walletInfo.walletDevice) {
      await SecureStore.setItemAsync('wallet_device', walletInfo.walletDevice);
    }
    if (walletInfo.platform) {
      await SecureStore.setItemAsync('wallet_platform', walletInfo.platform);
    }
  } catch (error) {
    console.error('Error storing wallet info:', error);
    throw error;
  }
}

/**
 * Clear all stored wallet data
 */
export async function clearWalletData(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(WALLET_CREDENTIAL_KEY);
    await SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY);
    await SecureStore.deleteItemAsync('wallet_passkey_pubkey').catch(() => {});
    await SecureStore.deleteItemAsync('wallet_device').catch(() => {});
    await SecureStore.deleteItemAsync('wallet_platform').catch(() => {});
  } catch (error) {
    console.error('Error clearing wallet data:', error);
  }
}

/**
 * Check if Face ID is enabled
 */
export async function isFaceIdEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(FACE_ID_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Set Face ID enabled status
 */
export async function setFaceIdEnabled(enabled: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(FACE_ID_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting Face ID enabled:', error);
  }
}
