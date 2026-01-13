/**
 * Profile/Settings Screen
 * Main profile and settings page
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Profile" showBack={true} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' }}
              style={styles.profileImage}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Hasan Kassas</Text>
          </View>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Ionicons name="pencil" size={16} color="#000000" />
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Notification</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#333333', true: '#FCFC65' }}
              thumbColor={notificationsEnabled ? '#000000' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/accounts')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="people-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Accounts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/finance')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="wallet-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Finance</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        {/* Other Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other</Text>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/legal-documents')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Legal Documents</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/add-business')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="business-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Add new Business</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/languages')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Languages</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/privacy-security')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        {/* Join the Family Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join the family</Text>
          <View style={styles.socialIconsContainer}>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-instagram" size={32} color="#FCFC65" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="musical-notes" size={32} color="#FCFC65" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-snapchat" size={32} color="#FCFC65" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-whatsapp" size={32} color="#FCFC65" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support and Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support and Feedback</Text>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/bugs-suggestions')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="bug-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Bugs and Suggestions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/help-center')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="headset-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        {/* More Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Information</Text>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/privacy-policy')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/terms-of-service')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="heart-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => router.push('/logout')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        {/* Also from Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Also from LazerKit</Text>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => {}}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="apps-outline" size={24} color="#FCFC65" />
              <Text style={styles.settingText}>LazerKit App</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  profileImageContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333333',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFC65',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  socialIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#FCFC65',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
