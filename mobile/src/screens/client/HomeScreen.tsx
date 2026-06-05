import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { appointmentsApi } from '../../api/appointments';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Appointment } from '../../types';
import { formatDate } from '../../utils/date';

const statusVariant = (s: string): any =>
  s === 'Confirmed' ? 'confirmed'
  : s === 'Completed' ? 'completed'
  : s === 'Cancelled' ? 'cancelled'
  : 'pending';

export const HomeScreen = ({ navigation }: any) => {
  const user = useAuthStore((s) => s.user);

  const { data: appointments, isLoading, refetch, isRefetching } = useQuery<Appointment[]>({
    queryKey: ['myAppointments', user?.userId],
    enabled: !!user?.userId,
    queryFn: () => appointmentsApi.getByClient(user!.userId).then((r) => r.data),
  });

  const onRefresh = useCallback(() => { refetch(); }, []);

  const total = appointments?.length ?? 0;
  const upcoming = (appointments || []).filter((a) => a.status === 'Confirmed').length;
  const completed = (appointments || []).filter((a) => a.status === 'Completed').length;
  const recent: Appointment[] = (appointments || []).slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Xoş gəldiniz, {user?.fullName?.split(' ')[0]}! 👋</Text>
          <Text style={styles.greetingSub}>Ümumi baxış</Text>
        </View>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <StatCard label="Cəmi" value={total} icon="layers-outline" />
            <StatCard label="Gələcək" value={upcoming} icon="calendar-outline" />
            <StatCard label="Tamamlandı" value={completed} icon="checkmark-circle-outline" />
          </ScrollView>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görüşlər</Text>
          {recent.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>Görüş tapılmadı</Text>
            </Card>
          ) : (
            recent.map((appt) => (
              <Card key={appt.id} style={styles.apptCard}>
                <View style={styles.apptRow}>
                  <View style={styles.apptAvatar}>
                    <Text style={styles.apptAvatarText}>{appt.lawyerFullName?.[0] ?? 'L'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.apptName}>{appt.lawyerFullName}</Text>
                    <Text style={styles.apptDate}>{formatDate(appt.scheduledAt)}</Text>
                  </View>
                  <Badge label={appt.status} variant={statusVariant(appt.status)} />
                </View>
              </Card>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.findBtn} onPress={() => navigation.navigate('Lawyers')} activeOpacity={0.8}>
          <Ionicons name="search-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.findBtnText}>Vəkil tap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: number; icon: any }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={24} color="#0A0A0A" style={{ marginBottom: 8 }} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0A0A0A' },
  greetingSub: { fontSize: 14, color: '#6B6B6B', marginTop: 2 },
  statsScroll: { paddingLeft: 24, marginBottom: 24 },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginRight: 12, borderWidth: 1, borderColor: '#E8E8E8', width: 120, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#0A0A0A' },
  statLabel: { fontSize: 13, color: '#6B6B6B', marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0A0A0A', marginBottom: 12 },
  apptCard: { marginBottom: 10 },
  apptRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  apptAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  apptAvatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  apptName: { fontSize: 14, fontWeight: '600', color: '#0A0A0A' },
  apptDate: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#6B6B6B', fontSize: 14 },
  findBtn: { marginHorizontal: 16, marginBottom: 32, height: 52, backgroundColor: '#0A0A0A', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  findBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
