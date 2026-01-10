`# Quick Start Guide

## Installation

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## First Run

1. **Start the app** - It will redirect to login screen if no wallet exists
2. **Sign in with Face ID** - Creates passkey and smart wallet
3. **View Events** - See mock event (Summer Music Festival 2024)
4. **Buy Ticket** - Purchase ticket with Face ID (50 USDC, gasless)
5. **View Ticket** - Check ticket status and details
6. **Enter Event** - Verify entry with Face ID, mark ticket as used

## Key Files

- `/app/login.tsx` - Face ID authentication
- `/app/events.tsx` - Event listing and purchase
- `/app/buy-ticket.tsx` - Gasless USDC ticket purchase
- `/app/my-ticket.tsx` - Ticket details and status
- `/app/entry.tsx` - Face ID entry verification

## Configuration

### Solana Devnet

The app uses Solana Devnet by default. To change:

```typescript
// lib/solana.ts
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
```

### USDC Mint Address

Update the USDC mint address for devnet/mainnet:

```typescript
// lib/solana.ts
const USDC_MINT_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // Devnet
```

## Troubleshooting

### Face ID Not Working
- **iOS**: Features → Face ID → Enrolled in Simulator
- **Android**: Settings → Security → Fingerprint in Emulator

### Transaction Errors
- Check Solana Devnet connection
- Verify wallet has USDC (use devnet faucet)
- Check console for detailed errors

### Navigation Issues
```bash
# Clear cache and restart
expo start --clear
```

## Demo Limitations

This is a demo app with simplified implementations:
- Simulates LazorKit SDK (integrate real SDK for production)
- Simulates Paymaster (connect to real service for production)
- Uses mock event data (hardcoded)
- Devnet only (not mainnet)

## Next Steps

1. Integrate real LazorKit React Native SDK
2. Connect to LazorKit Paymaster service
3. Implement real Solana program for tickets
4. Add backend server for challenge generation
5. Deploy to TestFlight/Play Store for testing

## Learn More

- [Mobile Passkey Login](./tutorials/01-mobile-passkey-login.md)
- [Gasless Ticket Purchase](./tutorials/02-gasless-ticket-purchase.md)
- [Face ID Event Entry](./tutorials/03-faceid-event-entry.md)

