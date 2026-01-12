/**
 * My Ticket Screen
 * Black background with white text and yellow accents
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { getTicketData } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Ionicons } from '@expo/vector-icons';

// Mock event data
const MOCK_EVENT = {
  id: 'summer-festival-2024',
  name: 'Summer Music Festival 2024',
  date: 'July 15, 2024',
  time: '6:00 PM',
  location: 'Central Park, New York',
  price: 50, // USDC
};

export default function MyTicketScreen() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);

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
        await loadTicketTestMode(mockWalletAddress);
        return;
      }

      if (!isConnected) {
        router.replace('/login');
        return;
      }

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
      const data = await getTicketData(publicKey, MOCK_EVENT.id);
      if (!data) {
        router.replace('/events');
        return;
      }
      setTicketData(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleEnterEvent() {
    router.push('/entry');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FCFC65" />
        <Text style={styles.loadingText}>Loading ticket...</Text>
      </SafeAreaView>
    );
  }

  if (!ticketData || !walletPublicKey) {
    return null;
  }

  const isUsed = ticketData.used;
  const isValid = !isUsed;

  // Generate a booking reference
  const bookingRef = `TKT-2024-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Header title="My Ticket" showBack={true} />

        {/* Date and Route */}
        <View style={styles.dateRouteSection}>
          <Text style={styles.dateTime}>{MOCK_EVENT.date}, {MOCK_EVENT.time}</Text>
          <Text style={styles.route}>{MOCK_EVENT.location}</Text>
        </View>

        {/* Ticket Card */}
        <View style={styles.ticketContainer}>
          {/* Perforated left edge */}
          <View style={styles.perforatedLeft}>
            {[...Array(8)].map((_, i) => (
              <View key={i} style={styles.perforation} />
            ))}
          </View>

          {/* Ticket Content */}
          <View style={styles.ticketCard}>
            {/* Passenger Section */}
            <View style={styles.passengerSection}>
              <Text style={styles.passengerLabel}>Passenger</Text>
              <Text style={styles.passengerName}>You</Text>
            </View>

            {/* Journey Timeline */}
            <View style={styles.journeySection}>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timeText}>{MOCK_EVENT.time}</Text>
                  <View style={styles.timelineDot} />
                  <Text style={styles.locationText}>{MOCK_EVENT.location.split(',')[0]}</Text>
                  <Text style={styles.stationText}>{MOCK_EVENT.location}</Text>
                </View>

                <View style={styles.timelineCenter}>
                  <Text style={styles.durationText}>Event</Text>
                  <View style={styles.eventIcon}>
                    <Ionicons name="musical-notes" size={20} color="#000000" />
                  </View>
                </View>

                <View style={styles.timelineRight}>
                  <Text style={styles.timeText}>11:00 PM</Text>
                  <View style={styles.timelineDotEnd} />
                  <Text style={styles.locationText}>End</Text>
                  <Text style={styles.stationText}>Event Concludes</Text>
                </View>
              </View>
            </View>

            {/* Booking Reference */}
            <View style={styles.bookingSection}>
              <Text style={styles.bookingLabel}>Booking Reference</Text>
              <Text style={styles.bookingRef}>{bookingRef}</Text>
            </View>

            {/* Ticket Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Event</Text>
                <Text style={styles.detailValue}>Music Festival</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>General</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailValue}>{MOCK_EVENT.price} USDC</Text>
              </View>
            </View>

            {/* Status Badge */}
            <View style={styles.statusSection}>
              <View style={[styles.statusBadge, isUsed && styles.statusBadgeUsed]}>
                <Text style={[styles.statusText, isUsed && styles.statusTextUsed]}>
                  {isValid ? 'Valid' : 'Used'}
                </Text>
              </View>
            </View>

            {/* Barcode Section */}
            <View style={styles.barcodeSection}>
              <View style={styles.barcodeContainer}>
                {/* Simulated barcode */}
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.barcodeLine,
                      { width: Math.random() * 3 + 2, marginRight: 2 },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.barcodeText}>{bookingRef}</Text>
            </View>
          </View>

          {/* Perforated right edge */}
          <View style={styles.perforatedRight}>
            {[...Array(8)].map((_, i) => (
              <View key={i} style={styles.perforation} />
            ))}
          </View>
        </View>

        {/* Action Button */}
        {isValid && (
          <TouchableOpacity
            style={styles.enterButton}
            onPress={handleEnterEvent}
          >
            <Text style={styles.enterButtonText}>Enter Event</Text>
          </TouchableOpacity>
        )}

        {isUsed && (
          <View style={styles.usedInfo}>
            <Text style={styles.usedInfoText}>
              This ticket has already been used for entry.
            </Text>
          </View>
        )}
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
  dateRouteSection: {
    marginBottom: 24,
  },
  dateTime: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 8,
  },
  route: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  passengerSection: {
    marginBottom: 24,
  },
  passengerLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
  },
  passengerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  journeySection: {
    marginBottom: 24,
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  timelineCenter: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  timelineRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FCFC65',
    marginBottom: 8,
  },
  timelineDotEnd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#FCFC65',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stationText: {
    fontSize: 12,
    color: '#999999',
  },
  durationText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCFC65',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingSection: {
    marginBottom: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  bookingLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
  },
  bookingRef: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    backgroundColor: '#FCFC65',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  statusBadgeUsed: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#666666',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  statusTextUsed: {
    color: '#999999',
  },
  barcodeSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
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
  },
  barcodeLine: {
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  barcodeText: {
    fontSize: 12,
    color: '#999999',
    letterSpacing: 2,
  },
  enterButton: {
    backgroundColor: '#FCFC65',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  enterButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  usedInfo: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  usedInfoText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(30, 30, 60, 0.95)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  footerIconActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
