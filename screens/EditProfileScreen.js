import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PURPLE = '#4A168C';
const GENDERS = ['Male', 'Female', 'Other'];

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'DR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDob(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join(' / ');
}

export default function EditProfileScreen({ profile, onBack, onSave }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(profile?.name || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [dob, setDob] = useState(profile?.dob || '');
  const [address, setAddress] = useState(profile?.address || '');
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const save = () => {
    const nextName = name.trim();
    if (!nextName) return;
    onSave?.({
      name: nextName,
      phone: profile?.phone || '',
      gender,
      dob,
      address: address.trim(),
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
          <Text style={styles.avatarHint}>This is how you appear in the app</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#A39AAD"
            style={styles.input}
          />

          <Text style={styles.label}>Phone</Text>
          <View style={styles.locked}>
            <Text style={styles.lockedText}>{profile?.phone || 'Not provided'}</Text>
            <Ionicons name="lock-closed" size={14} color="#A39AAD" />
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genders}>
            {GENDERS.map((item) => {
              const on = gender === item;
              return (
                <Pressable key={item} onPress={() => setGender(item)} style={[styles.gender, on && styles.genderOn]}>
                  <Text style={[styles.genderText, on && styles.genderTextOn]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Date of birth</Text>
          <TextInput
            value={dob}
            onChangeText={(value) => setDob(formatDob(value))}
            placeholder="DD / MM / YYYY"
            placeholderTextColor="#A39AAD"
            keyboardType="number-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Where you stay"
            placeholderTextColor="#A39AAD"
            multiline
            style={[styles.input, styles.area]}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          onPress={save}
          onPressIn={() => {
            btnScale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
        >
          <Animated.View style={[styles.save, !name.trim() && styles.saveOff, btnStyle]}>
            <Text style={styles.saveText}>Save</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1C1C1C',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSide: {
    width: 36,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  avatarHint: {
    marginTop: 10,
    color: '#8A8496',
    fontSize: 13,
  },
  card: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
  },
  label: {
    marginTop: 14,
    marginBottom: 8,
    color: '#1C1C1C',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F7F7F8',
    paddingHorizontal: 14,
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '600',
  },
  area: {
    minHeight: 96,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: 'top',
  },
  locked: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F7F7F8',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedText: {
    color: '#6E6878',
    fontSize: 15,
    fontWeight: '600',
  },
  genders: {
    flexDirection: 'row',
    gap: 8,
  },
  gender: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F7F7F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOn: {
    backgroundColor: PURPLE,
  },
  genderText: {
    color: '#3C3846',
    fontSize: 13,
    fontWeight: '700',
  },
  genderTextOn: {
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F7F7F8',
  },
  save: {
    height: 52,
    borderRadius: 16,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOff: {
    opacity: 0.4,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
