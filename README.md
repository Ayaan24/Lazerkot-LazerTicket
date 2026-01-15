# LazorKit Event Ticketing App

> A production-ready React Native (Expo) demo app showcasing passkey-native Solana wallet integration with gasless transactions and biometric authentication.

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.0-black.svg)](https://expo.dev/)
[![LazorKit](https://img.shields.io/badge/LazorKit-1.0.0-yellow.svg)](https://lazorkit.com)
[![Solana](https://img.shields.io/badge/Solana-Devnet-purple.svg)](https://solana.com)

## 📱 Project Overview

This app demonstrates how to build a **walletless, biometric-first** event ticketing experience on Solana using LazorKit's passkey-native wallet technology. Users can:

- 🔐 **Sign in with Face ID** - No passwords, no seed phrases
- 💰 **Buy tickets with USDC** - Gasless transactions via Paymaster
- 🎫 **Own NFT tickets** - Stored on-chain as Program Derived Addresses (PDAs)
- 🚪 **Enter events with Face ID** - Biometric verification replaces QR codes

### Key Features

✅ **Passkey-Based Authentication** - Face ID creates and controls a smart wallet  
✅ **Gasless Transactions** - Paymaster sponsors all transaction fees  
✅ **On-Chain Tickets** - Tickets stored as PDAs on Solana  
✅ **One-Time Use** - Tickets can only be used once for entry  
✅ **Non-Transferable** - Tickets are cryptographically bound to wallet owner  
✅ **No Seed Phrases** - Users never see or manage private keys  

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **iOS Simulator** (for iOS) or **Android Emulator** (for Android)
- **Expo CLI** (optional, but recommended): `npm install -g expo-cli`

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd lazerkit
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo development server:**
   ```bash
   npm start
   ```

4. **Run on your device/simulator:**
   - **iOS**: Press `i` in terminal or scan QR code with Camera app
   - **Android**: Press `a` in terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in terminal

### First Run

1. **Start the app** - It will show the onboarding screen
2. **Sign in with Face ID** - Creates passkey and smart wallet automatically
3. **View Events** - Browse available events
4. **Buy Ticket** - Purchase ticket with Face ID (50 USDC, gasless)
5. **View Ticket** - Check ticket status and details
6. **Enter Event** - Verify entry with Face ID, mark ticket as used

---

## 📦 SDK Installation & Configuration

### 1. Install LazorKit SDK

The LazorKit React Native SDK is already installed. To add it to a new project:

```bash
npm install @lazorkit/wallet-mobile-adapter
```

### 2. Install Required Polyfills

React Native requires polyfills for Solana libraries:

```bash
npm install react-native-get-random-values react-native-url-polyfill buffer
```

### 3. Configure Polyfills

Add these imports at the **very top** of your entry file (`app/_layout.tsx`):

```typescript
// Must be at the very top, before any other imports
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
```

### 4. Setup LazorKitProvider

Wrap your app with `LazorKitProvider` in `app/_layout.tsx`:

```typescript
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';

export default function RootLayout() {
  return (
    <LazorKitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      configPaymaster={{
        paymasterUrl: 'https://kora.devnet.lazorkit.com',
        // apiKey: 'YOUR_API_KEY' // Optional
      }}
    >
      {/* Your app components */}
    </LazorKitProvider>
  );
}
```

### 5. Configure URL Scheme

Update `app.json` to match your redirect URL:

```json
{
  "expo": {
    "scheme": "lazorkit-ticket",
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["lazorkit-ticket"]
          }
        ]
      }
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "lazorkit-ticket"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

---

## 🔧 Environment Setup

### Solana Network Configuration

The app uses **Solana Devnet** by default. To change networks, update `app/_layout.tsx`:

```typescript
const LAZORKIT_CONFIG = {
  rpcUrl: 'https://api.devnet.solana.com', // Change to mainnet-beta for production
  portalUrl: 'https://portal.lazor.sh',
  configPaymaster: {
    paymasterUrl: 'https://kora.devnet.lazorkit.com',
  },
};
```

### USDC Mint Address

Update the USDC mint address in `lib/solana.ts`:

```typescript
// Devnet USDC
const USDC_MINT_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

// Mainnet USDC
// const USDC_MINT_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
```

### Organizer Wallet Address

Update the event organizer wallet address in `app/buy-ticket.tsx`:

```typescript
const organizerWallet = new PublicKey('BZkqZhJSsuZDJHHvXgizsj46oScPFahBcKVGPV8RA4nk');
```

---

## 📁 Project Structure

```
lazerkit/
├── app/                      # Expo Router screens
│   ├── _layout.tsx          # Root layout with LazorKitProvider
│   ├── splash.tsx           # Initial loading screen
│   ├── onboarding.tsx       # Onboarding flow
│   ├── login.tsx            # Face ID authentication
│   ├── events.tsx           # Event listing
│   ├── buy-ticket.tsx       # Ticket purchase with Face ID
│   ├── my-ticket.tsx        # Ticket details
│   └── entry.tsx            # Event entry verification
│
├── components/              # Reusable components
│   ├── FaceIdGuard.tsx      # App-wide Face ID authentication guard
│   ├── Header.tsx           # Navigation header
│   └── Footer.tsx           # Bottom navigation
│
├── lib/                     # Core libraries
│   ├── lazorkit.ts         # LazorKit SDK integration helpers
│   ├── solana.ts           # Solana blockchain helpers
│   ├── secure-storage.ts   # Secure credential storage
│   └── biometric-auth.ts   # Biometric authentication helpers
│
├── tutorials/               # Step-by-step tutorials
│   ├── 01-mobile-passkey-login.md
│   ├── 02-gasless-ticket-purchase.md
│   └── 03-faceid-event-entry.md
│
├── package.json            # Dependencies
├── app.json                # Expo configuration
└── README.md               # This file
```

---

## 📚 Step-by-Step Tutorials

### Tutorial 1: How to Create a Passkey-Based Wallet

Learn how Face ID creates a passkey and controls a smart wallet.

**📖 [Read Tutorial →](./tutorials/01-mobile-passkey-login.md)**

**Key Steps:**
1. Check biometric availability
2. Trigger Face ID authentication
3. Create WebAuthn passkey credential
4. Derive smart wallet (PDA) from passkey
5. Store credentials securely

### Tutorial 2: How to Trigger a Gasless Transaction

Learn how to execute gasless USDC transfers using LazorKit Paymaster.

**📖 [Read Tutorial →](./tutorials/02-gasless-ticket-purchase.md)**

**Key Steps:**
1. Create transaction instructions
2. Build Solana transaction
3. Request Paymaster sponsorship
4. Sign transaction with passkey
5. Submit and confirm transaction

### Tutorial 3: How to Persist Session Across Devices

Learn how wallet sessions are managed and restored.

**📖 [Read Tutorial →](./tutorials/03-faceid-event-entry.md)**

**Key Steps:**
1. Store wallet credentials securely
2. Restore wallet on app launch
3. Re-authenticate with Face ID
4. Maintain session state

---

## 💻 Code Examples

### Connect Wallet with Face ID

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';

const { connect } = useWallet();

await connect({
  redirectUrl: 'lazorkit-ticket://callback?screen=events',
  onSuccess: (walletInfo) => {
    console.log('Wallet address:', walletInfo.smartWallet);
    // Store credentials securely
  },
  onFail: (error) => {
    console.error('Connection failed:', error);
  },
});
```

### Sign and Send Gasless Transaction

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const { signAndSendTransaction, wallet } = useWallet();

const instruction = SystemProgram.transfer({
  fromPubkey: new PublicKey(wallet.smartWallet),
  toPubkey: new PublicKey('RECIPIENT_ADDRESS'),
  lamports: 0.01 * LAMPORTS_PER_SOL,
});

const signature = await signAndSendTransaction(
  {
    instructions: [instruction],
    transactionOptions: {
      feeToken: 'USDC', // Gasless transaction
      clusterSimulation: 'devnet',
    },
  },
  {
    redirectUrl: 'lazorkit-ticket://callback',
    onSuccess: (sig) => console.log('Transaction:', sig),
    onFail: (err) => console.error('Failed:', err),
  }
);
```

### Sign Message with Passkey

```typescript
import { useWallet } from '@lazorkit/wallet-mobile-adapter';

const { signMessage } = useWallet();

const result = await signMessage('Hello, LazorKit!', {
  redirectUrl: 'lazorkit-ticket://callback',
  onSuccess: (res) => console.log('Signature:', res.signature),
  onFail: (err) => console.error('Failed:', err),
});
```

---

## 🧪 Testing

### iOS Simulator

1. Open Xcode Simulator
2. Enable Face ID: **Features → Face ID → Enrolled**
3. Run: `npm run ios`

### Android Emulator

1. Open Android Studio Emulator
2. Configure fingerprint: **Settings → Security → Fingerprint**
3. Run: `npm run android`

### Test Deep Links

```bash
# iOS
xcrun simctl openurl booted lazorkit-ticket://test

# Android
adb shell am start -W -a android.intent.action.VIEW -d "lazorkit-ticket://test"
```

---

## 🐛 Troubleshooting

### Face ID Not Working

- **iOS Simulator**: Enable Face ID in Features menu
- **Android Emulator**: Configure fingerprint in Settings
- **Device**: Ensure Face ID/Touch ID is enrolled

### Transaction Failures

- Check Solana Devnet connection
- Verify wallet has USDC (use devnet faucet)
- Check transaction signatures in console
- Review error messages

### Navigation Issues

```bash
# Clear cache and restart
expo start --clear
```

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Live Demo

The app is configured to run on **Solana Devnet** with a working frontend. To test:

1. Start the app: `npm start`
2. Sign in with Face ID
3. Buy a ticket (requires USDC on Devnet)
4. Verify entry with Face ID

**Note**: For production, update network configuration to mainnet and use real USDC.

---

## 📖 Additional Resources

- [LazorKit Documentation](https://docs.lazorkit.com) - Official SDK docs
- [Solana Cookbook](https://solanacookbook.com) - Solana development guide
- [Expo Documentation](https://docs.expo.dev) - Expo and React Native guides
- [WebAuthn Guide](https://webauthn.guide) - Understanding WebAuthn/passkeys

---

## 📝 License

This demo app is for educational purposes as part of the LazorKit example repository program.

---

## 🤝 Support

For issues or questions:
1. Check the [tutorials](./tutorials/) for detailed explanations
2. Review code comments for implementation details
3. Refer to LazorKit and Solana documentation

---

**Built with ❤️ using LazorKit | Demonstrating walletless, biometric-first experiences on Solana**
