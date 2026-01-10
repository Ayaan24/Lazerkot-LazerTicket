# Face ID Event Entry

## Overview

This tutorial explains how Face ID proves event entry in the LazorKit Ticket Demo app. Users verify their identity and prove ticket ownership using biometric authentication, then mark their ticket as used on-chain.

## Entry Verification Flow

### Step 1: User Initiates Entry

From the "My Ticket" screen, user taps "Enter Event" button. This navigates to the Entry Verification screen.

### Step 2: Face ID Authentication

User taps "Verify Entry with Face ID":

```typescript
const authenticated = await authenticateWithBiometric(
  'Verify entry with Face ID'
);
```

The device's Face ID prompt appears, requiring the user to authenticate. This ensures only the ticket owner can attempt entry.

### Step 3: Generate Verification Challenge

The app generates a unique challenge for this verification attempt:

```typescript
const challenge = `entry_verification_${eventId}_${timestamp}`;
```

This challenge:
- Includes event ID to prevent replay across events
- Includes timestamp to prevent replay attacks
- Is unique to this verification attempt

### Step 4: Sign Challenge with Passkey

The challenge is signed using the user's passkey:

```typescript
const signature = await signWithPasskey(challenge);
```

**How it works**:
1. WebAuthn `navigator.credentials.get()` is called
2. User re-authenticates with Face ID (if required by policy)
3. Device signs challenge with passkey's private key
4. Signature is returned (private key never leaves device)

This proves:
- ✅ User is the passkey owner (Face ID confirmed)
- ✅ User controls the smart wallet (passkey controls wallet)
- ✅ User authorizes this entry attempt (signature)

### Step 5: Verify Ticket Ownership On-Chain

The app verifies ticket ownership by checking on-chain data:

```typescript
const ticketPDA = getTicketPDA(userWallet, eventId);
const ticketData = await getTicketData(userWallet, eventId);

// Verify ticket exists
if (!ticketData) {
  throw new Error('Ticket not found');
}

// Verify ticket is not already used
if (ticketData.used) {
  throw new Error('Ticket already used');
}

// Verify ticket owner matches wallet
if (!ticketData.ownerWallet.equals(userWallet)) {
  throw new Error('Ticket ownership mismatch');
}
```

**On-Chain Verification**:
- Ticket PDA exists (ticket was created)
- Ticket `used` flag is `false` (not yet used)
- Ticket `owner_wallet` matches user's wallet address

### Step 6: Mark Ticket as Used

If all checks pass, create instruction to mark ticket as used:

```typescript
const markUsedInstructions = await markTicketUsedInstruction(
  userWallet,
  eventId,
  userWallet  // Signer
);
```

This instruction updates the ticket PDA's `used` field from `false` to `true`.

### Step 7: Build and Sponsor Transaction

Transaction is built and sponsored by Paymaster:

```typescript
const transaction = new Transaction();
transaction.add(...markUsedInstructions);

const sponsored = await sponsorTransaction({
  transaction: transaction,
  userWallet: userWallet,
  description: 'Ticket entry verification'
});
```

**Gasless Entry**: User pays $0 in fees (sponsored by Paymaster).

### Step 8: Sign and Submit

Transaction is signed with passkey and submitted:

```typescript
// LazorKit SDK signs with passkey
const signature = await signWithPasskey(transaction.serializeMessage());

// Submit to Solana
await connection.sendRawTransaction(sponsoredTransaction.serialize());
await connection.confirmTransaction(signature);
```

### Step 9: Entry Granted

On successful transaction confirmation:

- ✅ Ticket marked as used on-chain
- ✅ Entry verification complete
- ✅ User can proceed to event

## Security Model

### Multi-Layer Verification

1. **Biometric Authentication**: Face ID confirms user identity
2. **Passkey Signing**: Cryptographic proof of wallet control
3. **On-Chain Verification**: Ticket ownership verified on blockchain
4. **One-Time Use**: Ticket can only be used once (`used` flag)

### Replay Attack Prevention

- **Unique Challenges**: Each verification uses a unique challenge
- **Timestamp Inclusion**: Challenges include timestamp
- **On-Chain State**: Ticket `used` flag prevents reuse
- **Event Binding**: Challenge includes event ID

### Ticket Reuse Prevention

Once a ticket is marked as `used = true`:

- Cannot be used again (on-chain check)
- Verification fails at Step 5 if already used
- State is immutable (cannot be reset)

## Entry Verification States

### Valid Ticket

```
Ticket PDA:
  event_id: "summer-festival-2024"
  owner_wallet: <user_wallet_address>
  used: false  ← Can be used

Result: Entry Granted
```

### Already Used Ticket

```
Ticket PDA:
  event_id: "summer-festival-2024"
  owner_wallet: <user_wallet_address>
  used: true  ← Already used

Result: Entry Denied
```

### Invalid Ticket

```
Ticket PDA: Not found

Result: Entry Denied
```

## User Experience Flow

### Successful Entry

1. User taps "Enter Event"
2. Face ID prompt appears
3. User authenticates with Face ID
4. Processing... (verifying ticket, signing transaction)
5. ✅ "Entry Granted!" message
6. Ticket marked as used
7. User can enter event

### Failed Entry (Already Used)

1. User taps "Enter Event"
2. Face ID prompt appears
3. User authenticates
4. Processing...
5. ✗ "Entry Denied - Ticket already used"
6. User cannot enter (ticket invalid)

### Failed Entry (No Ticket)

1. User tries to access entry screen
2. App checks for ticket on-chain
3. Ticket not found
4. Redirect to Events screen

## On-Chain Ticket State Machine

```
┌─────────┐
│ Created │  (used: false)
└────┬────┘
     │
     │ Entry verification succeeds
     ▼
┌─────────┐
│  Used   │  (used: true)
└─────────┘
     │
     │ Cannot transition back
     │ (immutable state)
     ▼
   (Final)
```

## Implementation Notes

In the demo app, entry verification is simplified. In production:

- Challenge would be generated by event server
- Server verifies signature before allowing entry
- On-chain verification happens in parallel
- Event staff can verify tickets on-site using QR codes (optional)

## Benefits of This Approach

1. **No QR Codes**: Biometric authentication replaces physical tickets
2. **Non-Transferable**: Ticket ownership cannot be transferred
3. **One-Time Use**: Each ticket can only be used once
4. **On-Chain Proof**: Entry verification is verifiable on blockchain
5. **Gasless**: User doesn't pay fees for entry verification
6. **Secure**: Multi-layer verification prevents fraud

## Privacy Considerations

- **No Personal Data**: Only wallet address stored on-chain
- **Biometric Data**: Never stored, only used for authentication
- **Passkey**: Stored securely on device, not transmitted
- **Verification**: Can be done without revealing identity

## Next Steps

- Learn about [mobile passkey login](./01-mobile-passkey-login.md)
- Understand [gasless ticket purchase](./02-gasless-ticket-purchase.md)

