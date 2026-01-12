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
  ImageBackground,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { getTicketData } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Ionicons } from '@expo/vector-icons';
import { getEventById } from '@/lib/events';

export default function MyTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = (params.eventId as string) || 'summer-festival-2024';
  const event = getEventById(eventId) || getEventById('summer-festival-2024')!;
  
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
      const data = await getTicketData(publicKey, event.id);
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
    router.push({
      pathname: '/entry',
      params: { eventId: event.id },
    });
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

        {/* Ticket Card */}
        <View style={styles.ticketContainer}>
          {/* Ticket Content */}
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
              
              {/* Two Column Layout for Details */}
              <View style={styles.ticketDetailsGrid}>
                <View style={styles.detailsColumn}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{event.date}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Check In Type</Text>
                    <Text style={styles.detailValue}>General Admission</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Place</Text>
                    <Text style={styles.detailValue}>{event.location}</Text>
                  </View>
                </View>
                
                <View style={styles.detailsColumn}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>{event.time}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Order ID</Text>
                    <Text style={styles.detailValue}>{bookingRef}</Text>
                  </View>
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
            </View>

            {/* Perforated Line with Semi-circles */}
            <View style={styles.perforatedLineContainer}>
              {/* Left Semi-circle */}
              <View style={styles.leftCutout}>
                <View style={styles.semiCircle} />
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
              
              {/* Right Semi-circle */}
              <View style={styles.rightCutout}>
                <View style={styles.semiCircle} />
              </View>
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
              <Text style={styles.barcodeText}>{bookingRef}</Text>
            </View>
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
  ticketContainer: {
    marginBottom: 24,
    marginHorizontal: 0,
  },
  ticketCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    overflow: 'visible',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  perforatedLineContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 0,
    height: 50,
    paddingVertical: 0,
  },
  leftCutout: {
    position: 'absolute',
    left: -30,
    top: 10,
    width: 55,
    height: 55,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  rightCutout: {
    position: 'absolute',
    right: -30,
    top: 10,
    width: 55,
    height: 55,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  semiCircle: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#000000',
    borderWidth: 2,
    
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
  ticketDetailsGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  detailsColumn: {
    flex: 1,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 20,
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
  perforatedLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    height: 2,
    marginTop: 30,
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
