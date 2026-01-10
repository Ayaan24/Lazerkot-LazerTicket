/**
 * My Ticket Screen
 * Displays ticket details and allows entry verification
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
import { getWalletAddress } from '@/lib/lazorkit';
import { getTicketData } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

      // For normal mode, try to get wallet from SDK state
      // Since wallet property isn't available, use mock for now
      // In production, this would get actual wallet from SDK
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
        // Ticket doesn't exist, redirect to events
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading ticket...</Text>
      </View>
    );
  }

  if (!ticketData || !walletPublicKey) {
    return null;
  }

  const isUsed = ticketData.used;
  const isValid = !isUsed;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Ticket</Text>
          {testMode && (
            <View style={styles.testModeBadge}>
              <Text style={styles.testModeText}>🧪 TEST MODE</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <Text style={styles.eventName}>{MOCK_EVENT.name}</Text>
          <View style={[styles.statusBadge, isUsed && styles.statusBadgeUsed]}>
            <Text style={[styles.statusText, isUsed && styles.statusTextUsed]}>
              {isValid ? 'Valid' : 'Used'}
            </Text>
          </View>
        </View>

        <View style={styles.ticketDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{MOCK_EVENT.date}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{MOCK_EVENT.time}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{MOCK_EVENT.location}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ticket Type:</Text>
            <Text style={styles.detailValue}>General Admission</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price Paid:</Text>
            <Text style={styles.detailValue}>{MOCK_EVENT.price} USDC</Text>
          </View>
        </View>

        {isUsed && (
          <View style={styles.usedWarning}>
            <Text style={styles.usedWarningText}>
              This ticket has already been used for entry.
            </Text>
          </View>
        )}
      </View>

      {isValid && (
        <View style={styles.actionSection}>
          <Text style={styles.actionDescription}>
            Use Face ID to verify your identity and enter the event.
            Your ticket will be marked as used after entry.
          </Text>

          <TouchableOpacity
            style={styles.enterButton}
            onPress={handleEnterEvent}
          >
            <Text style={styles.enterButtonText}>Enter Event</Text>
          </TouchableOpacity>
        </View>
      )}

      {isUsed && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Ticket Already Used</Text>
          <Text style={styles.infoText}>
            This ticket was used for entry verification. Each ticket can only be used once.
          </Text>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About Your Ticket</Text>
        <Text style={styles.infoText}>
          Your ticket is stored on-chain as a Program Derived Address (PDA).
          It cannot be transferred and can only be used once for entry verification.
          No wallet address is exposed - your identity is verified via Face ID.
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
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  eventName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusBadgeUsed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    color: '#065f46',
    fontWeight: '600',
    fontSize: 12,
  },
  statusTextUsed: {
    color: '#991b1b',
  },
  ticketDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 16,
  },
  usedWarning: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  usedWarningText: {
    color: '#991b1b',
    fontSize: 14,
    textAlign: 'center',
  },
  actionSection: {
    marginBottom: 20,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  enterButton: {
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
  enterButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
});

