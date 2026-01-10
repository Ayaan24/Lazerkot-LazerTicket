/**
 * LazorKit Integration
 * Wraps the LazorKit React Native SDK with simplified helpers
 */

import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { PublicKey } from '@solana/web3.js';
import type { WalletInfo as SDKWalletInfo } from '@lazorkit/wallet-mobile-adapter';

// Types
export interface PasskeySession {
  passkeyId: string;
  walletAddress: PublicKey;
  isAuthenticated: boolean;
}

export interface WalletInfo {
  publicKey: PublicKey;
  isInitialized: boolean;
  smartWallet?: string;
  credentialId?: string;
}

// Constants
const REDIRECT_URL = 'lazorkit-ticket://callback';

/**
 * Hook to use LazorKit wallet functionality
 * This wraps the useWallet hook from the SDK
 */
export function useLazorKitWallet() {
  const wallet = useWallet();
  return wallet;
}

/**
 * Connect to wallet using LazorKit SDK
 * This triggers the portal flow for passkey creation/login
 */
export async function connectWallet(
  onSuccess?: (wallet: WalletInfo) => void,
  onFail?: (error: Error) => void
): Promise<WalletInfo | null> {
  // This will be used in components via useWallet hook
  // Return type for compatibility
  return null;
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(wallet: SDKWalletInfo | null | undefined): boolean {
  return wallet !== null && wallet !== undefined && !!wallet.smartWallet;
}

/**
 * Get wallet address from SDK wallet info
 */
export function getWalletAddress(wallet: SDKWalletInfo | null | undefined): PublicKey | null {
  if (!wallet || !wallet.smartWallet) return null;
  try {
    return new PublicKey(wallet.smartWallet);
  } catch {
    return null;
  }
}

/**
 * Convert SDK WalletInfo to our WalletInfo format
 */
export function convertWalletInfo(sdkWallet: SDKWalletInfo | null | undefined): WalletInfo | null {
  if (!sdkWallet || !sdkWallet.smartWallet) return null;
  
  try {
    return {
      publicKey: new PublicKey(sdkWallet.smartWallet),
      isInitialized: true,
      smartWallet: sdkWallet.smartWallet,
      credentialId: sdkWallet.credentialId,
    };
  } catch {
    return null;
  }
}

/**
 * Restore wallet from SDK state
 * This is handled automatically by the SDK via useWallet hook
 */
export async function restoreWallet(): Promise<WalletInfo | null> {
  // The SDK handles wallet restoration automatically
  // This is kept for compatibility but should use useWallet hook in components
  return null;
}

/**
 * Sign a message using LazorKit SDK
 * This will open the portal for signing
 */
export async function signWithPasskey(
  message: string,
  signMessageFn: (message: string, options: any) => Promise<any>,
  redirectUrl: string = REDIRECT_URL
): Promise<string> {
  try {
    const result = await signMessageFn(message, {
      redirectUrl,
    });
    return result.signature;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign message');
  }
}

/**
 * Sign and send a transaction using LazorKit SDK
 * This will open the portal for transaction signing
 */
export async function signAndSendTransactionWithPasskey(
  transactionData: {
    instructions: any[];
    transactionOptions: {
      feeToken?: string;
      computeUnitLimit?: number;
      clusterSimulation: 'devnet' | 'mainnet';
    };
  },
  signAndSendFn: (payload: any, options: any) => Promise<string>,
  redirectUrl: string = REDIRECT_URL
): Promise<string> {
  try {
    const signature = await signAndSendFn(transactionData, {
      redirectUrl,
    });
    return signature;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign and send transaction');
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(
  disconnectFn: (options?: any) => Promise<void>
): Promise<void> {
  await disconnectFn();
}

// Export redirect URL constant for use in components
export const LAZORKIT_REDIRECT_URL = REDIRECT_URL;