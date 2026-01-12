/**
 * Events Screen
 * Displays multiple events with category filtering and search
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Image,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { ticketExists, getTicketData } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { EVENTS, CATEGORIES, getEventsByCategory, type Event } from '@/lib/events';

export default function EventsScreen() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Event');
  const [searchQuery, setSearchQuery] = useState('');
  const [userTickets, setUserTickets] = useState<Record<string, { used: boolean }>>({});

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
        await loadUserTickets(mockWalletAddress);
        setLoading(false);
        return;
      }

      if (!isConnected) {
        router.replace('/login');
        return;
      }
      setTestMode(false);
      const mockPublicKey = new PublicKey('11111111111111111111111111111112');
      setWalletPublicKey(mockPublicKey);
      await loadUserTickets(mockPublicKey);
      setLoading(false);
    } catch (error) {
      console.error('Error checking test mode:', error);
      if (!isConnected) {
        router.replace('/login');
        return;
      }
      setLoading(false);
    }
  }

  async function loadUserTickets(publicKey: PublicKey) {
    try {
      const tickets: Record<string, { used: boolean }> = {};
      for (const event of EVENTS) {
        const ticketExistsResult = await ticketExists(publicKey, event.id);
        if (ticketExistsResult) {
          const ticketData = await getTicketData(publicKey, event.id);
          if (ticketData) {
            tickets[event.id] = { used: ticketData.used };
          }
        }
      }
      setUserTickets(tickets);
    } catch (error) {
      console.error('Error loading user tickets:', error);
    }
  }

  const filteredEvents = useMemo(() => {
    let events = getEventsByCategory(selectedCategory);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      events = events.filter(event => 
        event.name.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.organizer.toLowerCase().includes(query)
      );
    }
    
    return events;
  }, [selectedCategory, searchQuery]);

  function handleEventPress(event: Event) {
    const hasTicket = !!userTickets[event.id];
    if (hasTicket) {
      router.push({
        pathname: '/my-ticket',
        params: { eventId: event.id },
      });
    } else {
      router.push({
        pathname: '/buy-ticket',
        params: { eventId: event.id },
      });
    }
  }

  function formatDate(dateStr: string) {
    // Parse date string like "July 15, 2024"
    const parts = dateStr.split(' ');
    if (parts.length >= 2) {
      const day = parts[1].replace(',', '');
      const month = parts[0].substring(0, 3);
      return { day, month };
    }
    // Fallback
    return { day: '15', month: 'Jul' };
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
          onSearchChange={setSearchQuery}
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
              disabled={loading}
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
          <Text style={styles.discoverTitle}>
            {loading 
              ? 'Discover Nearby Events' 
              : searchQuery 
                ? `Search Results (${filteredEvents.length})` 
                : `Discover Nearby Events (${filteredEvents.length})`
            }
          </Text>
        </View>

        {/* Events List */}
        {loading ? (
          // Skeleton loading placeholders
          [...Array(5)].map((_, index) => (
            <View key={`skeleton-${index}`} style={styles.eventCard}>
              <View style={styles.eventCardGradient}>
                <View style={[styles.eventDateCircle, styles.skeletonCircle]} />
                
                <View style={styles.eventCardContent}>
                  <View style={styles.eventLocation}>
                    <View style={[styles.skeletonLine, { width: '60%', marginBottom: 8 }]} />
                    <View style={[styles.skeletonLine, { width: '40%' }]} />
                  </View>
                  <View style={[styles.skeletonLine, { width: '50%', marginBottom: 8 }]} />
                  <View style={[styles.skeletonLine, { width: '80%', height: 24, marginBottom: 12 }]} />
                  
                  <View style={styles.eventFooter}>
                    <View style={styles.attendeesContainer}>
                      <View style={[styles.attendeeCircle, styles.skeletonCircle]} />
                      <View style={[styles.attendeeCircle, styles.attendeeCircleOverlap, styles.skeletonCircle]} />
                      <View style={[styles.attendeeCircle, styles.attendeeCircleOverlap, styles.skeletonCircle]} />
                      <View style={[styles.attendeeCircle, styles.attendeeCircleOverlap, styles.skeletonCircle]} />
                    </View>
                    <View style={[styles.skeletonLine, { width: 60, height: 16 }]} />
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No events found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or category filter
            </Text>
          </View>
        ) : (
          filteredEvents.map((event) => {
            const hasTicket = !!userTickets[event.id];
            const ticketUsed = userTickets[event.id]?.used || false;
            const dateInfo = formatDate(event.date);
            
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => handleEventPress(event)}
              >
                <ImageBackground
                  source={{ uri: event.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' }}
                  style={styles.eventCardBackground}
                  imageStyle={styles.eventCardImage}
                  resizeMode="cover"
                >
                  <View style={styles.eventCardOverlay} />
                  <View style={styles.eventCardGradient}>
                    <View style={styles.eventDateCircle}>
                      <Text style={styles.eventDateNumber}>{dateInfo.day}</Text>
                      <Text style={styles.eventDateMonth}>{dateInfo.month}</Text>
                    </View>
                    
                    <View style={styles.eventCardContent}>
                      <View style={styles.eventLocation}>
                        <Text style={styles.eventLocationCity}>{event.location.split(',')[0]}</Text>
                        <Text style={styles.eventLocationVenue}>{event.location.split(',')[1]?.trim()}</Text>
                      </View>
                      <Text style={styles.eventOrganizer}>{event.organizer}</Text>
                      <Text style={styles.eventName}>{event.name}</Text>
                      
                      <View style={styles.eventFooter}>
                        <View style={styles.attendeesContainer}>
                          <View style={styles.attendeeCircle} />
                          <View style={[styles.attendeeCircle, styles.attendeeCircleOverlap]} />
                          <View style={[styles.attendeeCircle, styles.attendeeCircleOverlap]} />
                          <View style={[styles.attendeeCircle, styles.attendeeCircleOverlap, styles.attendeeCircleMore]}>
                            <Text style={styles.attendeeMoreText}>+{event.attendees}</Text>
                          </View>
                        </View>
                        <View style={styles.eventRightSection}>
                          {hasTicket && (
                            <View style={styles.ticketBadge}>
                              <Text style={styles.ticketBadgeText}>
                                {ticketUsed ? 'Used' : 'Owned'}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.eventPrice}>{event.price} USDC</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          })
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
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FCFC65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  eventCardBackground: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  eventCardImage: {
    borderRadius: 20,
  },
  eventCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
  },
  eventCardGradient: {
    padding: 20,
    borderRadius: 20,
    minHeight: 180,
    position: 'relative',
  },
  eventDateCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FCFC65',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventDateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  eventDateMonth: {
    fontSize: 11,
    color: '#000000',
    marginTop: -4,
    fontWeight: '600',
  },
  eventCardContent: {
    flex: 1,
  },
  eventLocation: {
    marginBottom: 8,
  },
  eventLocationCity: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 2,
  },
  eventLocationVenue: {
    fontSize: 13,
    color: '#CCCCCC',
  },
  eventOrganizer: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  eventRightSection: {
    alignItems: 'flex-end',
  },
  ticketBadge: {
    backgroundColor: '#FCFC65',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  ticketBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FCFC65',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonCircle: {
    backgroundColor: '#333333',
  },
});
