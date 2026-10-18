import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cancelReservation } from '../services/api';

const PURPLE = '#4A168C';
const HERO_BG = require('../assets/rides/detail-hero.jpg');
const ROUTE_MAP = require('../assets/rides/route-map.png');

const BILL_ROWS = [
  { key: 'plan', icon: 'document-text-outline', label: 'Plan' },
  { key: 'fare', icon: 'cash-outline', label: 'Ride fare' },
  { key: 'deposit', icon: 'shield-checkmark-outline', label: 'Security deposit' },
  { key: 'method', icon: 'card-outline', label: 'Paid with' },
  { key: 'helmet', icon: 'person-outline', label: 'Helmet' },
];

function rupee(amount) {
  return `₹${Math.abs(Math.round(amount || 0)).toLocaleString('en-IN')}`;
}

function invoiceHtml(ride) {
  const rows = [
    ['Plan', ride.plan || 'Daily'],
    ['Ride fare', rupee(ride.fare)],
    ['Security deposit', ride.depositBack ? 'Returned' : rupee(ride.deposit)],
    ['Paid with', ride.method || 'UPI'],
    ['Helmet', 'Included'],
    ['Total paid', rupee(ride.fare)],
  ];
  const lines = rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><style>
    body{font-family:sans-serif;padding:28px;color:#1c1c1c}
    td{padding:8px 0;border-bottom:1px solid #eee}
    td:last-child{text-align:right;font-weight:700}
  </style></head><body>
    <p style="letter-spacing:2px;color:#6d28d9;font-size:12px;font-weight:700">EVEGAH</p>
    <h1 style="margin:8px 0 4px">${ride.vehicle || 'Ride'}</h1>
    <p style="margin:0;color:#6e6878">${ride.line || ''}</p>
    <p style="margin:12px 0 20px;font-weight:700">${ride.id || ''}</p>
    <p><strong>Pickup</strong><br/>${ride.pickup || ''}<br/>${ride.pickupWhen || ''}</p>
    <p><strong>Drop</strong><br/>${ride.drop || ''}<br/>${ride.dropWhen || ''}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px">${lines}</table>
  </body></html>`;
}

export default function RideDetailScreen({ ride, onBack }) {
  const insets = useSafeAreaInsets();
  const [lifted, setLifted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const glide = useSharedValue(0);
  const btnWidth = useSharedValue(300);
  const fillStyle = useAnimatedStyle(() => ({
    width: btnWidth.value * 3,
    transform: [{ translateX: btnWidth.value * -1.6 * (1 - glide.value) }],
  }));
  const shineStyle = useAnimatedStyle(() => {
    const width = btnWidth.value;
    return {
      width: width * 2,
      opacity: interpolate(glide.value, [0, 0.12, 0.5, 0.88, 1], [0, 0, 0.4, 0, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(glide.value, [0, 1], [width * -2.2, width * 1.25]) },
        { skewX: '-20deg' },
      ],
    };
  });

  useEffect(() => {
    glide.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.linear, reduceMotion: ReduceMotion.Never }),
        withDelay(700, withTiming(1, { duration: 0, reduceMotion: ReduceMotion.Never })),
        withTiming(0, { duration: 0, reduceMotion: ReduceMotion.Never }),
      ),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );
  }, [glide]);

  if (!ride) return null;

  const values = {
    plan: ride.plan || 'Daily',
    fare: rupee(ride.fare),
    deposit: ride.depositBack ? 'Returned' : rupee(ride.deposit),
    method: ride.method || 'UPI',
    helmet: 'Included',
  };

  const copyId = async () => {
    try {
      await Clipboard.setStringAsync(String(ride.id || ''));
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const openMap = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ride.pickup || '')}&destination=${encodeURIComponent(ride.drop || '')}`;
    Linking.openURL(url).catch(() => {});
  };

  const downloadInvoice = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const file = await Print.printToFileAsync({ html: invoiceHtml(ride), width: 360, height: 900 });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Invoice saved', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Download invoice',
      });
    } catch {
      Alert.alert('Could not save the invoice', 'Try the download again.');
    } finally {
      setSaving(false);
    }
  };

  const isUpcoming =
    String(ride.status || '').toLowerCase() === 'upcoming' ||
    String(ride.status || '').toLowerCase() === 'reserved';

  const handleCancelReservation = () => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this booking? Any pre-paid amount will be refunded to your Evegah wallet.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await cancelReservation(ride.id);
              Alert.alert('Booking Cancelled', res?.message || 'Your reservation has been cancelled.');
              onBack?.();
            } catch (e) {
              Alert.alert('Notice', e?.message || 'Unable to cancel this reservation right now.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style={lifted ? 'dark' : 'light'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const next = event.nativeEvent.contentOffset.y > 48;
          setLifted((prev) => (prev === next ? prev : next));
        }}
      >
        <LinearGradient
          colors={['#3B0764', '#4A168C', '#5B21B6']}
          locations={[0, 0.55, 1]}
          style={[styles.hero, { paddingTop: insets.top + 6 }]}
        >
          <Image
            pointerEvents="none"
            source={HERO_BG}
            style={styles.heroBg}
            contentFit="cover"
            contentPosition="right bottom"
          />
          <View style={styles.topBar}>
            <Pressable hitSlop={8} style={styles.round} onPress={onBack}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isUpcoming ? (
                <Pressable
                  hitSlop={8}
                  style={[styles.round, { backgroundColor: 'rgba(239, 68, 68, 0.35)' }]}
                  onPress={handleCancelReservation}
                >
                  <Ionicons name="trash-outline" size={17} color="#FCA5A5" />
                </Pressable>
              ) : null}
              <Pressable hitSlop={8} style={styles.round} onPress={downloadInvoice}>
                <Ionicons name="download-outline" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>VEHICLE DETAILS</Text>
              <Text style={styles.name}>{ride.vehicle}</Text>
              <Text style={styles.line}>{ride.line}</Text>
              <Pressable style={styles.idRow} onPress={copyId}>
                <Text style={styles.id}>{ride.id}</Text>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color="rgba(255,255,255,0.85)" />
              </Pressable>
            </View>
            {ride.image ? (
              <View style={styles.vehicleFrame} pointerEvents="none">
                <Image source={ride.image} style={styles.vehicle} contentFit="contain" />
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="navigate" size={16} color={PURPLE} />
              <Text style={styles.statValue}>{ride.distance || '—'}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statRule} />
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={16} color="#7C3AED" />
              <Text style={styles.statValue}>{ride.span || '—'}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statRule} />
            <View style={styles.stat}>
              <Ionicons name="battery-charging" size={16} color="#7C3AED" />
              <Text style={styles.statValue}>{ride.battery || '—'}</Text>
              <Text style={styles.statLabel}>Battery</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardTitle}>
                <Ionicons name="git-branch-outline" size={16} color={PURPLE} />
                <Text style={styles.cardHeading}>Route</Text>
              </View>
              <Pressable style={styles.mapLink} onPress={openMap}>
                <Ionicons name="map-outline" size={14} color={PURPLE} />
                <Text style={styles.mapLinkText}>View on Map</Text>
                <Ionicons name="chevron-forward" size={14} color={PURPLE} />
              </Pressable>
            </View>
            <View style={styles.routeRow}>
              <View style={styles.stops}>
                <View style={styles.stop}>
                  <View style={styles.rail}>
                    <View style={styles.dotFill} />
                    <View style={styles.railLine} />
                  </View>
                  <View>
                    <Text style={styles.stopKicker}>Pickup</Text>
                    <Text style={styles.stopPlace}>{ride.pickup}</Text>
                    <Text style={styles.stopWhen}>{ride.pickupWhen}</Text>
                  </View>
                </View>
                <View style={styles.stop}>
                  <View style={styles.rail}>
                    <View style={styles.dotRing} />
                  </View>
                  <View>
                    <Text style={styles.stopKicker}>Drop</Text>
                    <Text style={styles.stopPlace}>{ride.drop}</Text>
                    <Text style={styles.stopWhen}>{ride.dropWhen}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.routeFrame} pointerEvents="none">
                <Image source={ROUTE_MAP} style={styles.routeArt} contentFit="contain" />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitle}>
              <Ionicons name="receipt-outline" size={16} color={PURPLE} />
              <Text style={styles.cardHeading}>Bill Details</Text>
            </View>
            {BILL_ROWS.map((row, index) => (
              <View key={row.key} style={[styles.billRow, index > 0 && styles.billRule]}>
                <View style={styles.billIcon}>
                  <Ionicons name={row.icon} size={15} color="#6D28D9" />
                </View>
                <Text style={styles.billLabel}>{row.label}</Text>
                <Text style={styles.billValue}>{values[row.key]}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total paid</Text>
              <Text style={styles.totalValue}>{rupee(ride.fare)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable onPress={downloadInvoice} disabled={saving}>
          <Animated.View
            style={styles.download}
            onLayout={(event) => {
              btnWidth.value = event.nativeEvent.layout.width;
            }}
          >
            <Animated.View pointerEvents="none" style={[styles.downloadFill, fillStyle]}>
              <LinearGradient
                colors={['#7C1FFF', '#7C1FFF', '#D8B4FE', '#7C1FFF', '#7C1FFF']}
                locations={[0, 0.36, 0.44, 0.52, 1]}
                start={{ x: 0.79, y: 0.91 }}
                end={{ x: 0.21, y: 0.09 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
            <Text style={styles.downloadText}>{saving ? 'Saving…' : 'Download Invoice'}</Text>
            <Animated.View pointerEvents="none" style={[styles.downloadShine, shineStyle]} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F6FB',
  },
  hero: {
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: -24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  round: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroCopy: {
    flex: 1,
    paddingBottom: 8,
    zIndex: 2,
  },
  kicker: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  name: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  line: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
  },
  idRow: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  id: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  vehicleFrame: {
    width: 156,
    height: 118,
    overflow: 'hidden',
  },
  vehicle: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 156,
    height: 118,
  },
  body: {
    marginTop: -24,
    paddingHorizontal: 16,
  },
  stats: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1C1230',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    marginTop: 4,
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '600',
  },
  statRule: {
    width: 1,
    height: 36,
    backgroundColor: '#EFEAF6',
  },
  card: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeading: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '800',
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapLinkText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  routeRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stops: {
    flex: 1,
  },
  stop: {
    flexDirection: 'row',
  },
  rail: {
    width: 18,
    alignItems: 'center',
  },
  dotFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
    marginTop: 4,
  },
  railLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginVertical: 2,
    backgroundColor: '#E9D5FF',
  },
  dotRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#7C3AED',
    marginTop: 4,
  },
  stopKicker: {
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '600',
  },
  stopPlace: {
    marginTop: 1,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '800',
  },
  stopWhen: {
    marginTop: 1,
    marginBottom: 8,
    color: '#8A8496',
    fontSize: 12,
  },
  routeFrame: {
    width: 124,
    height: 112,
    overflow: 'hidden',
  },
  routeArt: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 124,
    height: 112,
  },
  billRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  billRule: {
    borderTopWidth: 1,
    borderTopColor: '#F3F0F7',
  },
  billIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billLabel: {
    flex: 1,
    color: '#3C3846',
    fontSize: 14,
    fontWeight: '600',
  },
  billValue: {
    color: '#1C1C1C',
    fontSize: 14,
    fontWeight: '700',
  },
  totalRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1EEF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '800',
  },
  totalValue: {
    color: PURPLE,
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    backgroundColor: '#F7F6FB',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  download: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#7C1FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  downloadFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  downloadShine: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
