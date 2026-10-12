import { useEffect, useRef, useState } from 'react';
import { Alert, Image as RNImage, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PURPLE = '#4A168C';
const PAPER = '#FBFBFA';

const STEPS = [
  { title: 'Reach the zone', text: 'The scooter stays at the pickup point you chose.' },
  { title: 'Carry your licence', text: 'A valid driving licence is checked before the ride.' },
  { title: 'Helmet is included', text: 'A sanitized helmet is handed over with the scooter.' },
];

const BARS = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1];

function rupee(amount) {
  return `₹${Math.abs(Math.round(amount || 0)).toLocaleString('en-IN')}`;
}

function whenLine(ms) {
  if (!ms) return 'Select';
  const date = new Date(ms);
  const day = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

function spanLabel(start, end) {
  if (!start || !end || end <= start) return '1 day';
  const hours = Math.round((end - start) / 36e5);
  if (hours < 24) return hours <= 1 ? '1 hr' : `${hours} hr`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function Sawtooth({ down }) {
  return (
    <View style={styles.saw}>
      {Array.from({ length: 24 }, (_, index) => (
        <View key={index} style={styles.sawSlot}>
          <View style={down ? styles.sawDown : styles.sawUp} />
        </View>
      ))}
    </View>
  );
}

function BillBody({ vehicle, trip, receipt }) {
  const method = receipt?.method === 'icici' ? 'ICICI Bank' : 'PayU';
  const paidLater = receipt?.depositWhen === 'later';

  return (
    <View style={styles.receiptBody}>
      <Text style={styles.receiptBrand}>EVEGAH</Text>
      <Text style={styles.receiptKicker}>OFFICIAL RECEIPT</Text>
      <Text style={styles.receiptStars}>* * * * * * * * * * *</Text>
      <Text style={styles.receiptStatus}>Booking confirmed</Text>
      <Text style={styles.receiptHint}>Show this at the pickup zone.</Text>

      <View style={styles.receiptRow}>
        <Text style={styles.receiptLbl}>BOOKING</Text>
        <Text style={styles.receiptVal}>{receipt?.bookingId || 'EVG00000000'}</Text>
      </View>
      <View style={styles.receiptRow}>
        <Text style={styles.receiptLbl}>STATUS</Text>
        <Text style={styles.receiptVal}>Confirmed</Text>
      </View>

      <View style={[styles.vehicleArt, { backgroundColor: vehicle?.tint || '#F6F1FC' }]}>
        {vehicle?.image ? (
          <Image source={vehicle.image} style={styles.vehicleImage} contentFit="contain" />
        ) : null}
      </View>
      <Text style={styles.vehicleName}>{vehicle?.name || 'Your scooter'}</Text>
      <Text style={styles.vehicleLine}>{vehicle?.line || 'Electric ride'}</Text>
      <Text style={styles.vehicleMeta}>
        {[vehicle?.range, vehicle?.speed].filter(Boolean).join('  ·  ')}
      </Text>

      <Text style={styles.receiptDash}>----------------------------</Text>
      <View style={styles.receiptRow}>
        <Text style={styles.receiptLbl}>PICKUP</Text>
        <Text style={styles.receiptVal} numberOfLines={2}>{trip?.pickupName || 'Zone'}</Text>
      </View>
      <Text style={styles.receiptWhen}>{whenLine(trip?.pickupAt)}</Text>
      <View style={styles.receiptRow}>
        <Text style={styles.receiptLbl}>DROP</Text>
        <Text style={styles.receiptVal} numberOfLines={2}>{trip?.dropName || 'Zone'}</Text>
      </View>
      <Text style={styles.receiptWhen}>{whenLine(trip?.dropAt)}</Text>
      <View style={styles.receiptRow}>
        <Text style={styles.receiptLbl}>DURATION</Text>
        <Text style={styles.receiptVal}>{spanLabel(trip?.pickupAt, trip?.dropAt)}</Text>
      </View>

      <Text style={styles.receiptDash}>----------------------------</Text>
      <View style={styles.receiptRow}>
        <Text style={styles.receiptLbl}>RIDE FARE</Text>
        <Text style={styles.receiptVal}>{rupee(receipt?.fare)}</Text>
      </View>
      <View style={styles.receiptRow}>
        <Text style={styles.receiptLbl}>DEPOSIT</Text>
        <Text style={styles.receiptVal}>{rupee(receipt?.deposit)}</Text>
      </View>
      <View style={styles.receiptRow}>
        <Text style={styles.receiptLbl}>DISCOUNT</Text>
        <Text style={styles.receiptVal}>{receipt?.discount ? `-${rupee(receipt.discount)}` : rupee(0)}</Text>
      </View>
      <View style={styles.receiptRow}>
        <Text style={styles.receiptTotal}>TOTAL</Text>
        <Text style={styles.receiptTotal}>{rupee(receipt?.total)}</Text>
      </View>
      <View style={styles.receiptRow}>
        <Text style={styles.receiptLbl}>PAID WITH</Text>
        <Text style={styles.receiptVal}>{paidLater ? 'Fare confirmed' : method}</Text>
      </View>
      {paidLater ? (
        <Text style={styles.receiptNote}>
          {rupee(receipt?.deposit || 250)} security deposit is due before pickup.
        </Text>
      ) : null}

      <Text style={styles.receiptDash}>----------------------------</Text>
      <Text style={styles.sectionLabel}>AT PICKUP</Text>
      {STEPS.map((step) => (
        <View key={step.title} style={styles.step}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepText}>{step.text}</Text>
        </View>
      ))}

      <Text style={styles.receiptDash}>============================</Text>
      <View style={styles.barcode}>
        {BARS.map((bar, index) => (
          <View
            key={index}
            style={{
              width: bar ? (index % 3 === 0 ? 2 : 1) : 1.5,
              height: 28,
              backgroundColor: bar ? '#1A1A1A' : 'transparent',
            }}
          />
        ))}
      </View>
      <Text style={styles.receiptThanks}>Thank you for riding with Evegah</Text>
    </View>
  );
}

function ReceiptPrint({ vehicle, trip, receipt }) {
  const progress = useSharedValue(0);
  const beam = useSharedValue(0.55);
  const full = useSharedValue(640);
  const started = useRef(false);

  const stageStyle = useAnimatedStyle(() => {
    const paperH = 8 + progress.value * Math.max(full.value - 8, 0);
    return { height: Math.max(76, 40 + paperH) };
  });
  const paperStyle = useAnimatedStyle(() => ({
    height: 8 + progress.value * Math.max(full.value - 8, 0),
  }));
  const beamStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 0.985 ? beam.value : 0,
  }));

  useEffect(() => {
    beam.value = withRepeat(
      withTiming(1, { duration: 350, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.Never }),
      -1,
      true,
      undefined,
      ReduceMotion.Never,
    );
  }, [beam]);

  const onPaperLayout = (event) => {
    const next = Math.ceil(event.nativeEvent.layout.height);
    if (next < 80) return;
    full.value = next;
    if (started.current) return;
    started.current = true;
    progress.value = withTiming(1, {
      duration: Math.min(4800, Math.max(2800, next * 5)),
      easing: Easing.linear,
      reduceMotion: ReduceMotion.Never,
    });
  };

  return (
    <View style={styles.printer}>
      <Animated.View style={[styles.stage, stageStyle]}>
        <LinearGradient
          colors={['#FFFFFF', '#EEF1F6', '#D5DAE3']}
          style={styles.bezelPlate}
          pointerEvents="none"
        />
        <View style={styles.lowerLip} pointerEvents="none" />
        <View style={styles.slit} pointerEvents="none">
          <View style={styles.cutter} />
          <Animated.View style={[styles.beam, beamStyle]} />
        </View>
        <Animated.View style={[styles.paperViewport, paperStyle]}>
          <View onLayout={onPaperLayout}>
            <Sawtooth />
            <BillBody vehicle={vehicle} trip={trip} receipt={receipt} />
            <Sawtooth down />
          </View>
        </Animated.View>
        <LinearGradient
          colors={['#FFFFFF', '#F4F6F9', '#E3E7EE']}
          style={styles.upperLip}
          pointerEvents="none"
        >
          <View style={styles.screw} />
          <Text style={styles.bezelMark}>EVEGAH</Text>
          <View style={styles.screw} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

async function vehicleDataUri(source) {
  if (!source) return '';
  try {
    const resolved = RNImage.resolveAssetSource(source);
    if (!resolved?.uri) return '';
    const dest = `${FileSystem.cacheDirectory}evegah-bill-vehicle.png`;
    const file = await FileSystem.downloadAsync(resolved.uri, dest);
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch {
    return '';
  }
}

function billHtml({ vehicle, trip, receipt, image }) {
  const method = receipt?.method === 'icici' ? 'ICICI Bank' : 'PayU';
  const paidLater = receipt?.depositWhen === 'later';
  const teeth = Array.from({ length: 30 }, (_, index) => `${index * 12},${index % 2 ? 0 : 12}`).join(' ');
  const steps = STEPS.map((step) => (
    `<p class="step"><b>${esc(step.title)}</b><br/>${esc(step.text)}</p>`
  )).join('');
  const picture = image
    ? `<img src="${image}" alt="" />`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 18px; }
    body { margin: 0; font-family: Courier, monospace; color: #1a1a1a; background: #fff; }
    .sheet { width: 320px; margin: 0 auto; }
    svg { display: block; width: 100%; height: 12px; }
    h1 { margin: 8px 0 0; text-align: center; font-size: 22px; letter-spacing: 2px; }
    .kicker, .hint, .thanks, .when { text-align: center; color: #666; font-size: 12px; }
    .status { text-align: center; font-weight: 700; margin: 8px 0 2px; }
    img { display: block; width: 180px; height: 110px; object-fit: contain; margin: 10px auto 4px; }
    .name { text-align: center; font-size: 16px; font-weight: 700; margin: 0; }
    .line, .meta { text-align: center; color: #555; font-size: 12px; margin: 2px 0; }
    .row { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; margin: 4px 0; }
    .lbl { color: #777; }
    .total { font-size: 15px; font-weight: 700; }
    .rule { text-align: center; color: #bbb; letter-spacing: 1px; margin: 8px 0; }
    .section { font-size: 11px; letter-spacing: 1px; color: #777; }
    .step { font-size: 12px; margin: 6px 0; }
    .note { font-size: 12px; color: #444; }
  </style>
</head>
<body>
  <div class="sheet">
    <svg viewBox="0 0 360 12" preserveAspectRatio="none"><polygon points="0,12 ${teeth} 360,12" fill="#fbfbfa" stroke="#111" stroke-width="0.4"/></svg>
    <h1>EVEGAH</h1>
    <p class="kicker">OFFICIAL RECEIPT</p>
    <p class="status">Booking confirmed</p>
    <p class="hint">Show this at the pickup zone.</p>
    <div class="row"><span class="lbl">BOOKING</span><span>${esc(receipt?.bookingId || 'EVG00000000')}</span></div>
    <div class="row"><span class="lbl">STATUS</span><span>Confirmed</span></div>
    ${picture}
    <p class="name">${esc(vehicle?.name || 'Your scooter')}</p>
    <p class="line">${esc(vehicle?.line || 'Electric ride')}</p>
    <p class="meta">${esc([vehicle?.range, vehicle?.speed].filter(Boolean).join(' · '))}</p>
    <p class="rule">----------------------------</p>
    <div class="row"><span class="lbl">PICKUP</span><span>${esc(trip?.pickupName || 'Zone')}</span></div>
    <p class="when">${esc(whenLine(trip?.pickupAt))}</p>
    <div class="row"><span class="lbl">DROP</span><span>${esc(trip?.dropName || 'Zone')}</span></div>
    <p class="when">${esc(whenLine(trip?.dropAt))}</p>
    <div class="row"><span class="lbl">DURATION</span><span>${esc(spanLabel(trip?.pickupAt, trip?.dropAt))}</span></div>
    <p class="rule">----------------------------</p>
    <div class="row"><span class="lbl">RIDE FARE</span><span>${esc(rupee(receipt?.fare))}</span></div>
    <div class="row"><span class="lbl">DEPOSIT</span><span>${esc(rupee(receipt?.deposit))}</span></div>
    <div class="row"><span class="lbl">DISCOUNT</span><span>${esc(receipt?.discount ? `-${rupee(receipt.discount)}` : rupee(0))}</span></div>
    <div class="row total"><span>TOTAL</span><span>${esc(rupee(receipt?.total))}</span></div>
    <div class="row"><span class="lbl">PAID WITH</span><span>${esc(paidLater ? 'Fare confirmed' : method)}</span></div>
    ${paidLater ? `<p class="note">${esc(rupee(receipt?.deposit || 250))} security deposit is due before pickup.</p>` : ''}
    <p class="rule">----------------------------</p>
    <p class="section">AT PICKUP</p>
    ${steps}
    <p class="thanks">Thank you for riding with Evegah</p>
    <svg viewBox="0 0 360 12" preserveAspectRatio="none"><polygon points="0,0 ${teeth} 360,0" fill="#fbfbfa" stroke="#111" stroke-width="0.4"/></svg>
  </div>
</body>
</html>`;
}

export default function BookingConfirmedScreen({ vehicle, trip, receipt, onBack, onStart }) {
  const insets = useSafeAreaInsets();
  const btnScale = useSharedValue(1);
  const glide = useSharedValue(0);
  const startWidth = useSharedValue(300);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: startWidth.value * 3,
    transform: [{ translateX: startWidth.value * -1.6 * (1 - glide.value) }],
  }));
  const shineStyle = useAnimatedStyle(() => {
    const width = startWidth.value;
    return {
      width: width * 2,
      opacity: interpolate(glide.value, [0, 0.12, 0.5, 0.88, 1], [0, 0, 0.4, 0, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(glide.value, [0, 1], [width * -2.2, width * 1.25]) },
        { skewX: '-20deg' },
      ],
    };
  });
  const [saving, setSaving] = useState(false);

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

  const downloadBill = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const image = await vehicleDataUri(vehicle?.image);
      const html = billHtml({ vehicle, trip, receipt, image });
      const file = await Print.printToFileAsync({ html, width: 360, height: 1200 });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Bill saved', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Download bill',
      });
    } catch {
      Alert.alert('Could not save the bill', 'Try the download again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
      >
        <ReceiptPrint vehicle={vehicle} trip={trip} receipt={receipt} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.download} onPress={downloadBill} disabled={saving}>
          <Ionicons name="download-outline" size={16} color={PURPLE} />
          <Text style={styles.downloadText}>{saving ? 'Saving…' : 'Download bill'}</Text>
        </Pressable>
        <Pressable
          onPress={onStart}
          onPressIn={() => {
            btnScale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
        >
          <Animated.View
            style={[styles.start, btnStyle]}
            onLayout={(event) => {
              startWidth.value = event.nativeEvent.layout.width;
            }}
          >
            <Animated.View pointerEvents="none" style={[styles.startFill, fillStyle]}>
              <LinearGradient
                colors={['#7C1FFF', '#7C1FFF', '#D8B4FE', '#7C1FFF', '#7C1FFF']}
                locations={[0, 0.36, 0.44, 0.52, 1]}
                start={{ x: 0.79, y: 0.91 }}
                end={{ x: 0.21, y: 0.09 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Ionicons name="flash" size={16} color="#FFFFFF" />
            <Text style={styles.startText}>Start ride</Text>
            <Animated.View pointerEvents="none" style={[styles.startShine, shineStyle]} />
          </Animated.View>
        </Pressable>
      </View>
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
    paddingBottom: 4,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printer: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  stage: {
    position: 'relative',
    width: '100%',
  },
  paperViewport: {
    position: 'absolute',
    top: 36,
    left: '15%',
    width: '70%',
    overflow: 'hidden',
    zIndex: 4,
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  saw: {
    height: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  sawSlot: {
    width: 16,
    height: 10,
  },
  sawUp: {
    width: 0,
    height: 0,
    marginLeft: 8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: PAPER,
  },
  sawDown: {
    width: 0,
    height: 0,
    marginLeft: 8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: PAPER,
  },
  receiptBody: {
    backgroundColor: PAPER,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  receiptBrand: {
    textAlign: 'center',
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  receiptKicker: {
    marginTop: 2,
    textAlign: 'center',
    color: '#6B6574',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  receiptStars: {
    marginTop: 6,
    textAlign: 'center',
    color: '#B0AABA',
    fontSize: 10,
  },
  receiptStatus: {
    marginTop: 4,
    textAlign: 'center',
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '800',
  },
  receiptHint: {
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'center',
    color: '#6B6574',
    fontSize: 11,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 3,
  },
  receiptLbl: {
    color: '#8A8494',
    fontSize: 10,
    fontWeight: '700',
  },
  receiptVal: {
    flex: 1,
    textAlign: 'right',
    color: '#1A1A1A',
    fontSize: 11,
    fontWeight: '700',
  },
  receiptWhen: {
    marginTop: -2,
    marginBottom: 4,
    textAlign: 'right',
    color: '#6B6574',
    fontSize: 10,
  },
  receiptDash: {
    marginVertical: 6,
    textAlign: 'center',
    color: '#C8C2D0',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  receiptTotal: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '800',
  },
  receiptNote: {
    marginTop: 4,
    color: '#3C3846',
    fontSize: 11,
    lineHeight: 15,
  },
  vehicleArt: {
    marginTop: 8,
    height: 78,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImage: {
    width: 120,
    height: 68,
  },
  vehicleName: {
    marginTop: 8,
    textAlign: 'center',
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '800',
  },
  vehicleLine: {
    marginTop: 2,
    textAlign: 'center',
    color: '#6B6574',
    fontSize: 11,
  },
  vehicleMeta: {
    marginTop: 2,
    textAlign: 'center',
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionLabel: {
    color: '#8A8494',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  step: {
    marginTop: 6,
  },
  stepTitle: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    marginTop: 1,
    color: '#6B6574',
    fontSize: 11,
    lineHeight: 15,
  },
  barcode: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 1,
  },
  receiptThanks: {
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
    color: '#6B6574',
    fontSize: 10,
  },
  bezelPlate: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 1,
    elevation: 1,
  },
  lowerLip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 44,
    height: 28,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#C9CFD8',
    zIndex: 2,
    elevation: 2,
  },
  slit: {
    position: 'absolute',
    top: 32,
    left: 18,
    right: 18,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#080B11',
    overflow: 'hidden',
    zIndex: 3,
    elevation: 3,
  },
  cutter: {
    height: 2,
    backgroundColor: '#C5CDD8',
  },
  beam: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#7DD3FC',
  },
  upperLip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 6,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  bezelMark: {
    color: '#8B93A1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  screw: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C5CAD3',
    borderWidth: 1,
    borderColor: '#EEF1F5',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  download: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadText: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: '700',
  },
  start: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#7C1FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  startFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  startShine: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
