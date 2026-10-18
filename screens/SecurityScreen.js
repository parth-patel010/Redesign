import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

function phoneName() {
  const model = Device.modelName || '';
  const brand = Device.brand || '';
  if (model && brand && !model.toLowerCase().includes(brand.toLowerCase())) {
    const pretty = `${brand.charAt(0).toUpperCase()}${brand.slice(1)}`;
    return `${pretty} ${model}`;
  }
  if (model) return model;
  if (Platform.OS === 'ios') return 'iPhone';
  if (Platform.OS === 'android') return 'Android phone';
  return 'This phone';
}

export default function SecurityScreen({ phone, onBack, onLogout }) {
  const insets = useSafeAreaInsets();
  const system = [Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'This device', Device.osVersion]
    .filter(Boolean)
    .join(' ');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Text style={styles.section}>This phone</Text>
        <Animated.View entering={cardEnter(0)} style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="phone-portrait-outline" size={20} color="#4A168C" />
          </View>
          <View style={styles.copy}>
            <Text style={styles.name}>{phoneName()}</Text>
            <Text style={styles.meta}>{system}</Text>
            <Text style={styles.active}>Active now</Text>
          </View>
        </Animated.View>

        <Animated.View entering={cardEnter(1)} style={styles.account}>
          <Text style={styles.accountLabel}>Signed in as</Text>
          <Text style={styles.accountPhone}>{phone || 'Active Rider'}</Text>
        </Animated.View>

        <Pressable onPress={onLogout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={18} color="#A33B3B" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
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
  section: {
    marginTop: 18,
    marginBottom: 10,
    marginHorizontal: 20,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  name: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    marginTop: 4,
    color: '#6E6878',
    fontSize: 13,
  },
  active: {
    marginTop: 6,
    color: '#1F8A4C',
    fontSize: 12,
    fontWeight: '700',
  },
  account: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
  },
  accountLabel: {
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '700',
  },
  accountPhone: {
    marginTop: 4,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  logout: {
    marginTop: 22,
    marginHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0D5D5',
    backgroundColor: '#FFF8F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#A33B3B',
    fontSize: 16,
    fontWeight: '700',
  },
});
