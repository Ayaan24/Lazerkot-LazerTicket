/**
 * Events Screen
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
import { ticketExists, getTicketData } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Mock event data
const MOCK_EVENT = {
  id: 'summer-festival-2024',
  name: 'Summer Music Festival',
  date: 'July 15, 2024',
  time: '6:00 PM',
  location: 'Central Park, New York',
  price: 50, // USDC
  organizer: 'Sonic Waves Productions',
  attendees: 125,
};

// Event categories
const CATEGORIES = ['All Event', 'Music', 'Sport', 'Theater'];

export default function EventsScreen() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);
  const [hasTicket, setHasTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticketUsed, setTicketUsed] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Event');

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
        await loadWalletAndTicketStatusTestMode(mockWalletAddress);
        setLoading(false);
        return;
      }

      if (!isConnected) {
        router.replace('/login');
        return;
      }
      setTestMode(false);
      loadWalletAndTicketStatus();
    } catch (error) {
      console.error('Error checking test mode:', error);
      if (!isConnected) {
        router.replace('/login');
        return;
      }
      loadWalletAndTicketStatus();
    }
  }

  async function loadWalletAndTicketStatusTestMode(mockPublicKey: PublicKey) {
    try {
      const ticketExistsResult = await ticketExists(mockPublicKey, MOCK_EVENT.id);
      if (ticketExistsResult) {
        const ticketData = await getTicketData(mockPublicKey, MOCK_EVENT.id);
        if (ticketData) {
          setHasTicket(true);
          setTicketUsed(ticketData.used);
        }
      }
    } catch (error) {
      console.error('Error loading ticket status in test mode:', error);
    }
  }

  async function loadWalletAndTicketStatus() {
    try {
      const testModeEnabled = await AsyncStorage.getItem('test_mode');
      if (testModeEnabled === 'enabled') {
        const mockWalletAddress = new PublicKey('11111111111111111111111111111112');
        setWalletPublicKey(mockWalletAddress);
        setTestMode(true);
        
        const ticketExistsResult = await ticketExists(mockWalletAddress, MOCK_EVENT.id);
        if (ticketExistsResult) {
          const ticketData = await getTicketData(mockWalletAddress, MOCK_EVENT.id);
          if (ticketData) {
            setHasTicket(true);
            setTicketUsed(ticketData.used);
          }
        }
        setLoading(false);
        return;
      }

      if (!isConnected) {
        router.replace('/login');
        return;
      }

      const mockPublicKey = new PublicKey('11111111111111111111111111111112');
      setWalletPublicKey(mockPublicKey);

      const ticketExistsResult = await ticketExists(mockPublicKey, MOCK_EVENT.id);
      if (ticketExistsResult) {
        const ticketData = await getTicketData(mockPublicKey, MOCK_EVENT.id);
        if (ticketData) {
          setHasTicket(true);
          setTicketUsed(ticketData.used);
        }
      }
    } catch (error) {
      console.error('Error loading wallet status:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleBuyTicket() {
    router.push('/buy-ticket');
  }

  function handleViewTicket() {
    router.push('/my-ticket');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FCFC65" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </SafeAreaView>
    );
  }

  if (!walletPublicKey && !testMode) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Header 
          greeting="Hi, User"
          title="Find your next event."
          showSearch={true}
        />

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Discover Section */}
        <View style={styles.discoverHeader}>
          <Text style={styles.discoverTitle}>Discover Nearby Events</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Event Card */}
        <TouchableOpacity
          style={styles.eventCard}
          onPress={hasTicket ? handleViewTicket : handleBuyTicket}
        >
          <View style={styles.eventCardGradient}>
            <View style={styles.eventDateCircle}>
              <Text style={styles.eventDateNumber}>15</Text>
              <Text style={styles.eventDateMonth}>July</Text>
            </View>
            
            <View style={styles.eventCardContent}>
              <View style={styles.eventLocation}>
                <Text style={styles.eventLocationCity}>{MOCK_EVENT.location.split(',')[0]}</Text>
                <Text style={styles.eventLocationVenue}>{MOCK_EVENT.location.split(',')[1]?.trim()}</Text>
              </View>
              <Text style={styles.eventOrganizer}>{MOCK_EVENT.organizer}</Text>
              <Text style={styles.eventName}>{MOCK_EVENT.name}</Text>
              
              <View style={styles.eventFooter}>
                <View style={styles.attendeesContainer}>
                  <View style={styles.attendeeCircle} />
                  <View style={[styles.attendeeCircle, styles.attendeeCircleOverlap]} />
                  <View style={[styles.attendeeCircle, styles.attendeeCircleOverlap]} />
                  <View style={[styles.attendeeCircle, styles.attendeeCircleOverlap, styles.attendeeCircleMore]}>
                    <Text style={styles.attendeeMoreText}>+{MOCK_EVENT.attendees}</Text>
                  </View>
                </View>
                {hasTicket && (
                  <View style={styles.ticketBadge}>
                    <Text style={styles.ticketBadgeText}>
                      {ticketUsed ? 'Used' : 'Owned'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, hasTicket && styles.actionButtonSecondary]}
          onPress={hasTicket ? handleViewTicket : handleBuyTicket}
        >
          <Text style={styles.actionButtonText}>
            {hasTicket ? 'View My Ticket' : 'Buy Ticket'}
          </Text>
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
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesContent: {
    paddingRight: 20,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  categoryButtonActive: {
    backgroundColor: '#FCFC65',
    borderColor: '#FCFC65',
  },
  categoryText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  discoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  discoverTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FCFC65',
    fontWeight: '600',
  },
  eventCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  eventCardGradient: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    borderRadius: 20,
    minHeight: 220,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333333',
  },
  eventDateCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FCFC65',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  eventDateNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  eventDateMonth: {
    fontSize: 12,
    color: '#000000',
    marginTop: -4,
    fontWeight: '600',
  },
  eventCardContent: {
    flex: 1,
  },
  eventLocation: {
    marginBottom: 12,
  },
  eventLocationCity: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  eventLocationVenue: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  eventOrganizer: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCFC65',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    marginLeft: -8,
  },
  attendeeCircleOverlap: {
    marginLeft: -8,
  },
  attendeeCircleMore: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderColor: '#1A1A1A',
  },
  attendeeMoreText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ticketBadge: {
    backgroundColor: '#FCFC65',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  ticketBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  actionButton: {
    backgroundColor: '#FCFC65',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonSecondary: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#FCFC65',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
