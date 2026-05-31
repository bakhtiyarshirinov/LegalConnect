import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

const roleBadge = (role: string): any =>
  role === 'Lawyer' ? 'blue' : role === 'Admin' ? 'green' : 'default';

export const ProfileScreen = () => {
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const initials = (user?.fullName ?? '')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile({ fullName, phone });
      if (user) {
        await setUser({ ...user, fullName });
      }
      Alert.alert('Saved', 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => clearUser(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Profile</Text>

          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
            <Text style={styles.userName}>{user?.fullName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Badge label={user?.role ?? ''} variant={roleBadge(user?.role ?? '')} style={{ marginTop: 8 }} />
          </View>

          <Card style={styles.editCard}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              autoCapitalize="words"
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+994 50 000 00 00"
              keyboardType="phone-pad"
            />
            <Button title="Save Changes" onPress={handleSave} loading={saving} />
          </Card>

          <Button
            title="Logout"
            onPress={handleLogout}
            variant="danger"
            style={styles.logoutBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#0A0A0A', marginBottom: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  initials: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  userName: { fontSize: 20, fontWeight: '700', color: '#0A0A0A' },
  email: { fontSize: 14, color: '#6B6B6B', marginTop: 2 },
  editCard: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A', marginBottom: 16 },
  logoutBtn: { borderColor: '#EF4444' },
});
