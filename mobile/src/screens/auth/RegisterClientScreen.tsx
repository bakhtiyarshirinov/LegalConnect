import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api/auth';

export const RegisterClientScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await authApi.registerClient({ fullName, email, password, phone });
      navigation.navigate('VerifyOtp', { email });
    } catch (e: any) {
      Alert.alert('Registration Failed', e.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color="#0A0A0A" />
          </TouchableOpacity>

          <Text style={styles.title}>{t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>Join as a client</Text>

          <Input
            label={t('profile.fullName')}
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <Input
            label={t('auth.email')}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label={t('auth.password')}
            placeholder="Min 6 characters"
            value={password}
            onChangeText={setPassword}
            secureToggle
          />
          <Input
            label={t('profile.phone')}
            placeholder="+994 50 000 00 00"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Button
            title={t('auth.createAccount')}
            onPress={handleRegister}
            loading={loading}
            style={styles.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  back: { marginBottom: 24, width: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#0A0A0A', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6B6B6B', marginBottom: 32 },
  btn: { marginTop: 8 },
});
