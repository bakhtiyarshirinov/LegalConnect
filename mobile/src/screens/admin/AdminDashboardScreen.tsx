import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lawyersApi } from '../../api/lawyers';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Lawyer } from '../../types';

export const AdminDashboardScreen = () => {
  const qc = useQueryClient();

  const { data: lawyers, isLoading, refetch, isRefetching } = useQuery<Lawyer[]>({
    queryKey: ['unverifiedLawyers'],
    queryFn: () => lawyersApi.getUnverified().then((r) => r.data),
  });

  const handleVerify = async (id: string) => {
    try {
      await lawyersApi.verify(id);
      qc.invalidateQueries({ queryKey: ['unverifiedLawyers'] });
      Alert.alert('Təsdiqləndi', 'Vəkil təsdiqləndi');
    } catch {
      Alert.alert('Xəta', 'Vəkili təsdiqləmək alınmadı');
    }
  };

  const renderItem = ({ item }: { item: Lawyer }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.fullName[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.fullName}</Text>
          <Text style={styles.city}>{item.city}</Text>
        </View>
        <Button title="Təsdiqlə" onPress={() => handleVerify(item.id)} style={styles.verifyBtn} textStyle={{ fontSize: 13 }} />
      </View>
      {item.specializations?.length > 0 && (
        <View style={styles.specs}>
          {item.specializations.slice(0, 3).map((s) => (
            <View key={s} style={styles.chip}>
              <Text style={styles.chipText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Paneli</Text>
        <Text style={styles.subtitle}>
          {lawyers?.length ?? 0} Təsdiq gözləyir
        </Text>
      </View>
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={lawyers || []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Bütün vəkillər təsdiqləndi</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#0A0A0A' },
  subtitle: { fontSize: 14, color: '#6B6B6B', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '600', color: '#0A0A0A' },
  city: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  verifyBtn: { height: 36, paddingHorizontal: 16, backgroundColor: '#10B981', borderRadius: 10, minWidth: 80 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 11, color: '#374151' },
  emptyText: { textAlign: 'center', color: '#6B6B6B', fontSize: 15, marginTop: 60 },
});
