import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#4A168C';

function rupee(amount) {
  return `₹${Math.abs(Math.round(amount || 0)).toLocaleString('en-IN')}`;
}

export default function RideDetailScreen({ ride, onBack }) {
  const insets = useSafeAreaInsets();
  if (!ride) return null;

  const rows = [
    ['Plan', ride.plan],
    ['Ride fare', rupee(ride.fare)],
    ['Security deposit', ride.depositBack ? 'Returned' : rupee(ride.deposit)],
    ['Paid with', ride.method],
    ['Helmet', 'Included'],
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Ride</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.id}>{ride.id}</Text>
            <View style={[styles.pill, ride.status === 'completed' ? styles.pillDone : styles.pillSoon]}>
              <Text style={[styles.pillText, ride.status === 'completed' ? styles.pillTextDone : styles.pillTextSoon]}>
                {ride.statusLabel}
              </Text>
            </View>
          </View>
          <View style={[styles.art, { backgroundColor: ride.tint }]}>
            <Image source={ride.image} style={styles.image} contentFit="contain" />
          </View>
          <Text style={styles.name}>{ride.vehicle}</Text>
          <Text style={styles.line}>{ride.line}</Text>
        </Animated.View>

        <Animated.View entering={cardEnter(1)} style={styles.card}>
          <View style={styles.route}>
            <View style={styles.routeCol}>
              <Text style={styles.kicker}>Pickup</Text>
              <Text style={styles.place}>{ride.pickup}</Text>
              <Text style={styles.when}>{ride.pickupWhen}</Text>
            </View>
            <View style={styles.mid}>
              <View style={styles.lineBar} />
              <Text style={styles.span}>{ride.span}</Text>
            </View>
            <View style={[styles.routeCol, styles.routeEnd]}>
              <Text style={styles.kicker}>Drop</Text>
              <Text style={[styles.place, styles.align]}>{ride.drop}</Text>
              <Text style={[styles.when, styles.align]}>{ride.dropWhen}</Text>
            </View>
          </View>
          <View style={styles.facts}>
            <View style={styles.fact}>
              <Text style={styles.factValue}>{ride.distance}</Text>
              <Text style={styles.factLabel}>Distance</Text>
            </View>
            <View style={styles.factLine} />
            <View style={styles.fact}>
              <Text style={styles.factValue}>{ride.battery}</Text>
              <Text style={styles.factLabel}>Battery left</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.Text entering={cardEnter(2)} style={styles.section}>Bill</Animated.Text>
        <Animated.View entering={cardEnter(2)} style={styles.card}>
          {rows.map(([label, value], index) => (
            <View key={label} style={[styles.row, index === rows.length - 1 && styles.rowLast]}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
          <View style={styles.total}>
            <Text style={styles.totalLabel}>Total paid</Text>
            <Text style={styles.totalValue}>{rupee(ride.fare)}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
  },
  heroTop: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  id: {
    color: '#1C1C1C',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillDone: {
    backgroundColor: '#F3FBF6',
  },
  pillSoon: {
    backgroundColor: '#F6F1FC',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextDone: {
    color: '#1F8A4C',
  },
  pillTextSoon: {
    color: PURPLE,
  },
  art: {
    marginTop: 16,
    width: 180,
    height: 110,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 160,
    height: 96,
  },
  name: {
    marginTop: 14,
    color: '#1C1C1C',
    fontSize: 22,
    fontWeight: '800',
  },
  line: {
    marginTop: 4,
    color: '#6E6878',
    fontSize: 14,
  },
  card: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeCol: {
    flex: 1,
  },
  routeEnd: {
    alignItems: 'flex-end',
  },
  align: {
    textAlign: 'right',
  },
  kicker: {
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '700',
  },
  place: {
    marginTop: 3,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  when: {
    marginTop: 3,
    color: '#6E6878',
    fontSize: 12,
    lineHeight: 16,
  },
  mid: {
    width: 72,
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  lineBar: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: '#E4D4F5',
  },
  span: {
    marginTop: 6,
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
  },
  facts: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  fact: {
    flex: 1,
    alignItems: 'center',
  },
  factValue: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '800',
  },
  factLabel: {
    marginTop: 2,
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '600',
  },
  factLine: {
    width: 1,
    height: 28,
    backgroundColor: '#E8E4EE',
  },
  section: {
    marginTop: 22,
    marginBottom: 2,
    marginHorizontal: 20,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F3',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    color: '#6E6878',
    fontSize: 14,
  },
  rowValue: {
    color: '#1C1C1C',
    fontSize: 14,
    fontWeight: '700',
  },
  total: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    color: PURPLE,
    fontSize: 18,
    fontWeight: '800',
  },
});
