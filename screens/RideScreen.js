import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PURPLE = '#4A168C';
const PLACES = {
  Gotri: { latitude: 22.3106, longitude: 73.1248 },
  Manjalpur: { latitude: 22.2705, longitude: 73.1889 },
  Aatapi: { latitude: 22.3488, longitude: 73.1612 },
  KPGU: { latitude: 22.3694, longitude: 73.1086 },
};

function placeFor(name) {
  const key = Object.keys(PLACES).find((item) => String(name || '').toLowerCase().includes(item.toLowerCase()));
  return PLACES[key] || PLACES.Gotri;
}

function ridePoint(trip, seconds) {
  const from = placeFor(trip?.pickupName);
  const to = placeFor(trip?.dropName);
  const progress = 1 - Math.exp(-seconds / 80);
  const wobble = Math.sin(seconds / 6) * 0.00035;
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * progress + Math.cos(seconds / 6) * 0.0002,
    longitude: from.longitude + (to.longitude - from.longitude) * progress + wobble,
  };
}

function clock(total) {
  const safe = Math.max(0, total);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function timeLeft(dropAt, now) {
  if (!dropAt) return 'Scheduled';
  const left = Math.floor((dropAt - now) / 1000);
  if (left <= 0) return 'Drop time';
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return clock(left);
}

export default function RideScreen({ vehicle, trip, receipt, onBack, onEnd }) {
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(0);
  const [now, setNow] = useState(Date.now());
  const mapRef = useRef(null);
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const position = ridePoint(trip, seconds);
  const start = placeFor(trip?.pickupName);

  useEffect(() => {
    mapRef.current?.animateToRegion(
      {
        ...position,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      900,
    );
  }, [position.latitude, position.longitude]);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((value) => value + 1);
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const speed = 16 + Math.round(6 * Math.abs(Math.sin(seconds / 8)));
  const distance = (seconds / 3600) * 18;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          ...start,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        mapPadding={{ top: insets.top + 64, right: 12, bottom: 340, left: 12 }}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}
        loadingBackgroundColor="#E7E4EA"
      >
        <Circle
          center={position}
          radius={46 + ((seconds % 3) / 3) * 70}
          fillColor="rgba(74, 22, 140, 0.16)"
          strokeColor="rgba(74, 22, 140, 0.28)"
          strokeWidth={1}
        />
        <Marker coordinate={position} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.dot} />
        </Marker>
      </MapView>

      <View style={[styles.top, { top: insets.top + 10 }]}>
        <Pressable hitSlop={8} style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <View style={styles.topCard}>
          <Text style={styles.topId} numberOfLines={1}>{receipt?.bookingId || 'EVG'}</Text>
          <View style={styles.topSplit} />
          <Ionicons name="time-outline" size={14} color={PURPLE} />
          <Text style={styles.topLeft}>{timeLeft(trip?.dropAt, now)}</Text>
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />
        <View style={styles.hero}>
          <View style={[styles.heroArt, { backgroundColor: vehicle?.tint || '#F6F1FC' }]}>
            {vehicle?.image ? (
              <Image source={vehicle.image} style={styles.heroImage} contentFit="contain" />
            ) : null}
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroName}>{vehicle?.name || 'Your scooter'}</Text>
            <Text style={styles.heroRoute} numberOfLines={1}>
              {trip?.pickupName || 'Pickup'}  →  {trip?.dropName || 'Drop'}
            </Text>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Riding</Text>
            </View>
          </View>
        </View>

        <Text style={styles.timer}>{clock(seconds)}</Text>
        <Text style={styles.timerLabel}>On this ride</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{distance.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statLine} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>86%</Text>
            <Text style={styles.statLabel}>Battery</Text>
          </View>
          <View style={styles.statLine} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{speed} km/h</Text>
            <Text style={styles.statLabel}>Speed</Text>
          </View>
        </View>

        <Pressable
          onPress={() => onEnd?.({
            elapsed: clock(seconds),
            distance: distance.toFixed(1),
          })}
          onPressIn={() => {
            btnScale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
        >
          <Animated.View style={[styles.end, btnStyle]}>
            <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
            <Text style={styles.endText}>End ride</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E7E4EA',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PURPLE,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  top: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCard: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topId: {
    flex: 1,
    color: '#1C1C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  topSplit: {
    width: 1,
    height: 16,
    backgroundColor: '#E8E4EE',
  },
  topLeft: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '800',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E0E8',
    marginBottom: 16,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroArt: {
    width: 84,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 76,
    height: 52,
  },
  heroCopy: {
    flex: 1,
    marginLeft: 12,
  },
  heroName: {
    color: '#1C1C1C',
    fontSize: 18,
    fontWeight: '700',
  },
  heroRoute: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 13,
  },
  liveRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1F8A4C',
  },
  liveText: {
    color: '#1F8A4C',
    fontSize: 12,
    fontWeight: '700',
  },
  timer: {
    marginTop: 18,
    textAlign: 'center',
    color: '#1C1C1C',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  timerLabel: {
    textAlign: 'center',
    color: '#8A8496',
    fontSize: 13,
    fontWeight: '600',
  },
  stats: {
    marginTop: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F8',
    borderRadius: 18,
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#1C1C1C',
    fontSize: 15,
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
    backgroundColor: '#E8E4EE',
  },
  end: {
    height: 52,
    borderRadius: 16,
    backgroundColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  endText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
