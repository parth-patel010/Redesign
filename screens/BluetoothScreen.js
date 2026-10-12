import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PURPLE = '#4A168C';

const NEARBY = [
  {
    name: 'Evegah City',
    code: 'EV-1042',
    away: '2 m',
    tint: '#F3FBF6',
    image: require('../assets/home/vehicle-city.png'),
  },
  {
    name: 'Evegah Mink',
    code: 'EV-2208',
    away: '8 m',
    tint: '#F6F1FC',
    image: require('../assets/home/vehicle-mink.png'),
  },
];

export default function BluetoothScreen({ onBack, onUnlock }) {
  const insets = useSafeAreaInsets();
  const [searching, setSearching] = useState(true);
  const [pass, setPass] = useState(0);
  const pulse = useSharedValue(0);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: searching ? 0.28 * (1 - pulse.value) : 0,
    transform: [{ scale: 0.8 + pulse.value * 0.45 }],
  }));

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }),
      -1,
      false,
    );
  }, [pulse]);

  useEffect(() => {
    if (!searching) return undefined;
    const timer = setTimeout(() => setSearching(false), 1400);
    return () => clearTimeout(timer);
  }, [searching, pass]);

  const searchAgain = () => {
    setSearching(true);
    setPass((value) => value + 1);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Bluetooth</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.hero}>
        <View style={styles.markWrap}>
          <Animated.View style={[styles.ring, ringStyle]} />
          <View style={styles.mark}>
            <Ionicons name="bluetooth" size={26} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.title}>{searching ? 'Looking nearby' : 'Scooters next to you'}</Text>
        <Text style={styles.subtitle}>
          {searching ? 'Keep Bluetooth on and stay close.' : 'Pick the one in front of you.'}
        </Text>
      </View>

      <View style={styles.list}>
        {searching ? (
          <Text style={styles.wait}>Searching…</Text>
        ) : (
          NEARBY.map((scooter, index) => (
            <Animated.View key={scooter.code} entering={FadeIn.duration(320).delay(index * 80)}>
              <Pressable onPress={() => onUnlock(scooter)} style={styles.card}>
                <View style={[styles.art, { backgroundColor: scooter.tint }]}>
                  <Image source={scooter.image} style={styles.image} contentFit="contain" />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.name}>{scooter.name}</Text>
                  <Text style={styles.meta}>{scooter.code} · {scooter.away}</Text>
                </View>
                <Text style={styles.unlock}>Unlock</Text>
              </Pressable>
            </Animated.View>
          ))
        )}
      </View>

      {!searching ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable onPress={searchAgain} style={styles.again}>
            <Text style={styles.againText}>Search again</Text>
          </Pressable>
        </View>
      ) : null}
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
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 24,
  },
  markWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: PURPLE,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 8,
    color: '#1C1C1C',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    color: '#6E6878',
    fontSize: 14,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  wait: {
    textAlign: 'center',
    color: '#8A8496',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  art: {
    width: 84,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 74,
    height: 50,
  },
  copy: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    marginTop: 3,
    color: '#6E6878',
    fontSize: 13,
  },
  unlock: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
  },
  again: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  againText: {
    color: PURPLE,
    fontSize: 16,
    fontWeight: '700',
  },
});
