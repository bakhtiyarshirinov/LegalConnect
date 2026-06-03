import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lawyersApi } from '../../api/lawyers';
import { appointmentsApi } from '../../api/appointments';
import { chatsApi } from '../../api/chats';
import { slotsApi } from '../../api/slots';
import { Button } from '../../components/ui/Button';
import { Review } from '../../types';
import { formatDate, formatDateOnly } from '../../utils/date';
import { useAuthStore } from '../../store/authStore';

const TYPES = ['Online', 'Offline'];

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

const formatSlotTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const LawyerProfileScreen = ({ route, navigation }: any) => {
  const { lawyerId } = route.params;
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [bookingVisible, setBookingVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [type, setType] = useState('Online');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [slotsDateStr, setSlotsDateStr] = useState('');

  const { data: lawyer, isLoading } = useQuery({
    queryKey: ['lawyer', lawyerId],
    queryFn: () => lawyersApi.getById(lawyerId).then((r) => r.data),
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ['lawyerReviews', lawyerId],
    queryFn: () => lawyersApi.getReviews(lawyerId).then((r) => r.data),
  });

  const fetchSlots = async (date: Date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    const dateStr = date.toISOString().split('T')[0];
    setSlotsDateStr(dateStr);
    try {
      const res = await slotsApi.getAvailable(lawyerId, dateStr);
      setAvailableSlots(res.data || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const onDateChange = (_: any, d?: Date) => {
    setShowDatePicker(false);
    if (d) {
      setSelectedDate(d);
      fetchSlots(d);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }
    if (!user) return;
    if (!lawyer) return;

    // Ensure scheduledAt is a valid UTC ISO string in the future
    const scheduledAt = selectedSlot.startTime.endsWith('Z')
      ? selectedSlot.startTime
      : new Date(selectedSlot.startTime).toISOString();

    if (new Date(scheduledAt) <= new Date()) {
      Alert.alert('Error', 'Selected slot is in the past. Please choose a future date.');
      return;
    }

    const durationMinutes = Math.round(
      (new Date(selectedSlot.endTime).getTime() - new Date(selectedSlot.startTime).getTime()) / 60000
    );

    const payload = {
      clientId: user.userId,
      lawyerId: lawyer.id,
      scheduledAt,
      durationMinutes: Number(durationMinutes),
      type: type === 'Online' ? 1 : 2,
      notes: notes || undefined,
      slotId: selectedSlot.id,
    };

    console.log('Booking payload:', JSON.stringify(payload, null, 2));

    setBooking(true);
    try {
      await appointmentsApi.book(payload);
      setBookingVisible(false);
      setSelectedSlot(null);
      setNotes('');
      qc.invalidateQueries({ queryKey: ['myAppointments'] });
      Alert.alert('Booked!', 'Your appointment has been created.', [
        {
          text: 'View Appointments',
          onPress: () => navigation.navigate('Appointments'),
        },
        { text: 'OK' },
      ]);
    } catch (e: any) {
      const msg =
        e.response?.data?.message ||
        e.response?.data?.errors?.[Object.keys(e.response?.data?.errors ?? {})[0]]?.[0] ||
        JSON.stringify(e.response?.data) ||
        'Failed to book appointment';
      Alert.alert('Booking Failed', msg);
    } finally {
      setBooking(false);
    }
  };

  const handleMessage = async () => {
    if (!user) return;
    try {
      const res = await chatsApi.getOrCreate({ clientId: user.userId, lawyerId: lawyer!.id });
      const chatId = res.data.chatId ?? res.data.id;
      navigation.navigate('Conversation', { chatId, name: lawyer?.fullName });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to open chat');
    }
  };

  const openBooking = () => {
    setBookingVisible(true);
    fetchSlots(selectedDate);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color="#0A0A0A" />
      </SafeAreaView>
    );
  }

  if (!lawyer) return null;

  const initials = lawyer.fullName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll}>
        <View style={styles.headerBg}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileArea}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{lawyer.fullName}</Text>
            {lawyer.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" style={{ marginLeft: 6 }} />
            )}
          </View>
          <View style={styles.cityRow}>
            <Ionicons name="location-outline" size={14} color="#6B6B6B" />
            <Text style={styles.city}>{lawyer.city}</Text>
          </View>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons key={s} name="star" size={16} color={s <= Math.round(lawyer.rating) ? '#F59E0B' : '#E8E8E8'} />
            ))}
            <Text style={styles.ratingText}>{lawyer.rating.toFixed(1)} ({lawyer.reviewCount} reviews)</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatItem label="Experience" value={`${lawyer.experienceYears} yrs`} />
          <View style={styles.statDivider} />
          <StatItem label="Rate" value={`$${lawyer.hourlyRate}/hr`} />
          <View style={styles.statDivider} />
          <StatItem label="Reviews" value={String(lawyer.reviewCount)} />
        </View>

        {lawyer.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{lawyer.bio}</Text>
          </View>
        )}

        {lawyer.specializations?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specializations</Text>
            <View style={styles.specs}>
              {lawyer.specializations.map((s: string) => (
                <View key={s} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Reviews {lawyer.reviewCount > 0 ? `(${lawyer.reviewCount})` : ''}
          </Text>
          {reviewsLoading ? (
            <ActivityIndicator color="#0A0A0A" style={{ marginVertical: 16 }} />
          ) : !reviews || reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{r.clientFullName}</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= r.rating ? 'star' : 'star-outline'}
                        size={12}
                        color={s <= r.rating ? '#F59E0B' : '#D1D5DB'}
                      />
                    ))}
                  </View>
                </View>
                {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                <Text style={styles.reviewDate}>
                  {new Date(r.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button title="Message" onPress={handleMessage} variant="outline" style={{ flex: 1, marginRight: 8 }} />
        <Button title="Book Appointment" onPress={openBooking} style={{ flex: 2 }} />
      </View>

      <Modal visible={bookingVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <TouchableOpacity onPress={() => setBookingVisible(false)}>
              <Ionicons name="close" size={24} color="#0A0A0A" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">

            <Text style={styles.fieldLabel}>Select Date</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color="#6B6B6B" />
              <Text style={styles.dateButtonText}>{formatDateOnly(selectedDate.toISOString())}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}

            <Text style={styles.fieldLabel}>Available Slots</Text>
            {slotsLoading ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color="#0A0A0A" />
            ) : availableSlots.length === 0 ? (
              <View style={styles.noSlots}>
                <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
                <Text style={styles.noSlotsText}>No available slots for this date.</Text>
                <Text style={styles.noSlotsHint}>Try selecting another date.</Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      onPress={() => setSelectedSlot(isSelected ? null : slot)}
                      style={[styles.slotBtn, isSelected && styles.slotBtnSelected]}
                    >
                      <Text style={[styles.slotBtnText, isSelected && styles.slotBtnTextSelected]}>
                        {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.segmented}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.segment, type === t && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, type === t && styles.segmentTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Describe your legal issue..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {selectedSlot && (
              <View style={styles.selectedSlotInfo}>
                <Ionicons name="time-outline" size={16} color="#0A0A0A" />
                <Text style={styles.selectedSlotText}>
                  {formatSlotTime(selectedSlot.startTime)} – {formatSlotTime(selectedSlot.endTime)}
                  {'  •  '}
                  {Math.round(
                    (new Date(selectedSlot.endTime).getTime() - new Date(selectedSlot.startTime).getTime()) / 60000
                  )} min
                </Text>
              </View>
            )}

            <Button
              title={selectedSlot ? 'Confirm Booking' : 'Select a slot to book'}
              onPress={handleBook}
              loading={booking}
              disabled={!selectedSlot}
              style={{ marginTop: 8, marginBottom: 24 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { flex: 1 },
  headerBg: { height: 140, backgroundColor: '#0A0A0A', paddingTop: 48, paddingHorizontal: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileArea: { alignItems: 'center', marginTop: -44, paddingBottom: 20 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FAFAFA',
    marginBottom: 12,
  },
  initials: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '800', color: '#0A0A0A' },
  cityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  city: { fontSize: 14, color: '#6B6B6B', marginLeft: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: '#6B6B6B', marginLeft: 6 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 20,
  },
  statDivider: { width: 1, backgroundColor: '#E8E8E8' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0A0A0A', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#6B6B6B' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0A0A0A', marginBottom: 10 },
  bio: { fontSize: 14, color: '#374151', lineHeight: 22 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewName: { fontSize: 14, fontWeight: '600', color: '#0A0A0A' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 13, color: '#374151', lineHeight: 20, marginBottom: 4 },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
  noReviewsText: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  modalSafe: { flex: 1, backgroundColor: '#FAFAFA' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0A0A0A' },
  modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#0A0A0A', marginBottom: 8, marginTop: 16 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    padding: 14,
  },
  dateButtonText: { fontSize: 15, color: '#0A0A0A' },
  noSlots: { alignItems: 'center', paddingVertical: 24 },
  noSlotsText: { fontSize: 15, color: '#374151', fontWeight: '500', marginTop: 10 },
  noSlotsHint: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  slotBtnSelected: { backgroundColor: '#0A0A0A', borderColor: '#0A0A0A' },
  slotBtnText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  slotBtnTextSelected: { color: '#FFFFFF' },
  segmented: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: '#0A0A0A' },
  segmentText: { fontSize: 14, fontWeight: '500', color: '#6B6B6B' },
  segmentTextActive: { color: '#FFFFFF' },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    padding: 14,
    fontSize: 15,
    color: '#0A0A0A',
    minHeight: 100,
  },
  selectedSlotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  selectedSlotText: { fontSize: 14, color: '#065F46', fontWeight: '500' },
});
