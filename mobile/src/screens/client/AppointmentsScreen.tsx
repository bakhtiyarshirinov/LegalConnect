import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsApi } from '../../api/appointments';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Appointment } from '../../types';
import { formatDate } from '../../utils/date';

const FILTERS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

const statusVariant = (s: string): any =>
  s === 'Confirmed' ? 'confirmed' : s === 'Completed' ? 'completed' : s === 'Cancelled' ? 'cancelled' : 'pending';

export const AppointmentsScreen = () => {
  const [filter, setFilter] = useState('All');
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, refetch, isRefetching } = useQuery<Appointment[]>({
    queryKey: ['myAppointments', filter],
    queryFn: () =>
      appointmentsApi
        .getMyAppointments(filter === 'All' ? undefined : filter)
        .then((r) => r.data),
  });

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await appointmentsApi.cancel(id, user?.userId ?? '');
            qc.invalidateQueries({ queryKey: ['myAppointments'] });
          } catch {
            Alert.alert('Error', 'Failed to cancel appointment');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.lawyerFullName?.[0] ?? 'L'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.lawyerName}>{item.lawyerFullName}</Text>
          <Text style={styles.dateText}>{formatDate(item.scheduledAt)}</Text>
        </View>
        <Badge label={item.status} variant={statusVariant(item.status)} />
      </View>
      <View style={styles.detailRow}>
        <View style={styles.detail}>
          <Ionicons name="time-outline" size={14} color="#6B6B6B" />
          <Text style={styles.detailText}>{item.durationMinutes} min</Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name={item.type === 'Online' ? 'videocam-outline' : 'location-outline'} size={14} color="#6B6B6B" />
          <Text style={styles.detailText}>{item.type}</Text>
        </View>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
      {item.status === 'Pending' && (
        <Button
          title="Cancel"
          onPress={() => handleCancel(item.id)}
          variant="danger"
          style={styles.cancelBtn}
        />
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointments</Text>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No appointments found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#0A0A0A', marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  filterTabActive: { backgroundColor: '#0A0A0A', borderColor: '#0A0A0A' },
  filterText: { fontSize: 13, color: '#6B6B6B', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  lawyerName: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  dateText: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: '#6B6B6B' },
  price: { marginLeft: 'auto', fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  cancelBtn: { marginTop: 12, height: 40 },
  emptyText: { textAlign: 'center', color: '#6B6B6B', fontSize: 15, marginTop: 60 },
});
