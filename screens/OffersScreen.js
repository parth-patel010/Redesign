import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet } from '../services/api';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 14;
const CARD_W = Math.floor((SCREEN_W - 32 - GRID_GAP) / 2);
const PURPLE = '#4A168C';
const PURPLE_DARK = '#2A0B52';

const POPUP_CARD_W = 280;
const POPUP_CARD_H = 300;
const FOIL_COLS = 14;
const FOIL_ROWS = 14;
const FOIL_TOTAL = FOIL_COLS * FOIL_ROWS;
const CELL_W = POPUP_CARD_W / FOIL_COLS;
const CELL_H = POPUP_CARD_H / FOIL_ROWS;
const BRUSH_RADIUS = 38;
const UNLOCK_THRESHOLD = 0.45;

const INITIAL_COUPONS = [
  {
    id: 'evegah-navratri-fest',
    brand: 'Evegah Navratri Fest',
    logoType: 'navratri',
    title: 'Flat ₹100 OFF Garba Night Ride',
    expiry: 'Expires in 14 days',
    validTill: 'Valid till 31st October 2026',
    code: 'NAVRATRI100',
    about:
      'Celebrate Navratri with zero parking hassle! Hop on an Evegah EV for late-night Garba pandal hopping and get ₹100 OFF.',
    scratched: false,
    scratchTheme: 'royalPurple',
  },
  {
    id: 'evegah-diwali-fest',
    brand: 'Evegah Diwali Fest',
    logoType: 'diwali',
    title: '₹200 Free Festive Ride Credits',
    expiry: 'Expires in 18 days',
    validTill: 'Valid till 15th November 2026',
    code: 'DIWALI200',
    about:
      'Light up your city rides this Diwali! Unlock ₹200 festive ride credits valid on all Evegah Daily & Weekly EV plans.',
    scratched: false,
    scratchTheme: 'deepIndigo',
  },
  {
    id: 'evegah-first-ride',
    brand: 'Evegah First Ride',
    logoType: 'first',
    title: 'Flat ₹50 OFF on First Ride',
    expiry: 'Expires in 25 days',
    validTill: 'Valid till 31st October 2026',
    code: 'FIRST50',
    about:
      'Welcome to Evegah! Enjoy a flat ₹50 instant discount on your very first electric scooter ride across any Evegah zone.',
    scratched: true,
    scratchTheme: null,
  },
  {
    id: 'evegah-weekend-pass',
    brand: 'Evegah Weekend Fest',
    logoType: 'weekend',
    title: 'Flat ₹75 OFF on 2-Day Pass',
    expiry: 'Expires in 12 days',
    validTill: 'Valid till 31st October 2026',
    code: 'WEEKEND75',
    about:
      'Plan a weekend city getaway with unlimited battery swaps and flat ₹75 OFF on any 48-hour Evegah Pro or City booking.',
    scratched: false,
    scratchTheme: 'royalPurple',
  },
  {
    id: 'evegah-winter-ride',
    brand: 'Evegah Winter Ride',
    logoType: 'winter',
    title: 'Flat ₹40 OFF Winter Rides',
    expiry: 'Expires in 20 days',
    validTill: 'Valid till 30th November 2026',
    code: 'WINTER40',
    about:
      'Breeze through crisp winter mornings on an Evegah Mink or City electric scooter with flat ₹40 OFF on daily rentals.',
    scratched: true,
    scratchTheme: null,
  },
  {
    id: 'evegah-green-monthly',
    brand: 'Evegah Green Pass',
    logoType: 'eco',
    title: 'Flat ₹150 OFF Monthly Plan',
    expiry: 'Expires in 28 days',
    validTill: 'Valid till 30th November 2026',
    code: 'ECO150',
    about:
      'Switch to 100% electric daily commuting and save ₹150 instantly on your 30-day Evegah Monthly subscription.',
    scratched: false,
    scratchTheme: 'deepIndigo',
  },
  {
    id: 'evegah-monsoon-ride',
    brand: 'Evegah All-Weather',
    logoType: 'monsoon',
    title: 'Flat ₹60 OFF Daily EV Plan',
    expiry: 'Expires in 19 days',
    validTill: 'Valid till 31st October 2026',
    code: 'EVGRIDE60',
    about:
      'IP67 water-resistant battery and high-grip tyres built for Indian roads. Use code EVGRIDE60 on your next 24-hour ride.',
    scratched: true,
    scratchTheme: null,
  },
  {
    id: 'evegah-campus-fest',
    brand: 'Evegah Campus Pass',
    logoType: 'campus',
    title: '25% OFF for College Riders',
    expiry: 'Expires in 23 days',
    validTill: 'Valid till 31st October 2026',
    code: 'CAMPUS25',
    about:
      'Special student mobility offer! Ride between campus, hostel, and cafes on Evegah Fly with 25% OFF every ride.',
    scratched: true,
    scratchTheme: null,
  },
];

const APPLY_OFFERS = [
  {
    id: 'first50',
    title: 'Flat ₹50 OFF on First Evegah Ride',
    subtitle: 'Use code FIRST50',
    code: 'FIRST50',
    bullets: [
      'Valid for your first Evegah electric scooter booking.',
      'Applicable on Hourly, Daily & Monthly EV plans.',
    ],
  },
  {
    id: 'navratri100',
    title: 'Navratri Fest • Flat ₹100 OFF',
    subtitle: 'Use code NAVRATRI100',
    code: 'NAVRATRI100',
    bullets: [
      'Special festive coupon for Navratri & Garba night rides.',
      'Includes free battery swap at any 24/7 Evegah hub.',
    ],
  },
  {
    id: 'diwali200',
    title: 'Diwali Dhamaka • ₹200 OFF on Multi-Day Plan',
    subtitle: 'Use code DIWALI200',
    code: 'DIWALI200',
    bullets: [
      'Festive reward coupon on 2-day or Weekly EV bookings.',
      'Applicable across Evegah Fly, Mink, City & Pro fleet.',
    ],
  },
  {
    id: 'winter40',
    title: 'Winter Morning Ride • Flat ₹40 OFF above ₹149',
    subtitle: 'Use code WINTER40',
    code: 'WINTER40',
    bullets: [
      'Personalised Evegah winter ride offer for you.',
      'Applicable on ride bookings worth ₹149 or above.',
    ],
  },
];

function BrandLogo({ type, size = 46 }) {
  const configs = {
    first: { bg: '#F3E8FF', border: '#DDD6FE', icon: 'flash', color: PURPLE, tag: 'FIRST' },
    navratri: { bg: '#FEF3C7', border: '#FDE68A', icon: 'sparkles', color: '#D97706', tag: 'FEST' },
    winter: { bg: '#EDE9FE', border: '#DDD6FE', icon: 'snow', color: '#5B21B6', tag: 'WINTER' },
    diwali: { bg: '#FAE8FF', border: '#F5D0FE', icon: 'flame', color: '#9333EA', tag: 'DIWALI' },
    weekend: { bg: '#FCE7F3', border: '#FBCFE8', icon: 'bicycle', color: '#9D174D', tag: 'PASS' },
    monsoon: { bg: '#ECFDF5', border: '#A7F3D0', icon: 'shield-checkmark', color: '#059669', tag: 'RIDE' },
    campus: { bg: '#EEF2FF', border: '#C7D2FE', icon: 'school', color: '#4338CA', tag: 'CAMPUS' },
    eco: { bg: '#DCFCE7', border: '#BBF7D0', icon: 'leaf', color: '#15803D', tag: 'GREEN' },
  };
  const cfg = configs[type] || configs.first;

  return (
    <View
      style={[
        styles.logoCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
        },
      ]}
    >
      <Ionicons name={cfg.icon} size={Math.round(size * 0.42)} color={cfg.color} />
      <Text style={[styles.evegahBadgeMini, { color: cfg.color }]}>{cfg.tag}</Text>
    </View>
  );
}

/**
 * Unscratched Card Preview in the 2-column grid.
 * Tapping this card opens the Popup Modal first where the user scratches it!
 */
function GridScratchCardPreview({ theme, onPress }) {
  const isPurple = theme === 'royalPurple';
  const colors = isPurple
    ? ['#6B21A8', '#4A168C', '#2E0E56']
    : ['#4338CA', '#312E81', '#1E1B4B'];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardShell,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.scratchGradient}
      >
        <View style={styles.scratchRay1} />
        <View style={styles.scratchRay2} />

        <Text style={[styles.sparkleChar, { top: 14, left: 28 }]}>✦</Text>
        <Text style={[styles.sparkleChar, { top: 12, right: 16 }]}>✧</Text>
        <Text style={[styles.sparkleChar, { top: 54, left: 12 }]}>✦</Text>
        <Text style={[styles.sparkleChar, { bottom: 48, left: 18 }]}>✦</Text>
        <Text style={[styles.sparkleChar, { bottom: 52, right: 16 }]}>✦</Text>

        {isPurple ? (
          <View style={styles.giftCircle}>
            <View style={styles.giftBowRow}>
              <View
                style={[styles.giftBowLoop, { transform: [{ rotate: '-24deg' }] }]}
              />
              <View
                style={[styles.giftBowLoop, { transform: [{ rotate: '24deg' }] }]}
              />
            </View>
            <View style={styles.giftLid}>
              <View style={styles.giftRibbonVLid} />
            </View>
            <View style={styles.giftBoxBody}>
              <View style={styles.giftRibbonVBody} />
            </View>
          </View>
        ) : (
          <View style={styles.chestWrap}>
            <View style={styles.chestLid}>
              <View style={styles.chestStripeLeft} />
              <View style={styles.chestStripeRight} />
            </View>
            <View style={styles.chestLock}>
              <View style={styles.chestKeyholeDot} />
            </View>
            <View style={styles.chestBase}>
              <View style={styles.chestBaseInner} />
            </View>
          </View>
        )}

        <View style={styles.tapToScratchPill}>
          <Ionicons name="sparkles" size={11} color="#FDE047" />
          <Text style={styles.tapToScratchPillText}>Tap to Scratch</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

/**
 * Interactive Multi-Tile Foil Scratch Overlay rendered inside the Popup Modal.
 * Erases foil cells along the user's finger trajectory, revealing the actual
 * reward card underneath with smooth animations and sparkle feedback.
 */
function PopupScratchFoilOverlay({ theme, onComplete }) {
  const [erasedMap, setErasedMap] = useState({});
  const [touchCursor, setTouchCursor] = useState(null);
  const erasedRef = useRef({});
  const prevPtRef = useRef(null);
  const completedRef = useRef(false);

  const foilOpacity = useSharedValue(1);
  const foilScale = useSharedValue(1);
  const handWave = useSharedValue(0);
  const shimmerX = useSharedValue(-POPUP_CARD_W);

  useEffect(() => {
    handWave.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    shimmerX.value = withRepeat(
      withTiming(POPUP_CARD_W * 1.4, {
        duration: 2200,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      false
    );
  }, [handWave, shimmerX]);

  const finishScratch = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setTouchCursor(null);
    foilScale.value = withTiming(1.1, { duration: 280 });
    foilOpacity.value = withTiming(
      0,
      { duration: 320, easing: Easing.out(Easing.cubic) },
      (done) => {
        if (done) {
          runOnJS(onComplete)();
        }
      }
    );
  };

  const eraseAlongSegment = (x, y) => {
    if (completedRef.current) return;
    setTouchCursor({ x, y });

    const prev = prevPtRef.current || { x, y };
    prevPtRef.current = { x, y };

    const distSeg = Math.hypot(x - prev.x, y - prev.y);
    const steps = Math.max(1, Math.ceil(distSeg / 10));

    let changed = false;
    const next = { ...erasedRef.current };

    for (let s = 0; s <= steps; s++) {
      const px = prev.x + ((x - prev.x) * s) / steps;
      const py = prev.y + ((y - prev.y) * s) / steps;
      for (let r = 0; r < FOIL_ROWS; r++) {
        for (let c = 0; c < FOIL_COLS; c++) {
          const key = `${r}-${c}`;
          if (next[key]) continue;
          const cx = (c + 0.5) * CELL_W;
          const cy = (r + 0.5) * CELL_H;
          if (Math.hypot(cx - px, cy - py) <= BRUSH_RADIUS) {
            next[key] = true;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      erasedRef.current = next;
      setErasedMap(next);
      const count = Object.keys(next).length;
      if (count / FOIL_TOTAL >= UNLOCK_THRESHOLD && !completedRef.current) {
        finishScratch();
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        prevPtRef.current = { x: locationX, y: locationY };
        eraseAlongSegment(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        eraseAlongSegment(locationX, locationY);
      },
      onPanResponderRelease: () => {
        prevPtRef.current = null;
        setTouchCursor(null);
      },
      onPanResponderTerminate: () => {
        prevPtRef.current = null;
        setTouchCursor(null);
      },
    })
  ).current;

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: foilOpacity.value,
    transform: [{ scale: foilScale.value }],
  }));

  const handAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(handWave.value, [0, 1], [-26, 26]) },
      { translateY: interpolate(handWave.value, [0, 1], [6, -6]) },
      { rotate: `${interpolate(handWave.value, [0, 1], [-12, 12])}deg` },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { rotate: '20deg' }],
  }));

  const erasedCount = Object.keys(erasedMap).length;
  const pct = Math.min(
    100,
    Math.round((erasedCount / (FOIL_TOTAL * UNLOCK_THRESHOLD)) * 100)
  );
  const isPurple = theme === 'royalPurple';

  return (
    <Animated.View
      style={[styles.popupFoilOverlay, overlayAnimStyle]}
      {...panResponder.panHandlers}
    >
      {/* Smooth 14x14 Foil Grid that Erases Along Finger Stroke */}
      <View style={styles.foilTilesGrid} pointerEvents="none">
        {Array.from({ length: FOIL_ROWS }).map((_, r) => (
          <View key={r} style={styles.foilTileRow}>
            {Array.from({ length: FOIL_COLS }).map((__, c) => {
              const key = `${r}-${c}`;
              const isErased = !!erasedMap[key];
              const altShade = (r + c) % 2 === 0;
              return (
                <View
                  key={key}
                  style={[
                    styles.foilTileCell,
                    {
                      backgroundColor: isErased
                        ? 'transparent'
                        : isPurple
                        ? altShade
                          ? '#5B1A91'
                          : '#4A168C'
                        : altShade
                        ? '#3B349E'
                        : '#312E81',
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Exact Same Card Artwork as Grid Card (Rays + Sparkles + 3D Gift Box / Chest) */}
      <View
        pointerEvents="none"
        style={[
          styles.foilCenterDecor,
          { opacity: Math.max(0.12, 1 - pct / 95) },
        ]}
      >
        <View style={styles.scratchRay1} />
        <View style={styles.scratchRay2} />
        <Animated.View style={[styles.foilShimmerBar, shimmerStyle]} />

        <Text style={[styles.sparkleChar, { top: 22, left: 32, fontSize: 18 }]}>✦</Text>
        <Text style={[styles.sparkleChar, { top: 20, right: 26, fontSize: 16 }]}>✧</Text>
        <Text style={[styles.sparkleChar, { top: 82, left: 18, fontSize: 15 }]}>✦</Text>
        <Text style={[styles.sparkleChar, { bottom: 68, left: 26, fontSize: 16 }]}>✦</Text>
        <Text style={[styles.sparkleChar, { bottom: 72, right: 24, fontSize: 17 }]}>✦</Text>

        {isPurple ? (
          <View style={[styles.giftCircle, { transform: [{ scale: 1.25 }], marginBottom: 14 }]}>
            <View style={styles.giftBowRow}>
              <View
                style={[styles.giftBowLoop, { transform: [{ rotate: '-24deg' }] }]}
              />
              <View
                style={[styles.giftBowLoop, { transform: [{ rotate: '24deg' }] }]}
              />
            </View>
            <View style={styles.giftLid}>
              <View style={styles.giftRibbonVLid} />
            </View>
            <View style={styles.giftBoxBody}>
              <View style={styles.giftRibbonVBody} />
            </View>
          </View>
        ) : (
          <View style={[styles.chestWrap, { transform: [{ scale: 1.25 }], marginBottom: 14 }]}>
            <View style={styles.chestLid}>
              <View style={styles.chestStripeLeft} />
              <View style={styles.chestStripeRight} />
            </View>
            <View style={styles.chestLock}>
              <View style={styles.chestKeyholeDot} />
            </View>
            <View style={styles.chestBase}>
              <View style={styles.chestBaseInner} />
            </View>
          </View>
        )}

        <Text style={styles.foilMainTitle}>Scratch &amp; Win!</Text>
        <Text style={styles.foilSubTitle}>
          Rub smoothly across the card to unlock
        </Text>

        {erasedCount < 10 ? (
          <Animated.View style={[styles.foilHandPrompt, handAnimStyle]}>
            <View style={styles.foilCoinPrompt}>
              <Ionicons name="sparkles" size={15} color="#78350F" />
            </View>
          </Animated.View>
        ) : null}
      </View>

      {/* Live Sparkle Coin Cursor Following Finger */}
      {touchCursor ? (
        <View
          pointerEvents="none"
          style={[
            styles.scratchCoinCursor,
            {
              left: touchCursor.x - 24,
              top: touchCursor.y - 24,
            },
          ]}
        >
          <View style={styles.scratchCoinInner}>
            <Ionicons name="sparkles" size={18} color="#92400E" />
          </View>
        </View>
      ) : null}

      {/* Progress Pill at Bottom of Foil */}
      <View pointerEvents="none" style={styles.foilProgressPill}>
        <Text style={styles.foilProgressText}>
          {pct > 0
            ? `Scratching... ${pct}% (Scratch to 100% to reveal)`
            : 'Rub card to scratch & unlock'}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function OffersScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);

  useEffect(() => {
    apiGet('/coupons')
      .then((body) => {
        const list = body?.data || body?.coupons || body || [];
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((c, idx) => ({
            id: String(c.id || c.code || `coupon-${idx}`),
            brand: c.brand || c.title || 'Evegah Special Offer',
            logoType: c.logo_type || 'first',
            title: c.title || (c.discount ? `Flat ₹${c.discount} OFF` : 'Special Discount'),
            expiry: c.expiry_text || (c.valid_till ? `Valid till ${c.valid_till}` : 'Valid for 14 days'),
            validTill: c.valid_till ? `Valid till ${c.valid_till}` : 'Valid for limited time',
            code: String(c.code || c.coupon_code || 'EVEGAH').toUpperCase(),
            about: c.description || c.about || 'Enjoy special discount on your Evegah EV ride.',
            scratched: Boolean(c.is_scratched ?? (idx % 2 === 0)),
            scratchTheme: idx % 2 === 0 ? 'royalPurple' : 'deepIndigo',
          }));
          setCoupons(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [justRevealedId, setJustRevealedId] = useState(null);
  const [applySheetOpen, setApplySheetOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [expandedOffers, setExpandedOffers] = useState({
    first50: true,
    navratri100: true,
    diwali200: true,
    winter40: true,
  });

  const selectedCoupon =
    coupons.find((c) => c.id === selectedCouponId) || null;

  const rayRotate = useSharedValue(0);
  const cardPopScale = useSharedValue(1);

  useEffect(() => {
    rayRotate.value = withRepeat(
      withTiming(360, { duration: 24000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rayRotate]);

  const rayAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rayRotate.value}deg` }],
  }));

  const cardPopStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardPopScale.value }],
  }));

  const handleScratchComplete = (couponId) => {
    setCoupons((prev) =>
      prev.map((item) =>
        item.id === couponId ? { ...item, scratched: true } : item
      )
    );
    setJustRevealedId(couponId);
    cardPopScale.value = withSequence(
      withSpring(1.09, { damping: 10, stiffness: 220 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
  };

  const handleCopyCode = async (code) => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode((curr) => (curr === code ? '' : curr));
    }, 1800);
  };

  const toggleExpandOffer = (id) => {
    setExpandedOffers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={10} style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#1C1C1E" />
        </Pressable>
        <Text style={styles.headerTitle}>Your Evegah Coupons</Text>
        <Pressable
          hitSlop={8}
          style={styles.applyPopupTrigger}
          onPress={() => setApplySheetOpen(true)}
        >
          <Ionicons name="pricetag" size={14} color={PURPLE} />
          <Text style={styles.applyPopupTriggerText}>All Offers</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        <View style={styles.sectionDividerRow}>
          <Text style={styles.sectionDividerTitle}>EVEGAH RIDE COUPONS</Text>
        </View>

        <View style={styles.grid}>
          {coupons.map((coupon) => {
            if (!coupon.scratched) {
              return (
                <GridScratchCardPreview
                  key={coupon.id}
                  theme={coupon.scratchTheme}
                  onPress={() => {
                    setJustRevealedId(null);
                    setSelectedCouponId(coupon.id);
                  }}
                />
              );
            }

            return (
              <Pressable
                key={coupon.id}
                onPress={() => {
                  setJustRevealedId(null);
                  setSelectedCouponId(coupon.id);
                }}
                style={({ pressed }) => [
                  styles.cardShell,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={styles.revealedCardTop}>
                  <BrandLogo type={coupon.logoType} size={48} />
                  <Text style={styles.brandNameText} numberOfLines={1}>
                    {coupon.brand}
                  </Text>
                  <Text style={styles.couponTitleText} numberOfLines={2}>
                    {coupon.title}
                  </Text>
                  <View style={styles.codeMiniBadge}>
                    <Text style={styles.codeMiniBadgeText}>{coupon.code}</Text>
                  </View>
                </View>

                <View style={styles.dashedLine} />

                <View style={styles.viewDetailsRow}>
                  <Text style={styles.viewDetailsText}>View details</Text>
                  <View style={styles.viewDetailsArrowCircle}>
                    <Ionicons name="arrow-forward" size={11} color="#FFFFFF" />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* First-Open Popup Modal: Scratch Card Inside Popup & View Coupon Details */}
      <Modal
        visible={selectedCoupon !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedCouponId(null)}
      >
        <View style={styles.popupBackdrop}>
          {/* Rotating Sunburst Rays Behind Card */}
          <Animated.View
            pointerEvents="none"
            style={[styles.sunburstContainer, rayAnimStyle]}
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.sunburstRay,
                  { transform: [{ rotate: `${idx * 30}deg` }] },
                ]}
              />
            ))}
          </Animated.View>

          {/* Top Bar inside Modal */}
          <View style={[styles.popupTopBar, { marginTop: insets.top + 10 }]}>
            <View style={styles.popupStatusBadge}>
              <Ionicons
                name={selectedCoupon?.scratched ? 'checkmark-circle' : 'sparkles'}
                size={14}
                color="#FDE047"
              />
              <Text style={styles.popupStatusBadgeText}>
                {selectedCoupon?.scratched
                  ? 'COUPON UNLOCKED'
                  : 'SCRATCH TO UNLOCK'}
              </Text>
            </View>
            <Pressable
              hitSlop={12}
              onPress={() => setSelectedCouponId(null)}
              style={styles.popupCloseTopRight}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Center Floating Reward / Scratch Card Stage */}
          {selectedCoupon ? (
            <View style={styles.popupCenterStage}>
              <Animated.View entering={ZoomIn.duration(260)}>
                <Animated.View
                  style={[styles.rewardPopupCardWrap, cardPopStyle]}
                >
                  {selectedCoupon.scratched ? (
                    /* Real Offer Displayed ONLY After Full Scratch Completion */
                    <Animated.View
                      entering={ZoomIn.duration(300)}
                      style={styles.rewardPopupCard}
                    >
                      <BrandLogo type={selectedCoupon.logoType} size={64} />
                      <Text style={styles.rewardPopupBrand}>
                        {selectedCoupon.brand}
                      </Text>
                      <Text style={styles.rewardPopupOffer}>
                        {selectedCoupon.title}
                      </Text>

                      <View style={styles.rewardPopupCodePill}>
                        <Text style={styles.rewardPopupCodePillText}>
                          {selectedCoupon.code}
                        </Text>
                      </View>

                      <Text style={styles.rewardPopupValid}>
                        {selectedCoupon.validTill}
                      </Text>

                      {/* Confetti accents */}
                      <View
                        style={[
                          styles.confettiDot,
                          { top: 18, left: 22, backgroundColor: '#C084FC' },
                        ]}
                      />
                      <View
                        style={[
                          styles.confettiDot,
                          { top: 24, right: 24, backgroundColor: '#FDE047' },
                        ]}
                      />
                      <View
                        style={[
                          styles.confettiDot,
                          { bottom: 16, left: 28, backgroundColor: '#C084FC' },
                        ]}
                      />
                      <View
                        style={[
                          styles.confettiDot,
                          { bottom: 26, right: 24, backgroundColor: '#F472B6' },
                        ]}
                      />
                      <View
                        style={[
                          styles.confettiDot,
                          { bottom: 44, right: 32, backgroundColor: '#A78BFA' },
                        ]}
                      />
                    </Animated.View>
                  ) : (
                    /* Mystery Shimmer Vault Layer Under Scratch Foil (Hides Real Offer Until 100% Scratched) */
                    <LinearGradient
                      colors={['#FEF9C3', '#F3E8FF', '#EDE9FE']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.rewardPopupCard}
                    >
                      <View
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: 34,
                          backgroundColor: '#F3E8FF',
                          borderWidth: 2,
                          borderColor: '#C084FC',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 12,
                        }}
                      >
                        <Ionicons name="sparkles" size={32} color={PURPLE} />
                      </View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '800',
                          color: PURPLE,
                          textAlign: 'center',
                        }}
                      >
                        Keep Scratching...
                      </Text>
                      <Text
                        style={{
                          marginTop: 6,
                          fontSize: 12.5,
                          fontWeight: '600',
                          color: '#6B21A8',
                          textAlign: 'center',
                          paddingHorizontal: 14,
                        }}
                      >
                        Finish scratching the foil to reveal your secret Evegah
                        offer!
                      </Text>
                    </LinearGradient>
                  )}

                  {/* Interactive Scratch Foil Overlay if Not Yet Scratched */}
                  {!selectedCoupon.scratched ? (
                    <PopupScratchFoilOverlay
                      key={selectedCoupon.id}
                      theme={selectedCoupon.scratchTheme}
                      onComplete={() => handleScratchComplete(selectedCoupon.id)}
                    />
                  ) : null}
                </Animated.View>
              </Animated.View>

              {justRevealedId === selectedCoupon.id && selectedCoupon.scratched ? (
                <Animated.View
                  entering={FadeInDown.duration(280)}
                  style={styles.congratsBannerPill}
                >
                  <Ionicons name="trophy" size={15} color="#FDE047" />
                  <Text style={styles.congratsBannerText}>
                    Yay! You unlocked {selectedCoupon.code}
                  </Text>
                </Animated.View>
              ) : null}
            </View>
          ) : null}

          {/* Bottom Sheet: Prompt while scratching OR Full Coupon Details once scratched */}
          {selectedCoupon ? (
            selectedCoupon.scratched ? (
              <Animated.View
                entering={FadeInDown.duration(260)}
                style={[
                  styles.couponDetailsSheet,
                  { paddingBottom: Math.max(insets.bottom, 18) },
                ]}
              >
                <Text style={styles.couponDetailsHeading}>Coupon Details</Text>
                <View style={styles.couponDetailsDivider} />

                <Text style={styles.aboutBrandHeading}>
                  About {selectedCoupon.brand}
                </Text>
                <Text style={styles.aboutBrandBody}>{selectedCoupon.about}</Text>

                <View style={styles.codeCopyRow}>
                  <View style={styles.codeDashedBox}>
                    <Text style={styles.codeDashedText}>
                      {selectedCoupon.code}
                    </Text>
                  </View>

                  <Pressable
                    hitSlop={10}
                    onPress={() => handleCopyCode(selectedCoupon.code)}
                    style={styles.tapToCopyBtn}
                  >
                    <Text style={styles.tapToCopyText}>
                      {copiedCode === selectedCoupon.code
                        ? 'COPIED ✓'
                        : 'TAP TO COPY'}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.claimPurpleBtn}
                  onPress={() => {
                    handleCopyCode(selectedCoupon.code);
                    setSelectedCouponId(null);
                    setApplySheetOpen(true);
                  }}
                >
                  <Text style={styles.claimPurpleBtnText}>
                    Apply {selectedCoupon.code} on Evegah Ride
                  </Text>
                </Pressable>
              </Animated.View>
            ) : (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={[
                  styles.scratchPromptFooter,
                  { paddingBottom: Math.max(insets.bottom, 24) },
                ]}
              >
                <View style={styles.scratchPromptCard}>
                  <View style={styles.scratchPromptIconCircle}>
                    <Ionicons name="hand-left" size={20} color="#FDE047" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scratchPromptTitle}>
                      Scratch the card above!
                    </Text>
                    <Text style={styles.scratchPromptSub}>
                      Swipe your finger across the purple foil to reveal your Evegah ride reward.
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )
          ) : null}
        </View>
      </Modal>

      {/* Apply Coupon Offers Bottom Sheet Popup */}
      <Modal
        visible={applySheetOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setApplySheetOpen(false)}
      >
        <View style={styles.applyModalBackdrop}>
          <Pressable
            style={styles.applyBackdropTouch}
            onPress={() => setApplySheetOpen(false)}
          />

          <View style={styles.floatingCloseWrap}>
            <Pressable
              onPress={() => setApplySheetOpen(false)}
              style={styles.floatingCloseBtn}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <View
            style={[
              styles.applyOffersSheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <Text style={styles.applySheetMainTitle}>
              Offers at Evegah Mobility
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.applySheetScroll}
            >
              <View style={styles.applyOuterContainer}>
                <Text style={styles.applyGroupTitle}>Evegah Ride Coupons</Text>

                {APPLY_OFFERS.map((offer) => {
                  const isOpen = expandedOffers[offer.id] !== false;
                  return (
                    <View key={offer.id} style={styles.applyCouponCard}>
                      <Pressable
                        onPress={() => toggleExpandOffer(offer.id)}
                        style={styles.applyCouponHeader}
                      >
                        <View style={styles.purplePercentBadge}>
                          <Text style={styles.purplePercentSymbol}>%</Text>
                        </View>

                        <View style={styles.applyCouponHeaderCopy}>
                          <Text style={styles.applyCouponTitle}>
                            {offer.title}
                          </Text>
                          {offer.subtitle ? (
                            <Text style={styles.useCodeSub}>
                              {offer.subtitle}
                            </Text>
                          ) : null}
                          {offer.code ? (
                            <Pressable
                              onPress={() => handleCopyCode(offer.code)}
                              style={styles.inlineCodePill}
                            >
                              <Text style={styles.inlineCodePillText}>
                                {copiedCode === offer.code
                                  ? `${offer.code} ✓`
                                  : offer.code}
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>

                        <Ionicons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#6B7280"
                        />
                      </Pressable>

                      {isOpen ? (
                        <>
                          <View style={styles.applyCouponDashedDivider} />
                          <View style={styles.applyBulletsWrap}>
                            {offer.bullets.map((line, i) => (
                              <View key={i} style={styles.applyBulletRow}>
                                <View style={styles.purpleCheckCircle}>
                                  <Ionicons
                                    name="checkmark"
                                    size={11}
                                    color="#FFFFFF"
                                  />
                                </View>
                                <Text style={styles.applyBulletText}>
                                  {line}
                                </Text>
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
    backgroundColor: '#F6F5FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFF4',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
    letterSpacing: -0.2,
  },
  applyPopupTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  applyPopupTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionDividerRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionDividerTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#6E6878',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  cardShell: {
    width: CARD_W,
    height: 204,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE4F2',
    overflow: 'hidden',
    shadowColor: '#2A0B52',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  revealedCardTop: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  evegahBadgeMini: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  brandNameText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6E6878',
    textAlign: 'center',
  },
  couponTitleText: {
    marginTop: 3,
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: '800',
    color: '#18181B',
    textAlign: 'center',
  },
  codeMiniBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: '#F5EEFC',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C084FC',
  },
  codeMiniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: PURPLE,
    letterSpacing: 0.8,
  },
  dashedLine: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E0F0',
    marginHorizontal: 10,
  },
  viewDetailsRow: {
    height: 36,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  viewDetailsArrowCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scratchGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  scratchRay1: {
    position: 'absolute',
    width: 240,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    transform: [{ rotate: '-35deg' }],
  },
  scratchRay2: {
    position: 'absolute',
    width: 240,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '35deg' }],
  },
  sparkleChar: {
    position: 'absolute',
    color: 'rgba(253, 224, 71, 0.55)',
    fontSize: 12,
    fontWeight: '700',
  },
  giftCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  giftBowRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: -2,
  },
  giftBowLoop: {
    width: 14,
    height: 9,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: '#FACC15',
  },
  giftLid: {
    width: 48,
    height: 11,
    borderRadius: 3,
    backgroundColor: '#F472B6',
    alignItems: 'center',
  },
  giftRibbonVLid: {
    width: 9,
    height: '100%',
    backgroundColor: '#FACC15',
  },
  giftBoxBody: {
    width: 42,
    height: 32,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: '#DB2777',
    alignItems: 'center',
  },
  giftRibbonVBody: {
    width: 9,
    height: '100%',
    backgroundColor: '#EAB308',
  },
  chestWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  chestLid: {
    width: 68,
    height: 24,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: '#C084FC',
    borderWidth: 2,
    borderColor: '#FACC15',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chestStripeLeft: {
    width: 6,
    height: '100%',
    backgroundColor: '#FACC15',
  },
  chestStripeRight: {
    width: 6,
    height: '100%',
    backgroundColor: '#FACC15',
  },
  chestLock: {
    marginTop: -6,
    width: 16,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  chestKeyholeDot: {
    width: 4,
    height: 6,
    borderRadius: 2,
    backgroundColor: '#3B0764',
  },
  chestBase: {
    marginTop: -6,
    width: 68,
    height: 30,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#7E22CE',
    borderWidth: 2,
    borderColor: '#FACC15',
    padding: 4,
  },
  chestBaseInner: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: '#581C87',
  },
  tapToScratchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 99,
  },
  tapToScratchPillText: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '800',
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 7, 36, 0.86)',
    justifyContent: 'space-between',
  },
  sunburstContainer: {
    position: 'absolute',
    top: '14%',
    left: SCREEN_W / 2 - 220,
    width: 440,
    height: 440,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunburstRay: {
    position: 'absolute',
    width: 38,
    height: 440,
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
  },
  popupTopBar: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  popupStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.45)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  popupStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: 0.7,
  },
  popupCloseTopRight: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCenterStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  rewardPopupCardWrap: {
    width: POPUP_CARD_W,
    height: POPUP_CARD_H,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
    position: 'relative',
  },
  rewardPopupCard: {
    width: POPUP_CARD_W,
    height: POPUP_CARD_H,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#F3E8FF',
  },
  rewardPopupBrand: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#6E6878',
  },
  rewardPopupOffer: {
    marginTop: 6,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    color: '#18181B',
    textAlign: 'center',
  },
  rewardPopupCodePill: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F5EEFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: PURPLE,
  },
  rewardPopupCodePillText: {
    fontSize: 15,
    fontWeight: '900',
    color: PURPLE,
    letterSpacing: 1.6,
  },
  rewardPopupValid: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8496',
  },
  confettiDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  popupFoilOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: 'hidden',
    zIndex: 5,
  },
  foilTilesGrid: {
    width: POPUP_CARD_W,
    height: POPUP_CARD_H,
  },
  foilTileRow: {
    flexDirection: 'row',
    height: CELL_H,
  },
  foilTileCell: {
    width: CELL_W + 0.5,
    height: CELL_H + 0.5,
  },
  foilCenterDecor: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  foilShimmerBar: {
    position: 'absolute',
    width: 54,
    height: POPUP_CARD_H * 1.6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  foilGiftMedallion: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(253, 224, 71, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  foilMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  foilSubTitle: {
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  foilHandPrompt: {
    marginTop: 16,
  },
  foilCoinPrompt: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE047',
    borderWidth: 2,
    borderColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scratchCoinCursor: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(253, 224, 71, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scratchCoinInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FACC15',
    borderWidth: 2,
    borderColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foilProgressPill: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(18, 7, 36, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 99,
  },
  foilProgressText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FEF08A',
  },
  congratsBannerPill: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74, 22, 140, 0.85)',
    borderWidth: 1,
    borderColor: '#C084FC',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 99,
  },
  congratsBannerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scratchPromptFooter: {
    paddingHorizontal: 18,
  },
  scratchPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 20,
    padding: 16,
  },
  scratchPromptIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(253, 224, 71, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scratchPromptTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scratchPromptSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  couponDetailsSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  couponDetailsHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181B',
  },
  couponDetailsDivider: {
    height: 1,
    backgroundColor: '#F1EFF6',
    marginVertical: 12,
  },
  aboutBrandHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#27272A',
  },
  aboutBrandBody: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#6E6878',
  },
  codeCopyRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C084FC',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  codeDashedBox: {
    flex: 1,
  },
  codeDashedText: {
    fontSize: 17,
    fontWeight: '900',
    color: PURPLE,
    letterSpacing: 1.4,
  },
  tapToCopyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
  },
  tapToCopyText: {
    fontSize: 12,
    fontWeight: '800',
    color: PURPLE,
  },
  claimPurpleBtn: {
    marginTop: 16,
    height: 50,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimPurpleBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  applyModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 7, 36, 0.55)',
    justifyContent: 'flex-end',
  },
  applyBackdropTouch: {
    flex: 1,
  },
  floatingCloseWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  floatingCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E1B2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyOffersSheet: {
    maxHeight: '78%',
    backgroundColor: '#F6F5FA',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 20,
  },
  applySheetMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  applySheetScroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  applyOuterContainer: {
    gap: 12,
  },
  applyGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6E6878',
    marginBottom: 2,
  },
  applyCouponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE4F2',
  },
  applyCouponHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  purplePercentBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purplePercentSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  applyCouponHeaderCopy: {
    flex: 1,
  },
  applyCouponTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#18181B',
  },
  useCodeSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#6E6878',
  },
  inlineCodePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F5EEFC',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: PURPLE,
  },
  inlineCodePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: PURPLE,
    letterSpacing: 0.8,
  },
  applyCouponDashedDivider: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E0F0',
    marginVertical: 12,
  },
  applyBulletsWrap: {
    gap: 8,
  },
  applyBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  purpleCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBulletText: {
    flex: 1,
    fontSize: 12.5,
    color: '#52525B',
  },
});
