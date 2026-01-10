/**
 * Buy Ticket Screen
 * Confirms ticket purchase with Face ID and executes gasless USDC transfer
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { getWalletAddress, signAndSendTransactionWithPasskey, LAZORKIT_REDIRECT_URL } from '@/lib/lazorkit';
import {
  createUSDCTransferInstruction,
  createTicketInstruction,
  storeTicketData,
} from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock event data
const MOCK_EVENT = {
  id: 'summer-festival-2024',
  name: 'Summer Music Festival 2024',
  date: 'July 15, 2024',
  time: '6:00 PM',
  location: 'Central Park, New York',
  price: 50, // USDC
  organizerWallet: new PublicKey('11111111111111111111111111111112'), // Mock organizer (valid Solana address format)
};

export default function BuyTicketScreen() {
  const router = useRouter();
  const { isConnected, signAndSendTransaction } = useWallet();
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    checkTestMode();
  }, [isConnected]);

  async function checkTestMode() {
    try {
      // Check if test mode is enabled for local testing
      const testModeEnabled = await AsyncStorage.getItem('test_mode');
      
      if (testModeEnabled === 'enabled') {
        // In test mode, use mock wallet address
        const mockWalletAddress = new PublicKey('11111111111111111111111111111112');
        setWalletPublicKey(mockWalletAddress);
        setTestMode(true);
        setLoading(false);
        return;
      }

      // Normal mode: require wallet connection
      if (!isConnected) {
        router.replace('/login');
        return;
      }

      // For normal mode, use mock wallet for now
      // In production, get actual wallet from SDK
      const mockWalletAddress = new PublicKey('11111111111111111111111111111112');
      setWalletPublicKey(mockWalletAddress);
      setTestMode(false);
      setLoading(false);
    } catch (error) {
      console.error('Error checking test mode:', error);
      router.replace('/login');
    }
  }

  async function handleConfirmPurchase() {
    if (!walletPublicKey) return;

    setProcessing(true);

    try {
      // In test mode, simulate purchase without actual transaction
      if (testMode) {
        // Simulate successful purchase for testing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Store ticket in demo storage
        await storeTicketData(
          walletPublicKey,
          MOCK_EVENT.id,
          false // not used yet
        );
        
        Alert.alert(
          'Purchase Successful! (Test Mode)',
          'Your ticket has been purchased and is ready to use.\nNote: This is a test purchase.',
          [
            {
              text: 'View Ticket',
              onPress: () => router.replace('/my-ticket'),
            },
          ]
        );
        return;
      }

      // Normal mode: require signAndSendTransaction
      if (!signAndSendTransaction) {
        Alert.alert(
          'Transaction Not Available',
          'Please connect your wallet first.'
        );
        setProcessing(false);
        return;
      }

      // Step 1: Create USDC transfer instruction
      const transferInstructions = await createUSDCTransferInstruction(
        walletPublicKey,
        MOCK_EVENT.organizerWallet,
        MOCK_EVENT.price
      );

      // Step 2: Create ticket PDA instruction
      const ticketInstructions = await createTicketInstruction(
        walletPublicKey,
        MOCK_EVENT.id,
        walletPublicKey
      );

      // Step 3: Combine all instructions
      const allInstructions = [...transferInstructions, ...ticketInstructions];

      // Step 4: Sign and send transaction using LazorKit SDK
      // This will open the portal for Face ID authentication and signing
      // The SDK handles gasless transactions via Paymaster automatically
      const signature = await signAndSendTransactionWithPasskey(
        {
          instructions: allInstructions,
          transactionOptions: {
            feeToken: 'USDC', // Gasless with USDC as fee token
            clusterSimulation: 'devnet',
          },
        },
        signAndSendTransaction,
        `${LAZORKIT_REDIRECT_URL}?screen=my-ticket`
      );

      console.log('Transaction signature:', signature);

      // Store ticket in demo storage (in production, this would be on-chain)
      await storeTicketData(
        walletPublicKey,
        MOCK_EVENT.id,
        false // not used yet
      );

      // Success - navigate to my ticket screen
      Alert.alert(
        'Purchase Successful!',
        `Your ticket has been purchased and is ready to use.\nTransaction: ${signature.substring(0, 8)}...`,
        [
          {
            text: 'View Ticket',
            onPress: () => router.replace('/my-ticket'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Failed',
        error.message || 'An error occurred during purchase. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!walletPublicKey) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Confirm Purchase</Text>
            <Text style={styles.subtitle}>Review ticket details below</Text>
          </View>
          {testMode && (
            <View style={styles.testModeBadge}>
              <Text style={styles.testModeText}>🧪 TEST MODE</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.ticketDetails}>
        <Text style={styles.eventName}>{MOCK_EVENT.name}</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{MOCK_EVENT.date}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>{MOCK_EVENT.time}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>{MOCK_EVENT.location}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Price:</Text>
          <Text style={styles.priceValue}>{MOCK_EVENT.price} USDC</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Transaction Fee:</Text>
          <Text style={styles.priceValue}>0 USDC (Gasless)</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{MOCK_EVENT.price} USDC</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Gasless Transaction</Text>
        <Text style={styles.infoText}>
          This purchase uses a gasless transaction sponsored by Paymaster.
          You won't be charged any transaction fees.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, processing && styles.confirmButtonDisabled]}
        onPress={handleConfirmPurchase}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>
            Confirm with Face ID
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 200,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  testModeBadge: {
    backgroundColor: '#fef3c7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderStyle: 'dashed',
  },
  testModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  ticketDetails: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  infoBox: {
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3730a3',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4338ca',
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
});
