import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet, last10, shortDate } from '../services/api';

const PURPLE = '#4A168C';
const PAGE = '#F6F5FB';
const HERO_BG = require('../assets/rides/rides-hero-bg.jpg');
const HERO_SCOOTER = require('../assets/rides/header-scooter.png');
const IMAGES = {
  fly: require('../assets/home/vehicle-fly.png'),
  mink: require('../assets/home/vehicle-mink.png'),
  city: require('../assets/home/vehicle-city.png'),
  pro: require('../assets/home/vehicle-pro.png'),
};
const EMPTY_ART = require('../assets/home/no-bookings.png');

function artFor(name) {
  const value = String(name || '').toLowerCase();
  if (value.includes('fly')) return { image: IMAGES.fly, tint: '#F4F5F8', line: 'Light for every day' };
  if (value.includes('mink')) return { image: IMAGES.mink, tint: '#F3EEF8', line: 'Smooth city miles' };
  if (value.includes('pro') || value.includes('plus')) return { image: IMAGES.city, tint: '#F4F5F8', line: 'Smooth city miles' };
  return { image: IMAGES.city, tint: '#F4F5F8', line: 'Quiet across town' };
}

function rideStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status.includes('ongoing') || status.includes('active') || status.includes('start')) return ['ongoing', 'Ongoing'];
  if (status.includes('upcoming') || status.includes('confirm')) return ['upcoming', 'Upcoming'];
  return ['completed', 'Completed'];
}

function statusTone(status) {
  if (status === 'completed') return { bg: '#E8F8EF', fg: '#16A34A' };
  if (status === 'ongoing') return { bg: '#EDE9FE', fg: '#6D28D9' };
  return { bg: '#F3E8FF', fg: '#7C3AED' };
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

const RANK = { ongoing: 0, upcoming: 1, completed: 2 };

const RIDES = [
  {
    id: 'EVG141026',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    vehicle: 'Evegah Mink',
    line: 'Smooth city miles',
    tint: '#F3EEF8',
    image: require('../assets/home/vehicle-mink.png'),
    pickup: 'Gotri',
    drop: 'Manjalpur',
    pickupWhen: '14 Oct 2024 · 10:00 AM',
    dropWhen: '14 Oct 2024 · 6:00 PM',
    span: '8 hr',
    distance: '—',
    battery: '100%',
    plan: 'Daily',
    fare: 199,
    deposit: 250,
    depositBack: false,
    method: 'UPI',
  },
  {
    id: 'EVG121024',
    status: 'completed',
    statusLabel: 'Completed',
    vehicle: 'Evegah Plus',
    line: 'Power for every route',
    tint: '#F4F5F8',
    image: require('../assets/home/vehicle-city.png'),
    pickup: 'Alkapuri',
    drop: 'Vasna',
    pickupWhen: '12 Oct 2024 · 06:20 PM',
    dropWhen: '12 Oct 2024 · 6:00 PM',
    span: '4 hr',
    distance: '12 km',
    battery: '71%',
    plan: 'Daily',
    fare: 146,
    deposit: 250,
    depositBack: true,
    method: 'UPI',
  },
];

function RideCard({ ride, onPress }) {
  const tone = statusTone(ride.status);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={[styles.stamp, { backgroundColor: tone.bg }]}>
        <Text style={[styles.stampText, { color: tone.fg }]}>{ride.statusLabel}</Text>
      </View>
      <View style={styles.cardTop}>
        <View style={[styles.cardArt, { backgroundColor: ride.tint }]}>
          <Image source={ride.image} style={styles.cardImage} contentFit="contain" />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardName} numberOfLines={1}>{ride.vehicle}</Text>
          <Text style={styles.cardLine} numberOfLines={1}>{ride.line}</Text>
          <View style={styles.route}>
            <View style={styles.rail}>
              <View style={styles.dotFill} />
              <View style={styles.railLine} />
              <View style={styles.dotRing} />
            </View>
            <View style={styles.places}>
              <Text style={styles.place} numberOfLines={1}>{ride.pickup}</Text>
              <Text style={styles.place} numberOfLines={1}>{ride.drop}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.cardFoot}>
        <Ionicons name="calendar-outline" size={14} color="#A39BB0" />
        <Text style={styles.cardWhen} numberOfLines={1}>{ride.pickupWhen}</Text>
        <Text style={styles.cardFare}>₹{ride.fare}</Text>
        <Ionicons name="chevron-forward" size={15} color="#C4B5FD" />
      </View>
    </Pressable>
  );
}

export default function MyRidesScreen({ onOpenHome, onOpenScan, onOpenProfile, onOpenWallet, onOpenRide, phone }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const bodyY = useRef(0);
  const listY = useRef(0);
  const [filter, setFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
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

  const needle = query.trim().toLowerCase();
  const vehicles = ['all', ...new Set(rides.map((ride) => ride.vehicle))];
  const visible = rides
    .filter((ride) => {
      const statusOk = filter === 'all' || ride.status === filter;
      const vehicleOk = vehicleFilter === 'all' || ride.vehicle === vehicleFilter;
      const text = `${ride.vehicle} ${ride.id} ${ride.pickup} ${ride.drop}`.toLowerCase();
      return statusOk && vehicleOk && (!needle || text.includes(needle));
    })
    .slice()
    .sort((a, b) => (RANK[a.status] ?? 3) - (RANK[b.status] ?? 3));
  const countFor = (id) => (
    id === 'all' ? rides.length : rides.filter((ride) => ride.status === id).length
  );
  const bookingLabel = rides.length === 1 ? '1 booking' : `${rides.length} bookings`;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
          <Image pointerEvents="none" source={HERO_BG} style={styles.heroBg} contentFit="cover" />
          <Text style={styles.kicker}>MY RIDES</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>Every ride,{'\n'}in one place</Text>
              <Text style={styles.subtitle}>Book, manage and track all{'\n'}your Evegah rides easily.</Text>
            </View>
          </View>
          <Image pointerEvents="none" source={HERO_SCOOTER} style={styles.heroArt} contentFit="contain" />
        </View>

        <View
          style={styles.body}
          onLayout={(event) => {
            bodyY.current = event.nativeEvent.layout.y;
          }}
        >
          <BlurView intensity={20} tint="light" style={styles.summary}>
            <View style={styles.summaryCopy}>
              <View style={styles.clubPill}>
                <View style={styles.sparkBox}>
                  <Ionicons name="sparkles" size={13} color="#7C3AED" />
                </View>
                <Text style={styles.clubText}>EVEGAH RIDES</Text>
              </View>
              <Text style={styles.summaryTitle}>{bookingLabel}</Text>
              <Text style={styles.summarySub}>Open any ride for the route,{'\n'}time, and bill.</Text>
            </View>
            <Pressable
              style={styles.summaryBtn}
              onPress={() => scrollRef.current?.scrollTo({ y: Math.max(0, bodyY.current + listY.current - 8), animated: true })}
            >
              <Ionicons name="arrow-forward" size={18} color="#6D28D9" />
            </Pressable>
          </BlurView>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="car-sport" size={14} color="#6D28D9" />
              </View>
              <View style={styles.statCopy}>
                <Text style={styles.statValue}>{rides.length}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>Rides</Text>
              </View>
            </View>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time" size={14} color="#D97706" />
              </View>
              <View style={styles.statCopy}>
                <Text style={styles.statValue}>{countFor('upcoming')}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>Upcoming</Text>
              </View>
            </View>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              </View>
              <View style={styles.statCopy}>
                <Text style={styles.statValue}>{countFor('completed')}</Text>
                <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Completed</Text>
              </View>
            </View>
          </View>

          <View style={styles.chips}>
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {item.label} {countFor(item.id)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.search}>
            <Ionicons name="search" size={16} color="#A39BB0" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search vehicle, zone, or booking..."
              placeholderTextColor="#B0A9BC"
              style={styles.searchInput}
            />
            <Pressable
              hitSlop={8}
              onPress={() => setFilterOpen(true)}
              style={[styles.filterBtn, (filter !== 'all' || vehicleFilter !== 'all') && styles.filterBtnOn]}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={(filter !== 'all' || vehicleFilter !== 'all') ? '#FFFFFF' : '#5B21B6'}
              />
            </Pressable>
          </View>

          <View
            onLayout={(event) => {
              listY.current = event.nativeEvent.layout.y;
            }}
          >
            {visible.length ? (
              visible.map((ride, index) => (
                <Animated.View key={ride.id} entering={cardEnter(index)}>
                  <RideCard ride={ride} onPress={() => onOpenRide?.(ride)} />
                </Animated.View>
              ))
            ) : (
              <Animated.View entering={cardEnter(0)} style={styles.empty}>
                <Image source={EMPTY_ART} style={styles.emptyArt} contentFit="contain" />
                <Text style={styles.emptyTitle}>No bookings in this view</Text>
                <Text style={styles.emptySub}>Try another search, or show every ride.</Text>
                <Pressable
                  onPress={() => {
                    setFilter('all');
                    setVehicleFilter('all');
                    setQuery('');
                  }}
                  style={styles.resetBtn}
                >
                  <Text style={styles.resetText}>Show all rides</Text>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
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
      {filterOpen ? (
        <View style={styles.filterShade}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterOpen(false)} />
          <View style={[styles.filterSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.filterHandle} />
            <Text style={styles.filterTitle}>Filter rides</Text>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterOptions}>
              {FILTERS.map((item) => {
                const active = filter === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setFilter(item.id)}
                    style={[styles.filterOption, active && styles.filterOptionOn]}
                  >
                    <Text style={[styles.filterOptionText, active && styles.filterOptionTextOn]}>
                      {item.label} {countFor(item.id)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.filterLabel}>Vehicle</Text>
            <View style={styles.filterOptions}>
              {vehicles.map((name) => {
                const active = vehicleFilter === name;
                const label = name === 'all' ? 'All vehicles' : String(name).replace('Evegah ', '');
                return (
                  <Pressable
                    key={name}
                    onPress={() => setVehicleFilter(name)}
                    style={[styles.filterOption, active && styles.filterOptionOn]}
                  >
                    <Text style={[styles.filterOptionText, active && styles.filterOptionTextOn]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.filterDone} onPress={() => setFilterOpen(false)}>
              <Text style={styles.filterDoneText}>Show rides</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE,
  },
  scroll: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    overflow: 'hidden',
    backgroundColor: '#3B0764',
    borderBottomLeftRadius: 56,
    borderBottomRightRadius: 56,
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  kicker: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroRow: {
    marginTop: 6,
    minHeight: 88,
    paddingRight: 128,
    justifyContent: 'center',
  },
  heroCopy: {
    zIndex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 16,
  },
  heroArt: {
    position: 'absolute',
    right: 0,
    top: 36,
    width: 124,
    height: 104,
    zIndex: 1,
  },
  summary: {
    marginTop: 16,
    marginBottom: 16,
    zIndex: 2,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1C1230',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sparkBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
  },
  clubPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clubText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  summaryTitle: {
    marginTop: 6,
    color: '#1C1430',
    fontSize: 18,
    fontWeight: '800',
  },
  summarySub: {
    marginTop: 2,
    color: '#8A8496',
    fontSize: 13,
    lineHeight: 18,
  },
  summaryBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathArt: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 120,
    opacity: 0.38,
    zIndex: 0,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 0,
    zIndex: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#1C1230',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCopy: {
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    color: '#1C1C1C',
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8A8496',
    fontSize: 10,
    fontWeight: '600',
  },
  chips: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: PURPLE,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B6575',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  search: {
    marginTop: 12,
    marginBottom: 4,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1C',
    paddingVertical: 0,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnOn: {
    backgroundColor: PURPLE,
  },
  filterShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    elevation: 30,
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  filterHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4DCEF',
    marginBottom: 12,
  },
  filterTitle: {
    color: '#1C1C1C',
    fontSize: 20,
    fontWeight: '800',
  },
  filterLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F6F1FC',
  },
  filterOptionOn: {
    backgroundColor: PURPLE,
  },
  filterOptionText: {
    color: '#3A3542',
    fontSize: 13,
    fontWeight: '700',
  },
  filterOptionTextOn: {
    color: '#FFFFFF',
  },
  filterDone: {
    marginTop: 18,
    height: 48,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: 'hidden',
    shadowColor: '#1C1230',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardArt: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: 56,
    height: 46,
  },
  cardCopy: {
    flex: 1,
    paddingRight: 78,
  },
  cardName: {
    color: '#1C1430',
    fontSize: 16,
    fontWeight: '800',
  },
  cardLine: {
    marginTop: 1,
    color: '#9A94A6',
    fontSize: 12,
    fontWeight: '600',
  },
  route: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  rail: {
    width: 10,
    alignItems: 'center',
    paddingTop: 3,
  },
  dotFill: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
  },
  railLine: {
    width: 2,
    flex: 1,
    minHeight: 12,
    marginVertical: 2,
    backgroundColor: '#DDD6FE',
  },
  dotRing: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C4B5FD',
    backgroundColor: '#FFFFFF',
  },
  places: {
    flex: 1,
    gap: 6,
  },
  place: {
    color: '#3C3846',
    fontSize: 13,
    fontWeight: '700',
  },
  stamp: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stampText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardFoot: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1EEF6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardWhen: {
    flex: 1,
    color: '#8A8496',
    fontSize: 13,
    fontWeight: '600',
  },
  cardFare: {
    color: PURPLE,
    fontSize: 16,
    fontWeight: '800',
  },
  empty: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  emptyArt: {
    width: 180,
    height: 110,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '800',
    color: '#161616',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#8A8A8A',
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 16,
    alignSelf: 'stretch',
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tabBar: {
    zIndex: 2,
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
