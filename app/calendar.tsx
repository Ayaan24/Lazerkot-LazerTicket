/**
 * Calendar Screen
 * Shows calendar with events marked and popup on date click
 */

import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Ionicons } from '@expo/vector-icons';
import { EVENTS, Event } from '@/lib/events';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TICKET_STORAGE_PREFIX = 'demo_ticket_';

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvent: boolean;
  events: Event[];
}

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [userTickets, setUserTickets] = useState<Set<string>>(new Set());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Load user tickets
  useEffect(() => {
    async function loadTickets() {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const ticketKeys = allKeys.filter(key => key.startsWith(TICKET_STORAGE_PREFIX));
        const tickets = new Set<string>();
        
        for (const key of ticketKeys) {
          const storedTicket = await AsyncStorage.getItem(key);
          if (storedTicket) {
            const ticket = JSON.parse(storedTicket);
            tickets.add(ticket.eventId);
          }
        }
        setUserTickets(tickets);
      } catch (error) {
        console.error('Error loading tickets:', error);
      }
    }
    loadTickets();
  }, []);

  // Get events for a specific date
  function getEventsForDate(year: number, month: number, date: number): Event[] {
    const foundEvents = EVENTS.filter(event => {
      try {
        // Parse date string like "January 15, 2026" or "February 01, 2026"
        // Manually parse to handle all formats reliably
        const dateParts = event.date.split(' ');
        if (dateParts.length !== 3) {
          return false;
        }
        
        const monthName = dateParts[0];
        const dayStr = dateParts[1].replace(',', '');
        const day = parseInt(dayStr, 10);
        const yearStr = dateParts[2];
        
        const monthMap: { [key: string]: number } = {
          'January': 0, 'February': 1, 'March': 2, 'April': 3,
          'May': 4, 'June': 5, 'July': 6, 'August': 7,
          'September': 8, 'October': 9, 'November': 10, 'December': 11
        };
        
        const monthNum = monthMap[monthName];
        if (monthNum === undefined || isNaN(day) || isNaN(parseInt(yearStr, 10))) {
          return false;
        }
        
        const eventDate = new Date(parseInt(yearStr, 10), monthNum, day);
        
        if (isNaN(eventDate.getTime())) {
          return false;
        }
        
        const matches = (
          eventDate.getFullYear() === year &&
          eventDate.getMonth() === month &&
          eventDate.getDate() === date
        );
        
        return matches;
      } catch (error) {
        return false;
      }
    });
    return foundEvents;
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

    const today = new Date();
    const isToday = (date: number) => {
      return (
        date === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear()
      );
    };

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayDate = date.getDate();
      const dayMonth = date.getMonth();
      const dayYear = date.getFullYear();
      const isCurrentMonth = dayMonth === currentMonth;
      
      const events = getEventsForDate(dayYear, dayMonth, dayDate);
      const hasEvent = events.length > 0;

      days.push({
        date: dayDate,
        month: dayMonth,
        year: dayYear,
        isCurrentMonth,
        isToday: isToday(dayDate),
        hasEvent,
        events,
      });
    }

    return days;
  }, [currentMonth, currentYear, userTickets]);

  function handleDatePress(day: CalendarDay) {
    if (day.hasEvent) {
      setSelectedDate(day);
      setShowPopup(true);
    }
  }

  function handlePreviousMonth() {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  }

  function handleEventPress(event: Event) {
    setShowPopup(false);
    router.push({
      pathname: userTickets.has(event.id) ? '/my-ticket' : '/buy-ticket',
      params: { eventId: event.id },
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Calendar" showBack={true} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Month Navigation */}
        <View style={styles.monthContainer}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Day Names Header */}
        <View style={styles.dayNamesContainer}>
          {dayNames.map((day, index) => (
            <View key={index} style={styles.dayNameCell}>
              <Text style={styles.dayNameText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarCell,
                !day.isCurrentMonth && styles.calendarCellInactive,
              ]}
              onPress={() => handleDatePress(day)}
              disabled={!day.hasEvent}
            >
              {day.hasEvent && !day.isToday ? (
                <View style={styles.calendarCellHasEvent}>
                  <Text style={styles.calendarDateTextHasEvent}>
                    {day.date}
                  </Text>
                </View>
              ) : day.isToday ? (
                <View style={styles.calendarCellToday}>
                  <Text style={styles.calendarDateTextToday}>
                    {day.date}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.calendarDateText,
                    !day.isCurrentMonth && styles.calendarDateTextInactive,
                    day.isCurrentMonth && styles.calendarDateTextNormal,
                  ]}
                >
                  {day.date}
                </Text>
              )}
              {day.hasEvent && !day.isToday && (
                <View style={styles.eventIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Event Popup Modal */}
      <Modal
        visible={showPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && new Date(selectedDate.year, selectedDate.month, selectedDate.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPopup(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedDate?.events || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.eventCard}
                  onPress={() => handleEventPress(item)}
                >
                  <View style={styles.eventCardContent}>
                    <Text style={styles.eventCardName}>{item.name}</Text>
                    <Text style={styles.eventCardTime}>{item.time}</Text>
                    <Text style={styles.eventCardLocation}>{item.location}</Text>
                    {userTickets.has(item.id) && (
                      <View style={styles.ticketBadge}>
                        <Text style={styles.ticketBadgeText}>You have a ticket</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999999" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyEvents}>
                  <Text style={styles.emptyEventsText}>No events on this date</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

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
  monthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  monthButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
    minHeight: 50,
  },
  calendarCellInactive: {
    opacity: 0.3,
  },
  calendarCellToday: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCellHasEvent: {
    backgroundColor: '#FCFC65',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendarDateTextNormal: {
    color: '#FFFFFF',
  },
  calendarDateTextInactive: {
    color: '#666666',
  },
  calendarDateTextToday: {
    color: '#000000',
    fontWeight: '700',
  },
  calendarDateTextHasEvent: {
    color: '#000000',
    fontWeight: '700',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FCFC65',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  eventCardContent: {
    flex: 1,
  },
  eventCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventCardTime: {
    fontSize: 14,
    color: '#FCFC65',
    marginBottom: 2,
  },
  eventCardLocation: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  ticketBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FCFC65',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  ticketBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  emptyEvents: {
    padding: 40,
    alignItems: 'center',
  },
  emptyEventsText: {
    fontSize: 14,
    color: '#999999',
  },
});
