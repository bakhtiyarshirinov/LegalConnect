import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { filesApi } from '../../api/files';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

const API_BASE = 'http://localhost:5218';

const roleBadge = (role: string): any =>
  role === 'Lawyer' ? 'blue' : role === 'Admin' ? 'green' : 'default';

export const ProfileScreen = () => {
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setUser = useAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initials = (user?.fullName ?? '')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İcazə tələb olunur', 'Foto kitabxananıza giriş icazəsi verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const res = await filesApi.uploadAvatar(result.assets[0].uri);
      const avatarUrl: string = res.data.avatarUrl;
      if (user) await setUser({ ...user, avatarUrl });
    } catch (e: any) {
      Alert.alert('Yükləmə alınmadı', e.response?.data?.message || 'Avatar yüklənə bilmədi');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Xəta', 'Ad boş ola bilməz');
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile({ fullName, phone });
      if (user) await setUser({ ...user, fullName });
      Alert.alert('Hazır', 'Dəyişiklikləri saxla ✓');
    } catch (e: any) {
      Alert.alert('Xəta', e.response?.data?.message || 'Profil yenilənə bilmədi');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıxış', 'Əminsiniz?', [
      { text: 'Ləğv et' },
      { text: 'Çıxış', style: 'destructive', onPress: () => clearUser() },
    ]);
  };

  const avatarUri = user?.avatarUrl ? `${API_BASE}${user.avatarUrl}` : null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Profil</Text>

          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper} activeOpacity={0.8}>
              {uploading ? (
                <View style={styles.avatarCircle}>
                  <ActivityIndicator color="#FFFFFF" size="large" />
                </View>
              ) : avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.initials}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{user?.fullName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Badge label={user?.role ?? ''} variant={roleBadge(user?.role ?? '')} style={{ marginTop: 8 }} />
          </View>

          <Card style={styles.editCard}>
            <Text style={styles.sectionTitle}>Profili redaktə et</Text>
            <Input label="Ad Soyad" value={fullName} onChangeText={setFullName} placeholder="Ad Soyadınız" autoCapitalize="words" />
            <Input label="Telefon" value={phone} onChangeText={setPhone} placeholder="+994 50 000 00 00" keyboardType="phone-pad" />
            <Button title="Dəyişiklikləri saxla" onPress={handleSave} loading={saving} />
          </Card>

          <Button
            title="Çıxış"
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
  avatarWrapper: { marginBottom: 12 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FAFAFA' },
  initials: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  userName: { fontSize: 20, fontWeight: '700', color: '#0A0A0A' },
  userEmail: { fontSize: 14, color: '#6B6B6B', marginTop: 2 },
  editCard: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A', marginBottom: 16 },
  logoutBtn: { borderColor: '#EF4444' },
});
