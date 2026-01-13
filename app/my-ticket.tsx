/**
 * My Ticket Screen
 * Shows all tickets with toggle for used/unused and full ticket view
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
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { getTicketData } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Ionicons } from '@expo/vector-icons';
import { getEventById, EVENTS } from '@/lib/events';

const TICKET_STORAGE_PREFIX = 'demo_ticket_';

interface TicketWithEvent {
  eventId: string;
  event: any;
  used: boolean;
  bookingRef: string;
}

export default function MyTicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedEventId = params.eventId as string | undefined;
  
  const { isConnected } = useWallet();
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);
  const [allTickets, setAllTickets] = useState<TicketWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [selectedTicket, setSelectedTicket] = useState<TicketWithEvent | null>(null);

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
        await loadAllTickets(mockWalletAddress);
        return;
      }

      if (!isConnected) {
        router.replace('/login');
        return;
      }

      const mockWalletAddress = new PublicKey('11111111111111111111111111111112');
      setWalletPublicKey(mockWalletAddress);
      setTestMode(false);
      await loadAllTickets(mockWalletAddress);
    } catch (error) {
      console.error('Error checking test mode:', error);
      router.replace('/login');
    }
  }

  async function loadAllTickets(publicKey: PublicKey) {
    try {
      const tickets: TicketWithEvent[] = [];
      
      // Get all tickets from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const ticketKeys = allKeys.filter(key => key.startsWith(TICKET_STORAGE_PREFIX));
      
      for (const key of ticketKeys) {
        const walletId = publicKey.toBase58();
        if (key.includes(walletId)) {
          const storedTicket = await AsyncStorage.getItem(key);
          if (storedTicket) {
            const ticket = JSON.parse(storedTicket);
            const event = getEventById(ticket.eventId);
            if (event) {
              const bookingRef = `TKT-2024-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
              tickets.push({
                eventId: ticket.eventId,
                event,
                used: ticket.used || false,
                bookingRef,
              });
            }
          }
        }
      }

      // If no tickets found, create some demo tickets
      if (tickets.length === 0) {
        const demoEvents = EVENTS.slice(0, 5);
        for (const event of demoEvents) {
          const bookingRef = `TKT-2024-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
          tickets.push({
            eventId: event.id,
            event,
            used: Math.random() > 0.5,
            bookingRef,
          });
        }
      }

      setAllTickets(tickets);
      
      // If eventId is provided, select that ticket
      if (selectedEventId) {
        const ticket = tickets.find(t => t.eventId === selectedEventId);
        if (ticket) {
          setSelectedTicket(ticket);
        }
      } else if (tickets.length > 0) {
        setSelectedTicket(tickets[0]);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleEnterEvent(ticket: TicketWithEvent) {
    router.push({
      pathname: '/entry',
      params: { eventId: ticket.eventId },
    });
  }

  function handleTicketSelect(ticket: TicketWithEvent) {
    setSelectedTicket(ticket);
  }

  const filteredTickets = allTickets.filter(ticket => {
    if (filter === 'used') return ticket.used;
    if (filter === 'unused') return !ticket.used;
    return true;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Tickets" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FCFC65" />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  if (allTickets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Tickets" showBack={true} />
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={64} color="#666666" />
          <Text style={styles.emptyText}>No tickets found</Text>
          <Text style={styles.emptySubtext}>Purchase tickets to see them here</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/events')}
          >
            <Text style={styles.browseButtonText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Tickets" showBack={true} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Toggle Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All ({allTickets.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unused' && styles.filterButtonActive]}
            onPress={() => setFilter('unused')}
          >
            <Text style={[styles.filterText, filter === 'unused' && styles.filterTextActive]}>
              Unused ({allTickets.filter(t => !t.used).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'used' && styles.filterButtonActive]}
            onPress={() => setFilter('used')}
          >
            <Text style={[styles.filterText, filter === 'used' && styles.filterTextActive]}>
              Used ({allTickets.filter(t => t.used).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ticket Cards List */}
        <View style={styles.ticketsListContainer}>
          <Text style={styles.sectionTitle}>Your Tickets</Text>
          {filter === 'unused' && filteredTickets.length === 0 ? (
            <View style={styles.emptyFilterContainer}>
              <Ionicons name="ticket-outline" size={48} color="#666666" />
              <Text style={styles.emptyFilterText}>No Unused Tickets</Text>
              <Text style={styles.emptyFilterSubtext}>
                All your tickets have been used.{'\n'}
                Browse events to purchase new tickets.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTickets}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.eventId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.ticketCard,
                    selectedTicket?.eventId === item.eventId && styles.ticketCardSelected,
                  ]}
                  onPress={() => handleTicketSelect(item)}
                >
                  <ImageBackground
                    source={{ uri: item.event.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' }}
                    style={styles.ticketCardImage}
                    imageStyle={styles.ticketCardImageStyle}
                    resizeMode="cover"
                  >
                    <View style={styles.ticketCardOverlay} />
                    <View style={styles.ticketCardContent}>
                      <View style={[styles.ticketCardStatus, item.used && styles.ticketCardStatusUsed]}>
                        <Text style={[styles.ticketCardStatusText, item.used && styles.ticketCardStatusTextUsed]}>
                          {item.used ? 'Used' : 'Valid'}
                        </Text>
                      </View>
                      <Text style={styles.ticketCardEventName} numberOfLines={2}>
                        {item.event.name}
                      </Text>
                      <Text style={styles.ticketCardDate}>{item.event.date}</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.ticketsListContent}
            />
          )}
        </View>

        {/* Full Ticket View */}
        {selectedTicket && filteredTickets.length > 0 && (
          <View style={styles.fullTicketContainer}>
            <View style={styles.fullTicketCard}>
              {/* Event Image */}
              <ImageBackground
                source={{ uri: selectedTicket.event.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' }}
                style={styles.ticketImage}
                imageStyle={styles.ticketImageStyle}
                resizeMode="cover"
              >
                <View style={styles.imageOverlay} />
              </ImageBackground>

              {/* Ticket Content */}
              <View style={styles.ticketContent}>
                <Text style={styles.eventOrganizerLabel}>Local Music Present</Text>
                <Text style={styles.eventName}>{selectedTicket.event.name}</Text>
                
                {/* Two Column Layout for Details */}
                <View style={styles.ticketDetailsGrid}>
                  <View style={styles.detailsColumn}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>{selectedTicket.event.date}</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Check In Type</Text>
                      <Text style={styles.detailValue}>General Admission</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Place</Text>
                      <Text style={styles.detailValue}>{selectedTicket.event.location}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailsColumn}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Time</Text>
                      <Text style={styles.detailValue}>{selectedTicket.event.time}</Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Order ID</Text>
                      <Text style={styles.detailValue}>{selectedTicket.bookingRef}</Text>
                    </View>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={styles.statusSection}>
                  <View style={[styles.statusBadge, selectedTicket.used && styles.statusBadgeUsed]}>
                    <Text style={[styles.statusText, selectedTicket.used && styles.statusTextUsed]}>
                      {selectedTicket.used ? 'Used' : 'Valid'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Perforated Line with Semi-circles */}
              <View style={styles.perforatedLineContainer}>
                <View style={styles.leftCutout}>
                  <View style={styles.semiCircle} />
                </View>
                
                <View style={styles.perforatedLine}>
                  <View style={styles.perforatedLineLeft} />
                  <View style={styles.perforatedLineDots}>
                    {[...Array(25)].map((_, i) => (
                      <View key={i} style={styles.perforatedDot} />
                    ))}
                  </View>
                  <View style={styles.perforatedLineRight} />
                </View>
                
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
                <Text style={styles.barcodeText}>{selectedTicket.bookingRef}</Text>
              </View>
            </View>

            {/* Action Button */}
            {!selectedTicket.used && (
              <TouchableOpacity
                style={styles.enterButton}
                onPress={() => handleEnterEvent(selectedTicket)}
              >
                <Text style={styles.enterButtonText}>Enter Event</Text>
              </TouchableOpacity>
            )}

            {selectedTicket.used && (
              <View style={styles.usedInfo}>
                <Text style={styles.usedInfoText}>
                  This ticket has already been used for entry.
                </Text>
              </View>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#FCFC65',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FCFC65',
    borderColor: '#FCFC65',
  },
  filterText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  ticketsListContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  ticketsListContent: {
    paddingRight: 20,
  },
  emptyFilterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyFilterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyFilterSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  ticketCard: {
    width: 200,
    height: 280,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333333',
  },
  ticketCardSelected: {
    borderColor: '#FCFC65',
    borderWidth: 2,
  },
  ticketCardImage: {
    width: '100%',
    height: '100%',
  },
  ticketCardImageStyle: {
    borderRadius: 14,
  },
  ticketCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ticketCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  ticketCardStatus: {
    alignSelf: 'flex-start',
    backgroundColor: '#FCFC65',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  ticketCardStatusUsed: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#666666',
  },
  ticketCardStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  ticketCardStatusTextUsed: {
    color: '#999999',
  },
  ticketCardEventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 'auto',
    marginBottom: 8,
  },
  ticketCardDate: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  fullTicketContainer: {
    marginTop: 24,
  },
  ticketContainer: {
    marginBottom: 24,
    marginHorizontal: 0,
  },
  fullTicketCard: {
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
});
