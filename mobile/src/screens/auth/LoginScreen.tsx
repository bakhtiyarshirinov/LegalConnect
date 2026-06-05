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
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Xəta', 'Bütün sahələri doldurun');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      await setUser(res.data);
    } catch (e: any) {
      Alert.alert('Giriş alınmadı', e.response?.data?.message || 'Yanlış məlumatlar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Ionicons name="scale-outline" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>LegalConnect</Text>
            <Text style={styles.subtitle}>Azərbaycanda hüquqi platformanız</Text>
          </View>

          <View style={styles.form}>
            <Input label="E-poçt ünvanı" placeholder="siz@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <Input label="Şifrə" placeholder="Şifrəni daxil edin" value={password} onChangeText={setPassword} secureToggle />

            <Button title="Daxil ol" onPress={handleLogin} loading={loading} style={styles.signInBtn} />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hesabınız yoxdur?</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.registerRow}>
              <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('RegisterClient')}>
                <Text style={styles.registerBtnText}>Müştəri kimi qoşul</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.registerBtn, styles.registerBtnOutline]} onPress={() => navigation.navigate('RegisterLawyer')}>
                <Text style={styles.registerBtnTextOutline}>Vəkil kimi qoşul</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48 },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A0A0A', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6B6B6B', textAlign: 'center' },
  form: {},
  signInBtn: { marginTop: 8, marginBottom: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E8E8' },
  dividerText: { fontSize: 13, color: '#6B6B6B', marginHorizontal: 12 },
  registerRow: { flexDirection: 'row', gap: 12 },
  registerBtn: { flex: 1, height: 52, borderRadius: 12, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  registerBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#0A0A0A' },
  registerBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  registerBtnTextOutline: { color: '#0A0A0A', fontWeight: '600', fontSize: 15 },
});
