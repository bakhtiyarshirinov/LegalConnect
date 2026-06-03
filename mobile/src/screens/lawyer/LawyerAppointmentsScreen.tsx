import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../../api/appointments';
import { lawyersApi } from '../../api/lawyers';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Appointment } from '../../types';
import { formatDate } from '../../utils/date';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

const FILTERS = ['All', 'Pending', 'Confirmed', 'Completed'];

const statusVariant = (s: string): any =>
  s === 'Confirmed' ? 'confirmed'
  : s === 'Completed' ? 'completed'
  : s === 'Cancelled' ? 'cancelled'
  : 'pending';

export const LawyerAppointmentsScreen = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('All');
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const lawyerProfileId = useAuthStore((s) => s.lawyerProfileId);
  const setLawyerProfileId = useAuthStore((s) => s.setLawyerProfileId);

  useEffect(() => {
    if (!lawyerProfileId) {
      lawyersApi.getMyProfile()
        .then((r) => {
          console.log('Lawyer profile:', JSON.stringify(r.data, null, 2));
          setLawyerProfileId(r.data.id);
        })
        .catch((e) => console.log('Failed to load lawyer profile:', e));
    }
  }, [lawyerProfileId]);

  const { data: allAppointments, isLoading, refetch, isRefetching } = useQuery<Appointment[]>({
    queryKey: ['lawyerAppointments', lawyerProfileId],
    enabled: !!lawyerProfileId,
    queryFn: async () => {
      console.log('Fetching lawyer appointments for lawyerId:', lawyerProfileId);
      const res = await appointmentsApi.getByLawyer(lawyerProfileId!);
      console.log('Lawyer appointments response:', JSON.stringify(res.data, null, 2));
      return res.data;
    },
  });

  const data = filter === 'All'
    ? allAppointments
    : (allAppointments || []).filter((a) => a.status === filter);

  const confirm = async (id: string) => {
    if (!lawyerProfileId) { Alert.alert('Error', 'Lawyer profile not loaded'); return; }
    try {
      await appointmentsApi.confirm(id, lawyerProfileId);
      qc.invalidateQueries({ queryKey: ['lawyerAppointments'] });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to confirm');
    }
  };

  const cancel = async (id: string) => {
    if (!user) return;
    try {
      await appointmentsApi.cancel(id, user.userId);
      qc.invalidateQueries({ queryKey: ['lawyerAppointments'] });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to cancel');
    }
  };

  const complete = async (id: string) => {
    if (!lawyerProfileId) { Alert.alert('Error', 'Lawyer profile not loaded'); return; }
    try {
      await appointmentsApi.complete(id, lawyerProfileId);
      qc.invalidateQueries({ queryKey: ['lawyerAppointments'] });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to complete');
    }
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.clientFullName?.[0] ?? 'C'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.clientName}>{item.clientFullName}</Text>
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
          <Ionicons
            name={item.type === 'Online' ? 'videocam-outline' : 'location-outline'}
            size={14}
            color="#6B6B6B"
          />
          <Text style={styles.detailText}>{item.type}</Text>
        </View>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
      {item.status === 'Pending' && (
        <View style={styles.actionRow}>
          <Button
            title={t('appointments.confirm')}
            onPress={() => confirm(item.id)}
            style={{ flex: 1, height: 40, backgroundColor: '#10B981' } as any}
            textStyle={{ color: '#FFF' }}
          />
          <Button
            title={t('appointments.cancel')}
            onPress={() => cancel(item.id)}
            variant="danger"
            style={styles.actionBtn}
          />
        </View>
      )}
      {item.status === 'Confirmed' && (
        <View style={styles.actionRow}>
          <Button
            title={t('appointments.markComplete')}
            onPress={() => complete(item.id)}
            style={{ flex: 1, height: 40, backgroundColor: '#3B82F6' } as any}
            textStyle={{ color: '#FFF' }}
          />
          <Button
            title={t('appointments.cancel')}
            onPress={() => cancel(item.id)}
            variant="danger"
            style={styles.actionBtn}
          />
        </View>
      )}
      {item.status === 'Completed' && (
        <View style={styles.completedRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('appointments.title')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      {isLoading || !lawyerProfileId ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {t('appointments.noAppointments')}
            </Text>
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
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12, paddingRight: 16 },
  filterTab: {
    paddingHorizontal: 14,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  dateText: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: '#6B6B6B' },
  price: { marginLeft: 'auto', fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, height: 40 },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  completedText: { fontSize: 13, color: '#10B981', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#6B6B6B', fontSize: 15, marginTop: 60 },
});
