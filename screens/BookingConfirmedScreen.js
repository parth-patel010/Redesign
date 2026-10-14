import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
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
const SERRATED_COUNT = 22;

function rupee(amount) {
  return `₹${Math.abs(Math.round(amount || 0)).toLocaleString('en-IN')}`;
}

function formatReceiptWhen(ms) {
  if (!ms) return 'Sat, 18 Apr · 8:00 pm';
  const date = new Date(ms);
  const day = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  return `${day} · ${time}`;
}

function spanLabel(start, end) {
  if (!start || !end || end <= start) return '1 day';
  const hours = Math.round((end - start) / 36e5);
  if (hours < 24) return hours <= 1 ? '1 hr' : `${hours} hrs`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

function DashedRule() {
  return (
    <View style={styles.dashedRuleRow}>
      {Array.from({ length: 28 }).map((_, idx) => (
        <View key={idx} style={styles.dashSegment} />
      ))}
    </View>
  );
}

export default function BookingConfirmedScreen({ vehicle, trip, receipt, onBack, onStart }) {
  const insets = useSafeAreaInsets();
  const [printingState, setPrintingState] = useState('initial'); // 'initial' | 'ready' | 'downloading' | 'downloaded'

  const paperSlideY = useSharedValue(-520);
  const paperOpacity = useSharedValue(0.35);
  const printerShakeX = useSharedValue(0);
  const ledGlow = useSharedValue(0.4);
  const laserScanY = useSharedValue(0);
  const startBtnScale = useSharedValue(1);
  const dlBtnScale = useSharedValue(1);

  const triggerThermalPrint = (isDownload = false) => {
    if (isDownload) {
      setPrintingState('downloading');
    }
    paperSlideY.value = -480;
    paperOpacity.value = 0.4;
    laserScanY.value = 0;

    // Subtle mechanical thermal head vibration while feeding paper
    printerShakeX.value = withRepeat(
      withSequence(
        withTiming(-1.4, { duration: 45 }),
        withTiming(1.4, { duration: 45 }),
        withTiming(0, { duration: 45 }),
      ),
      14,
      false,
    );

    // Step-by-step thermal line feed animation out of the printer slot
    paperSlideY.value = withSequence(
      withTiming(-340, { duration: 280, easing: Easing.out(Easing.quad) }),
      withDelay(60, withTiming(-190, { duration: 300, easing: Easing.out(Easing.quad) })),
      withDelay(60, withTiming(-60, { duration: 300, easing: Easing.out(Easing.quad) })),
      withSpring(0, { damping: 16, stiffness: 150 }),
    );

    paperOpacity.value = withTiming(1, { duration: 550 });
    laserScanY.value = withTiming(560, { duration: 1150, easing: Easing.inOut(Easing.quad) });

    const doneTimer = setTimeout(() => {
      setPrintingState(isDownload ? 'downloaded' : 'ready');
    }, 1250);

    return () => clearTimeout(doneTimer);
  };

  useEffect(() => {
    ledGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 650 }),
        withTiming(0.35, { duration: 650 }),
      ),
      -1,
      true,
    );
    const cleanup = triggerThermalPrint(false);
    return cleanup;
  }, []);

  const paperAnimStyle = useAnimatedStyle(() => ({
    opacity: paperOpacity.value,
    transform: [{ translateY: paperSlideY.value }],
  }));

  const printerHeadStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: printerShakeX.value }],
  }));

  const ledAnimStyle = useAnimatedStyle(() => ({
    opacity: ledGlow.value,
  }));

  const laserLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserScanY.value }],
    opacity: paperSlideY.value < -5 ? 1 : 0,
  }));

  const startBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startBtnScale.value }],
  }));

  const dlBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dlBtnScale.value }],
  }));

  const rideFare = receipt?.fare ?? 150;
  const deposit = receipt?.depositWhen === 'later' ? 0 : (receipt?.deposit ?? 250);
  const discount = receipt?.discount ?? 40;
  const totalPaid = receipt?.total ?? Math.max(0, rideFare + deposit - discount);
  const paidMethodLabel =
    receipt?.method === 'payu'
      ? 'PayU'
      : receipt?.method === 'card'
        ? 'Card'
        : receipt?.method === 'netbanking'
          ? 'NetBanking'
          : 'PayU';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Back Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={10} style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        {printingState === 'downloading' ? (
          <View style={styles.printStatusPill}>
            <Ionicons name="print" size={13} color={PURPLE} />
            <Text style={styles.printStatusText}>Printing official receipt...</Text>
          </View>
        ) : printingState === 'downloaded' ? (
          <Animated.View entering={FadeInDown.duration(260)} style={styles.printSavedPill}>
            <Ionicons name="checkmark-circle" size={14} color="#15803D" />
            <Text style={styles.printSavedText}>Receipt printed & saved to device</Text>
          </Animated.View>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 150 },
        ]}
      >
        {/* 3D Thermal Printer Housing (Matching assets/home/invoice.png) */}
        <Animated.View style={[styles.printerUnit, printerHeadStyle]}>
          <LinearGradient
            colors={['#FFFFFF', '#F3F1F8', '#E7E2F0']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.printerTopCasing}
          >
            <View style={styles.printerBrandRow}>
              <Animated.View style={[styles.printerDot, ledAnimStyle]} />
              <Text style={styles.printerBrandText}>EVEGAH</Text>
              <Animated.View style={[styles.printerDot, ledAnimStyle]} />
            </View>
          </LinearGradient>

          {/* Dark Recessed Paper Feed Slot */}
          <View style={styles.printerSlotOuter}>
            <View style={styles.printerSlotOpening} />
          </View>
        </Animated.View>

        {/* Paper Clipping Feed Viewport */}
        <View style={styles.paperFeedViewport}>
          <Animated.View style={[styles.receiptPaperWrap, paperAnimStyle]}>
            {/* Top Serrated Teeth directly under Printer Slot */}
            <View style={styles.serratedRowTop}>
              {Array.from({ length: SERRATED_COUNT }).map((_, idx) => (
                <View key={idx} style={styles.serratedToothTop} />
              ))}
            </View>

            {/* Main Receipt Paper Body */}
            <View style={styles.receiptPaper}>
              {/* Active Thermal Laser Line while printing */}
              <Animated.View pointerEvents="none" style={[styles.thermalLaserBar, laserLineStyle]} />

              {/* Receipt Header */}
              <Text style={styles.receiptBrandTitle}>EVEGAH</Text>
              <Text style={styles.receiptSubKicker}>OFFICIAL RECEIPT</Text>
              <Text style={styles.receiptStars}>*  *  *  *  *  *  *  *  *  *  *</Text>

              <Text style={styles.confirmedHeadline}>Booking confirmed</Text>
              <Text style={styles.confirmedSubtext}>Show this at the pickup zone.</Text>

              {/* Booking ID & Status Row */}
              <View style={styles.bookingMetaRow}>
                <View>
                  <Text style={styles.metaLabel}>BOOKING</Text>
                  <Text style={styles.metaValueBold}>{receipt?.bookingId || 'EVG29976125'}</Text>
                </View>
                <View style={styles.metaRightCol}>
                  <Text style={styles.metaLabel}>STATUS</Text>
                  <Text style={styles.metaStatusValue}>Confirmed</Text>
                </View>
              </View>

              {/* Lavender Vehicle Showcase Box */}
              <View style={styles.vehicleReceiptBox}>
                {vehicle?.image ? (
                  <Image source={vehicle.image} style={styles.vehicleReceiptImg} contentFit="contain" />
                ) : (
                  <Image
                    source={require('../assets/vehicles/mink-left.png')}
                    style={styles.vehicleReceiptImg}
                    contentFit="contain"
                  />
                )}
              </View>

              {/* Vehicle Title & Specs */}
              <Text style={styles.vehicleReceiptName}>{vehicle?.name || 'Evegah Mink'}</Text>
              <Text style={styles.vehicleReceiptDesc}>
                {vehicle?.line || 'Heavy-Duty Cargo & Delivery EV.'}
              </Text>
              <Text style={styles.vehicleReceiptSpecs}>
                {vehicle?.range || '70–90 km'} · {vehicle?.speed || '45 km/h'}
              </Text>

              <DashedRule />

              {/* PICKUP / DROP / DURATION */}
              <View style={styles.scheduleSection}>
                <View style={styles.scheduleRow}>
                  <Text style={styles.scheduleKey}>PICKUP</Text>
                  <View style={styles.scheduleValCol}>
                    <Text style={styles.schedulePlaceText}>{trip?.pickupName || 'Gotri'}</Text>
                    <Text style={styles.scheduleTimeText}>{formatReceiptWhen(trip?.pickupAt)}</Text>
                  </View>
                </View>

                <View style={styles.scheduleRow}>
                  <Text style={styles.scheduleKey}>DROP</Text>
                  <View style={styles.scheduleValCol}>
                    <Text style={styles.schedulePlaceText}>{trip?.dropName || 'Gotri'}</Text>
                    <Text style={styles.scheduleTimeText}>{formatReceiptWhen(trip?.dropAt)}</Text>
                  </View>
                </View>

                <View style={[styles.scheduleRow, { marginBottom: 0 }]}>
                  <Text style={styles.scheduleKey}>DURATION</Text>
                  <Text style={styles.scheduleDurationVal}>
                    {trip?.durationText || spanLabel(trip?.pickupAt, trip?.dropAt)}
                  </Text>
                </View>
              </View>

              <DashedRule />

              {/* Fare Breakdown */}
              <View style={styles.fareSection}>
                <View style={styles.fareLine}>
                  <Text style={styles.fareKey}>RIDE FARE</Text>
                  <Text style={styles.fareVal}>{rupee(rideFare)}</Text>
                </View>

                <View style={styles.fareLine}>
                  <Text style={styles.fareKey}>DEPOSIT</Text>
                  <Text style={styles.fareVal}>
                    {receipt?.depositWhen === 'later' ? 'At pickup' : rupee(deposit)}
                  </Text>
                </View>

                {discount > 0 ? (
                  <View style={styles.fareLine}>
                    <Text style={styles.fareKey}>DISCOUNT</Text>
                    <Text style={styles.fareDiscountVal}>-{rupee(discount)}</Text>
                  </View>
                ) : null}

                <View style={[styles.fareLine, styles.fareTotalRow]}>
                  <Text style={styles.fareTotalKey}>TOTAL</Text>
                  <Text style={styles.fareTotalVal}>{rupee(totalPaid)}</Text>
                </View>

                <View style={[styles.fareLine, { marginTop: 4 }]}>
                  <Text style={styles.fareKey}>PAID WITH</Text>
                  <Text style={styles.fareVal}>{paidMethodLabel}</Text>
                </View>
              </View>

              {/* Barcode & Timestamp Footer inside Receipt */}
              <View style={styles.barcodeWrap}>
                <View style={styles.barcodeBarsRow}>
                  {[3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 2, 1, 3, 2, 4, 1, 2].map(
                    (w, i) => (
                      <View
                        key={i}
                        style={[
                          styles.barcodeBar,
                          { width: w * 2, marginRight: i % 2 === 0 ? 2 : 3 },
                        ]}
                      />
                    ),
                  )}
                </View>
                <Text style={styles.barcodeCodeText}>
                  {receipt?.bookingId || 'EVG29976125'} · VERIFIED TAX INVOICE
                </Text>
              </View>
            </View>

            {/* Bottom Serrated Paper Edge */}
            <View style={styles.serratedRowBottom}>
              {Array.from({ length: SERRATED_COUNT }).map((_, idx) => (
                <View key={idx} style={styles.serratedToothBottom} />
              ))}
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Footer matching assets/home/invoice.png */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable
          onPress={() => triggerThermalPrint(true)}
          onPressIn={() => {
            dlBtnScale.value = withSpring(0.97, { damping: 18, stiffness: 280 });
          }}
          onPressOut={() => {
            dlBtnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
        >
          <Animated.View style={[styles.downloadBtn, dlBtnStyle]}>
            <Ionicons
              name={printingState === 'downloading' ? 'print' : 'download-outline'}
              size={18}
              color={PURPLE}
            />
            <Text style={styles.downloadBtnText}>
              {printingState === 'downloading'
                ? 'Printing receipt...'
                : printingState === 'downloaded'
                  ? 'Download bill again'
                  : 'Download bill'}
            </Text>
          </Animated.View>
        </Pressable>

        <Pressable
          onPress={onStart}
          onPressIn={() => {
            startBtnScale.value = withSpring(0.97, { damping: 18, stiffness: 280 });
          }}
          onPressOut={() => {
            startBtnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
        >
          <Animated.View style={[styles.startBtn, startBtnStyle]}>
            <Ionicons name="flash" size={17} color="#FFFFFF" />
            <Text style={styles.startBtnText}>Start ride</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F0F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E0A3C',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  printStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  printStatusText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  printSavedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  printSavedText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  printerUnit: {
    zIndex: 10,
  },
  printerTopCasing: {
    height: 62,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#E2DCEB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E0A3C',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  printerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  printerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#A78BFA',
  },
  printerBrandText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4.5,
  },
  printerSlotOuter: {
    height: 22,
    backgroundColor: '#E5E0EE',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#D8D0E5',
  },
  printerSlotOpening: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2B2538',
  },
  paperFeedViewport: {
    marginTop: -6,
    paddingHorizontal: 10,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  receiptPaperWrap: {
    shadowColor: '#180830',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  serratedRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2B2538',
    paddingHorizontal: 2,
    height: 8,
    alignItems: 'flex-end',
  },
  serratedToothTop: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  receiptPaper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  thermalLaserBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: '#8B5CF6',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    zIndex: 20,
  },
  receiptBrandTitle: {
    textAlign: 'center',
    color: PURPLE,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 4,
  },
  receiptSubKicker: {
    marginTop: 4,
    textAlign: 'center',
    color: '#8E8899',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  receiptStars: {
    marginTop: 6,
    textAlign: 'center',
    color: '#C4BDD0',
    fontSize: 11,
    letterSpacing: 1,
  },
  confirmedHeadline: {
    marginTop: 10,
    textAlign: 'center',
    color: '#18151F',
    fontSize: 22,
    fontWeight: '800',
  },
  confirmedSubtext: {
    marginTop: 4,
    textAlign: 'center',
    color: '#6E6878',
    fontSize: 12.5,
  },
  bookingMetaRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  metaRightCol: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    color: '#8E8899',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  metaValueBold: {
    marginTop: 4,
    color: '#18151F',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  metaStatusValue: {
    marginTop: 4,
    color: PURPLE,
    fontSize: 13.5,
    fontWeight: '800',
  },
  vehicleReceiptBox: {
    marginTop: 16,
    height: 128,
    borderRadius: 16,
    backgroundColor: '#F7F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  vehicleReceiptImg: {
    width: 170,
    height: 106,
  },
  vehicleReceiptName: {
    marginTop: 14,
    textAlign: 'center',
    color: '#18151F',
    fontSize: 18,
    fontWeight: '800',
  },
  vehicleReceiptDesc: {
    marginTop: 3,
    textAlign: 'center',
    color: '#6E6878',
    fontSize: 12.5,
  },
  vehicleReceiptSpecs: {
    marginTop: 4,
    textAlign: 'center',
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  dashedRuleRow: {
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dashSegment: {
    width: 6,
    height: 1.3,
    backgroundColor: '#DCD6E6',
    borderRadius: 1,
  },
  scheduleSection: {
    gap: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  scheduleKey: {
    color: '#8E8899',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1,
    paddingTop: 2,
  },
  scheduleValCol: {
    alignItems: 'flex-end',
    maxWidth: '68%',
  },
  schedulePlaceText: {
    color: '#18151F',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  scheduleTimeText: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 11.5,
    textAlign: 'right',
  },
  scheduleDurationVal: {
    color: '#18151F',
    fontSize: 13.5,
    fontWeight: '800',
  },
  fareSection: {
    gap: 8,
  },
  fareLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareKey: {
    color: '#7A7385',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  fareVal: {
    color: '#18151F',
    fontSize: 13,
    fontWeight: '700',
  },
  fareDiscountVal: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '800',
  },
  fareTotalRow: {
    marginTop: 4,
    paddingTop: 6,
  },
  fareTotalKey: {
    color: '#18151F',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  fareTotalVal: {
    color: PURPLE,
    fontSize: 18,
    fontWeight: '900',
  },
  barcodeWrap: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1EDF7',
    alignItems: 'center',
  },
  barcodeBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: '#2B2538',
    borderRadius: 0.5,
  },
  barcodeCodeText: {
    marginTop: 6,
    color: '#9B94A8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  serratedRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    height: 8,
  },
  serratedToothBottom: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECE8F2',
    gap: 10,
  },
  downloadBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D6C4EE',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadBtnText: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: '700',
  },
  startBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
});
