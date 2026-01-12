/**
 * Header Component
 * Reusable header with profile and search or back button
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  greeting?: string;
  title: string;
  showSearch?: boolean;
  showBack?: boolean;
  onSearchPress?: () => void;
  onBackPress?: () => void;
  onSearchChange?: (text: string) => void;
}

export default function Header({ 
  greeting = 'Hi, User', 
  title, 
  showSearch = false,
  showBack = false,
  onSearchPress,
  onBackPress,
  onSearchChange
}: HeaderProps) {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (onSearchChange) {
      onSearchChange(text);
    }
  };

  if (showBack) {
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
    );
  }

  return (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>U</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.mainTitle}>{title}</Text>
          </View>
        </View>
      </View>
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#999999"
            value={searchText}
            onChangeText={handleSearchChange}
            onFocus={onSearchPress}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FCFC65',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  greeting: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 24,
  },
});
