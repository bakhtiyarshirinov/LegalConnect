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
  Linking,
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
import { useAuthStore } from '../../store/authStore';

const FILTERS = ['Hamısı', 'Gözləyir', 'Təsdiqləndi', 'Tamamlandı'];
const FILTER_MAP: Record<string, string> = {
  'Hamısı': 'All', 'Gözləyir': 'Pending', 'Təsdiqləndi': 'Confirmed', 'Tamamlandı': 'Completed',
};

const statusVariant = (s: string): any =>
  s === 'Confirmed' ? 'confirmed' : s === 'Completed' ? 'completed' : s === 'Cancelled' ? 'cancelled' : 'pending';

export const LawyerAppointmentsScreen = () => {
  const [filter, setFilter] = useState('Hamısı');
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const lawyerProfileId = useAuthStore((s) => s.lawyerProfileId);
  const setLawyerProfileId = useAuthStore((s) => s.setLawyerProfileId);

  useEffect(() => {
    if (!lawyerProfileId) {
      lawyersApi.getMyProfile().then((r) => { setLawyerProfileId(r.data.id); }).catch((e) => console.log('Failed to load lawyer profile:', e));
    }
  }, [lawyerProfileId]);

  const { data: allAppointments, isLoading, refetch, isRefetching } = useQuery<Appointment[]>({
    queryKey: ['lawyerAppointments', lawyerProfileId],
    enabled: !!lawyerProfileId,
    queryFn: async () => {
      const res = await appointmentsApi.getByLawyer(lawyerProfileId!);
      return res.data;
    },
  });

  const apiFilter = FILTER_MAP[filter] ?? 'All';
  const data = apiFilter === 'All' ? allAppointments : (allAppointments || []).filter((a) => a.status === apiFilter);

  const confirm = async (id: string) => {
    if (!lawyerProfileId) { Alert.alert('Xəta', 'Vəkil profili yüklənmədi'); return; }
    try { await appointmentsApi.confirm(id, lawyerProfileId); qc.invalidateQueries({ queryKey: ['lawyerAppointments'] }); }
    catch (e: any) { Alert.alert('Xəta', e.response?.data?.message || 'Təsdiqləmə alınmadı'); }
  };

  const cancel = async (id: string) => {
    if (!user) return;
    try { await appointmentsApi.cancel(id, user.userId); qc.invalidateQueries({ queryKey: ['lawyerAppointments'] }); }
    catch (e: any) { Alert.alert('Xəta', e.response?.data?.message || 'Ləğv etmək alınmadı'); }
  };

  const isWithin24Hours = (scheduledAt: string) => {
    const diff = new Date(scheduledAt).getTime() - Date.now();
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
  };

  const handleJoinMeeting = async (item: Appointment) => {
    try {
      if (item.meetingUrl) { await Linking.openURL(item.meetingUrl); return; }
      const res = await appointmentsApi.createMeeting(item.id);
      qc.invalidateQueries({ queryKey: ['lawyerAppointments'] });
      await Linking.openURL(res.meetingUrl);
    } catch (e: any) { Alert.alert('Xəta', e.response?.data?.message || 'Görüşə qoşulmaq alınmadı'); }
  };

  const complete = async (id: string) => {
    if (!lawyerProfileId) { Alert.alert('Xəta', 'Vəkil profili yüklənmədi'); return; }
    try { await appointmentsApi.complete(id, lawyerProfileId); qc.invalidateQueries({ queryKey: ['lawyerAppointments'] }); }
    catch (e: any) { Alert.alert('Xəta', e.response?.data?.message || 'Tamamlamaq alınmadı'); }
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
          <Text style={styles.detailText}>{item.durationMinutes} dəq</Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name={item.type === 'Online' ? 'videocam-outline' : 'location-outline'} size={14} color="#6B6B6B" />
          <Text style={styles.detailText}>{item.type}</Text>
        </View>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
      {item.status === 'Pending' && (
        <View style={styles.actionRow}>
          <Button title="Təsdiqlə" onPress={() => confirm(item.id)} style={{ flex: 1, height: 40, backgroundColor: '#10B981' } as any} textStyle={{ color: '#FFF' }} />
          <Button title="Ləğv et" onPress={() => cancel(item.id)} variant="danger" style={styles.actionBtn} />
        </View>
      )}
      {item.status === 'Confirmed' && (
        <View style={styles.actionRow}>
          {isWithin24Hours(item.scheduledAt) && (
            <TouchableOpacity onPress={() => handleJoinMeeting(item)} style={styles.joinMeetingBtn}>
              <Ionicons name="videocam-outline" size={15} color="#fff" />
              <Text style={styles.joinMeetingText}>Görüşə qoşul</Text>
            </TouchableOpacity>
          )}
          <Button title="Tamamla" onPress={() => complete(item.id)} style={{ flex: 1, height: 40, backgroundColor: '#3B82F6' } as any} textStyle={{ color: '#FFF' }} />
          <Button title="Ləğv et" onPress={() => cancel(item.id)} variant="danger" style={styles.actionBtn} />
        </View>
      )}
      {item.status === 'Completed' && (
        <View style={styles.completedRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.completedText}>Tamamlandı</Text>
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Görüşlər</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterTab, filter === f && styles.filterTabActive]}>
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
          ListEmptyComponent={<Text style={styles.emptyText}>Görüş tapılmadı</Text>}
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
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E8E8E8', backgroundColor: '#FFFFFF' },
  filterTabActive: { backgroundColor: '#0A0A0A', borderColor: '#0A0A0A' },
  filterText: { fontSize: 13, color: '#6B6B6B', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  dateText: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: '#6B6B6B' },
  price: { marginLeft: 'auto', fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  joinMeetingBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#1C7ED6', justifyContent: 'center' },
  joinMeetingText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  actionBtn: { flex: 1, height: 40 },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  completedText: { fontSize: 13, color: '#10B981', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#6B6B6B', fontSize: 15, marginTop: 60 },
});
