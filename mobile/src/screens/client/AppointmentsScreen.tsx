import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsApi } from '../../api/appointments';
import { reviewsApi } from '../../api/reviews';
import { Review } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { Appointment } from '../../types';
import { formatDate } from '../../utils/date';

const FILTERS = ['Hamısı', 'Gözləyir', 'Təsdiqləndi', 'Tamamlandı', 'Ləğv edildi'];
const FILTER_MAP: Record<string, string> = {
  'Hamısı': 'All',
  'Gözləyir': 'Pending',
  'Təsdiqləndi': 'Confirmed',
  'Tamamlandı': 'Completed',
  'Ləğv edildi': 'Cancelled',
};

const statusVariant = (s: string): any =>
  s === 'Confirmed' ? 'confirmed'
  : s === 'Completed' ? 'completed'
  : s === 'Cancelled' ? 'cancelled'
  : 'pending';

const StarRating = ({ rating, onSelect }: { rating: number; onSelect: (r: number) => void }) => (
  <View style={reviewStyles.stars}>
    {[1, 2, 3, 4, 5].map((s) => (
      <TouchableOpacity key={s} onPress={() => onSelect(s)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
        <Ionicons name={s <= rating ? 'star' : 'star-outline'} size={36} color={s <= rating ? '#F59E0B' : '#D1D5DB'} />
      </TouchableOpacity>
    ))}
  </View>
);

export const AppointmentsScreen = () => {
  const [filter, setFilter] = useState('Hamısı');
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('Auth user object:', JSON.stringify(user, null, 2));
  }, [user]);

  const { data: allAppointments, isLoading, error, refetch, isRefetching } = useQuery<Appointment[]>({
    queryKey: ['myAppointments', user?.userId],
    enabled: !!user?.userId,
    queryFn: async () => {
      const res = await appointmentsApi.getByClient(user!.userId);
      return res.data;
    },
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  useEffect(() => {
    if (!allAppointments) return;
    const completed = allAppointments.filter((a) => a.status === 'Completed');
    const uniqueLawyerIds = [...new Set(completed.map((a) => a.lawyerId))];
    if (uniqueLawyerIds.length === 0) return;

    Promise.all(uniqueLawyerIds.map((lid) => reviewsApi.getByLawyer(lid).then((r) => r.data as Review[])))
      .then((results) => {
        const ids = new Set<string>();
        results.flat().forEach((r) => { if (r.appointmentId) ids.add(r.appointmentId); });
        setReviewedIds(ids);
      })
      .catch(() => {});
  }, [allAppointments]);

  const apiFilter = FILTER_MAP[filter] ?? 'All';
  const data = apiFilter === 'All'
    ? allAppointments
    : (allAppointments || []).filter((a) => a.status === apiFilter);

  const isWithin24Hours = (scheduledAt: string) => {
    const diff = new Date(scheduledAt).getTime() - Date.now();
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
  };

  const handleJoinMeeting = async (item: Appointment) => {
    try {
      if (item.meetingUrl) { await Linking.openURL(item.meetingUrl); return; }
      const res = await appointmentsApi.createMeeting(item.id);
      qc.invalidateQueries({ queryKey: ['myAppointments'] });
      await Linking.openURL(res.meetingUrl);
    } catch (e: any) {
      Alert.alert('Xəta', e.response?.data?.message || 'Görüşə qoşulmaq alınmadı');
    }
  };

  const handleCancel = (id: string) => {
    Alert.alert('Görüşü ləğv et', 'Əminsiniz?', [
      { text: 'Xeyr' },
      {
        text: 'Bəli, ləğv et',
        style: 'destructive',
        onPress: async () => {
          try {
            await appointmentsApi.cancel(id, user?.userId ?? '');
            qc.invalidateQueries({ queryKey: ['myAppointments'] });
          } catch (e: any) {
            Alert.alert('Xəta', e.response?.data?.message || 'Ləğv etmək alınmadı');
          }
        },
      },
    ]);
  };

  const openReview = (appt: Appointment) => {
    setReviewTarget(appt);
    setRating(5);
    setComment('');
  };

  const submitReview = async () => {
    if (!reviewTarget || !user) return;
    if (rating < 1) { Alert.alert('Xəta', 'Reytinq seçin'); return; }
    setSubmitting(true);
    try {
      await reviewsApi.create({
        clientId: user.userId, lawyerId: reviewTarget.lawyerId, appointmentId: reviewTarget.id,
        rating, comment: comment.trim() || undefined,
      });
      setReviewedIds((prev) => new Set(prev).add(reviewTarget.id));
      setReviewTarget(null);
      Alert.alert('Rəy göndərildi!', 'Rəyiniz üçün təşəkkür edirik.');
      qc.invalidateQueries({ queryKey: ['lawyerReviews', reviewTarget.lawyerId] });
    } catch (e: any) {
      Alert.alert('Xəta', e.response?.data?.message || 'Rəy göndərilə bilmədi');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: Appointment }) => {
    const alreadyReviewed = reviewedIds.has(item.id);
    return (
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
            <Text style={styles.detailText}>{item.durationMinutes} dəq</Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name={item.type === 'Online' ? 'videocam-outline' : 'location-outline'} size={14} color="#6B6B6B" />
            <Text style={styles.detailText}>{item.type}</Text>
          </View>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        </View>
        {item.status === 'Confirmed' && isWithin24Hours(item.scheduledAt) && (
          <TouchableOpacity onPress={() => handleJoinMeeting(item)} style={styles.joinMeetingBtn}>
            <Ionicons name="videocam-outline" size={15} color="#fff" />
            <Text style={styles.joinMeetingText}>Görüşə qoşul</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Pending' && (
          <Button title="Ləğv et" onPress={() => handleCancel(item.id)} variant="danger" style={styles.cancelBtn} />
        )}
        {item.status === 'Completed' && (
          alreadyReviewed ? (
            <View style={styles.reviewedRow}>
              <Ionicons name="checkmark-circle" size={16} color="#F59E0B" />
              <Text style={styles.reviewedText}>Rəy yazıldı ✓</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => openReview(item)} style={styles.leaveReviewBtn}>
              <Ionicons name="star-outline" size={15} color="#F59E0B" />
              <Text style={styles.leaveReviewText}>Rəy yaz</Text>
            </TouchableOpacity>
          )
        )}
      </Card>
    );
  };

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

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text style={styles.errorText}>Xəta baş verdi</Text>
          <Button title="Yenidən cəhd et" onPress={() => refetch()} style={{ marginTop: 16, width: 120 }} />
        </View>
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          extraData={reviewedIds}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Görüş tapılmadı</Text>}
        />
      )}

      <Modal visible={!!reviewTarget} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setReviewTarget(null)}>
        <SafeAreaView style={reviewStyles.safe}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={reviewStyles.header}>
              <Text style={reviewStyles.title}>Təcrübənizi qiymətləndirin</Text>
              <TouchableOpacity onPress={() => setReviewTarget(null)}>
                <Ionicons name="close" size={24} color="#0A0A0A" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={reviewStyles.body} keyboardShouldPersistTaps="handled">
              <Text style={reviewStyles.lawyerName}>{reviewTarget?.lawyerFullName}</Text>
              <Text style={reviewStyles.ratingLabel}>Reytinq</Text>
              <StarRating rating={rating} onSelect={setRating} />
              <Text style={reviewStyles.commentLabel}>Təcrübənizi paylaşın (isteğe bağlı)</Text>
              <TextInput
                style={reviewStyles.commentInput}
                placeholder="Təcrübənizi paylaşın..."
                placeholderTextColor="#9CA3AF"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Button title="Rəyi göndər" onPress={submitReview} loading={submitting} style={{ marginTop: 8 }} />
              <Button title="Ləğv et" onPress={() => setReviewTarget(null)} variant="outline" style={{ marginTop: 12 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  lawyerName: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  dateText: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: '#6B6B6B' },
  price: { marginLeft: 'auto', fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
  cancelBtn: { marginTop: 12, height: 40 },
  joinMeetingBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#1C7ED6', alignSelf: 'flex-start' },
  joinMeetingText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  reviewedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  reviewedText: { fontSize: 13, color: '#F59E0B', fontWeight: '600' },
  leaveReviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#F59E0B', alignSelf: 'flex-start' },
  leaveReviewText: { fontSize: 13, color: '#F59E0B', fontWeight: '600' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 15, color: '#EF4444', marginTop: 10 },
  emptyText: { textAlign: 'center', color: '#6B6B6B', fontSize: 15, marginTop: 60 },
});

const reviewStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  title: { fontSize: 18, fontWeight: '700', color: '#0A0A0A' },
  body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  lawyerName: { fontSize: 20, fontWeight: '700', color: '#0A0A0A', marginBottom: 24, textAlign: 'center' },
  ratingLabel: { fontSize: 14, fontWeight: '600', color: '#6B6B6B', marginBottom: 12, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  commentLabel: { fontSize: 14, fontWeight: '600', color: '#0A0A0A', marginBottom: 8 },
  commentInput: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E8E8', padding: 14, fontSize: 15, color: '#0A0A0A', minHeight: 110, marginBottom: 8 },
});
