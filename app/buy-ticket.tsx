/**
 * Buy Ticket Screen
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
  ImageBackground,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { signAndSendTransactionWithPasskey, LAZORKIT_REDIRECT_URL } from '@/lib/lazorkit';
import {
  createUSDCTransferInstruction,
  createTicketInstruction,
  storeTicketData,
  getUSDCBalance,
} from '@/lib/solana';
import { authenticateWithBiometric, getBiometricPromptMessage } from '@/lib/biometric-auth';
import { getWalletAddress } from '@/lib/secure-storage';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import { getEventById } from '@/lib/events';

export default function BuyTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = (params.eventId as string) || 'summer-festival-2024';
  const event = getEventById(eventId) || getEventById('summer-festival-2024')!;
  
  const walletHook = useWallet() as any;
  const { isConnected, signAndSendTransaction, wallet } = walletHook || {};
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  
  const organizerWallet = new PublicKey('11111111111111111111111111111112');

  useEffect(() => {
    initializeWallet();
  }, []);

  async function initializeWallet() {
    try {
      // Get wallet address from SDK or storage
      const storedAddress = await getWalletAddress();
      const walletAddress = wallet?.smartWallet || storedAddress;

      if (!walletAddress && !isConnected) {
        router.replace('/login');
        return;
      }

      // Set wallet public key from real wallet
      if (walletAddress) {
        try {
          const publicKey = new PublicKey(walletAddress);
          setWalletPublicKey(publicKey);
          // Load USDC balance
          await loadUSDCBalance(publicKey);
        } catch (error) {
          console.error('Error parsing wallet address:', error);
          Alert.alert('Error', 'Invalid wallet address. Please reconnect your wallet.');
          router.replace('/login');
          return;
        }
      } else {
        // No wallet available, redirect to login
        router.replace('/login');
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing wallet:', error);
      setLoading(false);
    }
  }

  async function loadUSDCBalance(publicKey: PublicKey) {
    try {
      setCheckingBalance(true);
      const balance = await getUSDCBalance(publicKey);
      setUsdcBalance(balance);
      console.log('USDC Balance:', balance);
    } catch (error) {
      // Silently handle errors - just set balance to 0
      console.warn('Could not load USDC balance, defaulting to 0');
      setUsdcBalance(0);
    } finally {
      setCheckingBalance(false);
    }
  }

  async function handleShowConfirmation() {
    if (!walletPublicKey) return;
    
    // Refresh balance before showing confirmation
    await loadUSDCBalance(walletPublicKey);
    setShowConfirmation(true);
  }

  async function handleConfirmWithFaceID() {
    if (!walletPublicKey) return;

    // Check balance
    if (usdcBalance < event.price) {
      Alert.alert(
        'Insufficient Wallet Balance',
        'Insufficient wallet balance'
      );
      return;
    }

    setAuthenticating(true);

    try {
      // Authenticate with Face ID
      const promptMessage = await getBiometricPromptMessage();
      const authenticated = await authenticateWithBiometric(
        `Confirm purchase of ${event.price} USDC with Face ID`
      );

      if (!authenticated) {
        Alert.alert('Authentication Failed', 'Face ID authentication is required to complete the purchase.');
        setAuthenticating(false);
        return;
      }

      // Close confirmation modal
      setShowConfirmation(false);
      
      // Proceed with purchase
      await handleConfirmPurchase();
    } catch (error: any) {
      console.error('Face ID authentication error:', error);
      Alert.alert('Authentication Error', error.message || 'Failed to authenticate. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  }

  async function handleConfirmPurchase() {
    if (!walletPublicKey) return;

    setProcessing(true);

    try {
      if (!signAndSendTransaction) {
        Alert.alert(
          'Transaction Not Available',
          'Please connect your wallet first.'
        );
        setProcessing(false);
        return;
      }

      const transferInstructions = await createUSDCTransferInstruction(
        walletPublicKey,
        organizerWallet,
        event.price
      );

      const ticketInstructions = await createTicketInstruction(
        walletPublicKey,
        event.id,
        walletPublicKey
      );

      const allInstructions = [...transferInstructions, ...ticketInstructions];

      const signature = await signAndSendTransactionWithPasskey(
        {
          instructions: allInstructions,
          transactionOptions: {
            feeToken: 'USDC',
            clusterSimulation: 'devnet',
          },
        },
        signAndSendTransaction,
        `${LAZORKIT_REDIRECT_URL}?screen=my-ticket`
      );

      console.log('Transaction signature:', signature);

      await storeTicketData(
        walletPublicKey,
        event.id,
        false
      );

      Alert.alert(
        'Purchase Successful!',
        `Your ticket has been purchased and is ready to use.\nTransaction: ${signature.substring(0, 8)}...`,
        [
          {
            text: 'View Ticket',
            onPress: () => router.push({
              pathname: '/my-ticket',
              params: { eventId: event.id },
            }),
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
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FCFC65" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!walletPublicKey) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Header title="Buy Ticket" showBack={true} />

        {/* Ticket Preview */}
        <View style={styles.ticketContainer}>
          {/* Ticket Card */}
          <View style={styles.ticketCard}>
            {/* Event Image */}
            <ImageBackground
              source={{ uri: event.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' }}
              style={styles.ticketImage}
              imageStyle={styles.ticketImageStyle}
              resizeMode="cover"
            >
              <View style={styles.imageOverlay} />
            </ImageBackground>

            {/* Ticket Content */}
            <View style={styles.ticketContent}>
              <Text style={styles.eventOrganizerLabel}>Local Music Present</Text>
              <Text style={styles.eventName}>{event.name}</Text>
              
              <View style={styles.ticketDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{event.date}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{event.time}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Place</Text>
                  <Text style={styles.detailValue}>{event.location}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Check In Type</Text>
                  <Text style={styles.detailValue}>General Admission</Text>
                </View>
              </View>

              {/* Price Section */}
              <View style={styles.priceSection}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Ticket Price</Text>
                  <Text style={styles.priceValue}>{event.price} USDC</Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Transaction Fee</Text>
                  <Text style={styles.feeValue}>0 USDC</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{event.price} USDC</Text>
                </View>
              </View>
            </View>

            {/* Perforated Line */}
            <View style={styles.perforatedLine}>
              <View style={styles.perforatedLineLeft} />
              <View style={styles.perforatedLineDots}>
                {[...Array(25)].map((_, i) => (
                  <View key={i} style={styles.perforatedDot} />
                ))}
              </View>
              <View style={styles.perforatedLineRight} />
            </View>

            {/* Gasless Transaction Info */}
            <View style={styles.gaslessSection}>
              <Ionicons name="flash" size={32} color="#FCFC65" style={{ marginBottom: 12 }} />
              <Text style={styles.gaslessTitle}>Gasless Transaction</Text>
              <Text style={styles.gaslessText}>
                This purchase uses a gasless transaction sponsored by Paymaster.
                You won't be charged any transaction fees.
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Fixed Bottom Button Bar */}
      <View style={styles.bottomButtonBar}>
        <TouchableOpacity
          style={[styles.confirmButton, (processing || checkingBalance) && styles.confirmButtonDisabled]}
          onPress={handleShowConfirmation}
          disabled={processing || checkingBalance}
        >
          {processing ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={24} color="#000000" style={{ marginRight: 12 }} />
              <Text style={styles.confirmButtonText}>
                Confirm and Pay
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Balance Confirmation Modal with Face ID */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Purchase</Text>
              <TouchableOpacity 
                onPress={() => setShowConfirmation(false)}
                disabled={authenticating}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Wallet Balance Section */}
              <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>Your USDC Balance</Text>
                {checkingBalance ? (
                  <ActivityIndicator size="small" color="#FCFC65" style={{ marginVertical: 12 }} />
                ) : (
                  <Text style={styles.balanceAmount}>{usdcBalance.toFixed(2)} USDC</Text>
                )}
                
                {usdcBalance < event.price && (
                  <View style={styles.insufficientBalanceWarning}>
                    <Ionicons name="warning" size={20} color="#FF6B6B" />
                    <Text style={styles.warningText}>
                      Insufficient wallet balance
                    </Text>
                  </View>
                )}
              </View>

              {/* Transaction Details */}
              <View style={styles.transactionDetails}>
                <Text style={styles.detailsTitle}>Transaction Details</Text>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailItemLabel}>Event</Text>
                  <Text style={styles.detailItemValue}>{event.name}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailItemLabel}>Ticket Price</Text>
                  <Text style={styles.detailItemValue}>{event.price} USDC</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailItemLabel}>Transaction Fee</Text>
                  <Text style={[styles.detailItemValue, styles.feeValue]}>0 USDC (Gasless)</Text>
                </View>
                
                <View style={styles.dividerLine} />
                
                <View style={styles.detailItem}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{event.price} USDC</Text>
                </View>
              </View>

              {/* Security Info */}
              <View style={styles.securityInfo}>
                <Ionicons name="shield-checkmark" size={24} color="#FCFC65" />
                <Text style={styles.securityText}>
                  Your transaction will be secured with Face ID authentication
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.faceIdButton,
                  (authenticating || usdcBalance < event.price) && styles.faceIdButtonDisabled
                ]}
                onPress={handleConfirmWithFaceID}
                disabled={authenticating || usdcBalance < event.price}
              >
                {authenticating ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={24} color="#000000" style={{ marginRight: 12 }} />
                    <Text style={styles.faceIdButtonText}>Pay with Face ID</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmation(false)}
                disabled={authenticating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  bottomButtonBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  ticketContainer: {
    marginBottom: 24,
  },
  ticketCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  ticketImage: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
  },
  ticketImageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  ticketContent: {
    padding: 20,
  },
  eventOrganizerLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  ticketDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 16,
  },
  priceSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#999999',
  },
  priceValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feeValue: {
    fontSize: 14,
    color: '#FCFC65',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FCFC65',
  },
  infoBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCFC65',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FCFC65',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: '#FCFC65',
    paddingVertical: 18,
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
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  perforatedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  perforatedLineLeft: {
    width: 0,
    height: 0,
  },
  perforatedLineDots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 2,
  },
  perforatedDot: {
    width: 10,
    height: 2,
    backgroundColor: '#666666',
    borderRadius: 1,
  },
  perforatedLineRight: {
    width: 0,
    height: 0,
  },
  gaslessSection: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  gaslessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FCFC65',
    marginBottom: 8,
  },
  gaslessText: {
    fontSize: 13,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  balanceSection: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FCFC65',
    marginBottom: 8,
  },
  insufficientBalanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1A1A',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#FF6B6B',
    flex: 1,
  },
  transactionDetails: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailItemLabel: {
    fontSize: 14,
    color: '#999999',
  },
  detailItemValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 16,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  securityText: {
    fontSize: 13,
    color: '#CCCCCC',
    flex: 1,
    lineHeight: 18,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 12,
  },
  faceIdButton: {
    backgroundColor: '#FCFC65',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  faceIdButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  faceIdButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999999',
    fontSize: 16,
    fontWeight: '600',
  },
});
