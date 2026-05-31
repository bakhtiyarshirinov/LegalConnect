import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { lawyersApi } from '../../api/lawyers';
import { specializationsApi } from '../../api/specializations';
import { LawyerCard } from '../../components/lawyers/LawyerCard';
import { Lawyer, Specialization } from '../../types';

export const LawyersScreen = ({ navigation }: any) => {
  const [city, setCity] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
  const [debouncedCity, setDebouncedCity] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCity(city), 500);
    return () => clearTimeout(t);
  }, [city]);

  const { data: specs } = useQuery<Specialization[]>({
    queryKey: ['specializations'],
    queryFn: () => specializationsApi.getAll().then((r) => r.data),
  });

  const { data: lawyers, isLoading, refetch, isRefetching } = useQuery<Lawyer[]>({
    queryKey: ['lawyers', debouncedCity, selectedSpec],
    queryFn: () =>
      lawyersApi
        .getAll({ city: debouncedCity || undefined, specializationId: selectedSpec || undefined })
        .then((r) => r.data),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Find a Lawyer</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#6B6B6B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by city..."
            placeholderTextColor="#9CA3AF"
            value={city}
            onChangeText={setCity}
          />
          {city.length > 0 && (
            <TouchableOpacity onPress={() => setCity('')}>
              <Ionicons name="close-circle" size={18} color="#6B6B6B" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
          contentContainerStyle={styles.chipsContent}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedSpec && styles.chipActive]}
            onPress={() => setSelectedSpec(null)}
          >
            <Text style={[styles.chipText, !selectedSpec && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {(specs || []).map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, selectedSpec === s.id && styles.chipActive]}
              onPress={() => setSelectedSpec(selectedSpec === s.id ? null : s.id)}
            >
              <Text style={[styles.chipText, selectedSpec === s.id && styles.chipTextActive]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#0A0A0A" />
      ) : (
        <FlatList
          data={lawyers || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LawyerCard
              lawyer={item}
              onPress={() => navigation.navigate('LawyerProfile', { lawyerId: item.id })}
            />
          )}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No lawyers found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: '#FAFAFA', paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#0A0A0A', marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0A0A0A' },
  chips: { marginBottom: 12 },
  chipsContent: { gap: 8, paddingRight: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#0A0A0A', borderColor: '#0A0A0A' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF' },
  list: { paddingTop: 8, paddingBottom: 24 },
  emptyText: { textAlign: 'center', color: '#6B6B6B', fontSize: 15, marginTop: 48 },
});
