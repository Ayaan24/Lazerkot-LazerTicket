/**
 * Footer Navigation Component
 * Reusable footer with rounded design and icons
 */

import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <View style={styles.footer}>
      <TouchableOpacity 
        style={styles.footerButton}
        onPress={() => router.push('/events')}
      >
        {isActive('/events') ? (
          <View style={styles.footerIconActive}>
            <Ionicons name="home" size={24} color="#000000" />
          </View>
        ) : (
          <Ionicons name="home-outline" size={24} color="#000000" />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.footerButton}
        onPress={() => router.push('/my-ticket')}
      >
        {isActive('/my-ticket') ? (
          <View style={styles.footerIconActive}>
            <MaterialIcons name="local-activity" size={24} color="#000000" />
          </View>
        ) : (
          <MaterialIcons name="local-activity" size={24} color="#000000" />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.footerButton}
        onPress={() => router.push('/calendar')}
      >
        {isActive('/calendar') ? (
          <View style={styles.footerIconActive}>
            <Ionicons name="calendar" size={24} color="#000000" />
          </View>
        ) : (
          <Ionicons name="calendar-outline" size={24} color="#000000" />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.footerButton}
        onPress={() => router.push('/finance')}
      >
        {isActive('/finance') ? (
          <View style={styles.footerIconActive}>
            <Ionicons name="wallet" size={24} color="#000000" />
          </View>
        ) : (
          <Ionicons name="wallet-outline" size={24} color="#000000" />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.footerButton}
        onPress={() => router.push('/profile')}
      >
        {isActive('/profile') ? (
          <View style={styles.footerIconActive}>
            <Ionicons name="person" size={24} color="#000000" />
          </View>
        ) : (
          <Ionicons name="person-outline" size={24} color="#000000" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fcfc65',
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
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
