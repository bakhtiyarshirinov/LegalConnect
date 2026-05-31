import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { slotsApi } from '../../api/slots';
import { lawyersApi } from '../../api/lawyers';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { formatDateOnly } from '../../utils/date';

const DURATIONS = [30, 60, 90, 120];

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

export const LawyerScheduleScreen = () => {
  const lawyerProfileId = useAuthStore((s) => s.lawyerProfileId);
  const setLawyerProfileId = useAuthStore((s) => s.setLawyerProfileId);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [duration, setDuration] = useState(60);
  const [startHour, setStartHour] = useState('9');
  const [endHour, setEndHour] = useState('17');
  const [generating, setGenerating] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!lawyerProfileId) {
      lawyersApi.getMyProfile().then((r) => {
        setLawyerProfileId(r.data.id);
      }).catch(() => {});
    }
  }, [lawyerProfileId]);

  useEffect(() => {
    if (lawyerProfileId) fetchSlots(selectedDate);
  }, [lawyerProfileId]);

  const fetchSlots = async (date: Date) => {
    if (!lawyerProfileId) return;
    setSlotsLoading(true);
    try {
      const from = new Date(date);
      from.setHours(0, 0, 0, 0);
      const to = new Date(date);
      to.setHours(23, 59, 59, 999);
      const res = await slotsApi.getBulk(lawyerProfileId, from.toISOString(), to.toISOString());
      setSlots(res.data || []);
    } catch {
      setSlots([]);
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

  const handleGenerate = async () => {
    if (!lawyerProfileId) {
      Alert.alert('Error', 'Profile not loaded yet');
      return;
    }
    const sh = parseInt(startHour);
    const eh = parseInt(endHour);
    if (isNaN(sh) || isNaN(eh) || sh >= eh || sh < 0 || eh > 24) {
      Alert.alert('Error', 'Invalid hours. Start must be before end (0–24)');
      return;
    }
    setGenerating(true);
    try {
      const res = await slotsApi.createBulk({
        lawyerId: lawyerProfileId,
        date: selectedDate.toISOString(),
        slotDurationMinutes: duration,
        startHour: sh,
        endHour: eh,
      });
      const count = res.data?.count ?? res.data?.length ?? '?';
      Alert.alert('Success', `${count} slot(s) created!`);
      fetchSlots(selectedDate);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to generate slots');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!lawyerProfileId) return;
    try {
      await slotsApi.deleteSlot(slotId, lawyerProfileId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to delete slot');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>My Schedule</Text>

        <Card style={styles.card}>
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

          <Text style={styles.fieldLabel}>Slot Duration</Text>
          <View style={styles.segmented}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDuration(d)}
                style={[styles.segment, duration === d && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, duration === d && styles.segmentTextActive]}>
                  {d}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.hoursRow}>
            <View style={styles.hourInput}>
              <Text style={styles.fieldLabel}>Start Hour</Text>
              <TextInput
                style={styles.hourBox}
                value={startHour}
                onChangeText={setStartHour}
                keyboardType="numeric"
                maxLength={2}
                placeholder="9"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.hourDivider}>
              <Text style={styles.hourDividerText}>–</Text>
            </View>
            <View style={styles.hourInput}>
              <Text style={styles.fieldLabel}>End Hour</Text>
              <TextInput
                style={styles.hourBox}
                value={endHour}
                onChangeText={setEndHour}
                keyboardType="numeric"
                maxLength={2}
                placeholder="17"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <Button
            title="Generate Slots"
            onPress={handleGenerate}
            loading={generating}
            style={{ marginTop: 4 }}
          />
        </Card>

        <Text style={styles.slotsTitle}>
          Slots for {formatDateOnly(selectedDate.toISOString())}
        </Text>

        {slotsLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color="#0A0A0A" />
        ) : slots.length === 0 ? (
          <View style={styles.emptySlots}>
            <Ionicons name="time-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No slots for this date</Text>
          </View>
        ) : (
          slots.map((slot) => (
            <View key={slot.id} style={styles.slotRow}>
              <View style={styles.slotTime}>
                <Ionicons name="time-outline" size={16} color="#6B6B6B" style={{ marginRight: 6 }} />
                <Text style={styles.slotTimeText}>
                  {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
                </Text>
              </View>
              <View style={styles.slotRight}>
                {slot.isBooked ? (
                  <Badge label="Booked" variant="confirmed" />
                ) : (
                  <TouchableOpacity
                    onPress={() => handleDelete(slot.id)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#0A0A0A', marginBottom: 20 },
  card: { marginBottom: 24 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#0A0A0A', marginBottom: 8, marginTop: 12 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    padding: 14,
  },
  dateButtonText: { fontSize: 15, color: '#0A0A0A' },
  segmented: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: '#0A0A0A' },
  segmentText: { fontSize: 14, fontWeight: '500', color: '#6B6B6B' },
  segmentTextActive: { color: '#FFFFFF' },
  hoursRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 4 },
  hourInput: { flex: 1 },
  hourBox: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#0A0A0A',
    textAlign: 'center',
  },
  hourDivider: { paddingBottom: 14 },
  hourDividerText: { fontSize: 20, color: '#9CA3AF', fontWeight: '300' },
  slotsTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A', marginBottom: 12 },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  slotTime: { flexDirection: 'row', alignItems: 'center' },
  slotTimeText: { fontSize: 15, fontWeight: '500', color: '#0A0A0A' },
  slotRight: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: { padding: 4 },
  emptySlots: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#9CA3AF', marginTop: 10 },
});
