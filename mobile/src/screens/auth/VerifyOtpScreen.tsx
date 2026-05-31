import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export const VerifyOtpScreen = ({ route, navigation }: any) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (value: string, index: number) => {
    const digits = value.replace(/[^0-9]/g, '');
    if (!digits) {
      const next = [...otp];
      next[index] = '';
      setOtp(next);
      return;
    }
    const next = [...otp];
    next[index] = digits[digits.length - 1];
    setOtp(next);
    if (index < 5 && digits) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Error', 'Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, code);
      const setUser = useAuthStore.getState().setUser;
      if (res.data?.token) {
        await setUser(res.data);
      } else {
        navigation.navigate('Login');
      }
    } catch (e: any) {
      Alert.alert('Invalid Code', e.response?.data?.message || 'Wrong or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await authApi.resendOtp(email);
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { setCanResend(true); clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      Alert.alert('Error', 'Failed to resend code');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { if (r) inputs.current[i] = r; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(v) => handleChange(v, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                autoFocus={i === 0}
              />
            ))}
          </View>

          <Button
            title="Verify"
            onPress={handleVerify}
            loading={loading}
            style={styles.btn}
          />

          <TouchableOpacity onPress={handleResend} disabled={!canResend} style={styles.resendBtn}>
            <Text style={[styles.resendText, !canResend && styles.resendDisabled]}>
              {canResend ? 'Resend code' : `Resend code in ${countdown}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#0A0A0A', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#6B6B6B', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  email: { fontWeight: '600', color: '#0A0A0A' },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  otpBoxFilled: { borderColor: '#0A0A0A' },
  btn: { width: '100%', marginBottom: 16 },
  resendBtn: { paddingVertical: 8 },
  resendText: { fontSize: 14, color: '#0A0A0A', fontWeight: '500' },
  resendDisabled: { color: '#9CA3AF' },
});
