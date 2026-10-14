import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const { width: SCREEN_W } = Dimensions.get('window');

const PURPLE_DARK = '#240646';
const PURPLE_PRIMARY = '#4A168C';
const PURPLE_ACCENT = '#6B21A8';
const PURPLE_SOFT = '#F6F1FC';

const EVEGAH_LOGO = require('../assets/login/evegah-logo.png');
const FLEET_PARTNERS_IMG = require('../assets/home/fleet-partners.png');

const HERO_STORY_PHOTO =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&auto=format&fit=crop&q=85';

const SQUAD_PHOTO =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=85';

const CULTURE_SLIDES = [
  {
    id: 'culture-1',
    uri: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&auto=format&fit=crop&q=85',
    caption: 'Team Evegah at our Vadodara EV Innovation Hub',
  },
  {
    id: 'culture-2',
    uri: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&auto=format&fit=crop&q=85',
    caption: 'Collaborating on zero-emission smart fleet operations',
  },
  {
    id: 'culture-3',
    uri: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&auto=format&fit=crop&q=85',
    caption: 'Celebrating 2.6 Lakh+ rides across Gujarat & India',
  },
];

const VALUES_LIST = [
  {
    id: 'quality',
    icon: 'ribbon-outline',
    badgeIcon: 'checkmark-seal',
    title: 'Quality',
    body: 'Every Evegah electric scooter undergoes a 50-point smart diagnostics & battery health inspection before hitting the zone — ensuring a smooth, safe, and worry-free ride every single time.',
  },
  {
    id: 'transparency',
    icon: 'Analytics-outline',
    title: 'Transparency & Accountability',
    body: 'From upfront per-minute and rental package pricing to real-time BMS battery range and live zone tracking, we keep every ride 100% transparent with zero hidden charges.',
  },
  {
    id: 'personalized',
    icon: 'sparkles-outline',
    title: 'Personalized Experience',
    body: 'Whether you are a daily college commuter, corporate rider, tourist at Atal Sarovar, or last-mile delivery partner, Evegah tailors plans and doorstep Flexi pickup & drop around your life.',
  },
];

const PARTNER_CARDS = [
  {
    id: 'delivery-1',
    topBadge: 'zomato',
    topColor: '#E23744',
    topSub: 'LAST-MILE DELIVERY PARTNER',
    bottomBadge: 'bigbasket',
    bottomColor: '#689F38',
    bottomSub: 'A TATA Enterprise · EV Grocery Fleet',
  },
  {
    id: 'delivery-2',
    topBadge: 'zepto',
    topColor: '#4A168C',
    topSub: '10-MINUTE QUICK COMMERCE FLEET',
    bottomBadge: 'SPEED FORCE EV',
    bottomColor: '#1D4ED8',
    bottomSub: 'Make Smart Choice · Service Partner',
  },
  {
    id: 'gov-startup',
    topBadge: '#startupindia',
    topColor: '#EA580C',
    topSub: 'DPIIT Recognized Clean Mobility Startup',
    bottomBadge: 'SHOONYA',
    bottomColor: '#0284C7',
    bottomSub: 'Zero Pollution Mobility Campaign',
  },
  {
    id: 'campus-partners',
    topBadge: 'SIGMA UNIVERSITY',
    topColor: '#3B0764',
    topSub: 'Vadodara Campus Green Mobility Partner',
    bottomBadge: 'KPGU VADODARA',
    bottomColor: '#B91C1C',
    bottomSub: 'Drs. Kiran & Pallavi Patel Global University',
  },
  {
    id: 'tourism-civic',
    topBadge: 'DAMAN MUNICIPAL COUNCIL',
    topColor: '#0369A1',
    topSub: 'Smart City Public EV Mobility Partner',
    bottomBadge: 'ATAL SAROVAR & AATAPI',
    bottomColor: '#15803D',
    bottomSub: 'Eco-Tourism & Riverfront EV Zones',
  },
  {
    id: 'hyperlocal-partners',
    topBadge: 'XERO · TRAVEL BY PIGU',
    topColor: '#1E293B',
    topSub: 'Smart Commute & Urban Transit Partner',
    bottomBadge: 'BADAL BASKET',
    bottomColor: '#D97706',
    bottomSub: 'Hyperlocal EV Delivery Ecosystem',
  },
];

const MEDIA_CARDS = [
  {
    id: 'fe',
    outlet: 'Financial Express',
    headline: 'How Evegah is electrifying urban micro-mobility and last-mile delivery across Gujarat',
    uri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=700&auto=format&fit=crop&q=80',
  },
  {
    id: 'db',
    outlet: 'Dainik Bhaskar',
    headline: 'Evegah expands smart EV scooter zones across Vadodara, Ahmedabad, Rajkot & Daman',
    uri: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=700&auto=format&fit=crop&q=80',
  },
  {
    id: 'afaqs',
    outlet: 'AFAQS',
    headline: 'Young commuters & delivery partners switch to Evegah zero-emission electric scooters',
    uri: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=700&auto=format&fit=crop&q=80',
  },
  {
    id: 'et',
    outlet: 'Economic Times',
    headline: 'Clean mobility startup Evegah powers green campus & tourism fleets with IoT-enabled EVs',
    uri: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=700&auto=format&fit=crop&q=80',
  },
];

const SOLID_STATS = [
  {
    id: 'rating',
    value: '4.8/5',
    subtitle: "is Evegah's average review rating across Play Store, App Store & Google",
    mascotIcon: 'diamond',
  },
  {
    id: 'riders',
    value: '2.6L+',
    subtitle: 'happy riders & delivery partners powered by Evegah electric scooters',
    mascotIcon: 'flash',
  },
  {
    id: 'zones',
    value: '25+',
    subtitle: 'smart EV pickup & battery swap zones operating 24×7 across cities',
    mascotIcon: 'location',
  },
];

const FOOTER_LINKS_LEFT = [
  'Evegah Assured',
  'Who we are',
  'Evegah Pro',
  'Blog - Green Drive',
  "FAQ's",
  'How it Works',
];

const FOOTER_LINKS_RIGHT = [
  'Fleet Inspection',
  'Careers',
  'Customer Reviews',
  'Zone Locator',
  'Sell / Partner Fleet',
  'Terms & Conditions',
];

function ValueIllustration({ type }) {
  if (type === 'quality') {
    return (
      <View style={styles.valueArtBox}>
        <View style={styles.valueArtCircle}>
          <Ionicons name="ribbon" size={28} color={PURPLE_PRIMARY} />
          <View style={styles.valueGoldDot}>
            <Ionicons name="star" size={11} color="#FFFFFF" />
          </View>
        </View>
      </View>
    );
  }
  if (type === 'transparency') {
    return (
      <View style={styles.valueArtBox}>
        <View style={styles.valueArtCircle}>
          <Ionicons name="bar-chart" size={26} color={PURPLE_PRIMARY} />
          <View style={styles.valueGoldDot}>
            <Ionicons name="search" size={11} color="#FFFFFF" />
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.valueArtBox}>
      <View style={styles.valueArtCircle}>
        <Ionicons name="bicycle" size={28} color={PURPLE_PRIMARY} />
        <View style={styles.valueGoldDot}>
          <Ionicons name="sparkles" size={11} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}

export default function AboutScreen({ onBack, onExplore }) {
  const insets = useSafeAreaInsets();
  const [cultureIdx, setCultureIdx] = useState(0);
  const cultureScrollRef = useRef(null);
  const cultureCardW = SCREEN_W - 36;

  useEffect(() => {
    const timer = setInterval(() => {
      setCultureIdx((prev) => {
        const next = (prev + 1) % CULTURE_SLIDES.length;
        cultureScrollRef.current?.scrollTo({
          x: next * cultureCardW,
          animated: true,
        });
        return next;
      });
    }, 3600);
    return () => clearInterval(timer);
  }, [cultureCardW]);

  const handleCallSupport = () => {
    Linking.openURL('tel:7277277275').catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Navigation Header with Evegah Logo */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={12} onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1E1035" />
        </Pressable>

        <Text style={styles.topHeaderTitle}>About Evegah</Text>

        <View style={styles.headerLogoPill}>
          <Image
            source={EVEGAH_LOGO}
            style={styles.headerLogoImg}
            contentFit="contain"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Customer Story Card (Matches video4.mp4 opening section) */}
        <Animated.View entering={cardEnter(0)} style={styles.heroStorySection}>
          <View style={styles.heroImageFrame}>
            <Image
              source={{ uri: HERO_STORY_PHOTO }}
              style={styles.heroImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(36, 6, 70, 0.55)']}
              style={styles.heroImageGradient}
            />
            <View style={styles.heroLogoWatermark}>
              <Image
                source={EVEGAH_LOGO}
                style={styles.heroWatermarkImg}
                contentFit="contain"
              />
            </View>
          </View>

          <Text style={styles.heroStoryTitle}>
            2 Lakh+ happy riders, here&apos;s what one has to say
          </Text>

          <Text style={styles.heroStoryQuote}>
            &ldquo;Evegah represents reliability and complete peace of mind for my
            daily commute. From instant QR unlocking to well-maintained electric
            scooters and doorstep Flexi delivery, the team goes above and beyond
            to make sustainable city travel effortless.&rdquo;
          </Text>

          <Text style={styles.heroStoryAuthor}>
            Neha Singh, Assistant Manager, Vadodara
          </Text>

          <Pressable
            onPress={onExplore}
            style={({ pressed }) => [
              styles.loveStoriesLinkRow,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={styles.loveStoriesLinkText}>
              See Evegah love stories
            </Text>
            <Ionicons name="chevron-forward" size={16} color={PURPLE_PRIMARY} />
          </Pressable>
        </Animated.View>

        <View style={styles.sectionDivider} />

        {/* 2. What's important to us (Matches video4.mp4 3-pillar layout) */}
        <Animated.View entering={cardEnter(1)} style={styles.sectionWrap}>
          <Text style={styles.sectionMainHeading}>
            What&apos;s important to us
          </Text>

          {VALUES_LIST.map((item) => (
            <View key={item.id} style={styles.valueBlock}>
              <ValueIllustration type={item.id} />
              <Text style={styles.valueTitle}>{item.title}</Text>
              <Text style={styles.valueBody}>{item.body}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={styles.sectionDivider} />

        {/* 3. Squad Evegah Section (Matches video4.mp4 Squad Spinny section) */}
        <Animated.View entering={cardEnter(2)} style={styles.sectionWrap}>
          <View style={styles.squadPhotoWrap}>
            <Image
              source={{ uri: SQUAD_PHOTO }}
              style={styles.squadPhoto}
              contentFit="cover"
            />
          </View>

          <Text style={styles.sectionMainHeading}>Squad Evegah</Text>

          <Text style={styles.squadParagraph}>
            Looking to change India&apos;s urban commute for the better,
            Evegah&apos;s leadership and engineering squad came together in 2021
            to build a smarter, cleaner, and rider-first electric mobility
            ecosystem.
          </Text>

          <Text style={[styles.squadParagraph, { marginTop: 14 }]}>
            Eight-plus cities and 2.6 Lakh+ riders later, Evegah continues to
            empower daily commuters, students, and last-mile delivery partners
            with zero-emission electric scooters and intelligent battery-swapping
            infrastructure.
          </Text>
        </Animated.View>

        <View style={styles.sectionDivider} />

        {/* 4. Culture Carousel Section (Matches video4.mp4 Culture section with 3 bars) */}
        <Animated.View entering={cardEnter(3)} style={styles.sectionWrap}>
          <ScrollView
            ref={cultureScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / cultureCardW
              );
              setCultureIdx(
                Math.max(0, Math.min(CULTURE_SLIDES.length - 1, idx))
              );
            }}
            style={[styles.cultureCarousel, { width: cultureCardW }]}
          >
            {CULTURE_SLIDES.map((slide) => (
              <View
                key={slide.id}
                style={[styles.cultureSlideFrame, { width: cultureCardW }]}
              >
                <Image
                  source={{ uri: slide.uri }}
                  style={styles.cultureSlideImg}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(20, 6, 42, 0.72)']}
                  style={styles.cultureCaptionGrad}
                >
                  <Text style={styles.cultureCaptionText}>{slide.caption}</Text>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>

          {/* 3 Dash Indicator Bars (Matches video4.mp4) */}
          <View style={styles.cultureDashRow}>
            {CULTURE_SLIDES.map((s, i) => (
              <View
                key={s.id}
                style={[
                  styles.cultureDash,
                  i === cultureIdx && styles.cultureDashActive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.sectionMainHeading}>Culture</Text>

          <Text style={styles.squadParagraph}>
            We pride ourselves in prioritizing our riders and partners to deliver
            an unmatched EV mobility experience. In our endeavour to challenge
            convention and electrify every street, we remain rooted in fairness,
            sustainability, and transparency.
          </Text>

          <Pressable
            onPress={onExplore}
            style={({ pressed }) => [
              styles.loveStoriesLinkRow,
              { marginTop: 14 },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={styles.loveStoriesLinkText}>
              Explore careers at Evegah
            </Text>
            <Ionicons name="chevron-forward" size={16} color={PURPLE_PRIMARY} />
          </Pressable>
        </Animated.View>

        {/* 5. Our Fleet & Delivery Partners Section (Soft Purple Tint + Uploaded Banner + Cards) */}
        <Animated.View entering={cardEnter(4)} style={styles.partnersSection}>
          <Text style={styles.sectionMainHeading}>
            Our Fleet &amp; Delivery Partners
          </Text>
          <Text style={styles.partnersSubtext}>
            Trusted by India&apos;s leading quick-commerce platforms, smart
            cities, universities, and eco-tourism hubs
          </Text>

          {/* Uploaded Official Fleet & Delivery Partners Logo Banner */}
          <View style={styles.fleetBannerCard}>
            <Image
              source={FLEET_PARTNERS_IMG}
              style={styles.fleetBannerImage}
              contentFit="contain"
            />
          </View>

          {/* Horizontal Stacked Partner Cards (Matches video4.mp4 Backers card carousel) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.partnerCardsScroll}
          >
            {PARTNER_CARDS.map((card) => (
              <View key={card.id} style={styles.partnerDualCard}>
                <View style={styles.partnerHalf}>
                  <Text
                    style={[styles.partnerBrandText, { color: card.topColor }]}
                    numberOfLines={1}
                  >
                    {card.topBadge}
                  </Text>
                  <Text style={styles.partnerRoleSub} numberOfLines={2}>
                    {card.topSub}
                  </Text>
                </View>

                <View style={styles.partnerCardDivider} />

                <View style={styles.partnerHalf}>
                  <Text
                    style={[
                      styles.partnerBrandText,
                      { color: card.bottomColor },
                    ]}
                    numberOfLines={1}
                  >
                    {card.bottomBadge}
                  </Text>
                  <Text style={styles.partnerRoleSub} numberOfLines={2}>
                    {card.bottomSub}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* 6. Media Coverage Carousel (Matches video4.mp4 square image cards with bottom title) */}
        <Animated.View entering={cardEnter(5)} style={styles.sectionWrap}>
          <Text style={styles.sectionMainHeading}>Media Coverage</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mediaScrollContent}
          >
            {MEDIA_CARDS.map((media) => (
              <Pressable key={media.id} style={styles.mediaCard}>
                <Image
                  source={{ uri: media.uri }}
                  style={styles.mediaCardImg}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={[
                    'rgba(22, 6, 44, 0.08)',
                    'rgba(22, 6, 44, 0.55)',
                    'rgba(22, 6, 44, 0.94)',
                  ]}
                  style={styles.mediaCardOverlay}
                >
                  <Text style={styles.mediaCardHeadline} numberOfLines={2}>
                    {media.headline}
                  </Text>
                  <View style={styles.mediaOutletRow}>
                    <Text style={styles.mediaOutletName}>{media.outlet}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* 7. Solid Evegah Stats (Matches video4.mp4 "Solid Spinny Stats" purple card carousel) */}
        <Animated.View entering={cardEnter(6)} style={styles.sectionWrap}>
          <Text style={styles.sectionMainHeading}>Solid Evegah Stats</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScrollContent}
          >
            {SOLID_STATS.map((stat) => (
              <View key={stat.id} style={styles.solidStatCard}>
                <View style={styles.solidStatCopy}>
                  <Text style={styles.solidStatValue}>{stat.value}</Text>
                  <Text style={styles.solidStatSub}>{stat.subtitle}</Text>
                </View>

                {/* 3D Mascot Emblem on Bottom-Right */}
                <LinearGradient
                  colors={['#A855F7', '#6B21A8', '#3B0764']}
                  style={styles.solidStatMascot}
                >
                  <Ionicons name={stat.mascotIcon} size={30} color="#FDE68A" />
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* 8. Deep Purple Evegah Brand Footer (Matches video4.mp4 bottom footer + Evegah logo) */}
        <LinearGradient
          colors={['#2E0E56', '#210740', '#16032E']}
          style={[
            styles.footerContainer,
            { paddingBottom: Math.max(insets.bottom + 24, 38) },
          ]}
        >
          {/* Footer Top Row: Evegah Logo + Phone Pill */}
          <View style={styles.footerTopRow}>
            <View style={styles.footerBrandWrap}>
              <View style={styles.footerLogoBadge}>
                <Image
                  source={EVEGAH_LOGO}
                  style={styles.footerLogoImg}
                  contentFit="contain"
                />
              </View>
              <View>
                <Text style={styles.footerBrandName}>evegah</Text>
                <Text style={styles.footerBrandTagline}>
                  Smart Electric Mobility
                </Text>
              </View>
            </View>

            <Pressable onPress={handleCallSupport} style={styles.footerCallBtn}>
              <Ionicons name="call" size={14} color="#FFFFFF" />
              <Text style={styles.footerCallText}>727-727-7275</Text>
            </Pressable>
          </View>

          {/* Footer Description Paragraph */}
          <Text style={styles.footerDesc}>
            Evegah is India&apos;s trusted full-stack electric scooter rental and
            last-mile fleet mobility platform. Our mission is to make urban
            commuting and hyperlocal deliveries 100% electric, affordable, and
            hassle-free.
          </Text>

          {/* Social Media Icons Row */}
          <View style={styles.footerSocialRow}>
            {['logo-instagram', 'logo-linkedin', 'logo-facebook', 'logo-twitter'].map(
              (iconName) => (
                <Pressable key={iconName} style={styles.footerSocialBtn}>
                  <Ionicons name={iconName} size={17} color="#FFFFFF" />
                </Pressable>
              )
            )}
          </View>

          {/* Two-Column ABOUT Links (Matches video4.mp4) */}
          <Text style={styles.footerHeading}>ABOUT</Text>

          <View style={styles.footerLinksGrid}>
            <View style={styles.footerLinksCol}>
              {FOOTER_LINKS_LEFT.map((link) => (
                <Pressable key={link} style={styles.footerLinkItem}>
                  <Text style={styles.footerLinkText}>{link}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.footerLinksCol}>
              {FOOTER_LINKS_RIGHT.map((link) => (
                <Pressable key={link} style={styles.footerLinkItem}>
                  <Text style={styles.footerLinkText}>{link}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.footerBottomDivider} />

          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} Evegah Mobility Pvt. Ltd. All rights
            reserved.
          </Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1ECF8',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PURPLE_DARK,
    letterSpacing: -0.2,
  },
  headerLogoPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F6F1FC',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  headerLogoImg: {
    width: 66,
    height: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  heroStorySection: {
    paddingHorizontal: 18,
    paddingBottom: 22,
  },
  heroImageFrame: {
    width: '100%',
    height: 215,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EDE9FE',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroLogoWatermark: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  heroWatermarkImg: {
    width: 64,
    height: 20,
  },
  heroStoryTitle: {
    marginTop: 18,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
    color: PURPLE_DARK,
    letterSpacing: -0.3,
  },
  heroStoryQuote: {
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 21,
    color: '#3F3356',
    fontWeight: '400',
  },
  heroStoryAuthor: {
    marginTop: 10,
    fontSize: 12.5,
    color: '#7C6F94',
    fontWeight: '600',
  },
  loveStoriesLinkRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  loveStoriesLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: PURPLE_PRIMARY,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#EFEAF6',
    marginHorizontal: 18,
  },
  sectionWrap: {
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  sectionMainHeading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: PURPLE_DARK,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  valueBlock: {
    marginTop: 18,
  },
  valueArtBox: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  valueArtCircle: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  valueGoldDot: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  valueTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PURPLE_DARK,
    marginBottom: 6,
  },
  valueBody: {
    fontSize: 13.5,
    lineHeight: 21,
    color: '#4B3E63',
  },
  squadPhotoWrap: {
    width: '100%',
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#EDE9FE',
  },
  squadPhoto: {
    width: '100%',
    height: '100%',
  },
  squadParagraph: {
    fontSize: 13.5,
    lineHeight: 21,
    color: '#3F3356',
  },
  cultureCarousel: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cultureSlideFrame: {
    height: 205,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EDE9FE',
  },
  cultureSlideImg: {
    width: '100%',
    height: '100%',
  },
  cultureCaptionGrad: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cultureCaptionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cultureDashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 18,
  },
  cultureDash: {
    width: 18,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#D8B4FE',
  },
  cultureDashActive: {
    width: 28,
    backgroundColor: PURPLE_PRIMARY,
  },
  partnersSection: {
    backgroundColor: PURPLE_SOFT,
    paddingVertical: 26,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EADFF8',
  },
  partnersSubtext: {
    marginTop: -8,
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 19,
    color: '#5B4B73',
  },
  fleetBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5D5F8',
    shadowColor: '#2E0E56',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  fleetBannerImage: {
    width: '100%',
    height: 125,
  },
  partnerCardsScroll: {
    gap: 12,
    paddingRight: 8,
  },
  partnerDualCard: {
    width: 215,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E9DDF7',
    justifyContent: 'space-between',
  },
  partnerHalf: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  partnerBrandText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  partnerRoleSub: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: '#6B5E82',
    textAlign: 'center',
    fontWeight: '500',
  },
  partnerCardDivider: {
    height: 1,
    backgroundColor: '#F1ECF8',
    marginVertical: 10,
  },
  mediaScrollContent: {
    gap: 14,
    paddingRight: 18,
  },
  mediaCard: {
    width: 245,
    height: 245,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#240646',
    position: 'relative',
  },
  mediaCardImg: {
    width: '100%',
    height: '100%',
  },
  mediaCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 16,
  },
  mediaCardHeadline: {
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '500',
    marginBottom: 8,
  },
  mediaOutletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mediaOutletName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsScrollContent: {
    gap: 14,
    paddingRight: 18,
  },
  solidStatCard: {
    width: 255,
    minHeight: 148,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E2CEF8',
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  solidStatCopy: {
    paddingRight: 44,
  },
  solidStatValue: {
    fontSize: 28,
    fontWeight: '900',
    color: PURPLE_PRIMARY,
    letterSpacing: -0.5,
  },
  solidStatSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: PURPLE_DARK,
    fontWeight: '500',
  },
  solidStatMascot: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  footerContainer: {
    marginTop: 10,
    paddingTop: 28,
    paddingHorizontal: 20,
  },
  footerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerLogoBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  footerLogoImg: {
    width: 68,
    height: 24,
  },
  footerBrandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  footerBrandTagline: {
    fontSize: 11,
    color: '#D8B4FE',
    fontWeight: '500',
  },
  footerCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PURPLE_ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  footerCallText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerDesc: {
    marginTop: 18,
    fontSize: 12.5,
    lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  footerSocialRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  footerSocialBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHeading: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  footerLinksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLinksCol: {
    flex: 1,
    gap: 10,
  },
  footerLinkItem: {
    paddingVertical: 2,
  },
  footerLinkText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  footerBottomDivider: {
    marginTop: 24,
    marginBottom: 14,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  footerCopyright: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
