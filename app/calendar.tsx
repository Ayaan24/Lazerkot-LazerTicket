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
  FlatList,
  ImageBackground,
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
  hasUserTicket?: boolean;
}

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(null);
  const [userTickets, setUserTickets] = useState<Set<string>>(new Set());
  const [userTicketStatus, setUserTicketStatus] = useState<Map<string, boolean>>(new Map()); // eventId -> used

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Load user tickets
  useEffect(() => {
    async function loadTickets() {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const ticketKeys = allKeys.filter(key => key.startsWith(TICKET_STORAGE_PREFIX));
        const tickets = new Set<string>();
        const ticketStatus = new Map<string, boolean>();
        
        for (const key of ticketKeys) {
          const storedTicket = await AsyncStorage.getItem(key);
          if (storedTicket) {
            const ticket = JSON.parse(storedTicket);
            tickets.add(ticket.eventId);
            ticketStatus.set(ticket.eventId, ticket.used || false);
          }
        }
        setUserTickets(tickets);
        setUserTicketStatus(ticketStatus);
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
      const hasUserTicket = events.some(event => userTickets.has(event.id));

      days.push({
        date: dayDate,
        month: dayMonth,
        year: dayYear,
        isCurrentMonth,
        isToday: isToday(dayDate),
        hasEvent,
        events,
        hasUserTicket,
      });
    }

    return days;
  }, [currentMonth, currentYear, userTickets]);

  function handleDatePress(day: CalendarDay) {
    if (day.hasEvent) {
      setSelectedDate(day);
    } else {
      setSelectedDate(null);
    }
  }

  function handlePreviousMonth() {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  }

  function handleEventPress(event: Event) {
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
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
              {day.hasUserTicket && (
                <View style={styles.ticketIconContainer}>
                  <Ionicons name="ticket" size={12} color="#FCFC65" />
                </View>
              )}
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

        {/* Events List Below Calendar */}
        {selectedDate && selectedDate.events.length > 0 && (
          <View style={styles.eventsSection}>
            <Text style={styles.eventsSectionTitle}>
              {new Date(selectedDate.year, selectedDate.month, selectedDate.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            {selectedDate.events.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.eventCard}
                onPress={() => handleEventPress(item)}
              >
                <ImageBackground
                  source={{ uri: item.image || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' }}
                  style={styles.eventCardBackground}
                  imageStyle={styles.eventCardImageStyle}
                  resizeMode="cover"
                >
                  <View style={styles.eventCardOverlay} />
                  <View style={styles.eventCardContent}>
                    <View style={styles.eventCardHeader}>
                      <Text style={styles.eventCardName} numberOfLines={2}>{item.name}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.eventCardArrow} />
                    </View>
                    <View style={styles.eventCardDetails}>
                      <View style={styles.eventCardDetailRow}>
                        <Ionicons name="time-outline" size={16} color="#FCFC65" />
                        <Text style={styles.eventCardTime} numberOfLines={1}>{item.time}</Text>
                      </View>
                      <View style={styles.eventCardDetailRow}>
                        <Ionicons name="location-outline" size={16} color="#FCFC65" />
                        <Text style={styles.eventCardLocation} numberOfLines={1}>{item.location}</Text>
                      </View>
                    </View>
                    {userTickets.has(item.id) && (
                      <View style={[
                        styles.ticketBadge,
                        userTicketStatus.get(item.id) && styles.ticketBadgeUsed
                      ]}>
                        <Ionicons 
                          name={userTicketStatus.get(item.id) ? "checkmark-circle" : "ticket"} 
                          size={14} 
                          color="#000000" 
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.ticketBadgeText}>
                          {userTicketStatus.get(item.id) ? 'Ticket Used' : 'You have a ticket'}
                        </Text>
                      </View>
                    )}
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    flexGrow: 1,
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
  ticketIconContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 10,
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
  eventsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  eventsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  eventCard: {
    width: '100%',
    height: 240,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventCardBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  eventCardImageStyle: {
    borderRadius: 12,
  },
  eventCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  eventCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
    padding: 16,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventCardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventCardDetails: {
    gap: 8,
    marginBottom: 8,
  },
  eventCardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  eventCardTime: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventCardLocation: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventCardArrow: {
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 4,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FCFC65',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  ticketBadgeUsed: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#666666',
  },
  ticketBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
});
