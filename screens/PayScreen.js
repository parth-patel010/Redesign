import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurTargetView, BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  ReduceMotion,
  interpolate,
  Extrapolation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#6D35D6';
const INK = '#1A1A1A';
const MUTED = '#8B8498';
const DAY_RATE = {
  'Evegah Fly': 149,
  'Evegah Mink': 199,
  'Evegah City': 229,
  'Evegah Pro': 299,
};
const DEPOSIT = 250;
const OFFER_OFF = 40;
const METHODS = [
  { id: 'payu', name: 'PayU', logo: require('../assets/pay/payu.png') },
  { id: 'icici', name: 'ICICI Bank', logo: require('../assets/pay/icici-bank.png') },
];
const SKETCHES = {
  fly: require('../assets/pay/sketch-fly.png'),
  mink: require('../assets/pay/sketch-mink.png'),
  city: require('../assets/pay/sketch-city.png'),
  pro: require('../assets/pay/sketch-pro.png'),
};

function sketchFor(vehicle) {
  const name = String(vehicle?.name || '').toLowerCase();
  if (name.includes('fly')) return SKETCHES.fly;
  if (name.includes('mink')) return SKETCHES.mink;
  if (name.includes('city')) return SKETCHES.city;
  if (name.includes('pro')) return SKETCHES.pro;
  return SKETCHES.city;
}

function rupee(amount) {
  const value = Math.abs(Math.round(amount)).toLocaleString('en-IN');
  return amount < 0 ? `− ₹${value}` : `₹${value}`;
}

function billDays(start, end) {
  if (!start || !end || end <= start) return 1;
  const hours = (end - start) / 36e5;
  return Math.max(1, Math.ceil(hours / 24));
}

function spanLabel(start, end) {
  if (!start || !end || end <= start) return '1 day';
  const hours = Math.round((end - start) / 36e5);
  if (hours < 24) return hours <= 1 ? '1 hr' : `${hours} hr`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

function whenLine(ms) {
  if (!ms) return 'Select';
  const date = new Date(ms);
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day} · ${time}`;
}

function policyWhen(ms) {
  if (!ms) return 'Pickup time';
  const date = new Date(ms);
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day}, ${time}`;
}

function chargeLine(vehicle) {
  const raw = String(vehicle?.charge || '4–5 hours');
  return raw.replace(/hours/gi, 'hrs').replace(/hour/gi, 'hr');
}

const SHEET_OFF = 560;
const SHEET_EASE = Easing.bezier(0.22, 1, 0.36, 1);

function Radio({ on }) {
  return (
    <View style={[styles.radio, on && styles.radioOn]}>
      {on ? <View style={styles.radioDot} /> : null}
    </View>
  );
}

function VerificationIcon() {
  return (
    <View style={styles.bringIcon}>
      <View style={[styles.scanCorner, styles.scanTL]} />
      <View style={[styles.scanCorner, styles.scanTR]} />
      <View style={[styles.scanCorner, styles.scanBL]} />
      <View style={[styles.scanCorner, styles.scanBR]} />
      <View style={styles.personHead} />
      <View style={styles.personBody} />
    </View>
  );
}

function PermitIcon() {
  return (
    <View style={styles.bringIcon}>
      <View style={styles.doc}>
        <View style={styles.docLine} />
        <View style={[styles.docLine, styles.docLineMid]} />
        <View style={[styles.docLine, styles.docLineShort]} />
      </View>
      <View style={styles.stamp} />
    </View>
  );
}

export default function PayScreen({ vehicle, trip, onBack, onPay }) {
  const insets = useSafeAreaInsets();
  const [offerOn, setOfferOn] = useState(true);
  const [method, setMethod] = useState('payu');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const blurTargetRef = useRef(null);
  const btnScale = useSharedValue(1);
  const sheetY = useSharedValue(SHEET_OFF);
  const glide = useSharedValue(0);
  const payWidth = useSharedValue(300);
  const doneWidth = useSharedValue(300);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: payWidth.value * 3,
    transform: [{ translateX: payWidth.value * -1.6 * (1 - glide.value) }],
  }));
  const shineStyle = useAnimatedStyle(() => {
    const width = payWidth.value;
    return {
      width: width * 2,
      opacity: interpolate(glide.value, [0, 0.12, 0.5, 0.88, 1], [0, 0, 0.4, 0, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(glide.value, [0, 1], [width * -2.2, width * 1.25]) },
        { skewX: '-20deg' },
      ],
    };
  });
  const doneFillStyle = useAnimatedStyle(() => ({
    width: doneWidth.value * 3,
    transform: [{ translateX: doneWidth.value * -1.6 * (1 - glide.value) }],
  }));
  const doneShineStyle = useAnimatedStyle(() => {
    const width = doneWidth.value;
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

  useEffect(() => {
    if (!summaryOpen) return undefined;
    const frame = requestAnimationFrame(() => {
      sheetY.value = withTiming(0, {
        duration: 420,
        easing: SHEET_EASE,
        reduceMotion: ReduceMotion.Never,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [summaryOpen, sheetY]);

  const days = billDays(trip?.pickupAt, trip?.dropAt);
  const rate = DAY_RATE[vehicle?.name] || DAY_RATE['Evegah Mink'];
  const fare = rate * days;
  const discount = offerOn ? Math.min(OFFER_OFF, fare) : 0;
  const total = fare - discount + DEPOSIT;
  const span = spanLabel(trip?.pickupAt, trip?.dropAt);
  const dayLabel = days === 1 ? '1 day' : `${days} days`;

  const pay = () => onPay?.({
    total,
    fare,
    discount,
    deposit: DEPOSIT,
    days,
    method,
    depositWhen: 'now',
    offerOn,
  });

  const closeSummary = () => {
    sheetY.value = withTiming(SHEET_OFF, {
      duration: 320,
      easing: Easing.in(Easing.cubic),
      reduceMotion: ReduceMotion.Never,
    }, (finished) => {
      if (finished) runOnJS(setSummaryOpen)(false);
    });
  };

  return (
    <View style={styles.root}>
      <BlurTargetView ref={blurTargetRef} collapsable={false} style={styles.blurTarget}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable hitSlop={10} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={INK} />
        </Pressable>
        <Text style={styles.headerTitle}>Pay for ride</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 108, paddingTop: 4 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroName} numberOfLines={1}>{vehicle?.name || 'Your scooter'}</Text>
            <View style={styles.specs}>
              <View style={styles.spec}>
                <Text style={styles.specLabel}>Range</Text>
                <Text style={styles.specValue} numberOfLines={1}>{vehicle?.range || '—'}</Text>
              </View>
              <View style={styles.spec}>
                <Text style={styles.specLabel}>Top speed</Text>
                <Text style={styles.specValue} numberOfLines={1}>{vehicle?.speed || '—'}</Text>
              </View>
              <View style={styles.spec}>
                <Text style={styles.specLabel}>Fast charge</Text>
                <Text style={styles.specValue} numberOfLines={1}>{chargeLine(vehicle)}</Text>
              </View>
            </View>
          </View>
          {vehicle?.image ? (
            <Image source={vehicle.image} style={styles.heroImage} contentFit="contain" />
          ) : null}
        </Animated.View>

        <Animated.View entering={cardEnter(1)} style={styles.card}>
          <View style={styles.route}>
            <View style={styles.routeCol}>
              <View style={styles.routeTitle}>
                <Ionicons name="location" size={14} color={PURPLE} />
                <Text style={styles.routeKicker}>Pickup</Text>
              </View>
              <Text style={styles.routePlace} numberOfLines={1}>{trip?.pickupName || 'Select'}</Text>
              <Text style={styles.routeWhen} numberOfLines={1}>{whenLine(trip?.pickupAt)}</Text>
            </View>
            <View style={styles.routeMid}>
              <View style={styles.routeDash} />
              <View style={styles.spanPill}>
                <Text style={styles.spanText}>{span}</Text>
              </View>
            </View>
            <View style={[styles.routeCol, styles.routeEnd]}>
              <View style={styles.routeTitle}>
                <Ionicons name="location" size={14} color={PURPLE} />
                <Text style={styles.routeKicker}>Drop</Text>
              </View>
              <Text style={[styles.routePlace, styles.alignEnd]} numberOfLines={1}>{trip?.dropName || 'Select'}</Text>
              <Text style={[styles.routeWhen, styles.alignEnd]} numberOfLines={1}>{whenLine(trip?.dropAt)}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={cardEnter(2)} style={styles.offer}>
          <View style={styles.offerMark}>
            <Ionicons name="pricetag" size={16} color={PURPLE} />
          </View>
          <View style={styles.offerCopy}>
            <Text style={styles.offerCode}>EVE20</Text>
            <Text style={styles.offerText}>₹40 off this ride</Text>
          </View>
          <Pressable hitSlop={8} onPress={() => setOfferOn((on) => !on)}>
            <Text style={styles.offerAction}>{offerOn ? 'Remove' : 'Apply'}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={cardEnter(3)}>
          <Text style={styles.section}>Pay with</Text>
          <View style={styles.choiceRow}>
            {METHODS.map((item) => {
              const on = method === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setMethod(item.id)}
                  style={[styles.payCard, on && styles.choiceOn]}
                >
                  <View style={styles.logoWell}>
                    <Image source={item.logo} style={styles.bankLogo} contentFit="contain" contentPosition="left" />
                  </View>
                  <View style={styles.payMeta}>
                    <Text style={styles.bankName} numberOfLines={1}>{item.name}</Text>
                    <Radio on={on} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={cardEnter(4)} style={styles.bill}>
          <Text style={styles.billTitle}>Bill details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Security deposit</Text>
            <Text style={styles.billValue}>{rupee(DEPOSIT)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billSave}>Discount</Text>
            <Text style={styles.billSave}>{discount ? rupee(-discount) : rupee(0)}</Text>
          </View>
          <View style={styles.billRule} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total amount</Text>
            <Text style={styles.billTotal}>{rupee(total)}</Text>
          </View>
          <Pressable style={styles.summaryBtn} onPress={() => setSummaryOpen(true)}>
            <Text style={styles.summaryBtnText}>Bill summary</Text>
            <Ionicons name="chevron-down" size={18} color={INK} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={cardEnter(6)} style={styles.bring}>
          <Text style={styles.blockTitle}>Things to bring with you</Text>
          <View style={styles.bringCard}>
            <VerificationIcon />
            <View style={styles.bringCopy}>
              <Text style={styles.bringTitle}>Verification</Text>
              <Text style={styles.bringText}>
                Carry your Original Driving Licence and Aadhaar for a quick in-person verification at the hub
              </Text>
            </View>
          </View>
          <View style={styles.bringCard}>
            <PermitIcon />
            <View style={styles.bringCopy}>
              <Text style={styles.bringTitle}>Ask for intercity permit.</Text>
              <Text style={styles.bringText}>
                Please ask hub partner for a permit if you're traveling intercity.
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={cardEnter(7)} style={styles.policy}>
          <Text style={styles.blockTitle}>Cancellation Policy</Text>
          <Text style={styles.policyLead}>Free cancellation available</Text>
          <View style={styles.refundWrap}>
            <View style={styles.refundBar}>
              <View style={styles.refundFull}>
                <Text style={styles.refundFullText}>100% Refund</Text>
              </View>
              <View style={styles.refundNone}>
                <Text style={styles.refundNoneText}>0% Refund</Text>
              </View>
            </View>
            <View style={styles.policyMark}>
              <View style={styles.arrowStem} />
              <View style={styles.arrowHead} />
              <Text style={styles.policyWhen}>{policyWhen(trip?.pickupAt)}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable
          onPress={pay}
          onPressIn={() => {
            btnScale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
        >
          <Animated.View
            style={[styles.pay, btnStyle]}
            onLayout={(event) => {
              payWidth.value = event.nativeEvent.layout.width;
            }}
          >
            <Animated.View pointerEvents="none" style={[styles.payFill, fillStyle]}>
              <LinearGradient
                colors={['#7C1FFF', '#7C1FFF', '#D8B4FE', '#7C1FFF', '#7C1FFF']}
                locations={[0, 0.36, 0.44, 0.52, 1]}
                start={{ x: 0.79, y: 0.91 }}
                end={{ x: 0.21, y: 0.09 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Text style={styles.payText}>Pay {rupee(total)}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            <Animated.View pointerEvents="none" style={[styles.lwShine, shineStyle]} />
          </Animated.View>
        </Pressable>
      </View>
      </BlurTargetView>

      {summaryOpen ? (
        <View style={styles.sheetRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSummary}>
            <BlurView
              blurTarget={blurTargetRef}
              intensity={16}
              tint="light"
              blurMethod="dimezisBlurView"
              blurReductionFactor={4}
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
          <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }, sheetStyle]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Bill summary</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Ride fare ({dayLabel})</Text>
              <Text style={styles.billValue}>{rupee(fare)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Security deposit</Text>
              <Text style={styles.billValue}>{rupee(DEPOSIT)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billSave}>Discount</Text>
              <Text style={styles.billSave}>{discount ? rupee(-discount) : rupee(0)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billTotal}>Total amount</Text>
              <Text style={styles.billTotal}>{rupee(total)}</Text>
            </View>
            <View style={styles.values}>
              <Text style={styles.valuesTitle}>Best-in-class values</Text>
              <View style={styles.valuesRow}>
                <Text style={styles.valuesText}>
                  Thorough inspection, expert refurbishment & cleaning has been conducted by our professionals.
                </Text>
                <Image
                  source={sketchFor(vehicle)}
                  style={styles.valuesSketch}
                  contentFit="contain"
                />
              </View>
            </View>
            <Pressable style={styles.done} onPress={closeSummary}>
              <View
                style={styles.doneFace}
                onLayout={(event) => {
                  doneWidth.value = event.nativeEvent.layout.width;
                }}
              >
                <Animated.View pointerEvents="none" style={[styles.payFill, doneFillStyle]}>
                  <LinearGradient
                    colors={['#7C1FFF', '#7C1FFF', '#D8B4FE', '#7C1FFF', '#7C1FFF']}
                    locations={[0, 0.36, 0.44, 0.52, 1]}
                    start={{ x: 0.79, y: 0.91 }}
                    end={{ x: 0.21, y: 0.09 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
                <Text style={styles.doneText}>Done</Text>
                <Animated.View pointerEvents="none" style={[styles.lwShine, doneShineStyle]} />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F4FB',
  },
  header: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: INK,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  hero: {
    marginHorizontal: 16,
    backgroundColor: '#F3EEFF',
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
    paddingRight: 8,
  },
  heroName: {
    color: INK,
    fontSize: 18,
    fontWeight: '700',
  },
  specs: {
    marginTop: 10,
    gap: 7,
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specLabel: {
    width: 78,
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  specValue: {
    flex: 1,
    color: INK,
    fontSize: 13,
    fontWeight: '700',
  },
  heroImage: {
    width: 124,
    height: 96,
    marginTop: 16,
  },
  card: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCol: {
    flex: 1,
  },
  routeEnd: {
    alignItems: 'flex-end',
  },
  routeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeKicker: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  routePlace: {
    marginTop: 4,
    color: INK,
    fontSize: 16,
    fontWeight: '800',
  },
  routeWhen: {
    marginTop: 2,
    color: MUTED,
    fontSize: 11,
  },
  alignEnd: {
    textAlign: 'right',
  },
  routeMid: {
    width: 78,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  routeDash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 13,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D9D0E8',
  },
  spanPill: {
    backgroundColor: '#F3EAFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  spanText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  offer: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3EAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  offerCode: {
    color: INK,
    fontSize: 15,
    fontWeight: '800',
  },
  offerText: {
    marginTop: 2,
    color: MUTED,
    fontSize: 12,
  },
  offerAction: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 16,
    color: INK,
    fontSize: 16,
    fontWeight: '800',
  },
  choiceRow: {
    marginHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
  },
  choiceOn: {
    borderColor: PURPLE,
    backgroundColor: '#F8F4FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D5D0DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: PURPLE,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PURPLE,
  },
  payCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E6E1EE',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  logoWell: {
    height: 36,
    justifyContent: 'center',
  },
  bankLogo: {
    width: '100%',
    height: 36,
  },
  payMeta: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bankName: {
    flex: 1,
    color: INK,
    fontSize: 14,
    fontWeight: '700',
  },
  bill: {
    marginTop: 22,
    marginHorizontal: 16,
  },
  billTitle: {
    color: INK,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  billLabel: {
    color: '#5E5868',
    fontSize: 14,
  },
  billValue: {
    color: INK,
    fontSize: 14,
    fontWeight: '700',
  },
  billSave: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: '700',
  },
  billRule: {
    height: 1,
    backgroundColor: '#E8E4EF',
    marginVertical: 6,
  },
  billTotal: {
    color: INK,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  summaryBtnText: {
    color: INK,
    fontSize: 14,
    fontWeight: '700',
  },
  values: {
    marginTop: 14,
    backgroundColor: '#F6F4FB',
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  valuesTitle: {
    textAlign: 'center',
    color: PURPLE,
    fontSize: 16,
    fontWeight: '700',
  },
  valuesRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  valuesText: {
    flex: 1,
    color: '#3C2A68',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  valuesSketch: {
    width: 112,
    height: 124,
  },
  bring: {
    marginTop: 26,
    marginHorizontal: 16,
    gap: 10,
  },
  blockTitle: {
    color: '#1C1C1C',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  bringCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E6EA',
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bringIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: '#C8CBD2',
  },
  scanTL: { top: 6, left: 6, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  scanTR: { top: 6, right: 6, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  scanBL: { bottom: 6, left: 6, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  scanBR: { bottom: 6, right: 6, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
  personHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2A2A2A',
    marginBottom: 1,
  },
  personBody: {
    width: 18,
    height: 10,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: '#3B78E0',
  },
  doc: {
    width: 16,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7DAE0',
    paddingTop: 3,
    paddingLeft: 2,
    gap: 2,
  },
  docLine: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#C5C8D0',
  },
  docLineMid: { width: 8 },
  docLineShort: { width: 5 },
  stamp: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#2E9B74',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  bringCopy: {
    flex: 1,
  },
  bringTitle: {
    color: INK,
    fontSize: 15,
    fontWeight: '700',
  },
  bringText: {
    marginTop: 3,
    color: '#8E8A96',
    fontSize: 13,
    lineHeight: 18,
  },
  policy: {
    marginTop: 26,
    marginHorizontal: 16,
  },
  policyLead: {
    marginTop: 2,
    marginBottom: 12,
    color: '#8A8A90',
    fontSize: 14,
  },
  refundWrap: {
    paddingBottom: 52,
  },
  refundBar: {
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  refundFull: {
    flex: 1,
    backgroundColor: '#E7F6EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundFullText: {
    color: '#149447',
    fontSize: 15,
    fontWeight: '600',
  },
  refundNone: {
    flex: 1,
    backgroundColor: '#F2F2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundNoneText: {
    color: '#2A2A2E',
    fontSize: 15,
    fontWeight: '600',
  },
  policyMark: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  arrowStem: {
    width: 1.5,
    height: 22,
    backgroundColor: '#B0B0B6',
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#B0B0B6',
  },
  policyWhen: {
    marginTop: 4,
    color: '#8A8A90',
    fontSize: 13,
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
    borderTopColor: '#F0EDF4',
  },
  pay: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#7C1FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  payFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  lwShine: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  payText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  blurTarget: {
    flex: 1,
  },
  sheetRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    elevation: 24,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E1EA',
    marginBottom: 14,
  },
  sheetTitle: {
    color: INK,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  done: {
    marginTop: 16,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#7C1FFF',
    overflow: 'hidden',
  },
  doneFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
