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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { signAndSendTransactionWithPasskey, LAZORKIT_REDIRECT_URL } from '@/lib/lazorkit';
import {
  createUSDCTransferInstruction,
  createTicketInstruction,
  storeTicketData,
} from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Ionicons } from '@expo/vector-icons';
import { getEventById } from '@/lib/events';

export default function BuyTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = (params.eventId as string) || 'summer-festival-2024';
  const event = getEventById(eventId) || getEventById('summer-festival-2024')!;
  
  const { isConnected, signAndSendTransaction } = useWallet();
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [testMode, setTestMode] = useState(false);
  
  const organizerWallet = new PublicKey('11111111111111111111111111111112');

  useEffect(() => {
    checkTestMode();
  }, [isConnected]);

  async function checkTestMode() {
    try {
      const testModeEnabled = await AsyncStorage.getItem('test_mode');
      
      if (testModeEnabled === 'enabled') {
        const mockWalletAddress = new PublicKey('11111111111111111111111111111112');
        setWalletPublicKey(mockWalletAddress);
        setTestMode(true);
        setLoading(false);
        return;
      }

      if (!isConnected) {
        router.replace('/login');
        return;
      }

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
      if (testMode) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await storeTicketData(
          walletPublicKey,
          event.id,
          false
        );
        
        Alert.alert(
          'Purchase Successful! (Test Mode)',
          'Your ticket has been purchased and is ready to use.\nNote: This is a test purchase.',
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
        return;
      }

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
          {/* Perforated left edge */}
          <View style={styles.perforatedLeft}>
            {[...Array(12)].map((_, i) => (
              <View key={i} style={styles.perforation} />
            ))}
          </View>

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
                {[...Array(20)].map((_, i) => (
                  <View key={i} style={styles.perforatedDot} />
                ))}
              </View>
              <View style={styles.perforatedLineRight} />
            </View>

            {/* Barcode Section */}
            <View style={styles.barcodeSection}>
              <View style={styles.barcodeContainer}>
                {[...Array(30)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.barcodeLine,
                      { width: Math.random() * 4 + 2, marginRight: 1 },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.barcodeText}>TKT-{event.id.substring(0, 8).toUpperCase()}</Text>
            </View>
          </View>

          {/* Perforated right edge */}
          <View style={styles.perforatedRight}>
            {[...Array(12)].map((_, i) => (
              <View key={i} style={styles.perforation} />
            ))}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="flash" size={32} color="#FCFC65" style={{ marginBottom: 12 }} />
          <Text style={styles.infoTitle}>Gasless Transaction</Text>
          <Text style={styles.infoText}>
            This purchase uses a gasless transaction sponsored by Paymaster.
            You won't be charged any transaction fees.
          </Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmButton, processing && styles.confirmButtonDisabled]}
          onPress={handleConfirmPurchase}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={24} color="#000000" style={{ marginRight: 12 }} />
              <Text style={styles.confirmButtonText}>
                Confirm with Face ID
              </Text>
            </>
          )}
        </TouchableOpacity>
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
  ticketContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  perforatedLeft: {
    width: 8,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  perforatedRight: {
    width: 8,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  perforation: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
  },
  ticketCard: {
    flex: 1,
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
    marginVertical: 16,
  },
  perforatedLineLeft: {
    width: 20,
    height: 1,
    backgroundColor: '#000000',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  perforatedLineDots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  perforatedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
  },
  perforatedLineRight: {
    width: 20,
    height: 1,
    backgroundColor: '#000000',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  barcodeSection: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    width: '100%',
  },
  barcodeLine: {
    height: 50,
    backgroundColor: '#FFFFFF',
  },
  barcodeText: {
    fontSize: 12,
    color: '#999999',
    letterSpacing: 2,
    fontWeight: '600',
  },
});
