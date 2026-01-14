/**
 * Entry Verification Screen
 * Modern UI with white, black, and #FCFC65 color scheme
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
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { signWithPasskey, signAndSendTransactionWithPasskey, LAZORKIT_REDIRECT_URL } from '@/lib/lazorkit';
import { getWalletAddress } from '@/lib/secure-storage';
import {
  getTicketData,
  markTicketUsedInstruction,
  updateTicketUsed,
} from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Ionicons } from '@expo/vector-icons';
import { getEventById } from '@/lib/events';

export default function EntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = (params.eventId as string) || 'summer-festival-2024';
  const event = getEventById(eventId) || getEventById('summer-festival-2024')!;
  
  const walletHook = useWallet() as any;
  const { isConnected, signMessage, signAndSendTransaction } = walletHook || {};
  const wallet = walletHook?.wallet;
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    initializeWallet();
  }, []);

  async function initializeWallet() {
    try {
      // Get wallet address from SDK or storage
      const { getWalletAddress } = await import('@/lib/secure-storage');
      const storedAddress = await getWalletAddress();
      const walletAddress = wallet?.smartWallet || storedAddress;

      if (!walletAddress && !isConnected) {
        router.replace('/login');
        return;
      }

      // Use real wallet address from LazorKit
      if (walletAddress) {
        try {
          const publicKey = new PublicKey(walletAddress);
          setWalletPublicKey(publicKey);
          await loadTicket(publicKey);
        } catch (error) {
          console.error('Error parsing wallet address:', error);
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error initializing wallet:', error);
      router.replace('/login');
    }
  }

  async function loadTicket(publicKey: PublicKey) {
    try {
      const data = await getTicketData(publicKey, event.id);
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
      if (!signMessage || !signAndSendTransaction) {
        Alert.alert(
          'Authentication Required',
          'Please connect your wallet and authenticate first.'
        );
        setVerifying(false);
        return;
      }

      const challenge = `entry_verification_${event.id}_${Date.now()}`;

      const signResult = await signWithPasskey(
        challenge,
        signMessage,
        `${LAZORKIT_REDIRECT_URL}?screen=entry&verify=true`
      );

      const onChainTicket = await getTicketData(walletPublicKey, event.id);

      if (!onChainTicket) {
        throw new Error('Ticket not found on-chain');
      }

      if (onChainTicket.used) {
        throw new Error('Ticket has already been used');
      }

      if (!onChainTicket.ownerWallet.equals(walletPublicKey)) {
        throw new Error('Ticket ownership verification failed');
      }

      const markUsedInstructions = await markTicketUsedInstruction(
        walletPublicKey,
        event.id,
        walletPublicKey
      );

      const signature = await signAndSendTransactionWithPasskey(
        {
          instructions: markUsedInstructions,
          transactionOptions: {
            feeToken: 'USDC',
            clusterSimulation: 'devnet',
          },
        },
        signAndSendTransaction,
        `${LAZORKIT_REDIRECT_URL}?screen=my-ticket`
      );

      console.log('Entry transaction signature:', signature);

      await updateTicketUsed(walletPublicKey, event.id, true);

      setVerified(true);
      
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FCFC65" />
        <Text style={styles.loadingText}>Loading verification...</Text>
      </SafeAreaView>
    );
  }

  if (!walletPublicKey || !ticketData) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Header title="Entry Verification" showBack={true} />

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/lt.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Event Name */}
        <Text style={styles.eventName}>{event.name}</Text>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✓ Valid Ticket</Text>
          </View>
        </View>

        {/* Success State */}
        {verified && (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Entry Granted</Text>
            <Text style={styles.successText}>
              Your ticket has been verified successfully. You may now enter the event.
            </Text>
            <Text style={styles.successNote}>
              Your ticket has been marked as used on-chain and cannot be reused.
            </Text>
          </View>
        )}

        {/* Error State */}
        {denied && !verifying && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>✗</Text>
            <Text style={styles.errorTitle}>Entry Denied</Text>
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

        {/* Verification Section */}
        {!verified && !denied && (
          <View style={styles.verificationSection}>
            <Ionicons name="lock-closed" size={48} color="#FCFC65" style={{ marginBottom: 16 }} />
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
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={24} color="#000000" style={{ marginRight: 12 }} />
                  <Text style={styles.verifyButtonText}>
                    Verify Entry with Face ID
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How Entry Verification Works</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>1. Face ID authenticates your identity</Text>
            <Text style={styles.infoItem}>2. Your passkey signs a verification challenge</Text>
            <Text style={styles.infoItem}>3. Ticket ownership is verified on-chain</Text>
            <Text style={styles.infoItem}>4. Ticket is marked as used (non-reusable)</Text>
            <Text style={styles.infoItem}>5. All transactions are gasless via Paymaster</Text>
          </View>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statusBadge: {
    backgroundColor: '#FCFC65',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  statusText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 16,
  },
  successCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FCFC65',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FCFC65',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  successNote: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CC0000',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
    color: '#CC0000',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CC0000',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#CC0000',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#CC0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  verifyButton: {
    backgroundColor: '#FCFC65',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
  },
  verifyButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  infoSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
