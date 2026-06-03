import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lawyer } from '../../types';

interface LawyerCardProps {
  lawyer: Lawyer;
  onPress: () => void;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

export const LawyerCard: React.FC<LawyerCardProps> = ({ lawyer, onPress }) => {
  const maxSpecs = 2;
  const visibleSpecs = lawyer.specializations.slice(0, maxSpecs);
  const extraCount = lawyer.specializations.length - maxSpecs;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{getInitials(lawyer.fullName)}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {lawyer.fullName}
            </Text>
            {lawyer.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
            )}
          </View>
          <View style={styles.cityRow}>
            <Ionicons name="location-outline" size={13} color="#6B6B6B" />
            <Text style={styles.city}>{lawyer.city}</Text>
          </View>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name={s <= Math.round(lawyer.rating) ? 'star' : 'star-outline'}
                size={12}
                color="#F59E0B"
              />
            ))}
            <Text style={styles.rating}>{lawyer.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({lawyer.reviewCount})</Text>
          </View>
          <View style={styles.specs}>
            {visibleSpecs.map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {s}
                </Text>
              </View>
            ))}
            {extraCount > 0 && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>+{extraCount}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${lawyer.hourlyRate}</Text>
          <Text style={styles.perHour}>/hr</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0A0A',
    flex: 1,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  city: {
    fontSize: 13,
    color: '#6B6B6B',
    marginLeft: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A0A0A',
    marginLeft: 3,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B6B6B',
    marginLeft: 2,
  },
  specs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  perHour: {
    fontSize: 11,
    color: '#6B6B6B',
  },
});
