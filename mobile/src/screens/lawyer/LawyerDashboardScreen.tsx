import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../../api/appointments';
import { lawyersApi } from '../../api/lawyers';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Appointment } from '../../types';
import { formatDate } from '../../utils/date';

export const LawyerDashboardScreen = () => {
  const user = useAuthStore((s) => s.user);
  const lawyerProfileId = useAuthStore((s) => s.lawyerProfileId);
  const setLawyerProfileId = useAuthStore((s) => s.setLawyerProfileId);
  const qc = useQueryClient();

  useEffect(() => {
    if (!lawyerProfileId) {
      lawyersApi.getMyProfile().then((r) => setLawyerProfileId(r.data.id)).catch(() => {});
    }
  }, [lawyerProfileId]);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['lawyerStats', lawyerProfileId],
    enabled: !!lawyerProfileId,
    queryFn: () => lawyersApi.getStats(lawyerProfileId!).then((r) => r.data),
  });

  const { data: allAppointments, isLoading: apptLoading, refetch: refetchAppts, isRefetching } = useQuery<Appointment[]>({
    queryKey: ['lawyerAppointments', lawyerProfileId],
    enabled: !!lawyerProfileId,
    queryFn: () => appointmentsApi.getByLawyer(lawyerProfileId!).then((r) => r.data),
  });

  const pending = (allAppointments || []).filter((a) => a.status === 'Pending');

  const onRefresh = useCallback(() => {
    refetchStats();
    refetchAppts();
  }, []);

  const handleConfirm = async (id: string) => {
    if (!lawyerProfileId) { Alert.alert('Xəta', 'Profil yüklənmədi'); return; }
    try { await appointmentsApi.confirm(id, lawyerProfileId); qc.invalidateQueries({ queryKey: ['lawyerAppointments'] }); }
    catch (e: any) { Alert.alert('Xəta', e.response?.data?.message || 'Təsdiqləmə alınmadı'); }
  };

  const handleCancel = async (id: string) => {
    if (!user) return;
    try { await appointmentsApi.cancel(id, user.userId); qc.invalidateQueries({ queryKey: ['lawyerAppointments'] }); }
    catch (e: any) { Alert.alert('Xəta', e.response?.data?.message || 'Ləğv etmək alınmadı'); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Sabahınız xeyir';
    if (h < 17) return 'Günortanız xeyir';
    return 'Axşamınız xeyir';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting()}, {user?.fullName?.split(' ')[0]}!</Text>
          <Text style={styles.greetingSub}>Günün xülasəsi</Text>
        </View>

        {statsLoading ? (
          <LoadingSpinner />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Cəmi" value={stats?.totalAppointments ?? 0} icon="layers-outline" />
            <StatCard label="Gözləyir" value={stats?.pendingAppointments ?? 0} icon="time-outline" />
            <StatCard label="Tamamlandı" value={stats?.completedAppointments ?? 0} icon="checkmark-outline" />
            <StatCard label="Reytinq" value={stats?.averageRating?.toFixed(1) ?? '—'} icon="star-outline" />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gözləyən sorğular</Text>
          {apptLoading ? (
            <LoadingSpinner />
          ) : pending.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>Gözləyən sorğu yoxdur</Text>
            </Card>
          ) : (
            pending.map((appt) => (
              <Card key={appt.id} style={styles.apptCard}>
                <View style={styles.apptHeader}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{appt.clientFullName?.[0] ?? 'C'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>{appt.clientFullName}</Text>
                    <Text style={styles.apptDate}>{formatDate(appt.scheduledAt)}</Text>
                  </View>
                </View>
                <View style={styles.apptDetails}>
                  <Text style={styles.apptDetail}>{appt.durationMinutes} dəq • {appt.type}</Text>
                  <Text style={styles.apptPrice}>${appt.price.toFixed(2)}</Text>
                </View>
                <View style={styles.actionRow}>
                  <Button title="Təsdiqlə" onPress={() => handleConfirm(appt.id)} style={{ flex: 1, height: 40, backgroundColor: '#10B981' } as any} textStyle={{ color: '#FFFFFF' }} />
                  <Button title="Ləğv et" onPress={() => handleCancel(appt.id)} variant="danger" style={styles.actionBtn} />
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: any; icon: any }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={22} color="#0A0A0A" style={{ marginBottom: 6 }} />
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12, marginBottom: 24 },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E8E8E8', width: '46%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#0A0A0A' },
  statLabel: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0A0A0A', marginBottom: 12 },
  apptCard: { marginBottom: 12 },
  apptHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  clientAvatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  apptDate: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  apptDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  apptDetail: { fontSize: 13, color: '#6B6B6B' },
  apptPrice: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 40 },
  emptyText: { textAlign: 'center', color: '#6B6B6B', fontSize: 14 },
});
