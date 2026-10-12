import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet } from '../services/api';

const PURPLE = '#4A168C';

export default function BmsScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    apiGet('/batteries/stats')
      .then((body) => setStats(body))
      .catch(() => {});
    apiGet('/batteries')
      .then((rows) => {
        if (Array.isArray(rows)) setPacks(rows.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  const charge = stats?.avg_soc ?? 90;
  const health = stats?.avg_soh ?? 74;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>BMS</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <Text style={styles.kicker}>Live fleet</Text>
          <Text style={styles.charge}>{charge}%</Text>
          <Text style={styles.subtitle}>Average charge · health {health}%</Text>
        </Animated.View>

        <Animated.View entering={cardEnter(1)} style={styles.stats}>
          <Stat value={stats?.total ?? '—'} label="Packs" />
          <View style={styles.statLine} />
          <Stat value={stats?.available ?? '—'} label="Ready" />
          <View style={styles.statLine} />
          <Stat value={stats?.in_use ?? '—'} label="In use" />
          <View style={styles.statLine} />
          <Stat value={stats?.low_soc ?? '—'} label="Low" />
        </Animated.View>

        <Text style={styles.section}>Batteries</Text>
        <Animated.View entering={cardEnter(2)} style={styles.list}>
          {packs.length === 0 ? (
            <Text style={styles.empty}>Waiting for the live list.</Text>
          ) : (
            packs.map((pack, index) => (
              <View key={pack.battery_id || index} style={[styles.row, index > 0 && styles.rowLine]}>
                <View style={styles.copy}>
                  <Text style={styles.title}>{pack.battery_id || 'Battery'}</Text>
                  <Text style={styles.meta}>{pack.zone || 'Zone'} · {pack.status || 'In use'}</Text>
                </View>
                <Text style={styles.soc}>{Math.round(Number(pack.soc) || 0)}%</Text>
              </View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  hero: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#F6F1FC',
    borderRadius: 24,
    padding: 18,
  },
  kicker: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  charge: {
    marginTop: 8,
    color: '#1C1C1C',
    fontSize: 40,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: '#6E6878',
    fontSize: 14,
  },
  stats: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#1C1C1C',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '600',
  },
  statLine: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F1F3',
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 20,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowLine: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 12,
  },
  soc: {
    color: PURPLE,
    fontSize: 16,
    fontWeight: '800',
  },
  empty: {
    paddingVertical: 18,
    color: '#8A8496',
    fontSize: 14,
  },
});
