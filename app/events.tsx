/**
 * Events Screen
 * Displays available events and allows ticket purchase
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { getWalletAddress, convertWalletInfo } from '@/lib/lazorkit';
import { ticketExists, getTicketData } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock event data (hardcoded as per requirements)
const MOCK_EVENT = {
  id: 'summer-festival-2024',
  name: 'Summer Music Festival 2024',
  date: 'July 15, 2024',
  time: '6:00 PM',
  location: 'Central Park, New York',
  price: 50, // USDC
};

export default function EventsScreen() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);
  const [hasTicket, setHasTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticketUsed, setTicketUsed] = useState(false);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    checkTestMode();
  }, [isConnected]);

  async function checkTestMode() {
    try {
      // Check if test mode is enabled for local testing
      const testModeEnabled = await AsyncStorage.getItem('test_mode');
      
      if (testModeEnabled === 'enabled') {
        // In test mode, create a mock wallet address for testing
        const mockWalletAddress = new PublicKey('11111111111111111111111111111112');
        setWalletPublicKey(mockWalletAddress);
        setTestMode(true);
        await loadWalletAndTicketStatusTestMode(mockWalletAddress);
        setLoading(false);
        return;
      }

      // Normal mode: require wallet connection
      if (!isConnected) {
        router.replace('/login');
        return;
      }
      setTestMode(false);
      loadWalletAndTicketStatus();
    } catch (error) {
      console.error('Error checking test mode:', error);
      // Fall back to normal mode
      if (!isConnected) {
        router.replace('/login');
        return;
      }
      loadWalletAndTicketStatus();
    }
  }

  async function loadWalletAndTicketStatusTestMode(mockPublicKey: PublicKey) {
    try {
      // Check if user already has a ticket in test mode
      const ticketExistsResult = await ticketExists(
        mockPublicKey,
        MOCK_EVENT.id
      );

      if (ticketExistsResult) {
        const ticketData = await getTicketData(
          mockPublicKey,
          MOCK_EVENT.id
        );
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
      // In test mode, use mock wallet
      const testModeEnabled = await AsyncStorage.getItem('test_mode');
      if (testModeEnabled === 'enabled') {
        const mockWalletAddress = new PublicKey('11111111111111111111111111111112');
        setWalletPublicKey(mockWalletAddress);
        setTestMode(true);
        
        const ticketExistsResult = await ticketExists(
          mockWalletAddress,
          MOCK_EVENT.id
        );
        
        if (ticketExistsResult) {
          const ticketData = await getTicketData(
            mockWalletAddress,
            MOCK_EVENT.id
          );
          if (ticketData) {
            setHasTicket(true);
            setTicketUsed(ticketData.used);
          }
        }
        setLoading(false);
        return;
      }

      // Normal mode: require wallet connection
      if (!isConnected) {
        router.replace('/login');
        return;
      }

      // For now, in normal mode, use a placeholder until wallet is available
      // In production, get actual wallet from SDK
      const mockPublicKey = new PublicKey('11111111111111111111111111111112');
      setWalletPublicKey(mockPublicKey);

      // Check if user already has a ticket
      const ticketExistsResult = await ticketExists(
        mockPublicKey,
        MOCK_EVENT.id
      );

      if (ticketExistsResult) {
        const ticketData = await getTicketData(
          mockPublicKey,
          MOCK_EVENT.id
        );
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
    // Navigate to buy ticket screen
    // In test mode, walletPublicKey is already set
    // In normal mode, walletPublicKey should be set from wallet
    router.push('/buy-ticket');
  }

  function handleViewTicket() {
    // Navigate to my ticket screen
    router.push('/my-ticket');
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  // Allow test mode or require wallet connection
  if (!walletPublicKey && !testMode) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Available Events</Text>
            <Text style={styles.subtitle}>Browse and purchase tickets</Text>
          </View>
          {testMode && (
            <TouchableOpacity
              style={styles.testModeBadge}
              onPress={async () => {
                await AsyncStorage.removeItem('test_mode');
                router.replace('/login');
              }}
            >
              <Text style={styles.testModeText}>🧪 TEST MODE</Text>
              <Text style={styles.testModeSubtext}>Tap to exit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.eventCard}>
        <Text style={styles.eventName}>{MOCK_EVENT.name}</Text>
        
        <View style={styles.eventDetails}>
          <View style={styles.eventRow}>
            <Text style={styles.eventLabel}>Date:</Text>
            <Text style={styles.eventValue}>{MOCK_EVENT.date}</Text>
          </View>
          
          <View style={styles.eventRow}>
            <Text style={styles.eventLabel}>Time:</Text>
            <Text style={styles.eventValue}>{MOCK_EVENT.time}</Text>
          </View>
          
          <View style={styles.eventRow}>
            <Text style={styles.eventLabel}>Location:</Text>
            <Text style={styles.eventValue}>{MOCK_EVENT.location}</Text>
          </View>
          
          <View style={styles.eventRow}>
            <Text style={styles.eventLabel}>Price:</Text>
            <Text style={[styles.eventValue, styles.priceText]}>
              {MOCK_EVENT.price} USDC
            </Text>
          </View>
        </View>

        <View style={styles.ticketStatus}>
          {hasTicket ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {ticketUsed ? 'Ticket Used' : 'Ticket Owned'}
              </Text>
            </View>
          ) : (
            <Text style={styles.noTicketText}>No ticket purchased</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            hasTicket && styles.actionButtonSecondary,
          ]}
          onPress={hasTicket ? handleViewTicket : handleBuyTicket}
        >
          <Text style={styles.actionButtonText}>
            {hasTicket ? 'View Ticket' : 'Buy Ticket'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About This Demo</Text>
        <Text style={styles.infoText}>
          This is a demonstration of walletless, biometric-first ticket
          purchase using LazorKit. Your wallet is managed automatically
          and transactions are gasless.
        </Text>
      </View>
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
  eventCard: {
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
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  eventValue: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  priceText: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  ticketStatus: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusText: {
    color: '#065f46',
    fontWeight: '600',
    fontSize: 14,
  },
  noTicketText: {
    color: '#666',
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
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
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
  testModeBadge: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 12,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderStyle: 'dashed',
  },
  testModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  testModeSubtext: {
    fontSize: 9,
    color: '#78350f',
    fontStyle: 'italic',
  },
});

