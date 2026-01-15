/**
 * Finance/Wallet Screen
 * Wallet UI with balance, send/receive, and cryptocurrency cards
 * Integrated with LazorKit for real wallet functionality
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection, getUSDCBalance } from '@/lib/solana';
import { LAZORKIT_REDIRECT_URL } from '@/lib/lazorkit';
import { getWalletAddress } from '@/lib/secure-storage';
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
  // Access wallet hook - wallet property may not be in TypeScript types but exists at runtime
  const walletHook = useWallet() as any;
  const { isConnected, signAndSendTransaction, wallet } = walletHook;
  
  // State management
  const [solBalance, setSolBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [usdBalance, setUsdBalance] = useState<string>('0.00');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [storedWalletAddress, setStoredWalletAddress] = useState<string | null>(null);

  // Load stored wallet address on mount
  useEffect(() => {
    loadStoredWallet();
  }, []);

  // Load wallet address from secure storage
  async function loadStoredWallet() {
    try {
      const address = await getWalletAddress();
      if (address) {
        setStoredWalletAddress(address);
        console.log('Loaded stored wallet address:', address);
        // Fetch balance immediately with stored address
        fetchBalanceWithAddress(address);
      }
    } catch (error) {
      console.error('Error loading stored wallet:', error);
    }
  }

  // Check wallet connection and refresh balance when wallet changes
  useEffect(() => {
    // Check if we have wallet from SDK (prioritize SDK wallet as per LazorKit docs)
    if (wallet?.smartWallet) {
      console.log('Wallet from SDK:', wallet.smartWallet);
      setStoredWalletAddress(wallet.smartWallet);
      fetchBalance();
      return;
    }
    
    // If SDK wallet not available but we have stored address, use that
    if (!wallet?.smartWallet && storedWalletAddress) {
      console.log('Using stored wallet address:', storedWalletAddress);
      fetchBalanceWithAddress(storedWalletAddress);
      return;
    }
    
    // If no wallet at all, redirect to login
    if (!isConnected && !storedWalletAddress) {
      router.replace('/login');
      return;
    }
  }, [isConnected, wallet?.smartWallet, storedWalletAddress]);

  // Fetch SOL and USDC balances with wallet address
  async function fetchBalanceWithAddress(address: string) {
    if (!address) return;
    
    try {
      setLoading(true);
      const publicKey = new PublicKey(address);
      
      // Fetch SOL balance
      const balance = await connection.getBalance(publicKey);
      const solAmount = balance / LAMPORTS_PER_SOL;
      setSolBalance(solAmount);
      
      // Fetch USDC balance
      try {
        const usdcAmount = await getUSDCBalance(publicKey);
        setUsdcBalance(usdcAmount);
        console.log('USDC Balance fetched:', usdcAmount, 'USDC');
      } catch (usdcError) {
        console.warn('Error fetching USDC balance:', usdcError);
        setUsdcBalance(0);
      }
      
      // Estimate USD value (using approximate $150 per SOL and $1 per USDC for demo)
      // In production, fetch real-time prices from an API
      const estimatedUsd = (solAmount * 150) + usdcBalance;
      setUsdBalance(estimatedUsd.toFixed(2));
      console.log('Balance fetched:', solAmount, 'SOL,', usdcBalance, 'USDC');
    } catch (error) {
      console.error('Error fetching balance:', error);
      Alert.alert('Error', 'Failed to fetch wallet balance');
    } finally {
      setLoading(false);
    }
  }

  // Fetch SOL balance from SDK wallet
  async function fetchBalance() {
    const address = wallet?.smartWallet || storedWalletAddress;
    if (!address) return;
    
    await fetchBalanceWithAddress(address);
  }

  // Handle send transaction
  async function handleSend() {
    // Always prioritize SDK wallet address (wallet.smartWallet) as per LazorKit docs
    const walletAddress = wallet?.smartWallet || storedWalletAddress;
    
    if (!walletAddress || !recipientAddress || !sendAmount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipientAddress);
    } catch {
      Alert.alert('Error', 'Invalid recipient address');
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }

    if (amount > solBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (!signAndSendTransaction) {
      Alert.alert('Error', 'Wallet not connected. Please connect your wallet first.');
      return;
    }

    setSending(true);
    try {
      const fromPubkey = new PublicKey(walletAddress);
      const instruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey: recipientPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      });

      const signature = await signAndSendTransaction(
        {
          instructions: [instruction],
          transactionOptions: {
            clusterSimulation: 'devnet',
            feeToken: 'USDC', // Gasless transaction
          },
        },
        {
          redirectUrl: `${LAZORKIT_REDIRECT_URL}?screen=finance`,
          onSuccess: (sig: string) => {
            console.log('Transaction sent:', sig);
            Alert.alert('Success', `Transaction sent!\nSignature: ${sig.substring(0, 8)}...`);
            setShowSendModal(false);
            setRecipientAddress('');
            setSendAmount('');
            // Refresh balance after a short delay to allow transaction to confirm
            setTimeout(() => {
              const address = wallet?.smartWallet || storedWalletAddress;
              if (address) {
                fetchBalanceWithAddress(address);
              }
            }, 3000);
          },
          onFail: (error: { message: any; }) => {
            console.error('Transaction failed:', error);
            Alert.alert('Error', error.message || 'Transaction failed');
          },
        }
      );
    } catch (error: any) {
      console.error('Send error:', error);
      Alert.alert('Error', error.message || 'Failed to send transaction');
    } finally {
      setSending(false);
    }
  }

  // Copy wallet address to clipboard
  async function copyAddress() {
    const walletAddress = wallet?.smartWallet || storedWalletAddress;
    if (!walletAddress) return;
    
    // In React Native, you'd use Clipboard from @react-native-clipboard/clipboard
    // For now, we'll just show it in an alert
    Alert.alert('Wallet Address', walletAddress, [
      { text: 'OK' },
    ]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  
  // Get current wallet address (from SDK or storage)
  function getCurrentWalletAddress(): string | null {
    return wallet?.smartWallet || storedWalletAddress;
  }

  // Format address for display
  function formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  }

  const wallets: Wallet[] = [
    {
      id: 'lazorkit-sol',
      name: 'LazorKit',
      symbol: 'SOL',
      amount: solBalance.toFixed(4),
      balance: (solBalance * 150).toFixed(2),
      change: 0,
      color: '#FFFFFF',
      logo: require('@/assets/logo.png'),
    },
    {
      id: 'lazorkit-usdc',
      name: 'USDC',
      symbol: 'USDC',
      amount: usdcBalance.toFixed(2),
      balance: usdcBalance.toFixed(2),
      change: 0,
      color: '#2775CA',
      logo: require('@/assets/logo.png'),
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

  // Only show loading if we don't have any wallet address
  if (loading && !getCurrentWalletAddress()) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Finance" showBack={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FCFC65" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Finance" showBack={true} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Wallet Address Section */}
        {getCurrentWalletAddress() && (
          <View style={styles.addressSection}>
            <Text style={styles.addressLabel}>Wallet Address</Text>
            <TouchableOpacity 
              style={styles.addressContainer}
              onPress={copyAddress}
              activeOpacity={0.7}
            >
              <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                {getCurrentWalletAddress()}
              </Text>
              <Ionicons 
                name={copied ? "checkmark" : "copy-outline"} 
                size={20} 
                color="#FCFC65" 
              />
            </TouchableOpacity>
            <Text style={styles.addressHint}>
              {copied ? 'Copied!' : 'Tap to copy address'}
            </Text>
            {!wallet?.smartWallet && storedWalletAddress && (
              <Text style={[styles.addressHint, { color: '#FCFC65', marginTop: 4 }]}>
                Using stored wallet address
              </Text>
            )}
          </View>
        )}

        {/* Current Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#FCFC65" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={styles.balanceAmount}>${usdBalance}</Text>
              <View style={styles.balanceDetails}>
                <Text style={styles.solBalance}>{solBalance.toFixed(4)} SOL</Text>
                <Text style={styles.usdcBalance}>{usdcBalance.toFixed(2)} USDC</Text>
              </View>
            </>
          )}
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowSendModal(true)}
              disabled={loading || solBalance === 0}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-up-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowReceiveModal(true)}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-down-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionButtonText}>Receive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={fetchBalance}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="refresh-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionButtonText}>Refresh</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                const walletAddress = getCurrentWalletAddress();
                if (!walletAddress) {
                  Alert.alert('Error', 'Wallet address not available');
                  return;
                }
                
                Alert.alert(
                  'Airdrop (Devnet)',
                  'Request airdrop for testing?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Request',
                      onPress: async () => {
                        try {
                          const pubkey = new PublicKey(walletAddress);
                          const sig = await connection.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL);
                          await connection.confirmTransaction(sig);
                          Alert.alert('Success', 'Airdrop received!');
                          fetchBalance();
                        } catch (error: any) {
                          Alert.alert('Error', error.message || 'Airdrop failed');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="add-circle-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionButtonText}>Airdrop</Text>
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
            {wallets.map((walletItem) => (
              <TouchableOpacity 
                key={walletItem.id} 
                style={[styles.walletCard, { backgroundColor: walletItem.color }]}
              >
                <View style={styles.walletCardHeader}>
                  <Text style={styles.walletName}>{walletItem.name}</Text>
                  <View style={styles.walletLogo}>
                    {typeof walletItem.logo === 'string' ? (
                      <Text style={styles.walletLogoText}>{walletItem.logo}</Text>
                    ) : (
                      <Image source={walletItem.logo} style={styles.walletLogoImage} resizeMode="contain" />
                    )}
                  </View>
                </View>
                <Text style={styles.walletSymbol}>{walletItem.symbol} {walletItem.amount}</Text>
                <Text style={styles.walletBalance}>${walletItem.balance}</Text>
                <View style={styles.walletChange}>
                  <Ionicons 
                    name={walletItem.change >= 0 ? "arrow-up" : "arrow-down"} 
                    size={14} 
                    color={walletItem.change >= 0 ? "#00FF00" : "#FF0000"} 
                  />
                  <Text style={[
                    styles.walletChangeText,
                    { color: walletItem.change >= 0 ? "#00FF00" : "#FF0000" }
                  ]}>
                    {Math.abs(walletItem.change)}%
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

      {/* Send Modal */}
      <Modal
        visible={showSendModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSendModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send SOL</Text>
              <TouchableOpacity onPress={() => setShowSendModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Recipient Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Solana address"
                placeholderTextColor="#666666"
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Amount (SOL)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0"
                placeholderTextColor="#666666"
                value={sendAmount}
                onChangeText={setSendAmount}
                keyboardType="decimal-pad"
              />

              <Text style={styles.balanceHint}>
                Available: {solBalance.toFixed(4)} SOL
              </Text>

              <TouchableOpacity
                style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.sendButtonText}>Send Transaction</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Receive Modal */}
      <Modal
        visible={showReceiveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReceiveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receive SOL</Text>
              <TouchableOpacity onPress={() => setShowReceiveModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.receiveLabel}>Your Wallet Address</Text>
              <TouchableOpacity
                style={styles.addressDisplay}
                onPress={copyAddress}
              >
                <Text style={styles.addressDisplayText} selectable>
                  {getCurrentWalletAddress() || 'Not connected'}
                </Text>
                <Ionicons name="copy-outline" size={20} color="#FCFC65" />
              </TouchableOpacity>
              <Text style={styles.receiveHint}>
                Share this address to receive SOL. Make sure you're on Devnet for testing.
              </Text>
            </View>
          </View>
        </View>
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
    color: '#000000',
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
    color: '#000000',
    opacity: 0.7,
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  addressSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  addressLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#FCFC65',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginRight: 8,
  },
  addressHint: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  balanceDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  solBalance: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  usdcBalance: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.7,
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
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBody: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  balanceHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  sendButton: {
    backgroundColor: '#FCFC65',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  receiveLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  addressDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
  },
  addressDisplayText: {
    flex: 1,
    fontSize: 14,
    color: '#FCFC65',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginRight: 8,
  },
  receiveHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
