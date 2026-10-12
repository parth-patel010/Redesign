import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet } from '../services/api';

const PURPLE = '#4A168C';
const MONTHS = [
  { month: 'Jan', amount: 150 },
  { month: 'Feb', amount: 220 },
  { month: 'Mar', amount: 180 },
  { month: 'Apr', amount: 300 },
  { month: 'May', amount: 250 },
  { month: 'Jun', amount: 340 },
];

export default function InsightsScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState('Jun');
  const [live, setLive] = useState(null);

  useEffect(() => {
    apiGet('/stats/co2')
      .then((body) => {
        if (body?.data?.kpis) setLive(body.data);
      })
      .catch(() => {});
  }, []);

  const months = live?.trend?.labels?.length
    ? live.trend.labels.map((label, index) => ({
      month: String(label).slice(0, 3),
      amount: live.trend.co2?.[index] || 0,
    }))
    : MONTHS;
  const index = Math.max(0, months.findIndex((item) => item.month === month));
  const current = months[index] || months[months.length - 1];
  const previous = index > 0 ? months[index - 1] : null;
  let trend = '';
  if (previous && previous.amount) {
    const change = Math.round((Math.abs(current.amount - previous.amount) / previous.amount) * 100);
    trend = current.amount <= previous.amount
      ? `${change}% less than ${previous.month}`
      : `${change}% more than ${previous.month}`;
  }
  const peak = Math.max(...months.map((item) => Number(item.amount) || 0), 1);
  const carbon = live?.kpis?.totalCo2SavedKg ?? '24.5';
  const trees = live?.kpis?.treesEquivalent ?? 1;
  const distance = live ? `${live.kpis.totalKmDriven} km` : '204.2 km';
  const countLabel = live ? 'EVs' : 'Rides';
  const countValue = live?.kpis?.totalVehicles ?? 12;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Insights</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <Text style={styles.kicker}>Carbon saved</Text>
          <Text style={styles.carbon}>{carbon} kg</Text>
          <Text style={styles.subtitle}>
            About the same as planting {trees} {Number(trees) === 1 ? 'tree' : 'trees'}.
          </Text>
        </Animated.View>

        <Animated.View entering={cardEnter(1)} style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{countValue}</Text>
            <Text style={styles.statLabel}>{countLabel}</Text>
          </View>
          <View style={styles.statLine} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
        </Animated.View>

        <Text style={styles.section}>{live ? `Carbon in ${current.month}` : `Spent in ${current.month}`}</Text>
        <Animated.View entering={cardEnter(2)} style={styles.card}>
          <Text style={styles.spent}>{live ? `${current.amount} kg` : `₹${current.amount}`}</Text>
          {trend ? <Text style={styles.trend}>{trend}</Text> : null}
          <View style={styles.bars}>
            {months.map((item) => {
              const on = item.month === current.month;
              return (
                <Pressable key={item.month} onPress={() => setMonth(item.month)} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max(8, (Number(item.amount) / peak) * 96) },
                        on && styles.barOn,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, on && styles.barLabelOn]}>{item.month}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
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
  carbon: {
    marginTop: 8,
    color: '#1C1C1C',
    fontSize: 36,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
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
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    color: '#8A8496',
    fontSize: 12,
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
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
  },
  spent: {
    color: '#1C1C1C',
    fontSize: 28,
    fontWeight: '800',
  },
  trend: {
    marginTop: 4,
    color: '#6E6878',
    fontSize: 13,
    fontWeight: '600',
  },
  bars: {
    marginTop: 20,
    height: 128,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    height: 96,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 22,
    borderRadius: 8,
    backgroundColor: '#E7D6F6',
  },
  barOn: {
    backgroundColor: PURPLE,
  },
  barLabel: {
    marginTop: 8,
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '700',
  },
  barLabelOn: {
    color: PURPLE,
  },
});
