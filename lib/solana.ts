/**
 * Solana Helpers
 * Handles PDA creation, USDC transfers, and ticket operations
 */

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const USDC_MINT_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // Devnet USDC
// Demo ticket program ID - using a valid Solana address format (System Program as placeholder)
// In production, this would be your deployed program ID
const TICKET_PROGRAM_ID = new PublicKey('11111111111111111111111111111111'); // Using System Program for demo

export const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Demo ticket storage key prefix (for AsyncStorage)
const TICKET_STORAGE_PREFIX = 'demo_ticket_';

// Types
export interface TicketData {
  eventId: string;
  ownerWallet: PublicKey;
  used: boolean;
}

/**
 * Derive Ticket PDA address for a user and event
 * Each user can have one ticket per event
 */
export function deriveTicketPDA(
  ownerWallet: PublicKey,
  eventId: string
): [PublicKey, number] {
  const eventIdBuffer = Buffer.from(eventId, 'utf-8');
  const ownerBuffer = ownerWallet.toBuffer();
  
  const seeds = [
    Buffer.from('ticket'),
    ownerBuffer,
    eventIdBuffer,
  ];

  // In production, use actual program ID
  // For demo: derive deterministic address
  return PublicKey.findProgramAddressSync(seeds, TICKET_PROGRAM_ID);
}

/**
 * Get ticket PDA address for user and event
 */
export function getTicketPDA(
  ownerWallet: PublicKey,
  eventId: string
): PublicKey {
  const [pda] = deriveTicketPDA(ownerWallet, eventId);
  return pda;
}

/**
 * Check if ticket exists on-chain or in demo storage
 */
export async function ticketExists(
  ownerWallet: PublicKey,
  eventId: string
): Promise<boolean> {
  try {
    // Check demo storage first
    const storageKey = `${TICKET_STORAGE_PREFIX}${ownerWallet.toBase58()}_${eventId}`;
    const storedTicket = await AsyncStorage.getItem(storageKey);
    
    if (storedTicket) {
      return true;
    }

    // Check on-chain
    const ticketPDA = getTicketPDA(ownerWallet, eventId);
    const accountInfo = await connection.getAccountInfo(ticketPDA);
    return accountInfo !== null;
  } catch (error) {
    console.error('Error checking ticket existence:', error);
    return false;
  }
}

/**
 * Get ticket data from on-chain account or demo storage
 * For demo: Uses AsyncStorage since tickets aren't actually deployed on-chain
 */
export async function getTicketData(
  ownerWallet: PublicKey,
  eventId: string
): Promise<TicketData | null> {
  try {
    // For demo: Check AsyncStorage first (since we don't have deployed ticket program)
    const storageKey = `${TICKET_STORAGE_PREFIX}${ownerWallet.toBase58()}_${eventId}`;
    const storedTicket = await AsyncStorage.getItem(storageKey);
    
    if (storedTicket) {
      // Return ticket from demo storage
      const ticket = JSON.parse(storedTicket);
      return {
        eventId: ticket.eventId,
        ownerWallet: new PublicKey(ticket.ownerWallet),
        used: ticket.used || false,
      };
    }

    // Try to get from on-chain (in case ticket exists)
    const ticketPDA = getTicketPDA(ownerWallet, eventId);
    const accountInfo = await connection.getAccountInfo(ticketPDA);
    
    // Check if account exists and has valid data
    if (!accountInfo) {
      // No ticket found on-chain or in storage
      return null;
    }

    // Validate account data exists
    if (!accountInfo.data || !Buffer.isBuffer(accountInfo.data) || accountInfo.data.length === 0) {
      return null;
    }

    // Try to parse on-chain data (if it exists in the future)
    // For demo: Since we don't have actual ticket program, skip parsing
    // In production, this would deserialize actual account data
    try {
      const data = accountInfo.data;
      
      // Validate data exists and has minimum length
      if (!data || data.length < 34) { // Minimum: 1 (used) + 1 (length) + 32 (owner)
        return null;
      }

      // Basic parsing (simplified for demo)
      // In production, use proper Borsh deserialization
      const used = data[0] === 1;
      const eventIdLength = data.length > 1 ? Number(data[1]) : 0;
      
      // Validate we have enough data
      const minLength = 2 + (eventIdLength || 0) + 32;
      if (data.length < minLength || eventIdLength < 0 || eventIdLength > 100) {
        return null;
      }

      // Extract event ID bytes
      const eventIdStart = 2;
      const eventIdEnd = eventIdStart + eventIdLength;
      if (eventIdEnd > data.length) {
        return null;
      }
      
      const eventIdBytes = data.slice(eventIdStart, eventIdEnd);
      if (!eventIdBytes || eventIdBytes.length === 0) {
        return null;
      }

      const parsedEventId = Buffer.from(eventIdBytes).toString('utf-8') || eventId;
      
      // Extract owner bytes (must be exactly 32 bytes)
      const ownerStart = eventIdEnd;
      const ownerEnd = ownerStart + 32;
      
      if (ownerEnd > data.length) {
        return null;
      }

      const ownerBytes = data.slice(ownerStart, ownerEnd);
      
      // Validate owner bytes
      if (!ownerBytes || !Buffer.isBuffer(ownerBytes) || ownerBytes.length !== 32) {
        return null;
      }

      // Create PublicKey from owner bytes
      const parsedOwnerWallet = new PublicKey(ownerBytes);

      return {
        eventId: parsedEventId,
        ownerWallet: parsedOwnerWallet,
        used,
      };
    } catch (parseError: any) {
      // If parsing fails, return null (account might not be a ticket)
      console.error('Error parsing on-chain ticket data:', parseError?.message || parseError);
      return null;
    }
  } catch (error) {
    console.error('Error getting ticket data:', error);
    return null;
  }
}

/**
 * Store ticket data in demo storage (for testing)
 * In production, this would be handled by on-chain transaction
 */
export async function storeTicketData(
  ownerWallet: PublicKey,
  eventId: string,
  used: boolean = false
): Promise<void> {
  try {
    const storageKey = `${TICKET_STORAGE_PREFIX}${ownerWallet.toBase58()}_${eventId}`;
    const ticketData = {
      eventId,
      ownerWallet: ownerWallet.toBase58(),
      used,
    };
    await AsyncStorage.setItem(storageKey, JSON.stringify(ticketData));
  } catch (error) {
    console.error('Error storing ticket data:', error);
  }
}

/**
 * Update ticket used status in demo storage
 */
export async function updateTicketUsed(
  ownerWallet: PublicKey,
  eventId: string,
  used: boolean = true
): Promise<void> {
  try {
    const storageKey = `${TICKET_STORAGE_PREFIX}${ownerWallet.toBase58()}_${eventId}`;
    const existingTicket = await AsyncStorage.getItem(storageKey);
    
    if (existingTicket) {
      const ticket = JSON.parse(existingTicket);
      ticket.used = used;
      await AsyncStorage.setItem(storageKey, JSON.stringify(ticket));
    } else {
      // Create new ticket entry
      await storeTicketData(ownerWallet, eventId, used);
    }
  } catch (error) {
    console.error('Error updating ticket used status:', error);
  }
}

/**
 * Create USDC transfer instruction
 * Transfers USDC from user's wallet to event organizer
 */
export async function createUSDCTransferInstruction(
  fromWallet: PublicKey,
  toWallet: PublicKey,
  amount: number // Amount in USDC (with 6 decimals)
): Promise<any[]> {
  const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
  
  // Get associated token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    fromWallet
  );
  
  const toTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    toWallet
  );

  const instructions = [];

  // Check if recipient token account exists, create if not
  const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
  if (!toAccountInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        fromWallet, // payer
        toTokenAccount, // associatedToken
        toWallet, // owner
        usdcMint // mint
      )
    );
  }

  // Create transfer instruction
  // Amount in smallest unit (6 decimals for USDC)
  const transferAmount = amount * 1_000_000;
  
  instructions.push(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromWallet,
      transferAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  return instructions;
}

/**
 * Create ticket on-chain
 * Creates a PDA account representing the ticket
 */
export async function createTicketInstruction(
  ownerWallet: PublicKey,
  eventId: string,
  payer: PublicKey
): Promise<any[]> {
  const [ticketPDA, bump] = deriveTicketPDA(ownerWallet, eventId);
  
  const instructions = [];

  // In production, this would create an instruction to initialize the ticket PDA
  // For demo: create a simple account with ticket data
  const eventIdBuffer = Buffer.from(eventId, 'utf-8');
  const ticketData = Buffer.alloc(1 + 1 + eventIdBuffer.length + 32);
  ticketData.writeUInt8(0, 0); // used = false
  ticketData.writeUInt8(eventIdBuffer.length, 1); // event_id length
  eventIdBuffer.copy(ticketData, 2); // event_id
  ownerWallet.toBuffer().copy(ticketData, 2 + eventIdBuffer.length); // owner

  // Create account instruction (simplified for demo)
  // In production, this would be a program instruction
  const space = ticketData.length;
  const rentExemptAmount = await connection.getMinimumBalanceForRentExemption(space);

  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: ticketPDA,
      lamports: rentExemptAmount,
      space,
      programId: TICKET_PROGRAM_ID,
    })
  );

  return instructions;
}

/**
 * Mark ticket as used on-chain
 */
export async function markTicketUsedInstruction(
  ownerWallet: PublicKey,
  eventId: string,
  signer: PublicKey
): Promise<any[]> {
  const ticketPDA = getTicketPDA(ownerWallet, eventId);
  
  const instructions = [];

  // In production, this would call a program instruction to mark ticket as used
  // For demo: update account data directly
  // Note: In production, this requires proper program authority
  
  // Simplified: would be a program instruction like:
  // markTicketUsed(ticketPDA, signer)
  
  return instructions;
}

/**
 * Get USDC balance for a wallet
 */
export async function getUSDCBalance(wallet: PublicKey): Promise<number> {
  try {
    const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
    const tokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      wallet
    );

    const accountInfo = await connection.getAccountInfo(tokenAccount);
    if (!accountInfo) return 0;

    // Parse token account balance (6 decimals for USDC)
    // In production, use proper SPL token account parsing
    const balance = 0; // Placeholder - would parse from account data
    return balance / 1_000_000; // Convert to USDC
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return 0;
  }
}

/**
 * Airdrop SOL for testing (devnet only)
 */
export async function airdropSOL(wallet: PublicKey, amount: number = 1): Promise<string> {
  try {
    const signature = await connection.requestAirdrop(
      wallet,
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    return signature;
  } catch (error) {
    console.error('Error airdropping SOL:', error);
    throw error;
  }
}
