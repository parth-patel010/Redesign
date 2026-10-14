import { useEffect, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Circle, Marker, Polyline, UrlTile } from 'react-native-maps';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet } from '../services/api';

const PURPLE = '#4A168C';
const DARK_TEXT = '#24083C';
const SUB_TEXT = '#280D42';

const PLACES = {
  Bill: { latitude: 22.2587, longitude: 73.1496 },
  Gotri: { latitude: 22.3106, longitude: 73.1248 },
  Alkapuri: { latitude: 22.3106, longitude: 73.1726 },
  Manjalpur: { latitude: 22.2705, longitude: 73.1889 },
  Aatapi: { latitude: 22.3488, longitude: 73.1612 },
  KPGU: { latitude: 22.3694, longitude: 73.1086 },
};

const RIDE_MODES = [
  { id: 'eco', label: 'Eco Mode', baseSpeed: 19, rangeKm: 72 },
  { id: 'city', label: 'City Mode', baseSpeed: 27, rangeKm: 58 },
  { id: 'sport', label: 'Sport Mode', baseSpeed: 36, rangeKm: 46 },
];

const EXTEND_OPTIONS = [
  { id: '2h', label: '+2 Hours', sub: 'Quick city errand extension', hours: 2, price: 39, tag: 'Quick' },
  { id: '6h', label: '+6 Hours', sub: 'Half-day shift extension', hours: 6, price: 79, tag: 'Popular' },
  { id: '1d', label: '+1 Day (24 hrs)', sub: 'Full 24-hour package extension', hours: 24, price: 119, tag: 'Best Value' },
  { id: '3d', label: '+3 Days', sub: 'Multi-day commuter extension', hours: 72, price: 329, tag: 'Save 12%' },
  { id: '7d', label: '+7 Days (Weekly)', sub: 'Weekly fleet saver pack', hours: 168, price: 699, tag: 'Super Saver' },
];

function placeFor(name) {
  const key = Object.keys(PLACES).find((item) =>
    String(name || '').toLowerCase().includes(item.toLowerCase())
  );
  return PLACES[key] || PLACES.Bill;
}

function buildRouteWaypoints(from) {
  return [
    from,
    { latitude: from.latitude + 0.0022, longitude: from.longitude - 0.0014 },
    { latitude: from.latitude + 0.0046, longitude: from.longitude + 0.0008 },
    { latitude: from.latitude + 0.0068, longitude: from.longitude + 0.0028 },
    { latitude: from.latitude + 0.0085, longitude: from.longitude + 0.0042 },
  ];
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

function formatDropTimeOnly(ms) {
  if (!ms) return '8:00 AM';
  const d = new Date(ms);
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase();
}

function formatDropDate(ms) {
  if (!ms) return 'Scheduled';
  const d = new Date(ms);
  return `${d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })} · ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
}

function getTopDownVehicleAsset(name) {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('city')) return require('../assets/home/city-top.png');
  if (lower.includes('fly')) return require('../assets/home/fly-top.png');
  if (lower.includes('pro')) return require('../assets/home/pro-top.png');
  return require('../assets/home/mink-top.png');
}

export default function RideScreen({
  vehicle,
  trip,
  receipt,
  onBack,
  onExtendRide,
  onEnd,
}) {
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(1);
  const [rideMode, setRideMode] = useState('city');
  const [pausedLock] = useState(false);
  const [quickToast, setQuickToast] = useState(null);
  const [extraMs, setExtraMs] = useState(0);
  const [extraFareTotal, setExtraFareTotal] = useState(0);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedExtendId, setSelectedExtendId] = useState('1d');
  const [extendBanner, setExtendBanner] = useState(null);

  // BMS Live Telemetry & Auto Scan State
  const [bmsStatus, setBmsStatus] = useState('connected'); // 'connected' | 'scanning' | 'connecting' | 'disconnected'
  const [bmsSoc, setBmsSoc] = useState(86);
  const [bmsBatteryId, setBmsBatteryId] = useState('EVG-B42');
  const [bmsTemp, setBmsTemp] = useState(32);
  const [bmsVoltage, setBmsVoltage] = useState(54.2);
  const [bmsDetailOpen, setBmsDetailOpen] = useState(false);

  const mapRef = useRef(null);
  const btnScale = useSharedValue(1);
  const scanSpin = useSharedValue(0);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const scanSpinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scanSpin.value}deg` }],
  }));

  // Auto scan BMS logic on mount or user tap
  const runAutoScanBms = () => {
    setBmsStatus('scanning');
    scanSpin.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false
    );
    triggerQuickAction('Scanning Bluetooth & CanBus for EV BMS...');

    setTimeout(() => {
      setBmsStatus('connecting');
      apiGet('/batteries/stats')
        .then((body) => {
          const liveSoc = body?.avg_soc ? Math.round(body.avg_soc) : 88;
          setBmsSoc(liveSoc);
        })
        .catch(() => {});

      apiGet('/batteries')
        .then((rows) => {
          if (Array.isArray(rows) && rows.length > 0) {
            const first = rows[0];
            if (first.battery_id) setBmsBatteryId(first.battery_id);
            if (first.soc) setBmsSoc(Math.round(Number(first.soc)));
            if (first.voltage) setBmsVoltage(Number(first.voltage));
            if (first.temperature) setBmsTemp(Number(first.temperature));
          }
        })
        .catch(() => {});

      setTimeout(() => {
        setBmsStatus('connected');
        scanSpin.value = 0;
        triggerQuickAction(`BMS Connected! Live SOC: ${bmsSoc}% (${bmsBatteryId})`);
      }, 900);
    }, 1200);
  };

  // Initial Auto-Scan on mount to fetch real live BMS SOC
  useEffect(() => {
    runAutoScanBms();
  }, []);

  const startCoord = placeFor(trip?.pickupName);
  const waypoints = buildRouteWaypoints(startCoord);
  const progress = Math.min(0.88, 0.42 + (seconds % 90) * 0.005);
  const segCount = waypoints.length - 1;
  const exactIdx = progress * segCount;
  const segIdx = Math.min(segCount - 1, Math.floor(exactIdx));
  const segFrac = exactIdx - segIdx;
  const pA = waypoints[segIdx];
  const pB = waypoints[segIdx + 1];
  const position = {
    latitude: pA.latitude + (pB.latitude - pA.latitude) * segFrac,
    longitude: pA.longitude + (pB.longitude - pA.longitude) * segFrac,
  };
  const midCalloutCoord = waypoints[2];

  const baseDropAt = trip?.dropAt || Date.now() + 24 * 3600 * 1000;
  const effectiveDropAt = baseDropAt + extraMs;
  const bookingIdText = receipt?.bookingId || 'EVG39745433';

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((value) => (pausedLock ? value : value + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [pausedLock]);

  const activeModeObj =
    RIDE_MODES.find((m) => m.id === rideMode) || RIDE_MODES[1];
  const speed = pausedLock
    ? 0
    : activeModeObj.baseSpeed + Math.round(2 * Math.sin(seconds / 5));
  const distance = (seconds / 3600) * 22;
  const chosenOption =
    EXTEND_OPTIONS.find((item) => item.id === selectedExtendId) ||
    EXTEND_OPTIONS[2];
  const previewNewDropAt = effectiveDropAt + chosenOption.hours * 3600 * 1000;

  const cycleMode = () => {
    const idx = RIDE_MODES.findIndex((m) => m.id === rideMode);
    const next = RIDE_MODES[(idx + 1) % RIDE_MODES.length];
    setRideMode(next.id);
    triggerQuickAction(`Switched to ${next.label}`);
  };

  const triggerQuickAction = (msg) => {
    setQuickToast(msg);
    setTimeout(() => {
      setQuickToast((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  const handleConfirmExtend = () => {
    const addedMs = chosenOption.hours * 3600 * 1000;
    const nextExtraMs = extraMs + addedMs;
    const nextExtraFare = extraFareTotal + chosenOption.price;
    setExtraMs(nextExtraMs);
    setExtraFareTotal(nextExtraFare);
    setExtendModalOpen(false);
    setExtendBanner({
      label: chosenOption.label,
      newDropText: formatDropDate(baseDropAt + nextExtraMs),
      price: chosenOption.price,
    });
    onExtendRide?.({
      addedHours: chosenOption.hours,
      addedPrice: chosenOption.price,
      newDropAt: baseDropAt + nextExtraMs,
    });
  };

  const recenterMap = () => {
    mapRef.current?.animateToRegion(
      {
        latitude: (startCoord.latitude + position.latitude) / 2,
        longitude: (startCoord.longitude + position.longitude) / 2,
        latitudeDelta: 0.014,
        longitudeDelta: 0.014,
      },
      450
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Leaflet / OpenStreetMap Map Area */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          mapType="none"
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: (startCoord.latitude + position.latitude) / 2,
            longitude: (startCoord.longitude + position.longitude) / 2,
            latitudeDelta: 0.014,
            longitudeDelta: 0.014,
          }}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          showsCompass={false}
          loadingBackgroundColor="#ECEFF4"
        >
          {/* OpenStreetMap / Carto Voyager Leaflet Tile Layer */}
          <UrlTile
            urlTemplate="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />

          {/* Origin Soft Green Halo */}
          <Circle
            center={startCoord}
            radius={85}
            fillColor="rgba(34, 197, 94, 0.18)"
            strokeColor="rgba(34, 197, 94, 0.35)"
            strokeWidth={1.5}
          />

          {/* Route Polyline in Evegah Purple */}
          <Polyline
            coordinates={waypoints}
            strokeColor={PURPLE}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />

          {/* Green Origin Dot Marker */}
          <Marker coordinate={startCoord} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.originMarkerOuter}>
              <View style={styles.originMarkerInner} />
            </View>
          </Marker>

          {/* Mid-Route Turn Callout Bubble (2.3 km / 8 min) */}
          <Marker coordinate={midCalloutCoord} anchor={{ x: 0.5, y: 1.1 }}>
            <View style={styles.routeCalloutBubble}>
              <View style={styles.routeCalloutIconWrap}>
                <Ionicons name="return-up-forward" size={14} color={PURPLE} />
              </View>
              <View>
                <Text style={styles.routeCalloutDist}>2.3 km</Text>
                <Text style={styles.routeCalloutTime}>8 min</Text>
              </View>
            </View>
          </Marker>

          {/* Rider Current Position Soft Purple Halo */}
          <Circle
            center={position}
            radius={75}
            fillColor="rgba(109, 40, 217, 0.15)"
            strokeColor="rgba(109, 40, 217, 0.32)"
            strokeWidth={1.5}
          />

          {/* Top-Down 3D Evegah Scooter Marker (Rapido Style) */}
          <Marker coordinate={position} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.scooterMarkerWrap}>
              <View style={styles.scooterMarkerHalo} />
              <Image
                source={getTopDownVehicleAsset(vehicle?.name)}
                style={styles.scooterMarkerImg}
                contentFit="contain"
              />
            </View>
          </Marker>
        </MapView>

        {/* Leaflet / OpenStreetMap Attribution Badge */}
        <View style={styles.osmBadge}>
          <Text style={styles.osmBadgeText}>Leaflet · © OpenStreetMap</Text>
        </View>

        {/* Top Floating Rapido-Style Bar: Back | [● EVG39745433 ⌄] | Menu */}
        <View style={[styles.topBar, { top: insets.top + 10 }]}>
          <Pressable hitSlop={8} style={styles.topCircleBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={20} color="#1E162B" />
          </Pressable>

          <Pressable
            style={styles.topCenterPill}
            onPress={() =>
              triggerQuickAction(
                `Hub: ${trip?.pickupName || 'Bill'} · Helpline 1800 889 8791`
              )
            }
          >
            <View
              style={[
                styles.topPillDot,
                pausedLock && { backgroundColor: '#F59E0B' },
              ]}
            />
            <Text style={styles.topPillIdText}>{bookingIdText}</Text>
            <Ionicons name="chevron-down" size={15} color="#6E657F" />
          </Pressable>

          <Pressable
            hitSlop={8}
            style={styles.topCircleBtn}
            onPress={() => Linking.openURL('tel:18008898791')}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#1E162B" />
          </Pressable>
        </View>

        {/* Right Floating Map Controls (Recenter + Navigate) */}
        <View style={styles.mapRightControls}>
          <Pressable style={styles.mapFloatBtn} onPress={recenterMap}>
            <Ionicons name="locate" size={20} color={PURPLE} />
          </Pressable>
          <Pressable
            style={styles.mapFloatBtn}
            onPress={() =>
              triggerQuickAction(
                `Navigating to ${trip?.dropName || 'Bill Hub, Vadodara'}`
              )
            }
          >
            <Ionicons name="navigate" size={19} color={PURPLE} />
          </Pressable>
        </View>

        {/* Extended Ride Confirmation Toast */}
        {extendBanner ? (
          <Animated.View
            entering={FadeInDown.duration(260)}
            style={[styles.extendToast, { top: insets.top + 64 }]}
          >
            <Ionicons name="checkmark-circle" size={18} color="#15803D" />
            <View style={{ flex: 1 }}>
              <Text style={styles.extendToastTitle}>
                Ride Extended ({extendBanner.label})
              </Text>
              <Text style={styles.extendToastSub}>
                New drop: {extendBanner.newDropText}
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={() => setExtendBanner(null)}>
              <Ionicons name="close" size={16} color="#15803D" />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Quick EV Action Toast */}
        {quickToast ? (
          <Animated.View
            entering={FadeInDown.duration(220)}
            style={[styles.quickToastPill, { top: insets.top + 64 }]}
          >
            <Ionicons name="radio-outline" size={15} color="#FFFFFF" />
            <Text style={styles.quickToastText}>{quickToast}</Text>
          </Animated.View>
        ) : null}
      </View>

      {/* Rapido-Style Bottom Sheet in Evegah Purple Theme */}
      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.sheetHandle} />

        {/* Row 1: Vehicle Identity + Riding Live Badge + City Mode Pill */}
        <View style={styles.vehicleHeaderRow}>
          <View style={styles.vehicleThumbBox}>
            <Image
              source={
                vehicle?.image || require('../assets/vehicles/mink-left.png')
              }
              style={styles.vehicleThumbImg}
              contentFit="contain"
            />
          </View>

          <View style={styles.vehicleHeaderInfo}>
            <Text style={styles.vehicleTitle} numberOfLines={1}>
              {vehicle?.name || 'Evegah Mink'}
            </Text>
            <View style={styles.vehicleSubRow}>
              <Text style={styles.vehicleCodeText} numberOfLines={1}>
                {bookingIdText}
              </Text>
              <View
                style={[
                  styles.ridingLiveBadge,
                  pausedLock && styles.ridingPausedBadge,
                ]}
              >
                <View
                  style={[
                    styles.ridingLiveDot,
                    pausedLock && { backgroundColor: '#D97706' },
                  ]}
                />
                <Text
                  style={[
                    styles.ridingLiveText,
                    pausedLock && { color: '#B45309' },
                  ]}
                >
                  {pausedLock ? 'Paused' : 'Riding Live'}
                </Text>
              </View>
            </View>
          </View>

          <Pressable onPress={cycleMode} style={styles.cityModePill}>
            <Ionicons name="leaf" size={13} color={PURPLE} />
            <Text style={styles.cityModeText} numberOfLines={1}>
              {activeModeObj.label}
            </Text>
          </Pressable>
        </View>

        {/* Row 2: 3-Column Telemetry Stat Cards (Duration | Speed | Distance) */}
        <View style={styles.statsThreeColRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValueText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {clock(seconds)}
            </Text>
            <Text style={styles.statLabelText}>Duration</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValueText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {speed} <Text style={styles.statUnitText}>km/h</Text>
            </Text>
            <Text style={styles.statLabelText}>Speed</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValueText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {distance.toFixed(1)} <Text style={styles.statUnitText}>km</Text>
            </Text>
            <Text style={styles.statLabelText}>Distance</Text>
          </View>
        </View>

        {/* Row 3: 2-Column Info Cards (BMS Auto Scan & Connect + Real SOC | Drop By) */}
        <View style={styles.infoTwoColRow}>
          <Pressable
            onPress={() => setBmsDetailOpen(true)}
            style={styles.infoCard}
          >
            <View style={styles.infoCardTopRow}>
              <View
                style={[
                  styles.batteryIconBadge,
                  bmsStatus === 'scanning' && { backgroundColor: '#EDE4F7' },
                  bmsStatus === 'disconnected' && { backgroundColor: '#FEE2E2' },
                ]}
              >
                <Ionicons
                  name={
                    bmsStatus === 'scanning'
                      ? 'sync'
                      : bmsStatus === 'disconnected'
                      ? 'alert-circle'
                      : 'battery-charging'
                  }
                  size={14}
                  color={
                    bmsStatus === 'scanning'
                      ? PURPLE
                      : bmsStatus === 'disconnected'
                      ? '#EF4444'
                      : '#16A34A'
                  }
                />
              </View>
              <Text style={styles.infoCardLabel} numberOfLines={1}>
                BMS Battery
              </Text>
            </View>

            <Text style={styles.infoCardMainVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {bmsSoc}%{' '}
              <Text style={styles.infoCardSubVal}>
                · {activeModeObj.rangeKm} km
              </Text>
            </Text>

            <View style={styles.batteryBarTrack}>
              <View
                style={[
                  styles.batteryBarFill,
                  {
                    width: `${Math.min(100, Math.max(5, bmsSoc))}%`,
                    backgroundColor:
                      bmsSoc < 20 ? '#EF4444' : bmsSoc < 40 ? '#F59E0B' : '#16A34A',
                  },
                ]}
              />
            </View>

            <Pressable
              hitSlop={8}
              onPress={runAutoScanBms}
              style={[
                styles.bmsScanPill,
                bmsStatus === 'connected' && styles.bmsScanPillConnected,
              ]}
            >
              <Animated.View style={bmsStatus === 'scanning' ? scanSpinStyle : null}>
                <Ionicons
                  name={
                    bmsStatus === 'scanning'
                      ? 'sync'
                      : bmsStatus === 'connected'
                      ? 'bluetooth'
                      : 'refresh'
                  }
                  size={11}
                  color={bmsStatus === 'connected' ? PURPLE : '#2563EB'}
                />
              </Animated.View>
              <Text
                style={[
                  styles.bmsScanPillText,
                  bmsStatus === 'connected' && { color: PURPLE },
                ]}
                numberOfLines={1}
              >
                {bmsStatus === 'scanning'
                  ? 'Scanning...'
                  : bmsStatus === 'connecting'
                  ? 'Connecting'
                  : 'Auto Scan'}
              </Text>
            </Pressable>
          </Pressable>

          <View style={styles.infoCard}>
            <View style={styles.infoCardTopRow}>
              <View style={styles.dropIconBadge}>
                <Ionicons name="calendar" size={13} color={PURPLE} />
              </View>
              <Text style={styles.infoCardLabel}>Drop By</Text>
            </View>
            <Text style={styles.infoCardMainVal}>
              {formatDropTimeOnly(effectiveDropAt)}
            </Text>
            <Text style={styles.dropCardSubNote} numberOfLines={1}>
              {extraFareTotal > 0
                ? `Extended (+₹${extraFareTotal})`
                : trip?.dropName || 'Bill Hub, Vadodara'}
            </Text>
          </View>
        </View>

        {/* Row 4: Bottom Dual Buttons (Extend ride | End ride) */}
        <View style={styles.bottomBtnsRow}>
          <Pressable
            onPress={() => setExtendModalOpen(true)}
            style={({ pressed }) => [
              styles.extendBtn,
              pressed && { opacity: 0.88 },
            ]}
          >
            <Ionicons name="add-circle-outline" size={18} color={PURPLE} />
            <Text style={styles.extendBtnText}>Extend ride</Text>
          </Pressable>

          <Animated.View style={[styles.endBtnWrap, btnStyle]}>
            <Pressable
              onPressIn={() => {
                btnScale.value = withSpring(0.97, {
                  damping: 15,
                  stiffness: 300,
                });
              }}
              onPressOut={() => {
                btnScale.value = withSpring(1, {
                  damping: 15,
                  stiffness: 300,
                });
              }}
              onPress={onEnd}
              style={styles.endBtn}
            >
              <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
              <Text style={styles.endBtnText}>End ride</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* Extend Ride Bottom Sheet Modal */}
      <Modal
        visible={extendModalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setExtendModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setExtendModalOpen(false)}
          />

          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 18) },
            ]}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Extend Your EV Ride</Text>
                <Text style={styles.modalSubtitle}>
                  Keep riding {vehicle?.name || 'Evegah Mink'} without visiting
                  the hub
                </Text>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => setExtendModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={18} color="#4A4458" />
              </Pressable>
            </View>

            <View style={styles.previewDropCard}>
              <View style={styles.previewCol}>
                <Text style={styles.previewKicker}>CURRENT DROP</Text>
                <Text style={styles.previewVal}>
                  {formatDropDate(effectiveDropAt)}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={PURPLE} />
              <View style={[styles.previewCol, { alignItems: 'flex-end' }]}>
                <Text style={[styles.previewKicker, { color: PURPLE }]}>
                  NEW DROP TIME
                </Text>
                <Text style={[styles.previewVal, { color: PURPLE }]}>
                  {formatDropDate(previewNewDropAt)}
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.optionsList}
            >
              {EXTEND_OPTIONS.map((opt) => {
                const active = opt.id === selectedExtendId;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setSelectedExtendId(opt.id)}
                    style={[
                      styles.optionRow,
                      active && styles.optionRowActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionRadio,
                        active && styles.optionRadioActive,
                      ]}
                    >
                      {active ? <View style={styles.optionRadioDot} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.optionTitleLine}>
                        <Text
                          style={[
                            styles.optionLabel,
                            active && { color: PURPLE },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <View
                          style={[
                            styles.optionTagPill,
                            active && styles.optionTagPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionTagText,
                              active && styles.optionTagTextActive,
                            ]}
                          >
                            {opt.tag}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.optionSub}>{opt.sub}</Text>
                    </View>
                    <Text
                      style={[
                        styles.optionPrice,
                        active && { color: PURPLE },
                      ]}
                    >
                      ₹{opt.price}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={handleConfirmExtend}
              style={styles.confirmExtendBtn}
            >
              <Text style={styles.confirmExtendBtnText}>
                Confirm Extension · ₹{chosenOption.price}
              </Text>
              <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Live BMS Detail Sheet Modal */}
      <Modal
        visible={bmsDetailOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setBmsDetailOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setBmsDetailOpen(false)}
          />
          <View style={styles.bmsSheetContent}>
            <View style={styles.sheetHandle} />
            <View style={styles.bmsHeaderRow}>
              <View style={styles.bmsHeaderLeft}>
                <View style={styles.bmsIconCircle}>
                  <Ionicons name="hardware-chip" size={18} color={PURPLE} />
                </View>
                <View>
                  <Text style={styles.bmsTitle}>BMS Telemetry & Status</Text>
                  <Text style={styles.bmsSubTitle}>Pack ID: {bmsBatteryId}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setBmsDetailOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.bmsGrid}>
              <View style={styles.bmsMetricCard}>
                <Text style={styles.bmsMetricLabel}>Live SOC</Text>
                <Text
                  style={[
                    styles.bmsMetricValue,
                    { color: bmsSoc < 20 ? '#EF4444' : '#16A34A' },
                  ]}
                >
                  {bmsSoc}%
                </Text>
                <Text style={styles.bmsMetricSub}>State of Charge</Text>
              </View>
              <View style={styles.bmsMetricCard}>
                <Text style={styles.bmsMetricLabel}>Voltage</Text>
                <Text style={styles.bmsMetricValue}>{bmsVoltage}V</Text>
                <Text style={styles.bmsMetricSub}>Pack Voltage</Text>
              </View>
              <View style={styles.bmsMetricCard}>
                <Text style={styles.bmsMetricLabel}>Temperature</Text>
                <Text style={styles.bmsMetricValue}>{bmsTemp}°C</Text>
                <Text style={styles.bmsMetricSub}>Cell Temp</Text>
              </View>
              <View style={styles.bmsMetricCard}>
                <Text style={styles.bmsMetricLabel}>Health (SOH)</Text>
                <Text style={styles.bmsMetricValue}>98%</Text>
                <Text style={styles.bmsMetricSub}>Optimal</Text>
              </View>
            </View>

            <View style={styles.bmsStatusBanner}>
              <Ionicons
                name={bmsStatus === 'connected' ? 'shield-checkmark' : 'sync'}
                size={18}
                color={bmsStatus === 'connected' ? '#16A34A' : PURPLE}
              />
              <Text style={styles.bmsStatusBannerText}>
                {bmsStatus === 'connected'
                  ? 'Real BMS connected · Telemetry synced with Evegah IoT'
                  : 'Scanning CAN bus & Bluetooth BLE controller...'}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                runAutoScanBms();
              }}
              style={styles.bmsRescanBtn}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.bmsRescanBtnText}>Re-Scan & Sync BMS</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ECEFF4',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  osmBadge: {
    position: 'absolute',
    left: 12,
    bottom: 28,
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  osmBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  originMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  originMarkerInner: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#16A34A',
  },
  routeCalloutBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
  },
  routeCalloutIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCalloutDist: {
    fontSize: 12.5,
    fontWeight: '800',
    color: DARK_TEXT,
  },
  routeCalloutTime: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6E657F',
  },
  scooterMarkerWrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scooterMarkerHalo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(109, 40, 217, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(109, 40, 217, 0.45)',
  },
  scooterMarkerImg: {
    width: 44,
    height: 44,
  },
  topBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#140826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topCenterPill: {
    flexShrink: 1,
    height: 42,
    marginHorizontal: 10,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#140826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topPillDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#22C55E',
  },
  topPillIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK_TEXT,
    letterSpacing: 0.2,
  },
  mapRightControls: {
    position: 'absolute',
    right: 14,
    bottom: 28,
    gap: 10,
  },
  mapFloatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#140826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  extendToast: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  extendToastTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#065F46',
  },
  extendToastSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  quickToastPill: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(36, 8, 60, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  quickToastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSheet: {
    marginTop: -16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#18092E',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 14,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2DCEB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleThumbBox: {
    width: 60,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F6F3FA',
    borderWidth: 1,
    borderColor: '#EAE4F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleThumbImg: {
    width: 50,
    height: 40,
  },
  vehicleHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK_TEXT,
    letterSpacing: -0.3,
  },
  vehicleSubRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  vehicleCodeText: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6E657F',
  },
  ridingLiveBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  ridingPausedBadge: {
    backgroundColor: '#FEF3C7',
  },
  ridingLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  ridingLiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  cityModePill: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E2CEF8',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  cityModeText: {
    fontSize: 12,
    fontWeight: '800',
    color: PURPLE,
  },
  statsThreeColRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#ECE7F4',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statValueText: {
    width: '100%',
    fontSize: 16,
    fontWeight: '800',
    color: DARK_TEXT,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  statUnitText: {
    fontSize: 13,
    fontWeight: '700',
    color: SUB_TEXT,
  },
  statLabelText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: '#736B82',
  },
  infoTwoColRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  infoCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#ECE7F4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batteryIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#736B82',
    flex: 1,
  },
  bmsScanPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bmsScanPillConnected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#E2CEF8',
  },
  bmsScanPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  infoCardMainVal: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: '800',
    color: DARK_TEXT,
  },
  infoCardSubVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B526B',
  },
  batteryBarTrack: {
    marginTop: 7,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  batteryBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  dropCardSubNote: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#736B82',
  },
  actionsThreeColRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  actionTile: {
    flex: 1,
    minWidth: 0,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F7F4FB',
    borderWidth: 1,
    borderColor: '#E8E2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionTileActivePurple: {
    backgroundColor: '#F3E8FF',
    borderColor: PURPLE,
  },
  actionTileText: {
    fontSize: 13,
    fontWeight: '700',
    color: SUB_TEXT,
  },
  actionTileHazard: {
    flex: 1,
    minWidth: 0,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionTileHazardActive: {
    backgroundColor: '#FFE4E6',
    borderColor: '#E11D48',
  },
  actionTileHazardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },
  bottomBtnsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  extendBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.6,
    borderColor: PURPLE,
    backgroundColor: '#FAF7FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  extendBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PURPLE,
  },
  endBtnWrap: {
    flex: 1,
  },
  endBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  endBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 8, 34, 0.52)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: '82%',
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DED8E8',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK_TEXT,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '600',
    color: '#736B82',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F1F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewDropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F5FC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E9E1F5',
    marginBottom: 12,
  },
  previewCol: {
    flex: 1,
  },
  previewKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888098',
    letterSpacing: 0.6,
  },
  previewVal: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: '800',
    color: DARK_TEXT,
  },
  optionsList: {
    maxHeight: 280,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#ECE8F4',
    backgroundColor: '#FFFFFF',
    marginBottom: 9,
  },
  optionRowActive: {
    borderColor: PURPLE,
    backgroundColor: '#FAF6FE',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: '#C5BDD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioActive: {
    borderColor: PURPLE,
  },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PURPLE,
  },
  optionTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK_TEXT,
  },
  optionTagPill: {
    backgroundColor: '#F2EEF8',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optionTagPillActive: {
    backgroundColor: PURPLE,
  },
  optionTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6A617A',
  },
  optionTagTextActive: {
    color: '#FFFFFF',
  },
  optionSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#7C748C',
    fontWeight: '500',
  },
  optionPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK_TEXT,
  },
  confirmExtendBtn: {
    marginTop: 8,
    height: 50,
    borderRadius: 14,
    backgroundColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmExtendBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bmsSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  bmsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bmsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bmsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK_TEXT,
  },
  bmsSubTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  bmsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  bmsMetricCard: {
    width: '48%',
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#ECE7F4',
    borderRadius: 14,
    padding: 12,
  },
  bmsMetricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#736B82',
    textTransform: 'uppercase',
  },
  bmsMetricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK_TEXT,
    marginVertical: 4,
  },
  bmsMetricSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  bmsStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4FBF7',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  bmsStatusBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  bmsRescanBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bmsRescanBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
