/**
 * Finance/Wallet Screen
 * Wallet UI with balance, send/receive, and cryptocurrency cards
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Ionicons } from '@expo/vector-icons';

interface Wallet {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  balance: string;
  change: number;
  color: string;
  logo: any; // Image source
}

interface Trending {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  value: string;
  change: number;
  color: string;
  logo: any; // Image source
}

export default function FinanceScreen() {
  const router = useRouter();
  const [currentBalance] = useState('56.085');
  
  const wallets: Wallet[] = [
    {
      id: 'phantom',
      name: 'Phantom',
      symbol: 'PHANTOM',
      amount: '0.2215',
      balance: '31,426.70',
      change: 2.4,
      color: '#AB9FF2',
      logo: require('@/assets/phantom.png'),
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      symbol: 'JUP',
      amount: '0.212',
      balance: '32,120.50',
      change: -1.2,
      color: '#0B3533',
      logo: require('@/assets/jup.webp'),
    },
  ];

  const trending: Trending[] = [
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      amount: '1 ETH',
      value: '1,571.45',
      change: 8.75,
      color: '#627EEA',
      logo: require('@/assets/eth.png'),
    },
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      amount: '0.02 BTC',
      value: '406.95',
      change: 1.85,
      color: '#F7931A',
      logo: require('@/assets/Bitcoin.svg.webp'),
    },
    {
      id: 'solana',
      name: 'Solana',
      symbol: 'SOL',
      amount: '5.5 SOL',
      value: '825.30',
      change: 3.2,
      color: '#9945FF',
      logo: require('@/assets/Solana_logo.png'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Finance" showBack={true} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Current Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>${currentBalance}</Text>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-up-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionButtonText}>Transfer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-down-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionButtonText}>Receive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="add-circle-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionButtonText}>Top Up</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="scan-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionButtonText}>Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Wallet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Wallet</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletCardsContainer}
          >
            {wallets.map((wallet) => (
              <TouchableOpacity 
                key={wallet.id} 
                style={[styles.walletCard, { backgroundColor: wallet.color }]}
              >
                <View style={styles.walletCardHeader}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <View style={styles.walletLogo}>
                    {typeof wallet.logo === 'string' ? (
                      <Text style={styles.walletLogoText}>{wallet.logo}</Text>
                    ) : (
                      <Image source={wallet.logo} style={styles.walletLogoImage} resizeMode="contain" />
                    )}
                  </View>
                </View>
                <Text style={styles.walletSymbol}>{wallet.symbol} {wallet.amount}</Text>
                <Text style={styles.walletBalance}>${wallet.balance}</Text>
                <View style={styles.walletChange}>
                  <Ionicons 
                    name={wallet.change >= 0 ? "arrow-up" : "arrow-down"} 
                    size={14} 
                    color={wallet.change >= 0 ? "#00FF00" : "#FF0000"} 
                  />
                  <Text style={[
                    styles.walletChangeText,
                    { color: wallet.change >= 0 ? "#00FF00" : "#FF0000" }
                  ]}>
                    {Math.abs(wallet.change)}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending</Text>
          {trending.map((item) => (
            <TouchableOpacity key={item.id} style={styles.trendingItem}>
              <View style={[styles.trendingIcon, { backgroundColor: item.color }]}>
                {typeof item.logo === 'string' ? (
                  <Text style={styles.trendingIconText}>{item.logo}</Text>
                ) : (
                  <Image source={item.logo} style={styles.trendingIconImage} resizeMode="contain" />
                )}
              </View>
              <View style={styles.trendingInfo}>
                <Text style={styles.trendingName}>{item.name}</Text>
                <Text style={styles.trendingAmount}>{item.amount} + {item.value} $</Text>
              </View>
              <View style={styles.trendingValue}>
                <Text style={styles.trendingValueText}>${item.value}</Text>
                <Text style={[styles.trendingChange, { color: item.change >= 0 ? "#00FF00" : "#FF0000" }]}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
  balanceSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    opacity: 0.7,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FCFC65',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FCFC65',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  walletCardsContainer: {
    paddingRight: 20,
    gap: 16,
  },
  walletCard: {
    width: 200,
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  walletLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  walletLogoText: {
    fontSize: 24,
  },
  walletLogoImage: {
    width: 40,
    height: 40,
  },
  walletSymbol: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  walletChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  trendingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  trendingIconText: {
    fontSize: 24,
  },
  trendingIconImage: {
    width: 32,
    height: 32,
  },
  trendingInfo: {
    flex: 1,
  },
  trendingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trendingAmount: {
    fontSize: 12,
    color: '#999999',
  },
  trendingValue: {
    alignItems: 'flex-end',
  },
  trendingValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trendingChange: {
    fontSize: 12,
    fontWeight: '600',
  },
});
