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
  getAccount,
} from '@solana/spl-token';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
// Using Helius RPC for better reliability (fallback to public RPC)
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const USDC_MINT_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // Devnet USDC
// Demo ticket program ID - using a valid Solana address format (System Program as placeholder)
// In production, this would be your deployed program ID
const TICKET_PROGRAM_ID = new PublicKey('11111111111111111111111111111111'); // Using System Program for demo

// Create connection with multiple commitment levels support
// Using public RPC - if you have access to Helius/QuickNode, use those for better indexing
export const connection = new Connection(SOLANA_RPC_URL, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  httpHeaders: {
    'Content-Type': 'application/json',
  },
});

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
 * 
 * Transfers USDC tokens from user's wallet to event organizer.
 * This function creates Solana SPL Token transfer instructions.
 * 
 * Note: LazorKit smart wallets are PDAs (off-curve addresses).
 * This function handles both on-curve and off-curve addresses gracefully.
 * 
 * @param fromWallet - User's wallet address (PublicKey)
 * @param toWallet - Recipient wallet address (PublicKey, must be on-curve)
 * @param amount - Amount in USDC (will be converted to smallest unit with 6 decimals)
 * @returns Promise<any[]> - Array of TransactionInstruction objects
 * 
 * @example
 * ```typescript
 * const instructions = await createUSDCTransferInstruction(
 *   userWallet,
 *   organizerWallet,
 *   50 // 50 USDC
 * );
 * ```
 */
export async function createUSDCTransferInstruction(
  fromWallet: PublicKey,
  toWallet: PublicKey,
  amount: number // Amount in USDC (with 6 decimals)
): Promise<any[]> {
  const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
  const instructions: any[] = [];

  try {
    // Validate wallets are on-curve for token accounts
    // LazorKit smart wallets are PDAs (off-curve), so we need to handle this differently
    const fromWalletOnCurve = PublicKey.isOnCurve(fromWallet.toBuffer());
    const toWalletOnCurve = PublicKey.isOnCurve(toWallet.toBuffer());

    let fromTokenAccount: PublicKey;
    let toTokenAccount: PublicKey;

    // Get associated token accounts
    // For off-curve addresses (PDAs), we'll try to get the token account
    // If it fails, we'll need to handle it differently
    try {
      fromTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        fromWallet
      );
    } catch (error: any) {
      if (error?.name === 'TokenOwnerOffCurveError' || 
          error?.message?.includes('TokenOwnerOffCurveError')) {
        throw new Error(
          'Smart wallet token accounts are not yet supported. ' +
          'Please use a standard wallet address for USDC transfers.'
        );
      }
      throw error;
    }

    try {
      toTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        toWallet
      );
    } catch (error: any) {
      if (error?.name === 'TokenOwnerOffCurveError' || 
          error?.message?.includes('TokenOwnerOffCurveError')) {
        throw new Error(
          'Recipient wallet address must be a valid on-curve address for token transfers.'
        );
      }
      throw error;
    }

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
  } catch (error: any) {
    console.error('Error creating USDC transfer instruction:', error);
    throw new Error(
      error.message || 
      'Failed to create transfer instruction. Please ensure wallet addresses are valid.'
    );
  }
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
  
  const instructions: any[] = [];

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
  
  const instructions: any[] = [];

  // In production, this would call a program instruction to mark ticket as used
  // For demo: update account data directly
  // Note: In production, this requires proper program authority
  
  // Simplified: would be a program instruction like:
  // markTicketUsed(ticketPDA, signer)
  
  return instructions;
}

/**
 * Get USDC balance for a wallet
 * Supports both on-curve wallets and PDAs (like LazorKit smart wallets)
 * Uses getParsedTokenAccountsByOwner for PDAs to avoid TokenOwnerOffCurveError
 */
export async function getUSDCBalance(wallet: PublicKey): Promise<number> {
  try {
    const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
    const usdcMintString = usdcMint.toBase58();
    
    // Check if wallet is a PDA (off-curve)
    const isPDA = !PublicKey.isOnCurve(wallet.toBuffer());
    
    if (isPDA) {
      // For PDAs, manually derive the Associated Token Account (ATA) address
      // ATA is derived using: findProgramAddress([owner, TOKEN_PROGRAM_ID, mint], ASSOCIATED_TOKEN_PROGRAM_ID)
      // Note: RPC indexing can be delayed, so we try multiple methods and commitment levels
      try {
        console.log('=== Getting USDC balance for PDA wallet ===');
        console.log('Wallet:', wallet.toBase58());
        console.log('USDC Mint:', usdcMintString);
        
        // Method 1: Try to derive ATA address manually using findProgramAddress
        // Seeds for ATA: [owner, TOKEN_PROGRAM_ID, mint]
        const [ataAddress] = PublicKey.findProgramAddressSync(
          [
            wallet.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            usdcMint.toBuffer(),
          ],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        
        console.log('Derived ATA address:', ataAddress.toBase58());
        
        // Try to get the account info directly with multiple commitment levels and retries
        // Note: Public RPC may have indexing delays - Solscan uses faster indexed RPCs
        let accountFound = false;
        const commitments: Array<'confirmed' | 'finalized'> = ['finalized', 'confirmed'];
        
        for (const commitment of commitments) {
          for (let retry = 0; retry < 2; retry++) {
            try {
              const accountInfo = await connection.getAccountInfo(ataAddress, commitment);
              if (accountInfo && accountInfo.data && accountInfo.data.length > 0) {
                // Parse the token account data
                // Use SPL Token library to parse it properly
                try {
                  const account = await getAccount(connection, ataAddress, commitment);
                  const balance = Number(account.amount) / 1_000_000; // USDC has 6 decimals
                  console.log(`✅ USDC balance found (PDA - direct query, ${commitment}):`, balance, 'USDC');
                  accountFound = true;
                  return balance;
                } catch (parseError: any) {
                  console.warn(`Error parsing token account data (${commitment}, retry ${retry}):`, parseError?.message);
                  if (retry < 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                    continue;
                  }
                }
              } else {
                console.log(`ATA account not found with ${commitment} commitment (retry ${retry})`);
              }
            } catch (accountError: any) {
              console.warn(`Error getting ATA account info (${commitment}, retry ${retry}):`, accountError?.message);
              if (retry < 1) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                continue;
              }
            }
            break; // Exit retry loop if we got a result (even if null)
          }
        }
        
        if (!accountFound) {
          console.log('⚠️ ATA account not found at derived address:', ataAddress.toBase58());
          console.log('💡 Note: If Solscan shows balance but RPC returns 0, this is likely an RPC indexing delay.');
          console.log('💡 Consider using a faster RPC endpoint (Helius, QuickNode) for better indexing.');
        }
        
        // Method 2: Fallback - Query all token accounts by owner with multiple commitment levels
        console.log('Fallback: Querying all token accounts for PDA wallet');
        let tokenAccounts: any[] = [];
        
        // Try with different commitment levels
        for (const commitment of ['confirmed', 'finalized'] as const) {
          try {
            const response = await connection.getParsedTokenAccountsByOwner(
              wallet,
              {
                programId: TOKEN_PROGRAM_ID,
              },
              commitment
            );
            
            if (response.value && response.value.length > 0) {
              tokenAccounts = response.value;
              console.log(`Found ${tokenAccounts.length} token account(s) with ${commitment} commitment`);
              break;
            }
          } catch (err: any) {
            console.warn(`Error querying with ${commitment} commitment:`, err?.message);
          }
        }
        
        // Also try with mint filter
        if (tokenAccounts.length === 0) {
          try {
            const response = await connection.getParsedTokenAccountsByOwner(
              wallet,
              {
                mint: usdcMint,
              },
              'finalized'
            );
            if (response.value && response.value.length > 0) {
              tokenAccounts = response.value;
              console.log(`Found ${tokenAccounts.length} token account(s) with mint filter`);
            }
          } catch (err: any) {
            console.warn('Error querying with mint filter:', err?.message);
          }
        }
        
        // tokenAccounts is already set above, no need to redeclare
        
        if (tokenAccounts && tokenAccounts.length > 0) {
          // Log all token accounts for debugging
          tokenAccounts.forEach((account: any, index: number) => {
            const parsedInfo = account.account?.data?.parsed?.info;
            if (parsedInfo) {
              console.log(`Token account ${index}:`, {
                pubkey: account.pubkey.toBase58(),
                mint: parsedInfo.mint,
                owner: parsedInfo.owner,
                amount: parsedInfo.tokenAmount?.amount,
                decimals: parsedInfo.tokenAmount?.decimals,
              });
            }
          });
          
          // Find the USDC token account by matching mint address
          const usdcAccount = tokenAccounts.find(
            (account: { pubkey: PublicKey; account: any }) => {
              const parsedInfo = account.account?.data?.parsed?.info;
              const mint = parsedInfo?.mint;
              const matches = mint === usdcMintString;
              if (matches) {
                console.log('Found USDC account:', account.pubkey.toBase58());
              }
              return matches;
            }
          );
          
          if (usdcAccount) {
            const parsedInfo = usdcAccount.account?.data?.parsed?.info;
            if (parsedInfo?.tokenAmount) {
              // Convert from smallest unit (6 decimals for USDC) to USDC
              const amount = parsedInfo.tokenAmount.amount;
              const decimals = parsedInfo.tokenAmount.decimals || 6;
              const balance = Number(amount) / Math.pow(10, decimals);
              console.log('USDC balance found (PDA - parsed accounts):', balance, 'USDC');
              return balance;
            }
          }
        }
        
        console.log('No USDC token account found for PDA wallet', wallet.toBase58());
        return 0;
      } catch (pdaError: any) {
        console.error('Error querying token accounts for PDA:', pdaError?.message || pdaError);
        console.error('Full error:', JSON.stringify(pdaError, null, 2));
        return 0;
      }
    } else {
      // For on-curve wallets, use the standard method
      let tokenAccount: PublicKey;
      try {
        tokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          wallet
        );
      } catch (error: any) {
        if (error?.name === 'TokenOwnerOffCurveError' || 
            error?.message?.includes('TokenOwnerOffCurveError')) {
          console.warn('TokenOwnerOffCurveError: Cannot derive token account');
          return 0;
        }
        throw error;
      }

      try {
        // Use SPL Token library to get account info
        const account = await getAccount(connection, tokenAccount);
        // Convert from smallest unit (6 decimals for USDC) to USDC
        const balance = Number(account.amount) / 1_000_000;
        console.log('USDC balance found:', balance, 'for wallet', wallet.toBase58());
        return balance;
      } catch (accountError: any) {
        // Account doesn't exist yet or other errors
        if (accountError?.message?.includes('InvalidAccountData') || 
            accountError?.message?.includes('could not find account') ||
            accountError?.message?.includes('TokenAccountNotFoundError') ||
            accountError?.name === 'TokenAccountNotFoundError') {
          // Token account doesn't exist yet - this is normal for new wallets
          console.log('USDC token account does not exist yet for wallet', wallet.toBase58());
          return 0;
        }
        // Log but don't throw - return 0 for any other errors
        console.warn('Error getting USDC account:', accountError?.message || accountError);
        return 0;
      }
    }
  } catch (error: any) {
    // Handle any other errors gracefully
    console.warn('Error getting USDC balance:', error?.message || error);
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
