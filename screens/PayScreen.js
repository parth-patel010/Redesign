import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#4A168C';
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const DAY_RATE = {
  'Evegah Fly': 149,
  'Evegah Mink': 199,
  'Evegah City': 229,
  'Evegah Pro': 299,
};
const DEPOSIT = 250;
const FLEXI_BASE_FARE = 150;

const CHECKOUT_COUPONS = [
  {
    id: 'first50',
    title: 'Flat ₹50 OFF on First Evegah Ride',
    subtitle: 'Use code FIRST50',
    code: 'FIRST50',
    discount: 50,
    bullets: [
      'Valid on your first Evegah electric scooter booking.',
      'Applicable across Hourly, Daily & Monthly plans.',
    ],
  },
  {
    id: 'navratri100',
    title: 'Navratri Fest • Flat ₹100 OFF',
    subtitle: 'Use code NAVRATRI100',
    code: 'NAVRATRI100',
    discount: 100,
    bullets: [
      'Festive special coupon for Garba & night EV rides.',
      'Includes free battery swap at any 24/7 Evegah hub.',
    ],
  },
  {
    id: 'diwali200',
    title: 'Diwali Dhamaka • Flat ₹200 OFF',
    subtitle: 'Use code DIWALI200',
    code: 'DIWALI200',
    discount: 200,
    bullets: [
      'Festive reward coupon on multi-day or weekly EV plans.',
      'Applicable on Evegah Fly, Mink, City & Pro scooters.',
    ],
  },
  {
    id: 'winter40',
    title: 'Winter Ride • Flat ₹40 OFF above ₹149',
    subtitle: 'Use code WINTER40',
    code: 'WINTER40',
    discount: 40,
    bullets: [
      'This offer is personalised for your winter morning rides.',
      'Applicable on order worth ₹149 or above.',
    ],
  },
];

function rupee(amount) {
  const sign = amount < 0 ? '−' : '';
  return `${sign}₹${Math.abs(Math.round(amount)).toLocaleString('en-IN')}`;
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
  const day = date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} · ${time}`;
}

function formatCutoffLabel(pickupAt) {
  const d = pickupAt ? new Date(pickupAt) : new Date(Date.now() + 3600 * 1000);
  const dayMonth = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
  const time = d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dayMonth}, ${time.toUpperCase()}`;
}

function Segment({ value, onChange }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const markW = Math.max((width - 8) / 2, 0);

  useEffect(() => {
    x.value = withTiming(value === 'now' ? 0 : markW, {
      duration: 320,
      easing: EASE,
      reduceMotion: ReduceMotion.Never,
    });
  }, [markW, value, x]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      style={styles.segment}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.segmentMark, { width: markW }, markStyle]}
      />
      {[
        ['now', 'Pay now'],
        ['later', 'Pay later'],
      ].map(([id, label]) => {
        const on = value === id;
        return (
          <Pressable
            key={id}
            style={styles.segmentBtn}
            onPress={() => onChange(id)}
          >
            <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function PayScreen({ vehicle, trip, onBack, onPay }) {
  const insets = useSafeAreaInsets();
  const [offerOn, setOfferOn] = useState(false);
  const [appliedCode, setAppliedCode] = useState('FIRST50');
  const [appliedDiscountAmt, setAppliedDiscountAmt] = useState(50);
  const [couponPopupOpen, setCouponPopupOpen] = useState(false);
  const [expandedMap, setExpandedMap] = useState({
    first50: true,
    navratri100: true,
    diwali200: true,
    winter40: true,
  });
  const [depositWhen, setDepositWhen] = useState('now');
  const [method, setMethod] = useState('upi');
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const days = billDays(trip?.pickupAt, trip?.dropAt);
  const rate = DAY_RATE[vehicle?.name] || DAY_RATE['Evegah Mink'];
  const fare = rate * days;
  const flexiEnabled = Boolean(trip?.flexiEnabled || vehicle?.flexiEnabled);
  const flexiFee = flexiEnabled ? FLEXI_BASE_FARE : 0;
  const discount = offerOn ? Math.min(appliedDiscountAmt, fare) : 0;
  const deposit = depositWhen === 'now' ? DEPOSIT : 0;
  const total = fare + flexiFee - discount + deposit;
  const span = spanLabel(trip?.pickupAt, trip?.dropAt);

  const pickupLabel =
    trip?.flexiPickupAddress ||
    vehicle?.flexiPickupAddress ||
    trip?.pickupName ||
    'Select';
  const dropLabel =
    trip?.flexiDropAddress ||
    vehicle?.flexiDropAddress ||
    trip?.dropName ||
    'Select';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Text pointerEvents="none" style={styles.headerTitle}>
            Checkout
          </Text>
          <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
            <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
          </Pressable>
          <View style={styles.secure}>
            <Ionicons name="lock-closed" size={12} color={PURPLE} />
            <Text style={styles.secureText}>Secure</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.card}>
          <View style={styles.hero}>
            <View
              style={[
                styles.heroArt,
                { backgroundColor: vehicle?.tint || '#F6F1FC' },
              ]}
            >
              {vehicle?.image ? (
                <Image
                  source={vehicle.image}
                  style={styles.heroImage}
                  contentFit="contain"
                />
              ) : null}
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroName}>
                {vehicle?.name || 'Your scooter'}
              </Text>
              <Text style={styles.heroLine}>
                {vehicle?.line || 'Electric ride'}
              </Text>
              <Text style={styles.heroMeta}>{vehicle?.range || ''}</Text>
            </View>
          </View>
          <View style={styles.rule} />
          <View style={styles.route}>
            <View style={styles.routeCol}>
              <Text style={styles.routeKicker}>
                {flexiEnabled ? 'Flexi Pickup' : 'Pickup'}
              </Text>
              <Text style={styles.routePlace} numberOfLines={2}>
                {pickupLabel}
              </Text>
              <Text style={styles.routeWhen} numberOfLines={1}>
                {whenLine(trip?.pickupAt)}
              </Text>
            </View>
            <View style={styles.routeMid}>
              <View style={styles.routeLine} />
              <Text style={styles.routeSpan}>{span}</Text>
            </View>
            <View style={[styles.routeCol, styles.routeEnd]}>
              <Text style={styles.routeKicker}>
                {flexiEnabled ? 'Flexi Drop' : 'Drop'}
              </Text>
              <Text
                style={[styles.routePlace, styles.routeAlign]}
                numberOfLines={2}
              >
                {dropLabel}
              </Text>
              <Text
                style={[styles.routeWhen, styles.routeAlign]}
                numberOfLines={1}
              >
                {whenLine(trip?.dropAt)}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.Text entering={cardEnter(1)} style={styles.section}>
          Offer
        </Animated.Text>
        <Animated.View entering={cardEnter(1)}>
          <Pressable
            onPress={() => setCouponPopupOpen(true)}
            style={[styles.offer, offerOn && styles.offerOn]}
          >
            <View style={styles.offerMark}>
              <Ionicons name="pricetag" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.offerCopy}>
              <Text style={styles.offerCode}>
                {offerOn ? appliedCode : 'Apply Evegah Coupon'}
              </Text>
              <Text style={styles.offerText}>
                {offerOn
                  ? `₹${discount} off applied on this ride`
                  : 'First Ride, Navratri, Diwali & Winter Ride coupons'}
              </Text>
            </View>
            <Text style={[styles.offerAction, offerOn && styles.offerActionOn]}>
              {offerOn ? 'Applied' : 'View'}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.Text entering={cardEnter(2)} style={styles.section}>
          Deposit
        </Animated.Text>
        <Animated.View entering={cardEnter(2)} style={styles.card}>
          <Segment value={depositWhen} onChange={setDepositWhen} />
          <Text style={styles.depositNote}>
            {depositWhen === 'now'
              ? `₹${DEPOSIT} is refundable and comes back after the ride.`
              : `₹${DEPOSIT} is due before pickup. It is refundable.`}
          </Text>
        </Animated.View>

        <Animated.Text entering={cardEnter(3)} style={styles.section}>
          Pay with
        </Animated.Text>
        <Animated.View entering={cardEnter(3)} style={styles.methods}>
          {[
            ['upi', 'UPI', 'phone-portrait-outline'],
            ['card', 'Card', 'card-outline'],
          ].map(([id, label, icon]) => {
            const on = method === id;
            return (
              <Pressable
                key={id}
                onPress={() => setMethod(id)}
                style={[styles.method, on && styles.methodOn]}
              >
                <Ionicons
                  name={icon}
                  size={20}
                  color={on ? PURPLE : '#6E6878'}
                />
                <Text style={[styles.methodText, on && styles.methodTextOn]}>
                  {label}
                </Text>
                {on ? (
                  <Ionicons name="checkmark-circle" size={16} color={PURPLE} />
                ) : (
                  <View style={styles.methodDot} />
                )}
              </Pressable>
            );
          })}
        </Animated.View>

        <Animated.Text entering={cardEnter(4)} style={styles.section}>
          Bill
        </Animated.Text>
        <Animated.View entering={cardEnter(4)} style={styles.card}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>
              Ride fare · {days === 1 ? '1 day' : `${days} days`}
            </Text>
            <Text style={styles.billValue}>{rupee(fare)}</Text>
          </View>
          {flexiEnabled ? (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Flexi EV Delivery & Pickup</Text>
              <Text style={styles.billValue}>{rupee(flexiFee)}</Text>
            </View>
          ) : null}
          {discount > 0 ? (
            <Animated.View
              entering={FadeIn.duration(220)}
              style={styles.billRow}
            >
              <Text style={styles.billSave}>{appliedCode}</Text>
              <Text style={styles.billSave}>{rupee(-discount)}</Text>
            </Animated.View>
          ) : null}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Security deposit</Text>
            <Text style={styles.billValue}>
              {deposit ? rupee(deposit) : 'Later'}
            </Text>
          </View>
          <View style={styles.billRule} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total</Text>
            <Animated.Text
              key={total}
              entering={FadeIn.duration(220)}
              style={styles.billTotal}
            >
              {rupee(total)}
            </Animated.Text>
          </View>
          <Text style={styles.billHint}>Includes taxes</Text>
        </Animated.View>

        {/* SECTION: Things to bring with you (KYC & Intercity Permit - Matches Screenshot) */}
        <Animated.View entering={cardEnter(5)} style={styles.policySectionWrap}>
          <Text style={styles.policyHeading}>Things to bring with you</Text>

          <View style={styles.bringCard}>
            <View style={styles.bringIconSquare}>
              <View style={styles.verifyFaceCircle}>
                <Ionicons name="person" size={20} color="#F59E0B" />
              </View>
              <View style={styles.verifyIdMini}>
                <Ionicons name="card" size={13} color="#3B82F6" />
              </View>
              <View style={styles.verifyCheckDot}>
                <Ionicons name="checkmark" size={9} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.bringCardCopy}>
              <Text style={styles.bringCardTitle}>Verification</Text>
              <Text style={styles.bringCardSub}>
                Carry your Original Driving Licence and Aadhaar for a quick
                in-person verification at the hub
              </Text>
            </View>
          </View>

          <View style={styles.bringCard}>
            <View style={styles.bringIconSquare}>
              <View style={styles.permitDocSheet}>
                <View style={styles.permitDocLineLong} />
                <View style={styles.permitDocLineShort} />
                <View style={styles.permitStampBadge}>
                  <Ionicons name="ribbon" size={12} color="#2563EB" />
                </View>
              </View>
            </View>
            <View style={styles.bringCardCopy}>
              <Text style={styles.bringCardTitle}>
                Ask for intercity permit.
              </Text>
              <Text style={styles.bringCardSub}>
                Please ask hub partner for a permit if you&apos;re traveling
                intercity.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* SECTION: Cancellation Policy (Matches Screenshot) */}
        <Animated.View entering={cardEnter(6)} style={styles.policySectionWrap}>
          <Text style={styles.policyHeading}>Cancellation Policy</Text>
          <Text style={styles.policySubheading}>
            Free cancellation available
          </Text>

          <View style={styles.cancelBarWrap}>
            <View style={styles.cancelSplitPill}>
              <View style={styles.cancelLeftGreen}>
                <Text style={styles.cancelLeftGreenText}>100% Refund</Text>
              </View>
              <View style={styles.cancelRightGrey}>
                <Text style={styles.cancelRightGreyText}>0% Refund</Text>
              </View>
            </View>

            <View style={styles.cancelCutoffPointer}>
              <View style={styles.cancelArrowStem} />
              <Ionicons name="arrow-down" size={15} color="#111827" style={{ marginTop: -5 }} />
              <Text style={styles.cancelCutoffTimeText}>
                {formatCutoffLabel(trip?.pickupAt)}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <View>
          <Text style={styles.footerKicker}>To pay</Text>
          <Text style={styles.footerAmount}>{rupee(total)}</Text>
        </View>
        <Pressable
          onPress={() =>
            onPay?.({
              total,
              fare,
              flexiFee,
              discount,
              deposit,
              days,
              method,
              depositWhen,
              offerOn,
            })
          }
          onPressIn={() => {
            btnScale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
        >
          <Animated.View style={[styles.pay, btnStyle]}>
            <Text style={styles.payText}>Pay {rupee(total)}</Text>
          </Animated.View>
        </Pressable>
      </View>

      {/* Apply Evegah Coupon Popup Modal */}
      <Modal
        visible={couponPopupOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setCouponPopupOpen(false)}
      >
        <View style={styles.popupBackdrop}>
          <Pressable
            style={styles.popupBackdropTouch}
            onPress={() => setCouponPopupOpen(false)}
          />

          <View style={styles.popupCloseCircleWrap}>
            <Pressable
              onPress={() => setCouponPopupOpen(false)}
              style={styles.popupCloseCircle}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <View
            style={[
              styles.popupSheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <Text style={styles.popupMainTitle}>Offers at Evegah</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.popupScroll}
            >
              <View style={styles.popupGroupBox}>
                <Text style={styles.popupGroupHeading}>
                  Evegah Ride Coupons
                </Text>

                {CHECKOUT_COUPONS.map((item) => {
                  const open = expandedMap[item.id] !== false;
                  return (
                    <View key={item.id} style={styles.popupCouponCard}>
                      <Pressable
                        onPress={() =>
                          setExpandedMap((prev) => ({
                            ...prev,
                            [item.id]: !open,
                          }))
                        }
                        style={styles.popupCouponTop}
                      >
                        <View style={styles.popupBlueBadge}>
                          <Text style={styles.popupBlueBadgeText}>%</Text>
                        </View>

                        <View style={styles.popupCouponCopy}>
                          <Text style={styles.popupCouponTitle}>
                            {item.title}
                          </Text>
                          {item.subtitle ? (
                            <Text style={styles.popupUseCodeSub}>
                              {item.subtitle}
                            </Text>
                          ) : null}
                          {item.code ? (
                            <Pressable
                              onPress={() => {
                                setAppliedCode(item.code);
                                setAppliedDiscountAmt(item.discount || 40);
                                setOfferOn(true);
                                setCouponPopupOpen(false);
                              }}
                              style={styles.popupCodePill}
                            >
                              <Text style={styles.popupCodePillText}>
                                APPLY {item.code}
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>

                        <Ionicons
                          name={open ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#6B7280"
                        />
                      </Pressable>

                      {open ? (
                        <>
                          <View style={styles.popupDashedRule} />
                          <View style={styles.popupBullets}>
                            {item.bullets.map((b, idx) => (
                              <View key={idx} style={styles.popupBulletRow}>
                                <View style={styles.popupGreenCheck}>
                                  <Ionicons
                                    name="checkmark"
                                    size={11}
                                    color="#FFFFFF"
                                  />
                                </View>
                                <Text style={styles.popupBulletText}>{b}</Text>
                              </View>
                            ))}
                          </View>
                        </>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 12,
  },
  headerRow: {
    height: 36,
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
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    lineHeight: 36,
    color: '#1C1C1C',
    fontSize: 17,
    fontWeight: '700',
  },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F6F1FC',
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 32,
  },
  secureText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroArt: {
    width: 92,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 84,
    height: 58,
  },
  heroCopy: {
    flex: 1,
    marginLeft: 14,
  },
  heroName: {
    color: '#1C1C1C',
    fontSize: 18,
    fontWeight: '700',
  },
  heroLine: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 13,
  },
  heroMeta: {
    marginTop: 6,
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  rule: {
    height: 1,
    backgroundColor: '#F1F1F3',
    marginVertical: 14,
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
  routeAlign: {
    textAlign: 'right',
  },
  routeKicker: {
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '700',
  },
  routePlace: {
    marginTop: 2,
    color: '#1C1C1C',
    fontSize: 14,
    fontWeight: '700',
  },
  routeWhen: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 12,
  },
  routeMid: {
    width: 72,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  routeLine: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: '#E4D4F5',
  },
  routeSpan: {
    marginTop: 6,
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 20,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  offer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  offerOn: {
    borderColor: '#E4D4F5',
    backgroundColor: '#FCF9FF',
  },
  offerMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  offerCode: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  offerText: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 12,
  },
  offerAction: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: '700',
  },
  offerActionOn: {
    color: '#1F8A4C',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F6',
    borderRadius: 14,
    padding: 4,
  },
  segmentMark: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  segmentBtn: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    color: '#8A8496',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextOn: {
    color: '#1C1C1C',
  },
  depositNote: {
    marginTop: 12,
    color: '#6E6878',
    fontSize: 13,
    lineHeight: 18,
  },
  methods: {
    marginHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
  },
  method: {
    flex: 1,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodOn: {
    borderColor: PURPLE,
    backgroundColor: '#FCF9FF',
  },
  methodText: {
    flex: 1,
    color: '#3C3846',
    fontSize: 15,
    fontWeight: '700',
  },
  methodTextOn: {
    color: '#1C1C1C',
  },
  methodDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D9D4E0',
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  billLabel: {
    color: '#6E6878',
    fontSize: 14,
  },
  billValue: {
    color: '#1C1C1C',
    fontSize: 14,
    fontWeight: '600',
  },
  billSave: {
    color: '#1F8A4C',
    fontSize: 14,
    fontWeight: '700',
  },
  billRule: {
    height: 1,
    backgroundColor: '#F1F1F3',
    marginVertical: 8,
  },
  billTotal: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '800',
  },
  billHint: {
    marginTop: 2,
    color: '#8A8496',
    fontSize: 12,
  },
  /* Things to bring with you & Cancellation Policy Styles */
  policySectionWrap: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  policyHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  policySubheading: {
    marginTop: -8,
    marginBottom: 14,
    fontSize: 13.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  bringCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  bringIconSquare: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  verifyFaceCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyIdMini: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 20,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyCheckDot: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  permitDocSheet: {
    width: 34,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 6,
    justifyContent: 'space-between',
  },
  permitDocLineLong: {
    width: '90%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
  },
  permitDocLineShort: {
    width: '60%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
  },
  permitStampBadge: {
    alignSelf: 'flex-end',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bringCardCopy: {
    flex: 1,
  },
  bringCardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#111827',
  },
  bringCardSub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18.5,
    color: '#6B7280',
    fontWeight: '400',
  },
  cancelBarWrap: {
    alignItems: 'center',
  },
  cancelSplitPill: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelLeftGreen: {
    flex: 1,
    backgroundColor: '#E3F3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLeftGreenText: {
    color: '#137333',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelRightGrey: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelRightGreyText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelCutoffPointer: {
    alignItems: 'center',
    marginTop: -2,
  },
  cancelArrowStem: {
    width: 1.5,
    height: 12,
    backgroundColor: '#111827',
  },
  cancelCutoffTimeText: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  footerKicker: {
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '600',
  },
  footerAmount: {
    color: '#1C1C1C',
    fontSize: 20,
    fontWeight: '800',
  },
  pay: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 18, 24, 0.62)',
    justifyContent: 'flex-end',
  },
  popupBackdropTouch: {
    flex: 1,
  },
  popupCloseCircleWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  popupCloseCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(42, 44, 50, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupSheet: {
    maxHeight: '78%',
    backgroundColor: '#F4F5F8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  popupMainTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E293B',
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  popupScroll: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  popupGroupBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  popupGroupHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  popupCouponCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF3',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  popupCouponTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  popupBlueBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  popupBlueBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  popupCouponCopy: {
    flex: 1,
  },
  popupCouponTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  popupUseCodeSub: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
  },
  popupCodePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
  },
  popupCodePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4A168C',
    letterSpacing: 0.3,
  },
  popupDashedRule: {
    marginVertical: 12,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
  },
  popupBullets: {
    gap: 8,
  },
  popupBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  popupGreenCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  popupBulletText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: '#475569',
    fontWeight: '500',
  },
});
