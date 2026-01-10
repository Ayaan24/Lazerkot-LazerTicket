/**
 * Entry Verification Screen
 * Verifies entry with Face ID and marks ticket as used on-chain
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
import { getWalletAddress, signWithPasskey, signAndSendTransactionWithPasskey, LAZORKIT_REDIRECT_URL } from '@/lib/lazorkit';
import {
  getTicketData,
  markTicketUsedInstruction,
  getTicketPDA,
  updateTicketUsed,
} from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock event data
const MOCK_EVENT = {
  id: 'summer-festival-2024',
  name: 'Summer Music Festival 2024',
};

export default function EntryScreen() {
  const router = useRouter();
  const { isConnected, signMessage, signAndSendTransaction } = useWallet();
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [denied, setDenied] = useState(false);
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
        await loadTicketTestMode(mockWalletAddress);
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
      await loadTicketTestMode(mockWalletAddress);
    } catch (error) {
      console.error('Error checking test mode:', error);
      router.replace('/login');
    }
  }

  async function loadTicketTestMode(publicKey: PublicKey) {
    try {
      // Get ticket data from on-chain
      const data = await getTicketData(publicKey, MOCK_EVENT.id);
      if (!data) {
        Alert.alert('No Ticket', 'You do not have a ticket for this event.');
        router.replace('/events');
        return;
      }

      if (data.used) {
        Alert.alert('Ticket Already Used', 'This ticket has already been used for entry.');
        router.replace('/my-ticket');
        return;
      }

      setTicketData(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEntry() {
    if (!walletPublicKey || !ticketData) return;

    setVerifying(true);
    setDenied(false);
    setVerified(false);

    try {
      // In test mode, simulate entry verification
      if (testMode) {
        // Simulate verification process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify ticket ownership on-chain (mock check)
        const onChainTicket = await getTicketData(walletPublicKey, MOCK_EVENT.id);

        if (!onChainTicket) {
          throw new Error('Ticket not found on-chain');
        }

        if (onChainTicket.used) {
          throw new Error('Ticket has already been used');
        }

        // In test mode, mark ticket as used in demo storage
        await updateTicketUsed(walletPublicKey, MOCK_EVENT.id, true);
        
        setVerified(true);
        setTicketData({
          ...ticketData,
          used: true,
        });

        Alert.alert(
          'Entry Granted! (Test Mode)',
          'Your ticket has been verified and marked as used. Welcome to the event!\nNote: This is a test verification.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/my-ticket'),
            },
          ]
        );
        setVerifying(false);
        return;
      }

      // Normal mode: require signMessage and signAndSendTransaction
      if (!signMessage || !signAndSendTransaction) {
        Alert.alert(
          'Authentication Required',
          'Please connect your wallet and authenticate first.'
        );
        setVerifying(false);
        return;
      }

      // Step 1: Generate challenge (in production, this comes from server)
      const challenge = `entry_verification_${MOCK_EVENT.id}_${Date.now()}`;

      // Step 2: Sign challenge with passkey using LazorKit SDK
      // This will open the portal for Face ID authentication
      const signResult = await signWithPasskey(
        challenge,
        signMessage,
        `${LAZORKIT_REDIRECT_URL}?screen=entry&verify=true`
      );

      // Step 3: Verify ticket ownership on-chain
      const ticketPDA = getTicketPDA(walletPublicKey, MOCK_EVENT.id);
      const onChainTicket = await getTicketData(walletPublicKey, MOCK_EVENT.id);

      if (!onChainTicket) {
        throw new Error('Ticket not found on-chain');
      }

      if (onChainTicket.used) {
        throw new Error('Ticket has already been used');
      }

      // Verify ticket owner matches wallet
      if (!onChainTicket.ownerWallet.equals(walletPublicKey)) {
        throw new Error('Ticket ownership verification failed');
      }

      // Step 4: Create instruction to mark ticket as used
      const markUsedInstructions = await markTicketUsedInstruction(
        walletPublicKey,
        MOCK_EVENT.id,
        walletPublicKey
      );

      // Step 5: Sign and send transaction using LazorKit SDK
      // This will open the portal again for Face ID to sign the transaction
      // The SDK handles gasless transactions via Paymaster automatically
      const signature = await signAndSendTransactionWithPasskey(
        {
          instructions: markUsedInstructions,
          transactionOptions: {
            feeToken: 'USDC', // Gasless with USDC
            clusterSimulation: 'devnet',
          },
        },
        signAndSendTransaction,
        `${LAZORKIT_REDIRECT_URL}?screen=my-ticket`
      );

      console.log('Entry transaction signature:', signature);

      // Update ticket as used in demo storage
      await updateTicketUsed(walletPublicKey, MOCK_EVENT.id, true);

      // Success - mark ticket as used
      setVerified(true);
      
      // Update local ticket data
      setTicketData({
        ...ticketData,
        used: true,
      });

      Alert.alert(
        'Entry Granted!',
        'Your ticket has been verified and marked as used. Welcome to the event!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/my-ticket'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Verification error:', error);
      setDenied(true);
      Alert.alert(
        'Entry Denied',
        error.message || 'Entry verification failed. Please try again.'
      );
    } finally {
      setVerifying(false);
    }
  }

  function handleRetry() {
    setDenied(false);
    setVerified(false);
  }

  function handleBack() {
    router.back();
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading verification...</Text>
      </View>
    );
  }

  if (!walletPublicKey || !ticketData) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Entry Verification</Text>
            <Text style={styles.subtitle}>{MOCK_EVENT.name}</Text>
          </View>
          {testMode && (
            <View style={styles.testModeBadge}>
              <Text style={styles.testModeText}>🧪 TEST MODE</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.ticketCard}>
        <Text style={styles.ticketLabel}>Ticket Status</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Valid</Text>
        </View>
      </View>

      {verified && (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>✓ Entry Granted</Text>
          <Text style={styles.successText}>
            Your ticket has been verified successfully. You may now enter the event.
          </Text>
          <Text style={styles.successNote}>
            Your ticket has been marked as used on-chain and cannot be reused.
          </Text>
        </View>
      )}

      {denied && !verifying && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>✗ Entry Denied</Text>
          <Text style={styles.errorText}>
            Entry verification failed. Please try again or contact support.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!verified && !denied && (
        <View style={styles.verificationSection}>
          <Text style={styles.verificationTitle}>Verify Your Identity</Text>
          <Text style={styles.verificationText}>
            Use Face ID to verify your identity and prove ticket ownership.
            This will mark your ticket as used on-chain.
          </Text>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              verifying && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerifyEntry}
            disabled={verifying}
          >
            {verifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>
                Verify Entry with Face ID
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How Entry Verification Works</Text>
        <Text style={styles.infoText}>
          1. Face ID authenticates your identity{'\n'}
          2. Your passkey signs a verification challenge{'\n'}
          3. Ticket ownership is verified on-chain{'\n'}
          4. Ticket is marked as used (non-reusable){'\n'}
          5. All transactions are gasless via Paymaster
        </Text>
      </View>

      {verified && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>Back to My Ticket</Text>
        </TouchableOpacity>
      )}
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
    alignItems: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    flexWrap: 'wrap',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
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
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  statusText: {
    color: '#065f46',
    fontWeight: '600',
    fontSize: 16,
  },
  successCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  successNote: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationSection: {
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
  verificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  verifyButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
});

