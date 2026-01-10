# LazorKit Ticket Demo

A production-quality demo app demonstrating walletless, biometric-first event ticket purchase and entry using LazorKit, Solana, and Face ID.

## Overview

This app shows how to build a mobile experience where users can:
- **Sign in with Face ID** - No passwords, no seed phrases
- **Buy event tickets with USDC** - Gasless transactions via Paymaster
- **Enter events with Face ID** - Biometric verification replaces QR codes
- **No wallet UI needed** - Smart wallet managed automatically

## Key Features

✅ **Passkey-Based Authentication**: Face ID creates and controls a smart wallet  
✅ **Gasless Transactions**: Paymaster sponsors all transaction fees  
✅ **On-Chain Tickets**: Tickets stored as Program Derived Addresses (PDAs)  
✅ **One-Time Use**: Tickets can only be used once for entry  
✅ **Non-Transferable**: Tickets are bound to the wallet owner  
✅ **No Seed Phrases**: Users never see or manage private keys  

## Tech Stack

- **React Native** with Expo (~50.0.0)
- **TypeScript** for type safety
- **Expo Router** for navigation
- **LazorKit SDK** for passkey and smart wallet management
- **Solana Web3.js** for blockchain interactions
- **expo-local-authentication** for Face ID/Touch ID
- **Solana Devnet** for testing

## Project Structure

```
/app
  ├── _layout.tsx         # Root navigation layout
  ├── index.tsx           # Entry point (redirects to login/events)
  ├── login.tsx           # Face ID authentication screen
  ├── events.tsx          # Event listing screen
  ├── buy-ticket.tsx      # Ticket purchase screen
  ├── my-ticket.tsx       # Ticket details screen
  └── entry.tsx           # Entry verification screen

/lib
  ├── lazorkit.ts         # LazorKit integration (passkeys, wallets, sessions)
  ├── solana.ts           # Solana helpers (PDAs, USDC, tickets)
  └── paymaster.ts        # Paymaster integration (gasless transactions)

/tutorials
  ├── 01-mobile-passkey-login.md      # How Face ID creates passkeys
  ├── 02-gasless-ticket-purchase.md   # How gasless USDC purchases work
  └── 03-faceid-event-entry.md        # How Face ID proves entry
```

## How It Works

### 1. Face ID Creates a Passkey

When users sign in with Face ID:
- Device authenticates with biometrics
- LazorKit creates a WebAuthn passkey credential
- A smart wallet (PDA) is derived from the passkey
- No seed phrase needed - wallet is controlled by passkey

See [Mobile Passkey Login](./tutorials/01-mobile-passkey-login.md) for details.

### 2. Passkey Controls a Smart Wallet

The smart wallet is a Program Derived Address (PDA) on Solana:
- Wallet address is derived from passkey credential ID
- Only the passkey can authorize transactions
- Private key never leaves device secure storage
- Wallet is non-custodial but user-friendly

### 3. Gasless USDC Ticket Purchase

When users buy a ticket:
- USDC transfers from user to organizer (user pays ticket price)
- Ticket PDA is created on-chain (stored as account data)
- Paymaster sponsors transaction fees (user pays $0 in gas)
- Transaction is signed with passkey (Face ID required)

See [Gasless Ticket Purchase](./tutorials/02-gasless-ticket-purchase.md) for details.

### 4. Face ID Proves Event Entry

When users enter an event:
- Face ID authenticates user identity
- Passkey signs a verification challenge
- On-chain ticket ownership is verified
- Ticket is marked as used (one-time use enforced)
- Entry granted or denied based on verification

See [Face ID Event Entry](./tutorials/03-faceid-event-entry.md) for details.

## Running the App Locally

### Prerequisites

- Node.js 18+ installed
- iOS Simulator (for iOS) or Android Emulator (for Android)
- Expo CLI installed globally: `npm install -g expo-cli`
- npm registry access (packages will be installed from npm)

### Installation

1. **Clone and install dependencies:**

```bash
cd lazerkit
npm install
```

2. **Start the Expo development server:**

```bash
npm start
# or
expo start
```

3. **Run on device/simulator:**

- **iOS**: Press `i` in terminal or scan QR code with Camera app
- **Android**: Press `a` in terminal or scan QR code with Expo Go app

### iOS Simulator Setup

1. Open Xcode Simulator
2. Run `expo start --ios`
3. Face ID can be simulated: Features → Face ID → Enrolled

### Android Emulator Setup

1. Open Android Studio Emulator
2. Run `expo start --android`
3. Fingerprint can be simulated via Settings → Security

## App Flow

### 1. Login Screen

- User taps "Sign in with Face ID"
- Face ID authenticates user
- Passkey and smart wallet are created/restored
- Navigates to Events screen

### 2. Events Screen

- Displays mock event (Summer Music Festival 2024)
- Shows event details: date, time, location, price (50 USDC)
- "Buy Ticket" button (or "View Ticket" if owned)
- Navigates to Buy Ticket or My Ticket screen

### 3. Buy Ticket Screen

- Shows ticket details and total price
- Displays "Gasless Transaction" info (0 fees)
- User taps "Confirm with Face ID"
- Face ID authentication required
- Executes gasless USDC transfer and ticket creation
- Navigates to My Ticket screen on success

### 4. My Ticket Screen

- Displays ticket details and status (Valid/Used)
- Shows event information
- "Enter Event" button (if ticket is valid)
- Navigates to Entry Verification screen

### 5. Entry Verification Screen

- User taps "Verify Entry with Face ID"
- Face ID authentication required
- Passkey signs verification challenge
- On-chain ticket ownership verified
- Ticket marked as used on-chain
- Shows "Entry Granted" or "Entry Denied"

## On-Chain Data Model

### Ticket PDA

Each ticket is stored as a Program Derived Address (PDA):

```
Ticket PDA Structure:
  seeds: ['ticket', ownerWallet, eventId]
  data:
    - used: boolean (u8)
    - event_id: string
    - owner_wallet: PublicKey (32 bytes)
```

**Properties**:
- **Non-transferable**: PDA ownership cannot be transferred
- **One per user**: Each user can have one ticket per event
- **One-time use**: `used` flag prevents reuse
- **On-chain**: Fully verifiable on Solana blockchain

## Important Notes

### Demo Limitations

This is a **demo app** for educational purposes:

- Uses Solana Devnet (not mainnet)
- Mock event data (hardcoded)
- Uses real LazorKit SDK with portal-based authentication
- Gasless transactions handled by LazorKit Paymaster
- No backend server required (all on-chain)

### Production Considerations

For production use:

- Replace mock event data with dynamic event system
- Implement real Solana program for ticket management
- Use mainnet or appropriate network
- Add proper error handling and retries
- Implement transaction confirmation waiting
- Add loading states and user feedback
- Handle network errors gracefully
- Consider adding server-side challenge generation for entry verification

## Understanding the Code

### LazorKit Integration (`lib/lazorkit.ts`)

Handles:
- Biometric authentication checks
- Passkey creation and restoration
- Smart wallet derivation
- Session management
- Transaction signing with passkey

**Note**: In production, this would use the real LazorKit React Native SDK. The demo simulates these flows.

### Solana Helpers (`lib/solana.ts`)

Handles:
- Ticket PDA derivation
- USDC transfer instructions
- Ticket creation instructions
- Ticket data fetching
- On-chain verification

**Note**: Uses Solana Devnet. Replace RPC URL for mainnet.

### Paymaster Integration (`lib/paymaster.ts`)

Handles:
- Transaction sponsorship
- Gas fee estimation (always 0 for user)
- Sponsor address management

**Note**: In production, this would call LazorKit Paymaster API.

## Troubleshooting

### Face ID Not Working

- **iOS Simulator**: Enable Face ID in Features menu
- **Android Emulator**: Configure fingerprint in Settings
- **Device**: Ensure Face ID/Touch ID is enrolled

### Transaction Failures

- Check Solana Devnet connection
- Verify wallet has USDC (use devnet faucet)
- Check transaction signatures
- Review error messages in console

### Navigation Issues

- Ensure Expo Router is configured correctly
- Check route names match file names
- Clear cache: `expo start --clear`

## Additional Resources

- [LazorKit Documentation](https://docs.lazorkit.com) - Official LazorKit docs
- [Solana Cookbook](https://solanacookbook.com) - Solana development guide
- [Expo Documentation](https://docs.expo.dev) - Expo and React Native guides
- [WebAuthn Guide](https://webauthn.guide) - Understanding WebAuthn/passkeys

## License

This demo app is for educational purposes as part of the LazorKit bounty program.

## Support

For issues or questions:
1. Check the [tutorials](./tutorials/) for detailed explanations
2. Review code comments for implementation details
3. Refer to LazorKit and Solana documentation

---

**Built for LazorKit Bounty Program** | Demonstrating walletless, biometric-first experiences on Solana

