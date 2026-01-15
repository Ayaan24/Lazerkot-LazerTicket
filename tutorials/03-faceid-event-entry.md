# Face ID Event Entry & Session Persistence

## Overview

This tutorial explains how Face ID is used for event entry verification and how wallet sessions are persisted across app launches in the LazorKit Event Ticketing App.

## Part 1: Face ID Event Entry Verification

### How It Works

When a user arrives at an event, they use Face ID to prove ownership of their ticket. The app verifies:
1. **Biometric Authentication** - User authenticates with Face ID
2. **Message Signing** - Passkey signs a verification challenge
3. **On-Chain Verification** - Ticket ownership is verified on Solana
4. **One-Time Use** - Ticket is marked as used (cannot be reused)

### Step-by-Step Implementation

#### Step 1: Initialize Wallet

When the entry screen loads, the app retrieves the user's wallet address:

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { getWalletAddress } from '@/lib/secure-storage';

const walletHook = useWallet();
const { signMessage, signAndSendTransaction } = walletHook;
const wallet = walletHook?.wallet;

// Get wallet address from SDK or secure storage
const storedAddress = await getWalletAddress();
const walletAddress = wallet?.smartWallet || storedAddress;
```

#### Step 2: Load Ticket Data

The app fetches the ticket data from on-chain storage:

```typescript
import { getTicketData } from '@/lib/solana';

const ticketData = await getTicketData(walletPublicKey, eventId);

if (!ticketData) {
  Alert.alert('No Ticket', 'You do not have a ticket for this event.');
  return;
}

if (ticketData.used) {
  Alert.alert('Ticket Already Used', 'This ticket has already been used for entry.');
  return;
}
```

#### Step 3: Face ID Authentication

User authenticates with Face ID before verification:

```typescript
import { authenticateWithBiometric } from '@/lib/biometric-auth';

const authenticated = await authenticateWithBiometric(
  'Verify entry with Face ID'
);

if (!authenticated) {
  Alert.alert('Authentication Failed', 'Please try again.');
  return;
}
```

#### Step 4: Sign Verification Challenge

The app creates a unique challenge and signs it with the passkey:

```typescript
import { signWithPasskey } from '@/lib/lazorkit';

const challenge = `entry_verification_${event.id}_${Date.now()}`;

const signResult = await signWithPasskey(
  challenge,
  signMessage,
  `${LAZORKIT_REDIRECT_URL}?screen=entry&verify=true`
);

// signResult contains the signature
console.log('Verification signature:', signResult.signature);
```

**What Happens:**
- LazorKit SDK opens the portal
- User authenticates with Face ID
- Passkey signs the challenge message
- Signature is returned to the app

#### Step 5: Verify On-Chain Ticket

The app verifies ticket ownership on-chain:

```typescript
const onChainTicket = await getTicketData(walletPublicKey, event.id);

if (!onChainTicket) {
  throw new Error('Ticket not found on-chain');
}

if (onChainTicket.used) {
  throw new Error('Ticket has already been used');
}

if (!onChainTicket.ownerWallet.equals(walletPublicKey)) {
  throw new Error('Ticket ownership verification failed');
}
```

#### Step 6: Mark Ticket as Used

If verification succeeds, mark the ticket as used on-chain:

```typescript
import { markTicketUsedInstruction } from '@/lib/solana';
import { signAndSendTransactionWithPasskey } from '@/lib/lazorkit';

const markUsedInstructions = await markTicketUsedInstruction(
  walletPublicKey,
  event.id,
  walletPublicKey
);

const signature = await signAndSendTransactionWithPasskey(
  {
    instructions: markUsedInstructions,
    transactionOptions: {
      feeToken: 'USDC',
      clusterSimulation: 'devnet',
    },
  },
  signAndSendTransaction,
  `${LAZORKIT_REDIRECT_URL}?screen=my-ticket`
);

// Update local state
await updateTicketUsed(walletPublicKey, event.id, true);
```

#### Step 7: Grant Entry

If all verifications pass, entry is granted:

```typescript
setVerified(true);
setTicketData({
  ...ticketData,
  used: true,
});
```

---

## Part 2: Session Persistence Across Devices

### How Sessions Work

LazorKit wallets are **device-bound** but can be restored using the same passkey credential. The app stores wallet credentials securely to enable session restoration.

### Step 1: Store Wallet Credentials

After successful wallet connection, store credentials securely:

```typescript
import { storeWalletInfo } from '@/lib/secure-storage';

await connect({
  redirectUrl: `${LAZORKIT_REDIRECT_URL}?screen=events`,
  onSuccess: async (walletInfo) => {
    // Store all wallet credentials securely
    await storeWalletInfo({
      credentialId: walletInfo.credentialId,
      smartWallet: walletInfo.smartWallet,
      passkeyPubkey: walletInfo.passkeyPubkey,
      walletDevice: walletInfo.walletDevice,
      platform: walletInfo.platform,
    });
  },
});
```

**Storage Implementation** (`lib/secure-storage.ts`):

```typescript
import * as SecureStore from 'expo-secure-store';

export async function storeWalletInfo(walletInfo: WalletInfo) {
  await SecureStore.setItemAsync(
    'wallet_credential_id',
    walletInfo.credentialId
  );
  await SecureStore.setItemAsync(
    'wallet_address',
    walletInfo.smartWallet
  );
  // Store other properties...
}
```

### Step 2: Restore Wallet on App Launch

The app checks for stored credentials on launch:

```typescript
import { getWalletAddress } from '@/lib/secure-storage';

useEffect(() => {
  async function restoreSession() {
    // Check if wallet is connected via SDK
    if (wallet?.smartWallet) {
      console.log('Wallet already connected:', wallet.smartWallet);
      return;
    }

    // Try to restore from secure storage
    const storedAddress = await getWalletAddress();
    if (storedAddress) {
      console.log('Restored wallet:', storedAddress);
      // Wallet will be restored by SDK on next connect()
    }
  }

  restoreSession();
}, []);
```

### Step 3: Face ID Re-Authentication

The app requires Face ID authentication when:
- App comes to foreground (after being backgrounded)
- User navigates to protected screens
- Transaction signing is required

**Implementation** (`components/FaceIdGuard.tsx`):

```typescript
import { AppState } from 'react-native';
import { authenticateWithBiometric } from '@/lib/biometric-auth';

useEffect(() => {
  // Listen for app state changes
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      // App came to foreground, re-authenticate
      checkAndReauthenticate();
    }
  });

  return () => subscription.remove();
}, []);

async function checkAndReauthenticate() {
  const walletAddress = await getWalletAddress();
  if (walletAddress && !isConnected) {
    // Wallet exists but not connected, require Face ID
    const authenticated = await authenticateWithBiometric(
      'Re-authenticate with Face ID'
    );
    if (authenticated) {
      // Wallet will be restored by SDK
      console.log('Re-authenticated successfully');
    }
  }
}
```

### Step 4: Cross-Device Considerations

**Important**: LazorKit passkeys are **device-bound** by default. To enable cross-device access:

1. **Same Device**: Wallet is automatically restored using stored credentials
2. **Different Device**: User must:
   - Sign in with Face ID on new device
   - LazorKit SDK creates new passkey credential
   - New smart wallet is derived (different address)
   - User would need to transfer tickets to new wallet (if needed)

**Note**: For true cross-device sync, you would need:
- Passkey backup/restore (platform-dependent)
- Or a separate account system that maps multiple passkeys to one user

---

## Security Model

### What's Stored Locally

- ✅ **Credential ID** - Encrypted in device secure storage
- ✅ **Wallet Address** - Public key (safe to store)
- ✅ **Platform Info** - Device/platform identifier

### What's NOT Stored

- ❌ **Private Key** - Never stored, only in device secure enclave
- ❌ **Passkey Private Key** - Never accessible to app
- ❌ **Seed Phrase** - Not used (passkey-based)

### Authentication Flow

```
User Action → Face ID Prompt → Device Secure Enclave → Passkey Signing → Transaction
```

**Key Points:**
- Private key never leaves device secure storage
- Face ID required for every transaction
- Passkey signing happens in secure enclave
- App only receives signatures, never private keys

---

## Code Example: Complete Entry Flow

```typescript
async function handleVerifyEntry() {
  if (!walletPublicKey || !ticketData) return;

  setVerifying(true);

  try {
    // 1. Face ID authentication
    const authenticated = await authenticateWithBiometric(
      'Verify entry with Face ID'
    );
    if (!authenticated) {
      throw new Error('Face ID authentication failed');
    }

    // 2. Sign verification challenge
    const challenge = `entry_verification_${event.id}_${Date.now()}`;
    const signResult = await signWithPasskey(
      challenge,
      signMessage,
      `${LAZORKIT_REDIRECT_URL}?screen=entry&verify=true`
    );

    // 3. Verify on-chain ticket
    const onChainTicket = await getTicketData(walletPublicKey, event.id);
    if (!onChainTicket || onChainTicket.used) {
      throw new Error('Ticket invalid or already used');
    }

    // 4. Mark ticket as used
    const markUsedInstructions = await markTicketUsedInstruction(
      walletPublicKey,
      event.id,
      walletPublicKey
    );

    const signature = await signAndSendTransactionWithPasskey(
      {
        instructions: markUsedInstructions,
        transactionOptions: {
          feeToken: 'USDC',
          clusterSimulation: 'devnet',
        },
      },
      signAndSendTransaction,
      `${LAZORKIT_REDIRECT_URL}?screen=my-ticket`
    );

    // 5. Update local state
    await updateTicketUsed(walletPublicKey, event.id, true);
    setVerified(true);

  } catch (error) {
    console.error('Entry verification failed:', error);
    setDenied(true);
  } finally {
    setVerifying(false);
  }
}
```

---

## Best Practices

### 1. Always Verify On-Chain

Never trust local state alone. Always verify ticket status on-chain:

```typescript
// ❌ Bad: Trust local state
if (ticketData.used) return;

// ✅ Good: Verify on-chain
const onChainTicket = await getTicketData(walletPublicKey, event.id);
if (onChainTicket.used) return;
```

### 2. Use Unique Challenges

Always use unique, time-based challenges for message signing:

```typescript
// ❌ Bad: Static challenge
const challenge = 'verify_entry';

// ✅ Good: Unique challenge
const challenge = `entry_verification_${event.id}_${Date.now()}_${Math.random()}`;
```

### 3. Handle Errors Gracefully

Provide clear error messages and recovery options:

```typescript
try {
  await handleVerifyEntry();
} catch (error) {
  if (error.message.includes('already used')) {
    Alert.alert('Ticket Used', 'This ticket has already been used.');
  } else if (error.message.includes('not found')) {
    Alert.alert('No Ticket', 'You do not have a ticket for this event.');
  } else {
    Alert.alert('Verification Failed', 'Please try again.');
  }
}
```

### 4. Secure Storage

Always use secure storage for sensitive data:

```typescript
// ❌ Bad: AsyncStorage (not encrypted)
await AsyncStorage.setItem('wallet', walletAddress);

// ✅ Good: SecureStore (encrypted)
await SecureStore.setItemAsync('wallet_address', walletAddress);
```

---

## Next Steps

- Learn about [mobile passkey login](./01-mobile-passkey-login.md)
- Understand [gasless ticket purchase](./02-gasless-ticket-purchase.md)
- Review [LazorKit Documentation](https://docs.lazorkit.com)

---

**Key Takeaway**: Face ID entry verification combines biometric authentication, cryptographic message signing, and on-chain verification to create a secure, user-friendly event entry experience without QR codes or physical tickets.
