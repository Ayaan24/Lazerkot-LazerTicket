/**
 * Onboarding Screen
 * Two slides introducing wallet creation and NFT tickets
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_STORAGE_KEY = '@onboarding_completed';

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const slides = [
    {
      title: 'Create Your Wallet',
      description: 'Create your wallet using Face ID and make gasless USDC transfer to buy tickets',
      illustration: 'wallet',
    },
    {
      title: 'Get Your Tickets as NFT',
      description: 'Your tickets are stored as NFTs on the blockchain. Secure, verifiable, and truly yours.',
      illustration: 'ticket',
    },
  ];

  async function handleSkip() {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    router.replace('/login');
  }

  async function handleNext() {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      router.replace('/login');
    }
  }

  function handleScroll(event: any) {
    const offsetX = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentSlide(slideIndex);
  }

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeAreaTop} />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEnabled={false}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            {/* Illustration Section */}
            <View style={styles.illustrationContainer}>
              {slide.illustration === 'wallet' ? (
                <Image
                  source={require('@/assets/illust1.png')}
                  style={styles.illustrationImage}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require('@/assets/illust2.png')}
                  style={styles.illustrationImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Content Section */}
            <View style={[styles.contentCard, { paddingBottom: 40 + insets.bottom }]}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>

              {/* Pagination Indicators */}
              <View style={styles.pagination}>
                {slides.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.paginationDot,
                      i === currentSlide && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>

              {/* Buttons */}
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                >
                  <Text style={styles.nextButtonText}>
                    {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.safeAreaBottom, { height: insets.bottom }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeAreaTop: {
    backgroundColor: '#FFFFFF',
  },
  safeAreaBottom: {
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  illustrationPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  illustrationLines: {
    width: '80%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Wallet illustration styles
  faceIdCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FCFC65',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  faceIdRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#FCFC65',
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  walletCard: {
    width: 200,
    height: 120,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  walletCardLine: {
    height: 2,
    backgroundColor: '#333333',
    borderRadius: 1,
    width: '100%',
  },
  transferLines: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  transferArrow: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usdcBadge: {
    backgroundColor: '#FCFC65',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  usdcText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  // NFT ticket illustration styles
  ticketShape: {
    width: 240,
    height: 180,
    marginBottom: 30,
  },
  ticketTop: {
    width: '100%',
    height: 40,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  ticketBody: {
    width: '100%',
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 16,
    justifyContent: 'space-between',
  },
  ticketLine: {
    height: 2,
    backgroundColor: '#333333',
    borderRadius: 1,
    width: '100%',
  },
  ticketBottom: {
    width: '100%',
    height: 40,
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  nftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  nftText: {
    color: '#FCFC65',
    fontSize: 18,
    fontWeight: '700',
  },
  blockchainLines: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  blockchainLink: {
    width: 40,
    height: 4,
    backgroundColor: '#FCFC65',
    borderRadius: 2,
  },
  contentCard: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    minHeight: 320,

  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666666',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#FCFC65',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#FCFC65',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});
