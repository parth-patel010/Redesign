import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet, last10, shortDate } from '../services/api';

const PURPLE = '#4A168C';
const IMAGES = {
  fly: require('../assets/home/vehicle-fly.png'),
  mink: require('../assets/home/vehicle-mink.png'),
  city: require('../assets/home/vehicle-city.png'),
  pro: require('../assets/home/vehicle-pro.png'),
};

function artFor(name) {
  const value = String(name || '').toLowerCase();
  if (value.includes('fly')) return { image: IMAGES.fly, tint: '#EEF3FF', line: 'Light for every day' };
  if (value.includes('mink')) return { image: IMAGES.mink, tint: '#F6F1FC', line: 'Smooth city miles' };
  if (value.includes('pro')) return { image: IMAGES.pro, tint: '#FFF6F2', line: 'Built for longer rides' };
  return { image: IMAGES.city, tint: '#F3FBF6', line: 'Quiet across town' };
}

function rideStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status.includes('ongoing') || status.includes('active') || status.includes('start')) return ['ongoing', 'Ongoing'];
  if (status.includes('upcoming') || status.includes('confirm')) return ['upcoming', 'Upcoming'];
  return ['completed', 'Completed'];
}

function mapRide(item) {
  const [status, statusLabel] = rideStatus(item.status);
  const art = artFor(item.vehicle_model || item.evegah_model_name);
  return {
    id: item.reservation_id || item.id,
    status,
    statusLabel,
    vehicle: item.vehicle_model || item.evegah_model_name || 'Evegah City',
    line: art.line,
    tint: art.tint,
    image: art.image,
    pickup: item.pickup_zone || item.pickup_location || 'Pickup',
    drop: item.drop_zone || item.drop_location || item.pickup_zone || 'Drop',
    pickupWhen: shortDate(item.start_date || item.pickup_date || item.created_at),
    dropWhen: shortDate(item.end_date || item.drop_date || item.created_at),
    span: item.package_type || 'Daily',
    distance: item.distance_km ? `${item.distance_km} km` : '—',
    battery: item.battery_pct ? `${Math.round(item.battery_pct)}%` : '—',
    plan: item.package_type || 'Daily',
    fare: Number(item.fare || item.total_amount || 0),
    deposit: Number(item.deposit_amount || item.security_deposit || 250),
    depositBack: String(item.deposit_status || '').toLowerCase().includes('return'),
    method: item.payment_method || 'UPI',
  };
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

const ART = require('../assets/home/no-bookings.png');

const RIDES = [
  {
    id: 'EVG280826',
    status: 'completed',
    statusLabel: 'Completed',
    vehicle: 'Evegah City',
    line: 'Quiet across town',
    tint: '#F3FBF6',
    image: require('../assets/home/vehicle-city.png'),
    pickup: 'Gotri',
    drop: 'Gotri',
    pickupWhen: '28 Aug · 10:00 AM',
    dropWhen: '28 Aug · 6:00 PM',
    span: '8 hr',
    distance: '18.4 km',
    battery: '64%',
    plan: 'Daily',
    fare: 120,
    deposit: 250,
    depositBack: true,
    method: 'UPI',
  },
  {
    id: 'EVG141026',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    vehicle: 'Evegah Mink',
    line: 'Smooth city miles',
    tint: '#F6F1FC',
    image: require('../assets/home/vehicle-mink.png'),
    pickup: 'Gotri',
    drop: 'Manjalpur',
    pickupWhen: '14 Oct · 10:00 AM',
    dropWhen: '14 Oct · 6:00 PM',
    span: '8 hr',
    distance: '—',
    battery: '100%',
    plan: 'Daily',
    fare: 199,
    deposit: 250,
    depositBack: false,
    method: 'UPI',
  },
];

export default function MyRidesScreen({ onOpenHome, onOpenScan, onOpenProfile, onOpenWallet, onOpenRide, phone }) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [rides, setRides] = useState(RIDES);

  useEffect(() => {
    const mobile = last10(phone);
    if (!mobile) return;
    apiGet(`/reservations?mobile=${mobile}&limit=20`)
      .then((body) => {
        const list = body?.data || [];
        if (!list.length) return;
        setRides(list.map(mapRide));
      })
      .catch(() => {});
  }, [phone]);

  const reset = () => {
    setFilter('all');
    setQuery('');
  };

  const needle = query.trim().toLowerCase();
  const visible = rides.filter((ride) => {
    const statusOk = filter === 'all' || ride.status === filter;
    const text = `${ride.vehicle} ${ride.id} ${ride.pickup} ${ride.drop}`.toLowerCase();
    return statusOk && (!needle || text.includes(needle));
  });
  const countFor = (id) => (
    id === 'all' ? rides.length : rides.filter((ride) => ride.status === id).length
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>Manage and track all your rides</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
                <Text style={[styles.chipCount, active && styles.chipTextActive]}>{countFor(item.id)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        

        <View style={styles.dropdowns}>
          <Pressable style={styles.dropdown}>
            <Ionicons name="calendar-outline" size={15} color="#3A3A3A" />
            <Text style={styles.dropdownText}>Date</Text>
            <Ionicons name="chevron-down" size={14} color="#3A3A3A" />
          </Pressable>
          <Pressable style={styles.dropdown}>
            <Ionicons name="bicycle-outline" size={15} color="#3A3A3A" />
            <Text style={styles.dropdownText}>Vehicle</Text>
            <Ionicons name="chevron-down" size={14} color="#3A3A3A" />
          </Pressable>
          <Pressable style={styles.dropdown}>
            <Ionicons name="card-outline" size={15} color="#3A3A3A" />
            <Text style={styles.dropdownText}>Payment</Text>
            <Ionicons name="chevron-down" size={14} color="#3A3A3A" />
          </Pressable>
        </View>

        {visible.length ? (
          visible.map((ride, index) => (
            <Animated.View key={ride.id} entering={cardEnter(index)}>
              <Pressable onPress={() => onOpenRide?.(ride)} style={styles.ride}>
                <View style={[styles.rideArt, { backgroundColor: ride.tint }]}>
                  <Image source={ride.image} style={styles.rideImage} contentFit="contain" />
                </View>
                <View style={styles.rideCopy}>
                  <View style={styles.rideTop}>
                    <Text style={styles.rideName} numberOfLines={1}>{ride.vehicle}</Text>
                    <Text style={[styles.rideStatus, ride.status === 'completed' && styles.rideStatusDone]}>
                      {ride.statusLabel}
                    </Text>
                  </View>
                  <Text style={styles.rideRoute} numberOfLines={1}>{ride.pickup} → {ride.drop}</Text>
                  <Text style={styles.rideMeta}>{ride.pickupWhen} · ₹{ride.fare}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C8C0D4" />
              </Pressable>
            </Animated.View>
          ))
        ) : (
        <Animated.View entering={cardEnter(0)} style={styles.empty}>
          <Image source={ART} style={styles.art} contentFit="contain" />
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptySub}>
            Try changing your search query or reset filters to see all rides.
          </Text>
          <Pressable onPress={reset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset All Filters</Text>
          </Pressable>
        </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.tab} onPress={onOpenHome}>
          <Ionicons name="home-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>
        <Pressable style={styles.tab}>
          <Ionicons name="bicycle" size={22} color={PURPLE} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>My Rides</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onOpenScan}>
          <View style={styles.scanButton}>
            <Ionicons name="scan-outline" size={26} color="#FFFFFF" />
            <Ionicons name="qr-code" size={12} color="#FFFFFF" style={styles.scanQr} />
          </View>
          <Text style={styles.tabLabel}>Scan</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onOpenWallet}>
          <Ionicons name="wallet-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>Wallet</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onOpenProfile}>
          <Ionicons name="person-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#161616',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#8A8A8A',
  },
  chips: {
    marginTop: 18,
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: PURPLE,
    backgroundColor: '#F6F1FC',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3A',
  },
  chipCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8A',
  },
  chipTextActive: {
    color: PURPLE,
  },
  searchRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1C1C1C',
    paddingVertical: 0,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdowns: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  ride: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F1F3',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rideArt: {
    width: 72,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideImage: {
    width: 64,
    height: 44,
  },
  rideCopy: {
    flex: 1,
  },
  rideTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rideName: {
    flex: 1,
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  rideStatus: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  rideStatusDone: {
    color: '#1F8A4C',
  },
  rideRoute: {
    marginTop: 3,
    color: '#6E6878',
    fontSize: 13,
  },
  rideMeta: {
    marginTop: 2,
    color: '#8A8496',
    fontSize: 12,
  },
  empty: {
    marginTop: 48,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  art: {
    width: 240,
    height: 140,
  },
  emptyTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: '800',
    color: '#161616',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#8A8A8A',
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 22,
    alignSelf: 'stretch',
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: PURPLE,
    fontWeight: '700',
  },
  scanButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  scanQr: {
    position: 'absolute',
    top: 15,
    left: 15,
  },
});
