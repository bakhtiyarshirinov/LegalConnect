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
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { filesApi } from '../../api/files';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

const API_BASE = 'http://localhost:5218';
const LANGS = ['en', 'az', 'ru'] as const;
const LANG_LABELS: Record<string, string> = { en: 'EN', az: 'AZ', ru: 'RU' };

const roleBadge = (role: string): any =>
  role === 'Lawyer' ? 'blue' : role === 'Admin' ? 'green' : 'default';

export const ProfileScreen = () => {
  const { t } = useTranslation();
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
      Alert.alert('Permission required', 'Please allow access to your photo library.');
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
      Alert.alert('Upload failed', e.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile({ fullName, phone });
      if (user) await setUser({ ...user, fullName });
      Alert.alert(t('common.done'), t('profile.saveChanges') + ' ✓');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel') },
      { text: t('auth.logout'), style: 'destructive', onPress: () => clearUser() },
    ]);
  };

  const avatarUri = user?.avatarUrl ? `${API_BASE}${user.avatarUrl}` : null;
  const activeLang = i18n.language?.slice(0, 2) ?? 'en';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('profile.title')}</Text>

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
            <Text style={styles.sectionTitle}>{t('profile.editProfile')}</Text>
            <Input
              label={t('profile.fullName')}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              autoCapitalize="words"
            />
            <Input
              label={t('profile.phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder="+994 50 000 00 00"
              keyboardType="phone-pad"
            />
            <Button title={t('profile.saveChanges')} onPress={handleSave} loading={saving} />
          </Card>

          <View style={styles.langSection}>
            <Text style={styles.langTitle}>Language / Dil / Язык</Text>
            <View style={styles.langRow}>
              {LANGS.map((lang) => {
                const isActive = activeLang === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => i18n.changeLanguage(lang)}
                    style={[styles.langBtn, isActive && styles.langBtnActive]}
                  >
                    <Text style={[styles.langBtnText, isActive && styles.langBtnTextActive]}>
                      {LANG_LABELS[lang]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Button
            title={t('auth.logout')}
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
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FAFAFA',
  },
  initials: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  userName: { fontSize: 20, fontWeight: '700', color: '#0A0A0A' },
  userEmail: { fontSize: 14, color: '#6B6B6B', marginTop: 2 },
  editCard: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0A0A0A', marginBottom: 16 },
  langSection: { marginBottom: 16 },
  langTitle: { fontSize: 13, fontWeight: '600', color: '#6B6B6B', marginBottom: 10 },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  langBtnActive: { backgroundColor: '#0A0A0A' },
  langBtnText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  langBtnTextActive: { color: '#FFFFFF' },
  logoutBtn: { borderColor: '#EF4444' },
});
