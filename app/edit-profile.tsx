/**
 * Edit Profile Screen
 * Edit main profile information
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const router = useRouter();
  const [location, setLocation] = useState('Dubai - DSO');
  const [company, setCompany] = useState('LazerKit Mena Fzco');
  const [phoneNumber, setPhoneNumber] = useState('+1 Phone Number');
  const [category, setCategory] = useState('eCommerce');

  const handleSave = () => {
    // Handle save logic here
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Edit Main Profile" showBack={true} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePictureContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' }}
              style={styles.profilePicture}
            />
            <TouchableOpacity style={styles.editPictureButton}>
              <Ionicons name="pencil" size={16} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Information Fields */}
        <View style={styles.fieldsSection}>
          <TouchableOpacity style={styles.field}>
            <Text style={styles.fieldText}>{location}</Text>
            <Ionicons name="chevron-down" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.field}>
            <Text style={styles.fieldText}>{company}</Text>
            <Ionicons name="chevron-down" size={20} color="#999999" />
          </TouchableOpacity>

          <View style={styles.field}>
            <TextInput
              style={styles.fieldInput}
              placeholder="+1 Phone Number"
              placeholderTextColor="#999999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity 
            style={styles.field}
            onPress={() => router.push('/category')}
          >
            <Text style={styles.fieldText}>{category}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.field}
            onPress={() => router.push('/manage-business-accounts')}
          >
            <Text style={styles.fieldText}>Manage Business Accounts</Text>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePictureContainer: {
    position: 'relative',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333333',
  },
  editPictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCFC65',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000',
  },
  fieldsSection: {
    gap: 16,
    marginBottom: 32,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  fieldText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  fieldInput: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#FCFC65',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
});
