import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#4A168C';

const STATS = [
  { value: '10,000+', label: 'Happy customers' },
  { value: '5,000+', label: 'EVs on rent' },
  { value: '75+', label: 'Cities' },
  { value: '4.8', label: 'Rating' },
];

const REASONS = [
  { icon: 'bicycle-outline', title: 'Wide range', text: 'Choose an EV that fits the ride.' },
  { icon: 'shield-checkmark-outline', title: 'Smart and reliable', text: 'A safe, smooth, connected ride.' },
  { icon: 'calendar-outline', title: 'Affordable plans', text: 'Daily and monthly plans for how you ride.' },
  { icon: 'headset-outline', title: '24/7 support', text: 'Help when the ride should stay simple.' },
  { icon: 'leaf-outline', title: 'A cleaner ride', text: 'Drive electric and keep the city lighter.' },
];

export default function AboutScreen({ onBack, onExplore }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>About Evegah</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <Text style={styles.kicker}>Evegah</Text>
          <Text style={styles.title}>Drive smart. Drive electric.</Text>
          <Text style={styles.subtitle}>
            Join the riders who trust Evegah for a cleaner way across the city.
          </Text>
        </Animated.View>

        <Animated.View entering={cardEnter(1)} style={styles.stats}>
          {STATS.map((item, index) => (
            <View key={item.label} style={[styles.stat, index % 2 === 0 && styles.statLeft, index < 2 && styles.statTop]}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </Animated.View>

        <Text style={styles.section}>Why Evegah</Text>
        <Animated.View entering={cardEnter(2)} style={styles.list}>
          {REASONS.map((item, index) => (
            <View key={item.title} style={[styles.row, index > 0 && styles.rowLine]}>
              <View style={styles.icon}>
                <Ionicons name={item.icon} size={18} color={PURPLE} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Pressable onPress={onExplore} style={styles.explore}>
          <Text style={styles.exploreText}>Explore rides</Text>
        </Pressable>

        <Text style={styles.footer}>Made for a better tomorrow</Text>
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
  title: {
    marginTop: 6,
    color: '#1C1C1C',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: '#6E6878',
    fontSize: 14,
    lineHeight: 20,
  },
  stats: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stat: {
    width: '50%',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  statLeft: {
    borderRightWidth: 1,
    borderRightColor: '#F1F1F3',
  },
  statTop: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F3',
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
    paddingHorizontal: 14,
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
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  rowTitle: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  rowText: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 13,
  },
  explore: {
    marginTop: 16,
    marginHorizontal: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 16,
    textAlign: 'center',
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '600',
  },
});
