# Gasless Ticket Purchase

## Overview

This tutorial explains how gasless USDC ticket purchase works in the LazorKit Ticket Demo app. Users can buy event tickets without paying transaction fees, thanks to Paymaster sponsorship.

## How Gasless Transactions Work

### Traditional Blockchain Transactions

In traditional blockchain transactions:
- User pays network fees (gas) to execute transactions
- Fees are deducted from user's balance
- Each transaction costs money

### Paymaster Sponsorship

With LazorKit Paymaster:
- A sponsor (Paymaster service) pays transaction fees
- User pays $0 in fees
- Sponsor covers gas costs on behalf of users

## Ticket Purchase Flow

### Step 1: User Initiates Purchase

When a user taps "Buy Ticket" on the Events screen, they're taken to the Buy Ticket screen showing:
- Event details
- Ticket price in USDC
- Transaction fee: **0 USDC (Gasless)**

### Step 2: Face ID Confirmation

User confirms purchase with Face ID:

```typescript
const authenticated = await authenticateWithBiometric(
  'Confirm ticket purchase with Face ID'
);
```

This ensures the transaction is authorized by the wallet owner.

### Step 3: Create Transaction Instructions

The app creates two main instructions:

#### A. USDC Transfer Instruction

Transfers USDC from user's wallet to event organizer:

```typescript
const transferInstructions = await createUSDCTransferInstruction(
  userWallet,      // From: user's wallet
  organizerWallet, // To: event organizer
  ticketPrice      // Amount: 50 USDC
);
```

This instruction:
- Transfers USDC tokens via SPL Token program
- Creates recipient's token account if needed
- Deducts USDC from user's balance

#### B. Ticket Creation Instruction

Creates a Ticket PDA (Program Derived Address) on-chain:

```typescript
const ticketInstructions = await createTicketInstruction(
  userWallet,  // Ticket owner
  eventId,     // Event identifier
  userWallet   // Transaction payer
);
```

The Ticket PDA stores:
- `event_id`: Event identifier (string)
- `owner_wallet`: Ticket owner's wallet address (PublicKey)
- `used`: Whether ticket has been used (boolean)

### Step 4: Build Transaction

All instructions are combined into a single Solana transaction:

```typescript
const transaction = new Transaction();
transaction.add(...transferInstructions);  // USDC transfer
transaction.add(...ticketInstructions);    // Ticket creation
transaction.recentBlockhash = blockhash;   // Recent blockhash
transaction.feePayer = userWallet;         // Original payer (will change)
```

### Step 5: Paymaster Sponsorship

The transaction is sent to LazorKit Paymaster service:

```typescript
const sponsored = await sponsorTransaction({
  transaction: transaction,
  userWallet: userWallet,
  description: 'Ticket purchase'
});
```

**What Paymaster Does**:
1. Receives transaction from user
2. Adds itself as fee payer
3. Signs transaction with sponsor's key
4. Returns sponsored transaction
5. Pays gas fees when transaction is executed

**User Pays**: Only ticket price (50 USDC)
**Sponsor Pays**: Transaction fees (e.g., 0.000005 SOL)

### Step 6: Sign with Passkey

User signs the sponsored transaction using their passkey:

```typescript
// LazorKit SDK handles this internally
// Uses WebAuthn to sign with passkey private key
const signature = await signWithPasskey(transaction.serializeMessage());
```

**Important**: User signs the transaction (authorizes it), but Paymaster pays the fees.

### Step 7: Submit Transaction

Sponsored and signed transaction is submitted to Solana:

```typescript
const signature = await connection.sendRawTransaction(
  sponsoredTransaction.serialize()
);
await connection.confirmTransaction(signature);
```

### Step 8: Confirmation

Transaction is confirmed on-chain:
- ✅ USDC transferred to organizer
- ✅ Ticket PDA created
- ✅ Ticket marked as valid
- ✅ User balance updated

## Transaction Structure

### Original Transaction (Before Sponsorship)

```
Transaction:
  Instructions:
    1. USDC Transfer (user → organizer)
    2. Create Ticket PDA
  Fee Payer: userWallet
  Fees: ~0.000005 SOL (user pays)
```

### Sponsored Transaction (After Paymaster)

```
Transaction:
  Instructions:
    1. USDC Transfer (user → organizer)
    2. Create Ticket PDA
  Fee Payer: paymasterWallet  ← Changed!
  Fees: ~0.000005 SOL (sponsor pays)
  Signers:
    - user (authorizes USDC transfer)
    - paymaster (pays fees)
```

## Benefits of Gasless Transactions

1. **Better UX**: Users don't need SOL for gas
2. **Simplified Onboarding**: No need to buy native tokens
3. **Cost Effective**: Paymaster can batch/sponsor transactions efficiently
4. **User-Friendly**: Users only pay for products (tickets), not infrastructure

## Cost Breakdown

### Traditional Transaction

```
User Pays:
  - Ticket: 50 USDC
  - Gas: ~0.000005 SOL (~$0.01)
  Total: 50 USDC + fees
```

### Gasless Transaction (with Paymaster)

```
User Pays:
  - Ticket: 50 USDC
  - Gas: 0 USDC (sponsored)
  Total: 50 USDC only

Sponsor Pays:
  - Gas: ~0.000005 SOL
```

## Implementation Notes

In the demo app, Paymaster sponsorship is simplified. In production, LazorKit Paymaster service:

- Validates transaction intent
- Checks user eligibility (rate limits, policies)
- Adds sponsor signature
- Tracks sponsorship costs
- May batch multiple transactions

## Security Considerations

- User still signs transaction (authorizes USDC transfer)
- Paymaster only pays fees, cannot spend user's tokens
- Transaction is fully transparent on-chain
- Ticket ownership is cryptographically verifiable

## Ticket PDA Structure

The ticket is stored as a PDA with deterministic address:

```typescript
// PDA seeds: ['ticket', ownerWallet, eventId]
const [ticketPDA, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('ticket'),
    ownerWallet.toBuffer(),
    Buffer.from(eventId)
  ],
  ticketProgramId
);
```

**Properties**:
- **Non-transferable**: PDA ownership cannot be transferred
- **One per user**: Each user can have one ticket per event
- **Verifiable**: Ticket ownership can be verified on-chain
- **Immutable**: Once created, ticket data cannot be modified (except `used` flag)

## Next Steps

- Learn about [Face ID entry verification](./03-faceid-event-entry.md)
- Understand [mobile passkey login](./01-mobile-passkey-login.md)

