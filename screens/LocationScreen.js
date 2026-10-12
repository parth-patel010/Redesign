import { useEffect } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const { width: SCREEN_W } = Dimensions.get('window');
const PURPLE = '#4A168C';
const MAP = require('../assets/home/location-map.jpg');
const MAP_HEIGHT = Math.round(SCREEN_W * 0.72);

const PINS = [
  { name: 'Evegah', distance: '3.6 km', x: 0.76, y: 0.32, tint: '#F3EEF8', icon: PURPLE },
  { name: 'Manjalpur', distance: '9.5 km', x: 0.2, y: 0.3, tint: '#E7F6EC', icon: '#1F8A4C' },
  { name: 'Gotri', distance: '13 km', x: 0.18, y: 0.7, tint: '#E8F4FC', icon: '#2B7BB9' },
  { name: 'Aatapi', distance: '18.6 km', x: 0.78, y: 0.66, tint: '#FFF4E8', icon: '#E07A1F' },
];

function PressScale({ style, children, scaleTo = 0.975, entering }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(scaleTo, { duration: 160, easing: Easing.out(Easing.cubic) });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
      }}
    >
      <Animated.View entering={entering} style={[style, animStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

function RadarScan({ size }) {
  const spin = useSharedValue(0);
  const beat = useSharedValue(1);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.linear }), -1, false);
    beat.value = withRepeat(
      withTiming(1.16, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [beat, spin]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const beatStyle = useAnimatedStyle(() => ({
    transform: [{ scale: beat.value }],
  }));

  return (
    <View style={[styles.radar, { width: size, height: size }]}>
      <View style={[styles.radarRing, { width: size, height: size, borderRadius: size / 2 }]}>
        <View
          style={[
            styles.radarClip,
            { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 },
          ]}
        >
          {[0.33, 0.58, 0.84].map((scale) => (
            <View
              key={scale}
              style={[
                styles.ring,
                {
                  width: (size - 4) * scale,
                  height: (size - 4) * scale,
                  borderRadius: ((size - 4) * scale) / 2,
                },
              ]}
            />
          ))}
          <Animated.View style={[{ width: size - 4, height: size - 4 }, spinStyle]}>
            <LinearGradient
              colors={['rgba(122,63,240,0.78)', 'rgba(122,63,240,0.24)', 'rgba(122,63,240,0)']}
              locations={[0, 0.42, 1]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: (size - 4) / 2,
                height: (size - 4) / 2,
              }}
            />
          </Animated.View>
        </View>
      </View>
      <Animated.View style={[styles.dotWrap, beatStyle]}>
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
}

function MapRadar({ width, height, topInset }) {
  const sheetOverlap = 28;
  const visibleTop = topInset + 8;
  const visibleBottom = height - sheetOverlap - 8;
  const visibleH = Math.max(visibleBottom - visibleTop, 120);
  const size = Math.min(width * 0.74, visibleH);
  const cx = width / 2;
  const cy = visibleTop + visibleH / 2;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View pointerEvents="none" style={[styles.radarSlot, { left: cx - size / 2, top: cy - size / 2 }]}>
        <RadarScan size={size} />
      </View>
      {PINS.map((pin, index) => (
        <Animated.View
          key={pin.name}
          entering={ZoomIn.delay(220 + index * 140).duration(460)}
          style={[styles.pin, { left: pin.x * width - 46, top: pin.y * height - 24 }]}
        >
          <PressScale style={styles.pinPress} scaleTo={0.92}>
            <View style={styles.pinBubble}>
              <View style={[styles.pinIcon, { backgroundColor: pin.tint }]}>
                <Ionicons name="storefront" size={15} color={pin.icon} />
              </View>
            </View>
            <View style={styles.pinPill}>
              <Text style={styles.pinText}>
                {pin.name} · {pin.distance}
              </Text>
            </View>
          </PressScale>
        </Animated.View>
      ))}
    </View>
  );
}

const ZONES = [
  {
    name: 'Evegah Zone',
    address: 'Krishna Battery Sales & Services',
    hours: '06:00 – 23:00',
    phone: '+91 89809 66376',
    distance: '3.6 km',
    tint: '#F3EEF8',
    icon: PURPLE,
  },
  {
    name: 'Manjalpur Zone',
    address: 'Office No. 11, Vidya Dham Society',
    hours: '10:00 – 22:00',
    phone: '+91 89809 66677',
    distance: '9.5 km',
    tint: '#E7F6EC',
    icon: '#1F8A4C',
  },
  {
    name: 'Gotri Zone',
    address: 'Office 10, Royal Nandish, New Alkapuri',
    hours: '10:00 – 22:00',
    phone: '+91 81282 5117',
    distance: '13.0 km',
    tint: '#E8F4FC',
    icon: '#2B7BB9',
  },
  {
    name: 'Aatapi Zone',
    address: 'Evegah Aatapi Wonderland, Ajwa',
    hours: '',
    phone: '',
    distance: '18.6 km',
    tint: '#FFF4E8',
    icon: '#E07A1F',
  },
];

export default function LocationScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const mapH = MAP_HEIGHT + insets.top;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.mapWrap, { height: mapH }]}>
        <Image source={MAP} style={styles.map} contentFit="cover" contentPosition="center" />
        <MapRadar width={SCREEN_W} height={mapH} topInset={insets.top} />
      </View>

      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={[styles.back, { top: insets.top + 10 }]}
      >
        <Ionicons name="chevron-back" size={22} color="#1C1C1C" />
      </Pressable>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={cardEnter(0)} style={styles.currentCard}>
          <View style={styles.currentIcon}>
            <Ionicons name="locate" size={20} color={PURPLE} />
          </View>
          <View style={styles.currentCopy}>
            <Text style={styles.currentTitle}>Current Location</Text>
            <Text style={styles.currentAddress} numberOfLines={1}>
              868Q+5X4, Ajwa Rd, Sonalvatika
            </Text>
          </View>
          <Pressable onPress={onBack} hitSlop={8} style={styles.useCurrent}>
            <Ionicons name="paper-plane-outline" size={14} color={PURPLE} />
            <Text style={styles.useCurrentText}>Use Current</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.sectionHead}>
          <Ionicons name="navigate" size={14} color={PURPLE} />
          <View>
            <Text style={styles.sectionTitle}>Nearest Zones</Text>
            <Text style={styles.sectionSub}>Based on your current location</Text>
          </View>
        </View>

        {ZONES.map((zone, index) => (
          <PressScale key={zone.name} entering={cardEnter(index + 1)} style={styles.zoneCard}>
            <View style={styles.zoneTop}>
              <View style={[styles.zoneMark, { backgroundColor: zone.tint }]}>
                <Ionicons name="storefront" size={22} color={zone.icon} />
              </View>
              <View style={styles.zoneMain}>
                <View style={styles.zoneTitleRow}>
                  <Text style={styles.zoneName} numberOfLines={1}>
                    {zone.name}
                  </Text>
                  <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Operational</Text>
                  </View>
                </View>
                <Text style={styles.zoneAddress} numberOfLines={1}>
                  {zone.address}
                </Text>
              </View>
              <View style={styles.distanceWrap}>
                <Text style={styles.distanceValue}>{zone.distance}</Text>
                <Text style={styles.distanceAway}>away</Text>
              </View>
            </View>

            <View style={styles.zoneFoot}>
              <View style={styles.metaCol}>
                {zone.hours ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={13} color="#8A8A8A" />
                    <Text style={styles.metaText}>{zone.hours}</Text>
                  </View>
                ) : null}
                {zone.phone ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="call-outline" size={13} color="#8A8A8A" />
                    <Text style={styles.metaText}>{zone.phone}</Text>
                  </View>
                ) : null}
              </View>
              <Pressable style={styles.direction}>
                <Ionicons name="navigate-outline" size={14} color={PURPLE} />
                <Text style={styles.directionText}>Direction</Text>
              </Pressable>
            </View>
          </PressScale>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  mapWrap: {
    width: '100%',
    backgroundColor: '#E7EEF2',
    overflow: 'hidden',
  },
  radarSlot: {
    position: 'absolute',
  },
  radar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(122, 63, 240, 0.95)',
    backgroundColor: 'transparent',
  },
  radarClip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(122, 63, 240, 0.16)',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(122, 63, 240, 0.75)',
  },
  dotWrap: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(122, 63, 240, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#7A3FF0',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  pin: {
    position: 'absolute',
    width: 92,
    alignItems: 'center',
  },
  pinPress: {
    alignItems: 'center',
  },
  pinBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  pinIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPill: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pinText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  back: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  sheet: {
    flex: 1,
    marginTop: -28,
    backgroundColor: '#F7F7F8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0F0F2',
  },
  currentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentCopy: {
    flex: 1,
  },
  currentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  currentAddress: {
    marginTop: 2,
    fontSize: 12,
    color: '#8A8A8A',
  },
  useCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  useCurrentText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  sectionHead: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  sectionSub: {
    marginTop: 1,
    fontSize: 12,
    color: '#8A8A8A',
  },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F2',
  },
  zoneTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  zoneMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneMain: {
    flex: 1,
    paddingTop: 2,
  },
  zoneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoneName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E7F6EC',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1F8A4C',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F8A4C',
  },
  zoneAddress: {
    marginTop: 4,
    fontSize: 12,
    color: '#6E6E6E',
  },
  distanceWrap: {
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  distanceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE,
  },
  distanceAway: {
    marginTop: 1,
    fontSize: 11,
    color: '#8A8A8A',
  },
  zoneFoot: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  metaCol: {
    gap: 4,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6E6E6E',
  },
  direction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3EEF8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  directionText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
});
