import React, { useState, useEffect } from 'react';
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
import { specializationsApi } from '../../api/specializations';
import { Specialization } from '../../types';

export const RegisterLawyerScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    specializationsApi.getAll().then((r) => setSpecializations(r.data)).catch(() => {});
  }, []);

  const toggleSpec = (id: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !phone.trim() || !city.trim()) {
      Alert.alert('Xəta', 'Bütün tələb olunan sahələri doldurun');
      return;
    }
    setLoading(true);
    try {
      await authApi.registerLawyer({
        fullName, email, password, phone, bio, city, licenseNumber,
        experienceYears: parseInt(experienceYears) || 0,
        hourlyRate: parseFloat(hourlyRate) || 0,
        specializationIds: selectedSpecs,
      });
      navigation.navigate('VerifyOtp', { email });
    } catch (e: any) {
      Alert.alert('Qeydiyyat alınmadı', e.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color="#0A0A0A" />
          </TouchableOpacity>

          <Text style={styles.title}>Hesab yarat</Text>
          <Text style={styles.subtitle}>Vəkil kimi qeydiyyat</Text>

          <Input label="Ad Soyad" placeholder="Əli Həsənov" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          <Input label="E-poçt ünvanı" placeholder="siz@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Şifrə" placeholder="Minimum 6 simvol" value={password} onChangeText={setPassword} secureToggle />
          <Input label="Telefon" placeholder="+994 50 000 00 00" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Şəhər" placeholder="Bakı" value={city} onChangeText={setCity} />
          <Input label="Lisenziya nömrəsi" placeholder="AZ-12345" value={licenseNumber} onChangeText={setLicenseNumber} />
          <Input label="Təcrübə (il)" placeholder="5" value={experienceYears} onChangeText={setExperienceYears} keyboardType="numeric" />
          <Input label="Saatlıq qiymət ($)" placeholder="50" value={hourlyRate} onChangeText={setHourlyRate} keyboardType="decimal-pad" />
          <Input
            label="Bio"
            placeholder="Müştərilərə özünüz haqqında məlumat verin..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
          />

          {specializations.length > 0 && (
            <View style={styles.specsSection}>
              <Text style={styles.specsLabel}>İxtisaslar</Text>
              <View style={styles.specsList}>
                {specializations.map((spec) => {
                  const selected = selectedSpecs.includes(spec.id);
                  return (
                    <TouchableOpacity
                      key={spec.id}
                      onPress={() => toggleSpec(spec.id)}
                      style={[styles.specChip, selected && styles.specChipSelected]}
                    >
                      <Text style={[styles.specChipText, selected && styles.specChipTextSelected]}>
                        {spec.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <Button title="Vəkil kimi qoşul" onPress={handleRegister} loading={loading} style={styles.btn} />
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
  specsSection: { marginBottom: 16 },
  specsLabel: { fontSize: 14, fontWeight: '500', color: '#0A0A0A', marginBottom: 10 },
  specsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E8E8E8', backgroundColor: '#FFFFFF' },
  specChipSelected: { borderColor: '#0A0A0A', backgroundColor: '#0A0A0A' },
  specChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  specChipTextSelected: { color: '#FFFFFF' },
  btn: { marginTop: 8 },
});
