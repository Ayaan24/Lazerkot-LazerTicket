# LazorKit SDK Integration Changes

## Summary

The app has been updated to use the **real LazorKit React Native SDK** (`@lazorkit/wallet-mobile-adapter`) instead of the simulated version.

## Key Changes

### 1. Package Dependencies

Added to `package.json`:
- `@lazorkit/wallet-mobile-adapter`: Real LazorKit SDK
- `expo-web-browser`: Required for portal redirects
- `expo-crypto`: Required for cryptographic operations
- `react-native-get-random-values`: Polyfill for random values
- `react-native-url-polyfill`: URL polyfill for React Native
- `buffer`: Buffer polyfill for Solana libraries

### 2. Polyfills Setup (`app/_layout.tsx`)

Added at the very top of the entry file:
```typescript
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
```

### 3. LazorKitProvider (`app/_layout.tsx`)

Wrapped the entire app with `LazorKitProvider`:
```typescript
<LazorKitProvider
  rpcUrl="https://api.devnet.solana.com"
  portalUrl="https://portal.lazor.sh"
  configPaymaster={{ 
    paymasterUrl: "https://kora.devnet.lazorkit.com" 
  }}
>
  {/* App content */}
</LazorKitProvider>
```

### 4. URL Scheme Configuration (`app.json`)

Configured deep link URL scheme:
- iOS: `lazorkit-ticket://` via `CFBundleURLSchemes`
- Android: Intent filters for deep links

### 5. SDK Integration in Screens

#### Login Screen (`app/login.tsx`)
- Uses `useWallet()` hook from SDK
- Calls `connect()` method which opens portal
- Portal handles passkey creation/login
- Redirects back to app via deep link

#### Events Screen (`app/events.tsx`)
- Uses `useWallet()` to check connection status
- Gets wallet address from `wallet.smartWallet`
- Automatically redirects to login if not connected

#### Buy Ticket Screen (`app/buy-ticket.tsx`)
- Uses `signAndSendTransaction()` from SDK
- Opens portal for Face ID authentication
- SDK handles gasless transactions via Paymaster
- Uses `feeToken: 'USDC'` for gasless USDC transactions

#### My Ticket Screen (`app/my-ticket.tsx`)
- Uses `useWallet()` to get wallet address
- Fetches ticket data from on-chain using wallet address

#### Entry Screen (`app/entry.tsx`)
- Uses `signMessage()` to sign verification challenge
- Uses `signAndSendTransaction()` to mark ticket as used
- Both operations open portal for Face ID authentication

### 6. Helper Functions (`lib/lazorkit.ts`)

Updated to wrap SDK methods:
- `useLazorKitWallet()`: Wrapper for `useWallet()` hook
- `getWalletAddress()`: Extracts PublicKey from SDK wallet info
- `convertWalletInfo()`: Converts SDK WalletInfo to app format
- `signWithPasskey()`: Wrapper for `signMessage()`
- `signAndSendTransactionWithPasskey()`: Wrapper for `signAndSendTransaction()`

## How It Works Now

### Authentication Flow

1. User taps "Sign in with Face ID" on login screen
2. App calls `connect()` with redirect URL
3. SDK opens LazorKit portal in web browser
4. Portal handles WebAuthn passkey creation/login
5. User authenticates with Face ID in portal
6. Portal redirects back to app via deep link: `lazorkit-ticket://callback?screen=events`
7. App receives wallet info via SDK state

### Transaction Flow

1. User initiates transaction (buy ticket, verify entry)
2. App builds Solana transaction instructions
3. App calls `signAndSendTransaction()` with:
   - Instructions array
   - Transaction options (feeToken: 'USDC', clusterSimulation: 'devnet')
   - Redirect URL for callback
4. SDK opens portal for authentication
5. User authenticates with Face ID in portal
6. Portal handles transaction signing and gasless sponsorship
7. Transaction is submitted to Solana
8. Portal redirects back to app with transaction signature

### Gasless Transactions

- SDK automatically handles Paymaster integration
- User doesn't pay gas fees (sponsored by Paymaster)
- Set `feeToken: 'USDC'` in transaction options
- Paymaster URL configured in `LazorKitProvider`

## Configuration

### Devnet Configuration

The app is configured for Solana Devnet:
- RPC: `https://api.devnet.solana.com`
- Portal: `https://portal.lazor.sh`
- Paymaster: `https://kora.devnet.lazorkit.com`

### Redirect URLs

All redirects use the app's URL scheme:
- Base: `lazorkit-ticket://callback`
- With screen: `lazorkit-ticket://callback?screen=events`

## Important Notes

1. **Portal-Based Flow**: The SDK uses a portal-based flow where authentication and signing happen in a web browser, then redirect back to the app.

2. **Deep Links Required**: The app must be configured with URL scheme (`lazorkit-ticket://`) to receive redirects from the portal.

3. **Face ID in Portal**: Face ID authentication happens in the LazorKit portal, not directly in the app (for security and standardization).

4. **Gasless Transactions**: Transactions are automatically gasless when using `feeToken` option - Paymaster handles sponsorship.

5. **Session Management**: The SDK handles session management automatically. Wallet state is maintained across app sessions.

## Next Steps

1. **Install Dependencies**: Run `npm install` to install all packages
2. **Test on Device**: Portal requires real device or properly configured simulator
3. **Configure API Keys**: Add Paymaster API key if available (optional)
4. **Test Deep Links**: Ensure deep links work correctly on iOS/Android

## Troubleshooting

### Portal Not Opening
- Check that `expo-web-browser` is installed
- Verify URL scheme is configured in `app.json`
- Test deep link handling: `lazorkit-ticket://test`

### Redirects Not Working
- Verify URL scheme matches in app.json and redirect URLs
- Check that app can handle deep links
- Test with: `xcrun simctl openurl booted lazorkit-ticket://test` (iOS)

### Transaction Errors
- Verify Solana RPC endpoint is accessible
- Check that wallet has USDC for ticket purchases
- Ensure Paymaster URL is correct for devnet/mainnet

---

**Integration Complete**: The app now uses the real LazorKit SDK for all wallet operations!
