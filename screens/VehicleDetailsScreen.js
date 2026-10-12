import { useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const { width: SCREEN_W } = Dimensions.get('window');
const PRIMARY_BLUE = '#3729E8';
const STORY_VIDEO = require('../assets/home/vid1.mp4');

const EXTRA = {
  'Evegah Fly': {
    price: '₹149/day',
    monthly: '₹999/month',
    discount: '₹30 off applied, ends on 21st Oct',
    variant: 'LITE 1.2 LI-ION PEDAL-ASSIST',
    battery: '1.2 kWh',
    motor: '1000 W',
    charge: '4–5 hours',
    load: '150 kg',
    wheels: '12 inch',
    topImage: require('../assets/home/fly-top.png'),
    diagram: {
      flLabel: 'Front tyre life',
      flValue: '30k km',
      frLabel: 'Front carrier',
      frValue: '15 kg basket',
      rlLabel: 'Drive mode',
      rlValue: 'Pedal + EV',
      rrLabel: 'Rear tyre life',
      rrValue: '28k km',
      bottomLabel: 'Rear luggage rack & motor',
      bottomValue: '1000 W • Heavy duty',
    },
    popularFeatures: [
      { key: 'basket', label: 'Front Utility Basket', image: require('../assets/home/fly-top.png'), scale: 1.15, rotate: '0deg' },
      { key: 'pedals', label: 'Dual Pedal + Throttle', image: require('../assets/home/vehicle-fly.png'), scale: 1.18, rotate: '-2deg' },
      { key: 'rack', label: 'Rear Carrier Rack', image: require('../assets/home/vehicle-fly.png'), scale: 1.24, rotate: '3deg' },
    ],
    features: [
      { key: 'basket', label: 'Heavy-Duty Front\nWire Basket', icon: 'basket-outline' },
      { key: 'pedal', label: 'Pedal Assist +\nThumb Throttle', icon: 'bicycle-outline' },
      { key: 'saddle', label: 'Ergonomic Comfort\nSaddle Seat', icon: 'happy-outline' },
      { key: 'rack', label: 'Rear Steel\nCarrier Rack', icon: 'cube-outline' },
      { key: 'bell', label: 'Mechanical Bell\n& Horn', icon: 'notifications-outline' },
      { key: 'brakes', label: 'Dual Drum & Disc\nBraking', icon: 'shield-checkmark-outline' },
      { key: 'frame', label: 'Step-Through\nAlloy Frame', icon: 'construct-outline' },
      { key: 'battery', label: ' Swappable 1.2 kWh\nLi-Ion Pack', icon: 'battery-charging-outline' },
    ],
  },
  'Evegah Mink': {
    price: '₹199/day',
    monthly: '₹1,299/month',
    discount: '₹40 off applied, ends on 21st Oct',
    variant: 'SHARP 3.2 DCT ELECTRIC',
    battery: '3.2 kWh',
    motor: '3000 W',
    charge: '4–5 hours',
    load: '200 kg',
    wheels: '12 inch',
    topImage: require('../assets/home/mink-top.png'),
    diagram: {
      flLabel: 'Front tyre life',
      flValue: '35k km',
      frLabel: 'Headlamp unit',
      frValue: 'Halo Ring LED',
      rlLabel: 'Suspension',
      rlValue: 'Dual Hydraulic',
      rrLabel: 'Rear tyre life',
      rrValue: '32k km',
      bottomLabel: 'Hub motor & battery health',
      bottomValue: '3000 W • 98% SoH',
    },
    popularFeatures: [
      { key: 'halo', label: 'Halo Ring LED Lamp', image: require('../assets/home/mink-top.png'), scale: 1.15, rotate: '0deg' },
      { key: 'deck', label: 'Wide Flat Footboard', image: require('../assets/home/vehicle-mink.png'), scale: 1.2, rotate: '-3deg' },
      { key: 'shocks', label: 'Dual Coil Suspension', image: require('../assets/home/vehicle-mink.png'), scale: 1.25, rotate: '3deg' },
    ],
    features: [
      { key: 'halo', label: 'Halo Ring LED\nProjector Lamp', icon: 'sunny-outline' },
      { key: 'console', label: 'Smart Digital\nLCD Console', icon: 'speedometer-outline' },
      { key: 'deck', label: 'Wide Anti-Slip\nUtility Deck', icon: 'apps-outline' },
      { key: 'seat', label: 'Ergonomic Dual\nCushion Seat', icon: 'layers-outline' },
      { key: 'shocks', label: 'Dual Rear Coil\nSuspension', icon: 'options-outline' },
      { key: 'brakes', label: 'Front & Rear\nDisc Brakes', icon: 'shield-checkmark-outline' },
      { key: 'bluetooth', label: 'Bluetooth App\nSmart Unlock', icon: 'bluetooth-outline' },
      { key: 'usb', label: 'Fast USB Type-C\nCharging Port', icon: 'battery-charging-outline' },
    ],
  },
  'Evegah City': {
    price: '₹229/day',
    monthly: '₹1,499/month',
    discount: '₹50 off applied, ends on 21st Oct',
    variant: 'URBAN 2.5 SMART AUTOMATIC',
    battery: '2.3 kWh',
    motor: '2500 W',
    charge: '4–5 hours',
    load: '150 kg',
    wheels: '12 inch',
    topImage: require('../assets/home/city-top.png'),
    diagram: {
      flLabel: 'Front tyre life',
      flValue: '36k km',
      frLabel: 'Dual headlamps',
      frValue: 'Matrix V-LED',
      rlLabel: 'Comfort seat',
      rlValue: 'Contoured Foam',
      rrLabel: 'Rear tyre life',
      rrValue: '34k km',
      bottomLabel: 'Hub motor & range health',
      bottomValue: '2500 W • 90 km',
    },
    popularFeatures: [
      { key: 'vled', label: 'Dual Matrix V-LED', image: require('../assets/home/city-top.png'), scale: 1.15, rotate: '0deg' },
      { key: 'mirrors', label: 'Wide-Angle Mirrors', image: require('../assets/home/vehicle-city.png'), scale: 1.2, rotate: '-2deg' },
      { key: 'seat', label: 'Contoured Plush Seat', image: require('../assets/home/vehicle-city.png'), scale: 1.24, rotate: '3deg' },
    ],
    features: [
      { key: 'vled', label: 'Dual Matrix V-LED\nHeadlamps', icon: 'flashlight-outline' },
      { key: 'drl', label: 'Aero Handlebar\nLED DRLs', icon: 'sunny-outline' },
      { key: 'mirrors', label: 'Twin Wide-Angle\nSide Mirrors', icon: 'eye-outline' },
      { key: 'seat', label: 'Contoured Memory\nFoam Seat', icon: 'layers-outline' },
      { key: 'storage', label: '22L Under-Seat\nHelmet Boot', icon: 'briefcase-outline' },
      { key: 'brakes', label: 'Combined CBS\nDisc Brakes', icon: 'shield-checkmark-outline' },
      { key: 'keyless', label: 'Remote Keyless\nCentral Lock', icon: 'key-outline' },
      { key: 'usb', label: 'Fast USB Phone\nCharger', icon: 'battery-charging-outline' },
    ],
  },
  'Evegah Pro': {
    price: '₹279/day',
    monthly: '₹1,799/month',
    discount: '₹60 off applied, ends on 21st Oct',
    variant: 'PRO 2.5 DUAL-BATTERY MAX',
    battery: '2.5 kWh',
    motor: '2500 W',
    charge: '4–5 hours',
    load: '150 kg',
    wheels: '12 inch',
    topImage: require('../assets/home/pro-top.png'),
    diagram: {
      flLabel: 'Front tyre life',
      flValue: '28k km',
      frLabel: 'Folding stem',
      frValue: 'Quick-Lock Alloy',
      rlLabel: 'Standing deck',
      rlValue: 'Silicone Grip',
      rrLabel: 'Rear tyre life',
      rrValue: '26k km',
      bottomLabel: 'Rear disc & motor life',
      bottomValue: '2500 W • E-ABS',
    },
    popularFeatures: [
      { key: 'fold', label: 'Quick-Fold Alloy Stem', image: require('../assets/home/pro-top.png'), scale: 1.15, rotate: '0deg' },
      { key: 'deck', label: 'Silicone Grip Deck', image: require('../assets/home/vehicle-pro.png'), scale: 1.2, rotate: '-3deg' },
      { key: 'disc', label: 'E-ABS Rear Disc Brake', image: require('../assets/home/vehicle-pro.png'), scale: 1.24, rotate: '3deg' },
    ],
    features: [
      { key: 'stem', label: 'Foldable Aerospace\nAlloy Stem', icon: 'resize-outline' },
      { key: 'deck', label: 'Textured Silicone\nStanding Deck', icon: 'footsteps-outline' },
      { key: 'throttle', label: 'Precision Thumb\nThrottle Control', icon: 'speedometer-outline' },
      { key: 'brakes', label: 'E-ABS + Rear\nVentilated Disc', icon: 'shield-checkmark-outline' },
      { key: 'stand', label: 'Spring-Loaded\nSide Kickstand', icon: 'construct-outline' },
      { key: 'tail', label: 'High-Mount LED\nStop Reflector', icon: 'sunny-outline' },
      { key: 'cruise', label: 'Smart Cruise\nControl Mode', icon: 'navigate-outline' },
      { key: 'water', label: 'IP67 Waterproof\nBattery Deck', icon: 'water-outline' },
    ],
  },
};

const GALLERY_TABS = [
  { key: 'Exterior', label: 'Exterior', scale: 1, rotate: '0deg' },
  { key: 'Interior', label: 'Interior', scale: 1.25, rotate: '-4deg' },
  { key: 'Tyres', label: 'Tyres', scale: 1.45, rotate: '6deg' },
  { key: 'Features', label: 'Features', scale: 1.2, rotate: '3deg' },
  { key: 'Highlights', label: 'Highlights', scale: 1.05, rotate: '0deg', badge: true },
];

const SECTION_TABS = [
  { key: 'promise', label: 'Evegah promise' },
  { key: 'variant', label: 'Gallery' },
  { key: 'condition', label: 'Vehicle condition' },
  { key: 'features', label: 'Features' },
  { key: 'more', label: 'More rides' },
];

const BENTO_CATEGORIES = ['Exterior', 'Interior', 'Features', 'Tyres'];

const BENTO_VIEWS = {
  Exterior: {
    top: { label: 'Right Front Diagonal', scale: 1.04, rotate: '0deg' },
    bottomLeftTop: { label: 'Front', scale: 1.18, rotate: '-3deg' },
    bottomLeftBottom: { label: 'Right Side View', scale: 0.96, rotate: '2deg' },
    bottomRight: { label: 'Right Back Diagonal', scale: 1.26, rotate: '5deg' },
  },
  Interior: {
    top: { label: 'Top-Down Cockpit View', scale: 1.05, rotate: '0deg', useTop: true },
    bottomLeftTop: { label: 'Handlebar Controls', scale: 1.4, rotate: '4deg' },
    bottomLeftBottom: { label: 'Ergonomic Seat', scale: 1.15, rotate: '-4deg' },
    bottomRight: { label: 'Deck & Storage', scale: 1.28, rotate: '3deg' },
  },
  Features: {
    top: { label: 'Smart LED Headlamp', scale: 1.25, rotate: '2deg' },
    bottomLeftTop: { label: 'Keyless Start', scale: 1.35, rotate: '-3deg' },
    bottomLeftBottom: { label: 'USB Fast Charger', scale: 1.2, rotate: '0deg' },
    bottomRight: { label: 'Regenerative Braking', scale: 1.3, rotate: '-5deg' },
  },
  Tyres: {
    top: { label: 'Front Tubeless Tyre', scale: 1.48, rotate: '8deg' },
    bottomLeftTop: { label: 'Front Alloy Rim', scale: 1.4, rotate: '-6deg' },
    bottomLeftBottom: { label: 'Rear Tubeless Tyre', scale: 1.5, rotate: '4deg' },
    bottomRight: { label: 'Dual Disc Caliper', scale: 1.44, rotate: '-4deg' },
  },
};

const QUESTIONS = [
  {
    q: 'What do I need to reserve this ride?',
    a: 'A valid driving licence and completed Aadhaar KYC in the Evegah app.',
  },
  {
    q: 'How does charging work?',
    a: 'Plug into any standard 15A socket or swap at the nearest Evegah charging hub.',
  },
  {
    q: 'Is a helmet and insurance included?',
    a: 'Yes. Comprehensive ride cover and a sanitized helmet are included with every booking.',
  },
];

function VehicleStoryModal({ onClose }) {
  const insets = useSafeAreaInsets();
  const [muted, setMuted] = useState(false);
  const player = useVideoPlayer(STORY_VIDEO, (instance) => {
    instance.loop = true;
    instance.muted = false;
    instance.play();
  });

  return (
    <View style={styles.storyModalRoot}>
      <StatusBar style="light" />
      <View style={[styles.storyModalStage, { marginTop: insets.top + 12, marginBottom: Math.max(insets.bottom, 16) }]}>
        <VideoView
          player={player}
          style={styles.storyModalVideo}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
        <View style={styles.storyModalControls}>
          <Pressable
            style={styles.storyModalBtn}
            onPress={() => {
              const next = !muted;
              setMuted(next);
              player.muted = next;
            }}
          >
            <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.storyModalBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function VehicleDetailsScreen({ vehicle, onBack, onBook }) {
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeSectionTab, setActiveSectionTab] = useState('promise');
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [bentoTab, setBentoTab] = useState('Exterior');
  const [featureSpecMode, setFeatureSpecMode] = useState('Features');
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [askExpanded, setAskExpanded] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const mainScrollRef = useRef(null);
  const galleryRef = useRef(null);
  const sectionOffsets = useRef({
    promise: 0,
    variant: 480,
    condition: 1080,
    features: 1780,
    more: 2380,
  });

  const vehicleName = vehicle?.name || 'Evegah Mink';
  const vehicleImage = vehicle?.image || require('../assets/home/vehicle-mink.png');
  const extra = {
    ...(EXTRA[vehicleName] || EXTRA['Evegah Mink']),
    ...(vehicle?.battery ? { battery: vehicle.battery } : {}),
    ...(vehicle?.motor ? { motor: vehicle.motor } : {}),
    ...(vehicle?.charge ? { charge: vehicle.charge } : {}),
    ...(vehicle?.load ? { load: vehicle.load } : {}),
    ...(vehicle?.wheels ? { wheels: vehicle.wheels } : {}),
    ...(vehicle?.price ? { price: vehicle.price } : {}),
  };

  const specGridItems = [
    { key: 'motor', label: `Motor Power\n${extra.motor}`, icon: 'speedometer-outline' },
    { key: 'battery', label: `Battery Pack\n${extra.battery}`, icon: 'battery-full-outline' },
    { key: 'charge', label: `Charge Time\n${extra.charge}`, icon: 'flash-outline' },
    { key: 'wheels', label: `Wheel Size\n${extra.wheels}`, icon: 'disc-outline' },
    { key: 'load', label: `Load Capacity\n${extra.load}`, icon: 'barbell-outline' },
    { key: 'water', label: 'Water Rating\nIP67 Certified', icon: 'water-outline' },
  ];

  const selectCategory = (idx) => {
    setActiveTab(idx);
    galleryRef.current?.scrollTo({ x: idx * SCREEN_W, animated: true });
  };

  const handleSectionTabPress = (key) => {
    setActiveSectionTab(key);
    const targetY = sectionOffsets.current[key] ?? 0;
    mainScrollRef.current?.scrollTo({ y: Math.max(0, targetY - 56), animated: true });
  };

  const handleMainScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    setScrolledPastHero(y > 240);

    const offsets = sectionOffsets.current;
    if (y + 120 >= offsets.more) {
      setActiveSectionTab('more');
    } else if (y + 120 >= offsets.features) {
      setActiveSectionTab('features');
    } else if (y + 120 >= offsets.condition) {
      setActiveSectionTab('condition');
    } else if (y + 120 >= offsets.variant) {
      setActiveSectionTab('variant');
    } else {
      setActiveSectionTab('promise');
    }
  };

  const bentoConfig = BENTO_VIEWS[bentoTab] || BENTO_VIEWS.Exterior;
  const featureList = extra.features || EXTRA['Evegah Mink'].features;
  const visibleFeatures = showAllFeatures ? featureList : featureList.slice(0, 6);
  const diagram = extra.diagram || EXTRA['Evegah Mink'].diagram;
  const popularList = extra.popularFeatures || EXTRA['Evegah Mink'].popularFeatures;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.topHeaderContainer, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarRow}>
          <Pressable hitSlop={8} style={styles.roundBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color="#1C1C1C" />
          </Pressable>

          {scrolledPastHero ? (
            <View style={styles.compactHeaderTitleWrap}>
              <Text style={styles.compactHeaderTitle} numberOfLines={1}>
                2026 {vehicleName}
              </Text>
              <Text style={styles.compactHeaderPrice}>{extra.price}</Text>
            </View>
          ) : (
            <View style={styles.ownedStockPill}>
              <Text style={styles.ownedStockBrand}>Evegah</Text>
              <View style={styles.ownedStockDot}>
                <View style={styles.ownedStockHalf} />
              </View>
              <Text style={styles.ownedStockText}>wned stock</Text>
            </View>
          )}

          <Pressable
            hitSlop={8}
            style={styles.roundBtn}
            onPress={() => {
              Share.share({
                message: `Check out the 2026 ${vehicleName} (${extra.price}) on Evegah!`,
              }).catch(() => {});
            }}
          >
            <Ionicons name="arrow-redo-outline" size={20} color="#1C1C1C" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionNavRow}
        >
          {SECTION_TABS.map((tab) => {
            const active = activeSectionTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleSectionTabPress(tab.key)}
                style={styles.sectionNavBtn}
              >
                <Text style={[styles.sectionNavText, active && styles.sectionNavTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.sectionNavIndicator, active && styles.sectionNavIndicatorActive]} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleMainScroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View
          onLayout={(e) => {
            sectionOffsets.current.promise = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.heroWrap}>
            <View style={styles.heroPedestal} />

            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_W);
                setActiveTab(Math.max(0, Math.min(GALLERY_TABS.length - 1, page)));
              }}
            >
              {GALLERY_TABS.map((item) => (
                <View key={item.key} style={styles.heroSlide}>
                  <Animated.View entering={FadeIn.duration(480)}>
                    <Image
                      source={vehicleImage}
                      style={[
                        styles.heroImage,
                        { transform: [{ scale: item.scale }, { rotate: item.rotate }] },
                      ]}
                      contentFit="contain"
                    />
                  </Animated.View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.heroMetaRow}>
              <View style={styles.sellsFastPill}>
                <Text style={styles.sellsFastText}>Usually books in 3 mins</Text>
              </View>

              <View style={styles.dotsRow}>
                {GALLERY_TABS.map((item, idx) => (
                  <View
                    key={item.key}
                    style={[styles.dot, idx === activeTab && styles.dotActive]}
                  />
                ))}
              </View>

              <Pressable style={styles.storyRingBtn} onPress={() => setStoryOpen(true)}>
                <View style={styles.storyThumbInner}>
                  <Image
                    source={require('../assets/home/slider2_front.png')}
                    style={styles.storyThumbImg}
                    contentFit="cover"
                  />
                  <View style={styles.storyPlayOverlay}>
                    <Ionicons name="play" size={16} color="#FFFFFF" />
                  </View>
                </View>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbRow}
            >
              {GALLERY_TABS.map((item, idx) => {
                const active = idx === activeTab;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => selectCategory(idx)}
                    style={[styles.thumbCard, active && styles.thumbCardActive]}
                  >
                    <View style={styles.thumbImgBox}>
                      <Image
                        source={vehicleImage}
                        style={[
                          styles.thumbImg,
                          { transform: [{ scale: item.scale }, { rotate: item.rotate }] },
                        ]}
                        contentFit="contain"
                      />
                      {item.badge ? (
                        <View style={styles.thumbStarBadge}>
                          <Ionicons name="star" size={11} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.thumbLabel, active && styles.thumbLabelActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Animated.View entering={cardEnter(0)} style={styles.mainSheet}>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text style={styles.vehicleHeading}>2026 {vehicleName.toUpperCase()}</Text>
                <Text style={styles.vehicleVariant}>{extra.variant}</Text>
              </View>
              <Pressable
                hitSlop={10}
                style={styles.wishlistBtn}
                onPress={() => setSaved((v) => !v)}
              >
                <Ionicons
                  name={saved ? 'heart' : 'heart-outline'}
                  size={24}
                  color={saved ? '#E11D48' : '#11141C'}
                />
              </Pressable>
            </View>

            <View style={styles.breadcrumbsRow}>
              <Text style={styles.breadcrumbItem}>{vehicle?.range || '70-90 km'}</Text>
              <Text style={styles.breadcrumbSep}>|</Text>
              <Text style={styles.breadcrumbItem}>Electric</Text>
              <Text style={styles.breadcrumbSep}>|</Text>
              <Text style={styles.breadcrumbItem}>Automatic</Text>
              <Text style={styles.breadcrumbSep}>|</Text>
              <Text style={styles.breadcrumbItem}>GJ06</Text>
            </View>

            <View style={styles.dashedDivider} />

            <View style={styles.discountPill}>
              <Text style={styles.discountPillText}>{extra.discount}</Text>
            </View>

            <View style={styles.priceMainRow}>
              <Text style={styles.priceMainText}>{extra.price}</Text>
              <View style={styles.allInclusiveWrap}>
                <Text style={styles.allInclusiveText}>(all inclusive)</Text>
                <Ionicons name="information-circle-outline" size={15} color={PRIMARY_BLUE} />
              </View>
            </View>

            <View style={styles.emiRow}>
              <View style={styles.emiUnderline}>
                <Text style={styles.emiPriceText}>{extra.monthly}</Text>
              </View>
              <Text style={styles.breadcrumbSep}>|</Text>
              <Text style={styles.emiSubText}>Easy plans available</Text>
            </View>

            <View style={styles.assuranceBox}>
              <View style={styles.assuranceLeft}>
                <View style={styles.assuranceItem}>
                  <Ionicons name="checkmark-circle" size={17} color="#179C48" />
                  <Text style={styles.assuranceText}>With BMS, Geo-Fence & Many More </Text>
                </View>
                <View style={styles.assuranceItem}>
                  <Ionicons name="checkmark-circle" size={17} color="#179C48" />
                  <Text style={styles.assuranceText}>Great savings vs petrol scooter</Text>
                </View>
                <View style={styles.assuranceItem}>
                  <Ionicons name="checkmark-circle" size={17} color="#179C48" />
                  <Text style={styles.assuranceText}>Best price vs</Text>
                  <View style={styles.competitorDots}>
                    <View style={[styles.compCircle, { backgroundColor: '#E11D48', marginLeft: 0 }]}>
                      <Ionicons name="pricetag" size={8} color="#FFFFFF" />
                    </View>
                    <View style={[styles.compCircle, { backgroundColor: '#2563EB' }]}>
                      <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                    </View>
                    <View style={[styles.compCircle, { backgroundColor: '#F59E0B' }]}>
                      <Ionicons name="flash" size={8} color="#11141C" />
                    </View>
                    <View style={[styles.compCircle, { backgroundColor: '#111827' }]}>
                      <Ionicons name="star" size={8} color="#F59E0B" />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.festBadge}>
                <Text style={styles.festBadgeLine1}>Fest</Text>
                <Text style={styles.festBadgeLine2}>Forward</Text>
                <Text style={styles.festBadgeLine3}>Days</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* SECTION: Gallery Bento (Variant Info - Screenshot 3) */}
        <View
          style={styles.cardSection}
          onLayout={(e) => {
            sectionOffsets.current.variant = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.cardSectionHeading}>Gallery</Text>

          <View style={styles.segmentedBar4}>
            {BENTO_CATEGORIES.map((tab) => {
              const active = bentoTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setBentoTab(tab)}
                  style={[styles.segmentPill4, active && styles.segmentPillActive]}
                >
                  <Text style={[styles.segmentPillText, active && styles.segmentPillTextActive]}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.bentoContainer}>
            {/* Top full-width tile */}
            <View style={styles.bentoTopTile}>
              <View style={styles.bentoFloorRingLarge} />
              <Image
                source={vehicleImage}
                style={[
                  styles.bentoTopImg,
                  {
                    transform: [
                      { scale: bentoConfig.top.scale },
                      { rotate: bentoConfig.top.rotate },
                    ],
                  },
                ]}
                contentFit="contain"
              />
              <View style={styles.bentoLabelPill}>
                <Text style={styles.bentoLabelText}>{bentoConfig.top.label}</Text>
              </View>
            </View>

            {/* Bottom 2-column grid */}
            <View style={styles.bentoBottomRow}>
              <View style={styles.bentoLeftCol}>
                <View style={styles.bentoSmallTile}>
                  <View style={styles.bentoFloorRingSmall} />
                  <Image
                    source={vehicleImage}
                    style={[
                      styles.bentoSmallImg,
                      {
                        transform: [
                          { scale: bentoConfig.bottomLeftTop.scale },
                          { rotate: bentoConfig.bottomLeftTop.rotate },
                        ],
                      },
                    ]}
                    contentFit="contain"
                  />
                  <View style={styles.bentoLabelPill}>
                    <Text style={styles.bentoLabelText}>{bentoConfig.bottomLeftTop.label}</Text>
                  </View>
                </View>

                <View style={styles.bentoSmallTile}>
                  <View style={styles.bentoFloorRingSmall} />
                  <Image
                    source={vehicleImage}
                    style={[
                      styles.bentoSmallImg,
                      {
                        transform: [
                          { scale: bentoConfig.bottomLeftBottom.scale },
                          { rotate: bentoConfig.bottomLeftBottom.rotate },
                        ],
                      },
                    ]}
                    contentFit="contain"
                  />
                  <View style={styles.bentoLabelPill}>
                    <Text style={styles.bentoLabelText}>{bentoConfig.bottomLeftBottom.label}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.bentoRightCol}>
                <View style={styles.bentoFloorRingTall} />
                <Image
                  source={vehicleImage}
                  style={[
                    styles.bentoTallImg,
                    {
                      transform: [
                        { scale: bentoConfig.bottomRight.scale },
                        { rotate: bentoConfig.bottomRight.rotate },
                      ],
                    },
                  ]}
                  contentFit="contain"
                />
                <View style={styles.bentoLabelPill}>
                  <Text style={styles.bentoLabelText}>{bentoConfig.bottomRight.label}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION: Key highlights (Car condition - Screenshot 2) */}
        <View
          style={styles.cardSection}
          onLayout={(e) => {
            sectionOffsets.current.condition = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.cardSectionHeading}>Key highlights</Text>

          <View style={styles.inspectionCard}>
            <View style={styles.inspectionLeft}>
              <Text style={styles.inspectionCountTitle}>1457 parts checked</Text>
              <Text style={styles.inspectionCountSub}>by 3 automotive experts</Text>

              <View style={styles.inspectionDashedLine} />

              <View style={styles.inspectionCheckList}>
                <View style={styles.inspectionCheckRow}>
                  <Ionicons name="checkmark-circle" size={17} color="#179C48" />
                  <Text style={styles.inspectionCheckText}>Ready to drive</Text>
                </View>
                <View style={styles.inspectionCheckRow}>
                  <Ionicons name="checkmark-circle" size={17} color="#179C48" />
                  <Text style={styles.inspectionCheckText}>Maintainance Checklist Passed</Text>
                </View>
                <View style={styles.inspectionCheckRow}>
                  <Ionicons name="checkmark-circle" size={17} color="#179C48" />
                  <Text style={styles.inspectionCheckText}>Get after-rent support</Text>
                </View>
              </View>
            </View>

            <View style={styles.sealBadgeOuter}>
              <View style={styles.sealBadgeGoldRing}>
                <Text style={styles.sealTopBrand}>Evegah</Text>
                <Text style={styles.sealBottomSub}>INSPECTION</Text>
              </View>
              <View style={styles.sealRibbon}>
                <Text style={styles.sealRibbonText}>300 POINT</Text>
              </View>
            </View>
          </View>

          {/* Tyre Life & Top-Down Vehicle Diagram Card */}
          <View style={styles.tyreDiagramCard}>
            <View style={styles.tyreStripHeader}>
              <Text style={styles.tyreStripTitle}>Front</Text>
            </View>

            <View style={styles.tyreDiagramBody}>
              <View style={styles.tyreMainGrid}>
                {/* Left Callouts */}
                <View style={styles.tyreSideColLeft}>
                  <View style={styles.tyreCalloutBlockLeft}>
                    <View style={styles.tyreCalloutTextLeft}>
                      <Text style={styles.tyreCalloutLabel}>{diagram.flLabel}</Text>
                      <Text style={styles.tyreCalloutValue}>{diagram.flValue}</Text>
                    </View>
                    <View style={styles.calloutLineLeft}>
                      <View style={styles.calloutLineBar} />
                      <View style={styles.calloutLineDot} />
                    </View>
                  </View>

                  <View style={styles.tyreCalloutBlockLeft}>
                    <View style={styles.tyreCalloutTextLeft}>
                      <Text style={styles.tyreCalloutLabel}>{diagram.rlLabel}</Text>
                      <Text style={styles.tyreCalloutValue}>{diagram.rlValue}</Text>
                    </View>
                    <View style={styles.calloutLineLeft}>
                      <View style={styles.calloutLineBar} />
                      <View style={styles.calloutLineDot} />
                    </View>
                  </View>
                </View>

                {/* Center Top-Down Vehicle Graphic (mink-top, city-top, pro-top, fly-top) */}
                <View style={styles.topDownCarWrap}>
                  <View style={[styles.greenTyreArc, styles.tyreFL]} />
                  <View style={[styles.greenTyreArc, styles.tyreFR]} />
                  <View style={[styles.greenTyreArc, styles.tyreRL]} />
                  <View style={[styles.greenTyreArc, styles.tyreRR]} />

                  <Image
                    source={extra.topImage}
                    style={styles.frontVehicleDiagramImg}
                    contentFit="contain"
                  />
                </View>

                {/* Right Callouts */}
                <View style={styles.tyreSideColRight}>
                  <View style={styles.tyreCalloutBlockRight}>
                    <View style={styles.calloutLineRight}>
                      <View style={styles.calloutLineDot} />
                      <View style={styles.calloutLineBar} />
                    </View>
                    <View style={styles.tyreCalloutTextRight}>
                      <Text style={styles.tyreCalloutLabel}>{diagram.frLabel}</Text>
                      <Text style={styles.tyreCalloutValue}>{diagram.frValue}</Text>
                    </View>
                  </View>

                  <View style={styles.tyreCalloutBlockRight}>
                    <View style={styles.calloutLineRight}>
                      <View style={styles.calloutLineDot} />
                      <View style={styles.calloutLineBar} />
                    </View>
                    <View style={styles.tyreCalloutTextRight}>
                      <Text style={styles.tyreCalloutLabel}>{diagram.rrLabel}</Text>
                      <Text style={styles.tyreCalloutValue}>{diagram.rrValue}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Bottom Center Callout */}
              <View style={styles.spareCalloutWrap}>
                <View style={styles.calloutLineDot} />
                <View style={styles.spareVerticalLine} />
                <Text style={styles.tyreCalloutLabel}>{diagram.bottomLabel}</Text>
                <Text style={styles.tyreCalloutValueCenter}>{diagram.bottomValue}</Text>
              </View>
            </View>

            <View style={styles.tyreStripFooter}>
              <Text style={styles.tyreStripTitle}>Rear</Text>
            </View>
          </View>

          <Pressable style={styles.lavenderActionBtn} onPress={onBook}>
            <Text style={styles.lavenderActionText}>View inspection report</Text>
          </Pressable>
        </View>

        {/* SECTION: Features and specs (Screenshot 1) */}
        <View
          style={styles.cardSection}
          onLayout={(e) => {
            sectionOffsets.current.features = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.cardSectionHeading}>Features and specs</Text>
          <Text style={styles.popularFeaturesSub}>Popular features</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularFeaturesScroll}
          >
            {popularList.map((feat) => (
              <View key={feat.key} style={styles.popularFeatureCard}>
                <View style={styles.popularFeaturePedestal} />
                <Image
                  source={feat.image || vehicleImage}
                  style={[
                    styles.popularFeatureImg,
                    { transform: [{ scale: feat.scale || 1.15 }, { rotate: feat.rotate || '0deg' }] },
                  ]}
                  contentFit="contain"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(12, 16, 28, 0.35)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.popularFeaturePill}>
                  <Text style={styles.popularFeaturePillText}>{feat.label}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* 2-tab segmented toggle: Features | Specs */}
          <View style={styles.segmentedBar2}>
            {['Features', 'Specs'].map((mode) => {
              const active = featureSpecMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setFeatureSpecMode(mode)}
                  style={[styles.segmentPill2, active && styles.segmentPillActive]}
                >
                  <Text style={[styles.segmentPillText, active && styles.segmentPillTextActive]}>
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 2-column grid of icon + label */}
          <View style={styles.featureTwoColGrid}>
            {(featureSpecMode === 'Features' ? visibleFeatures : specGridItems).map((item) => (
              <View key={item.key} style={styles.featureGridCell}>
                <View style={styles.featureIconSquare}>
                  <Ionicons name={item.icon} size={19} color={PRIMARY_BLUE} />
                </View>
                <Text style={styles.featureCellLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.lavenderActionBtn}
            onPress={() => setShowAllFeatures((prev) => !prev)}
          >
            <Text style={styles.lavenderActionText}>
              {showAllFeatures ? 'Show fewer features & specs' : 'View all features & specs'}
            </Text>
          </Pressable>
        </View>

        {/* SECTION: Reserve Vehicle & FAQ (Bottom of Screenshot 1) */}
        <View
          style={styles.cardSection}
          onLayout={(e) => {
            sectionOffsets.current.more = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.cardSectionHeading}>Reserve {vehicleName}</Text>
          <Text style={styles.reserveSubText}>
            100% refundable reservation • Instant hub pickup or doorstep delivery
          </Text>

          <View style={styles.faqCard}>
            {QUESTIONS.map((item, index) => {
              const open = openFaq === index;
              return (
                <Pressable
                  key={item.q}
                  onPress={() => setOpenFaq(open ? -1 : index)}
                  style={[styles.faqRow, index === QUESTIONS.length - 1 && styles.faqRowLast]}
                >
                  <View style={styles.faqHead}>
                    <Text style={styles.faqQ}>{item.q}</Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#8A8496" />
                  </View>
                  {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Sparkle / "Ask me anything" FAB */}
      <Pressable
        style={[styles.sparkleFabWrap, { bottom: Math.max(insets.bottom, 12) + 74 }]}
        onPress={() => setAskExpanded((prev) => !prev)}
      >
        <LinearGradient
          colors={['#885BF4', '#632CE6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.sparkleFabGradient, askExpanded && styles.sparkleFabExpanded]}
        >
          <Ionicons name="sparkles-sharp" size={20} color="#FFFFFF" />
          {askExpanded ? (
            <Text style={styles.askMeAnythingText}>Ask me anything</Text>
          ) : null}
        </LinearGradient>
      </Pressable>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.callSquareBtn}>
          <Ionicons name="call" size={20} color={PRIMARY_BLUE} />
        </Pressable>

        <Pressable style={styles.reserveBtn} onPress={onBook}>
          <Text style={styles.reserveBtnText}>Reserve EV</Text>
        </Pressable>

        <Pressable style={styles.testDriveBtn} onPress={onBook}>
          <Text style={styles.testDriveBtnText}>Test drive</Text>
        </Pressable>
      </View>

      <Modal
        visible={storyOpen}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setStoryOpen(false)}
      >
        {storyOpen ? <VehicleStoryModal onClose={() => setStoryOpen(false)} /> : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F4F9',
  },
  topHeaderContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E9F2',
    zIndex: 10,
  },
  topBarRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F5F9',
    borderWidth: 1,
    borderColor: '#E5E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactHeaderTitleWrap: {
    flex: 1,
  },
  compactHeaderTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#11141C',
  },
  compactHeaderPrice: {
    marginTop: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#636978',
  },
  ownedStockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DDD8F8',
    backgroundColor: '#F9F8FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  ownedStockBrand: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PRIMARY_BLUE,
    marginRight: 4,
  },
  ownedStockDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: PRIMARY_BLUE,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  ownedStockHalf: {
    width: '50%',
    height: '100%',
    backgroundColor: PRIMARY_BLUE,
  },
  ownedStockText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PRIMARY_BLUE,
    marginLeft: 1,
  },
  sectionNavRow: {
    paddingHorizontal: 12,
    gap: 6,
  },
  sectionNavBtn: {
    paddingHorizontal: 10,
    paddingTop: 4,
    alignItems: 'center',
  },
  sectionNavText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C6475',
    paddingBottom: 9,
  },
  sectionNavTextActive: {
    color: PRIMARY_BLUE,
    fontWeight: '700',
  },
  sectionNavIndicator: {
    height: 3,
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: 'transparent',
  },
  sectionNavIndicatorActive: {
    backgroundColor: PRIMARY_BLUE,
  },
  heroWrap: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  heroPedestal: {
    position: 'absolute',
    top: 108,
    left: -40,
    right: -40,
    height: 150,
    borderRadius: 200,
    backgroundColor: '#F2F3FC',
  },
  heroSlide: {
    width: SCREEN_W,
    height: 224,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: SCREEN_W * 0.78,
    height: 204,
  },
  heroMetaRow: {
    marginTop: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sellsFastPill: {
    backgroundColor: '#FFF1EE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sellsFastText: {
    color: '#C84B31',
    fontSize: 11.5,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingBottom: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D0D5E0',
  },
  dotActive: {
    width: 14,
    backgroundColor: '#11141C',
  },
  storyRingBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: '#6E2EEB',
    padding: 2.5,
    backgroundColor: '#FFFFFF',
    marginTop: -28,
  },
  storyThumbInner: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#D6DEE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyThumbImg: {
    width: '100%',
    height: '100%',
  },
  storyPlayOverlay: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 20, 28, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  thumbCard: {
    width: 82,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#ECEEF3',
    padding: 3,
    overflow: 'hidden',
  },
  thumbCardActive: {
    borderColor: PRIMARY_BLUE,
  },
  thumbImgBox: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    backgroundColor: '#EEF0F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImg: {
    width: 64,
    height: 44,
  },
  thumbStarBadge: {
    position: 'absolute',
    right: 4,
    top: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4F35F0',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#525866',
    textAlign: 'center',
    paddingVertical: 5,
  },
  thumbLabelActive: {
    color: PRIMARY_BLUE,
    fontWeight: '700',
  },
  mainSheet: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 22,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCopy: {
    flex: 1,
  },
  vehicleHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#11141C',
    letterSpacing: 0.2,
  },
  vehicleVariant: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: '#636978',
    letterSpacing: 0.2,
  },
  wishlistBtn: {
    paddingTop: 2,
  },
  breadcrumbsRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  breadcrumbItem: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#5A6070',
  },
  breadcrumbSep: {
    fontSize: 13,
    color: '#D5D8E0',
  },
  dashedDivider: {
    marginTop: 16,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E7EF',
  },
  discountPill: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#129A43',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  discountPillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  priceMainRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceMainText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#11141C',
  },
  allInclusiveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allInclusiveText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY_BLUE,
  },
  emiRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emiUnderline: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9AA0AC',
    paddingBottom: 1,
  },
  emiPriceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C313D',
  },
  emiSubText: {
    fontSize: 13.5,
    color: '#636978',
    fontWeight: '500',
  },
  assuranceBox: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFE8CE',
    backgroundColor: '#F2FBF6',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  assuranceLeft: {
    flex: 1,
    gap: 9,
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assuranceText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#46505D',
  },
  competitorDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  compCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  festBadge: {
    backgroundColor: '#5B0E14',
    borderWidth: 1.5,
    borderColor: '#E3B252',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  festBadgeLine1: {
    color: '#FFD97D',
    fontSize: 11,
    fontWeight: '800',
  },
  festBadgeLine2: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    marginTop: -2,
  },
  festBadgeLine3: {
    color: '#FFD97D',
    fontSize: 10,
    fontWeight: '800',
    marginTop: -2,
  },
  cardSection: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  cardSectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#11141C',
  },
  segmentedBar4: {
    marginTop: 14,
    backgroundColor: '#EEF1F7',
    borderRadius: 28,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentPill4: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedBar2: {
    marginTop: 18,
    backgroundColor: '#EEF1F7',
    borderRadius: 28,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentPill2: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#4B5262',
  },
  segmentPillTextActive: {
    color: '#11141C',
    fontWeight: '700',
  },
  bentoContainer: {
    marginTop: 14,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  bentoTopTile: {
    width: '100%',
    height: 215,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bentoFloorRingLarge: {
    position: 'absolute',
    bottom: -26,
    width: '92%',
    height: 110,
    borderRadius: 200,
    backgroundColor: '#DDE0E6',
    borderWidth: 1.5,
    borderColor: '#C5C9D2',
  },
  bentoTopImg: {
    width: '78%',
    height: 180,
  },
  bentoBottomRow: {
    marginTop: 4,
    flexDirection: 'row',
    height: 248,
    gap: 4,
  },
  bentoLeftCol: {
    flex: 1,
    gap: 4,
  },
  bentoSmallTile: {
    flex: 1,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bentoFloorRingSmall: {
    position: 'absolute',
    bottom: -18,
    width: '94%',
    height: 60,
    borderRadius: 100,
    backgroundColor: '#DDE0E6',
    borderWidth: 1,
    borderColor: '#C5C9D2',
  },
  bentoSmallImg: {
    width: '82%',
    height: 92,
  },
  bentoRightCol: {
    flex: 1,
    backgroundColor: '#ECEEF2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bentoFloorRingTall: {
    position: 'absolute',
    bottom: -24,
    width: '96%',
    height: 96,
    borderRadius: 120,
    backgroundColor: '#DDE0E6',
    borderWidth: 1,
    borderColor: '#C5C9D2',
  },
  bentoTallImg: {
    width: '88%',
    height: 170,
  },
  bentoLabelPill: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(18, 23, 38, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  bentoLabelText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  inspectionCard: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E8F2',
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inspectionLeft: {
    flex: 1,
    paddingRight: 10,
  },
  inspectionCountTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PRIMARY_BLUE,
  },
  inspectionCountSub: {
    marginTop: 3,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#11141C',
  },
  inspectionDashedLine: {
    marginVertical: 12,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E8F2',
  },
  inspectionCheckList: {
    gap: 9,
  },
  inspectionCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspectionCheckText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#2B303C',
  },
  sealBadgeOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#371BC8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25108E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  sealBadgeGoldRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1.5,
    borderColor: '#E8B94F',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  sealTopBrand: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  sealBottomSub: {
    color: '#F5D076',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sealRibbon: {
    position: 'absolute',
    width: 102,
    backgroundColor: '#2B11A8',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#E8B94F',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
  },
  sealRibbonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tyreDiagramCard: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  tyreStripHeader: {
    backgroundColor: '#F6F7FB',
    paddingVertical: 11,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F6',
  },
  tyreStripFooter: {
    backgroundColor: '#F6F7FB',
    paddingVertical: 11,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEF0F6',
  },
  tyreStripTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#11141C',
  },
  tyreDiagramBody: {
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tyreMainGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  tyreSideColLeft: {
    flex: 1,
    height: 168,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  tyreSideColRight: {
    flex: 1,
    height: 168,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  tyreCalloutBlockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  tyreCalloutBlockRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  tyreCalloutTextLeft: {
    alignItems: 'flex-end',
  },
  tyreCalloutTextRight: {
    alignItems: 'flex-start',
  },
  tyreCalloutLabel: {
    fontSize: 11.5,
    color: '#6E7585',
    fontWeight: '500',
  },
  tyreCalloutValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#11141C',
  },
  tyreCalloutValueCenter: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#11141C',
    textAlign: 'center',
  },
  calloutLineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutLineRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutLineBar: {
    width: 18,
    height: 1.5,
    backgroundColor: '#C5C2F2',
  },
  calloutLineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: PRIMARY_BLUE,
  },
  topDownCarWrap: {
    width: 122,
    height: 204,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  greenTyreArc: {
    position: 'absolute',
    width: 5,
    height: 34,
    borderRadius: 3,
    backgroundColor: '#1EA853',
    zIndex: 2,
  },
  tyreFL: {
    left: 8,
    top: 22,
  },
  tyreFR: {
    right: 8,
    top: 22,
  },
  tyreRL: {
    left: 8,
    bottom: 22,
  },
  tyreRR: {
    right: 8,
    bottom: 22,
  },
  frontVehicleDiagramImg: {
    width: 108,
    height: 196,
  },
  spareCalloutWrap: {
    marginTop: 8,
    alignItems: 'center',
  },
  spareVerticalLine: {
    width: 1.5,
    height: 18,
    backgroundColor: '#C5C2F2',
    marginBottom: 4,
  },
  lavenderActionBtn: {
    marginTop: 16,
    backgroundColor: '#F3F4FE',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lavenderActionText: {
    color: PRIMARY_BLUE,
    fontSize: 15,
    fontWeight: '700',
  },
  popularFeaturesSub: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#222734',
  },
  popularFeaturesScroll: {
    paddingTop: 12,
    gap: 12,
  },
  popularFeatureCard: {
    width: 192,
    height: 126,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ECEEF3',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  popularFeaturePedestal: {
    position: 'absolute',
    bottom: -18,
    width: '94%',
    height: 62,
    borderRadius: 100,
    backgroundColor: '#DDE0E8',
    borderWidth: 1,
    borderColor: '#C6CBD6',
  },
  popularFeatureImg: {
    width: '82%',
    height: 104,
  },
  popularFeaturePill: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(18, 23, 38, 0.9)',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  popularFeaturePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  featureTwoColGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 18,
    justifyContent: 'space-between',
  },
  featureGridCell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F2F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCellLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: '#1C202B',
  },
  reserveSubText: {
    marginTop: 6,
    marginBottom: 14,
    fontSize: 13,
    color: '#636978',
  },
  faqCard: {
    backgroundColor: '#F8F9FC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ECEEF4',
  },
  faqRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF4',
  },
  faqRowLast: {
    borderBottomWidth: 0,
  },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqQ: {
    flex: 1,
    color: '#11141C',
    fontSize: 14,
    fontWeight: '600',
  },
  faqA: {
    marginTop: 8,
    color: '#636978',
    fontSize: 13,
    lineHeight: 19,
  },
  sparkleFabWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 9,
  },
  sparkleFabGradient: {
    height: 54,
    minWidth: 54,
    borderRadius: 27,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2E147A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  sparkleFabExpanded: {
    paddingHorizontal: 20,
  },
  askMeAnythingText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECEEF3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  callSquareBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PRIMARY_BLUE,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveBtnText: {
    color: PRIMARY_BLUE,
    fontSize: 15,
    fontWeight: '700',
  },
  testDriveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: PRIMARY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testDriveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  storyModalRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storyModalStage: {
    flex: 1,
    position: 'relative',
  },
  storyModalVideo: {
    width: '100%',
    height: '100%',
  },
  storyModalControls: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    gap: 12,
  },
  storyModalBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(110, 110, 118, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
