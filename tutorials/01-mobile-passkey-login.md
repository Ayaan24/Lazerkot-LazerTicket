# Mobile Passkey Login

## Overview

This tutorial explains how Face ID creates a passkey and controls a smart wallet in the LazorKit Ticket Demo app.

## How Face ID Creates a Passkey

### Step 1: Biometric Authentication

When a user taps "Sign in with Face ID" on the login screen, the app first checks if biometric authentication is available:

```typescript
const available = await isBiometricAvailable();
```

This checks:
- Device has biometric hardware (Face ID, Touch ID, or fingerprint sensor)
- User has enrolled biometrics in device settings

### Step 2: Face ID Prompt

The app triggers the device's native Face ID prompt:

```typescript
const authenticated = await authenticateWithBiometric(
  'Create passkey with Face ID'
);
```

This displays the system Face ID prompt asking the user to authenticate. On successful authentication, the device confirms the user's identity.

### Step 3: Passkey Creation

In production, LazorKit SDK creates a WebAuthn passkey credential:

1. **Credential Creation**: Uses WebAuthn `navigator.credentials.create()` API
2. **Key Pair Generation**: The device generates a unique public/private key pair
3. **Private Key Storage**: The private key is stored securely in the device's secure enclave (iOS) or hardware-backed keystore (Android)
4. **Credential ID**: A unique credential ID is generated and stored

The passkey credential is bound to:
- The device's biometric authentication
- The app's domain/origin
- A unique user identifier

### Step 4: Smart Wallet Derivation

LazorKit SDK derives a Program Derived Address (PDA) on Solana from the passkey:

1. **Seed Generation**: Uses the passkey credential ID as a seed
2. **PDA Derivation**: Creates a deterministic Solana address using `findProgramAddress`
3. **Wallet Initialization**: The PDA is initialized as a smart wallet controlled by the passkey

```typescript
// Simplified example (LazorKit SDK handles this internally)
const credentialId = passkey.credentialId;
const seeds = [credentialId, programId];
const [walletPDA, bump] = PublicKey.findProgramAddressSync(seeds, programId);
```

## How Passkey Controls a Smart Wallet

### Wallet Ownership

The smart wallet (PDA) is **cryptographically owned** by the passkey:

- The wallet address is derived from the passkey credential
- Only the passkey can authorize transactions for this wallet
- No seed phrase or private key is exposed to the user

### Transaction Signing

When a user needs to sign a transaction (e.g., buying a ticket):

1. **Face ID Authentication**: User authenticates with Face ID
2. **Passkey Signing**: WebAuthn `navigator.credentials.get()` is called with the credential ID
3. **Challenge Signing**: The transaction challenge is signed with the passkey's private key
4. **Transaction Authorization**: The signed transaction is submitted to Solana

```typescript
// Simplified flow
const challenge = transaction.serializeMessage();
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: challenge,
    allowCredentials: [{ id: credentialId, type: 'public-key' }],
    userVerification: 'required' // Requires Face ID
  }
});
const signature = assertion.response.signature;
```

### Session Management

For smooth UX, the app maintains a session after initial authentication:

- Passkey credential ID is stored locally (encrypted)
- Wallet address is cached
- Subsequent transactions reuse the session (re-authenticate with Face ID as needed)

**Important**: The private key never leaves the device's secure storage.

## Key Benefits

1. **No Seed Phrases**: Users never see or manage seed phrases
2. **Biometric Security**: Transactions require Face ID/Touch ID authentication
3. **Non-Custodial**: Wallet is controlled by user's device, not a third party
4. **Recovery**: Can be restored on same device or via passkey backup (device-dependent)
5. **Universal**: Works across apps using the same passkey standard

## Security Model

- **Private Key**: Never exposed, stored in device secure enclave
- **Biometric**: Required for every transaction authorization
- **On-Chain**: Wallet address (public key) is the only on-chain identifier
- **Off-Chain**: Passkey credential stored securely on device

## Implementation Notes

In the demo app, passkey creation and wallet derivation are simplified for demonstration purposes. In production, LazorKit SDK handles:

- WebAuthn API interactions
- Secure key storage
- PDA derivation
- Transaction signing
- Session management

The demo simulates these flows to show the concept without requiring a full WebAuthn implementation in the Expo environment.

## Next Steps

- Learn about [gasless ticket purchase](./02-gasless-ticket-purchase.md)
- Understand [Face ID entry verification](./03-faceid-event-entry.md)

