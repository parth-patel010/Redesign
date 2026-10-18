import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet, apiPost, last10 } from '../services/api';

const { width: SCREEN_W } = Dimensions.get('window');
const PURPLE = '#4A168C';
const PURPLE_DARK = '#25084A';
const PURPLE_MID = '#6B21A8';
const DEFAULT_REFERRAL_CODE = 'EVEGAH200';

const TEA_IMG = require('../assets/profile/tea.png');
const COFFEE_IMG = require('../assets/profile/coffee.png');

const TREATS = [
  {
    id: 'tea',
    phrase: 'cup of tea',
    phraseColor: '#FDE68A',
  },
  {
    id: 'coffee',
    phrase: 'cup of coffee',
    phraseColor: '#FDE68A',
  },
];

const HOW_IT_WORKS = [
  {
    id: 'step1',
    type: 'invite',
    text: 'Share your personalised Evegah referral code with your friends',
  },
  {
    id: 'step2',
    type: 'gift',
    text: 'Your friend gets a ₹200 Evegah gift coupon on their first EV ride',
  },
  {
    id: 'step3',
    type: 'coupon',
    text: 'After they complete their first ride, you also get a ₹200 gift coupon',
  },
];

const FAQS = [
  {
    id: 'faq1',
    q: 'What will I get by referring a friend?',
    a: 'Every time an invited friend completes their first Evegah ride using your referral code, you receive a ₹200 gift coupon in your Evegah account.',
  },
  {
    id: 'faq2',
    q: 'Can I earn rewards for referring multiple friends?',
    a: 'Yes! You can refer as many friends as you like and earn a ₹200 reward voucher for every friend who completes their first qualifying ride.',
  },
  {
    id: 'faq3',
    q: 'What does my friend get when I refer them?',
    a: 'Your friend gets a special welcome invite with a ₹200 gift coupon unlocked on their very first Evegah electric scooter ride.',
  },
];

function TreatArt({ type }) {
  if (type === 'tea') {
    return (
      <View style={styles.treatStage}>
        <Image
          source={TEA_IMG}
          style={styles.treatPhotoTea}
          contentFit="contain"
        />
      </View>
    );
  }

  return (
    <View style={styles.treatStage}>
      <Image
        source={COFFEE_IMG}
        style={styles.treatPhotoCoffee}
        contentFit="contain"
      />
    </View>
  );
}

function StepBadgeIcon({ type }) {
  if (type === 'invite') {
    return (
      <View style={[styles.stepIconCircle, { backgroundColor: '#F3E8FF' }]}>
        <Ionicons name="paper-plane" size={20} color={PURPLE} />
      </View>
    );
  }
  if (type === 'gift') {
    return (
      <View style={[styles.stepIconCircle, { backgroundColor: '#FAE8FF' }]}>
        <Ionicons name="gift" size={22} color="#9333EA" />
      </View>
    );
  }
  return (
    <View style={[styles.stepIconCircle, { backgroundColor: '#EDE9FE' }]}>
      <Ionicons name="pricetag" size={20} color="#5B21B6" />
    </View>
  );
}

export default function ReferScreen({ onBack, phone, name }) {
  const insets = useSafeAreaInsets();
  const [treatIdx, setTreatIdx] = useState(0);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [referralCode, setReferralCode] = useState(DEFAULT_REFERRAL_CODE);
  const [friendsJoined, setFriendsJoined] = useState('12');
  const [totalEarned, setTotalEarned] = useState('₹2,400');
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const scrollY = useSharedValue(0);
  const wordAnim = useSharedValue(1);
  const propAnim = useSharedValue(1);
  const float3d = useSharedValue(0);

  useEffect(() => {
    float3d.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [float3d]);

  useEffect(() => {
    const mobile = last10?.(phone);
    if (!mobile) return;
    apiGet(
      `/referral?mobile=${encodeURIComponent(mobile)}&name=${encodeURIComponent(
        name || 'Rider'
      )}`
    )
      .then((body) => {
        const data = body?.data;
        if (data?.referralCode) {
          setReferralCode(String(data.referralCode).toUpperCase());
        }
        if (data?.friendsJoined != null) {
          setFriendsJoined(String(data.friendsJoined));
        }
        if (data?.totalEarned != null) {
          setTotalEarned(`₹${data.totalEarned}`);
        }
      })
      .catch(() => {});
  }, [phone, name]);

  useEffect(() => {
    const interval = setInterval(() => {
      wordAnim.value = withSequence(
        withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })
      );
      propAnim.value = withSequence(
        withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 420, easing: Easing.out(Easing.back(1.2)) })
      );
      setTimeout(() => {
        setTreatIdx((prev) => (prev + 1) % TREATS.length);
      }, 210);
    }, 3000);

    return () => clearInterval(interval);
  }, [propAnim, wordAnim]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [120, 185], [0, 1], 'clamp');
    const translateY = interpolate(scrollY.value, [120, 185], [-12, 0], 'clamp');
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const phraseAnimStyle = useAnimatedStyle(() => ({
    opacity: wordAnim.value,
    transform: [
      { translateY: interpolate(wordAnim.value, [0, 1], [18, 0]) },
    ],
  }));

  const treatPropAnimStyle = useAnimatedStyle(() => ({
    opacity: propAnim.value,
    transform: [
      { translateX: interpolate(propAnim.value, [0, 1], [36, 0]) },
      { translateY: interpolate(propAnim.value, [0, 1], [-12, 0]) },
      { rotate: `${interpolate(propAnim.value, [0, 1], [12, 0])}deg` },
      { scale: interpolate(propAnim.value, [0, 1], [0.85, 1]) },
    ],
  }));

  const scooterFloatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float3d.value, [0, 1], [0, -6]) },
      { rotateZ: `${interpolate(float3d.value, [0, 1], [-1.5, 1.5])}deg` },
    ],
  }));

  const currentTreat = TREATS[treatIdx];

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleShareReferral = () => {
    Share.share({
      message: `Hey! Join me on Evegah with a ${currentTreat.phrase}! Use my referral code ${referralCode} and get a ₹200 gift coupon on your first EV ride!`,
    }).catch(() => {});
  };

  const handleRedeem = async () => {
    const mobile = last10?.(phone);
    if (!mobile) {
      Alert.alert('Notice', 'Please login to redeem referral rewards.');
      return;
    }
    setRedeeming(true);
    try {
      const res = await apiPost('/referral/redeem', { mobile });
      if (res?.error) {
        Alert.alert('Redeem', res.error);
      } else {
        Alert.alert('Success 🎉', res?.message || 'Referral bonus successfully credited to your wallet balance!');
        apiGet(
          `/referral?mobile=${encodeURIComponent(mobile)}&name=${encodeURIComponent(
            name || 'Rider'
          )}`
        )
          .then((body) => {
            const data = body?.data;
            if (data?.friendsJoined != null) setFriendsJoined(String(data.friendsJoined));
            if (data?.totalEarned != null) setTotalEarned(`₹${data.totalEarned}`);
          })
          .catch(() => {});
      }
    } catch (err) {
      Alert.alert('Redeem', err?.message || 'Unable to redeem referral bonus right now.');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Sticky White Header on Scroll */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.stickyHeader,
          { paddingTop: insets.top + 8 },
          stickyHeaderStyle,
        ]}
      >
        <Pressable hitSlop={10} onPress={onBack} style={styles.stickyBackBtn}>
          <Ionicons name="arrow-back" size={20} color="#1C1C1E" />
        </Pressable>
        <Text style={styles.stickyHeaderTitle}>Refer a friend</Text>
        <View style={{ width: 38 }} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}
      >
        {/* Evegah Purple Hero Section + Upgraded Refer Card */}
        <LinearGradient
          colors={[PURPLE_DARK, PURPLE, PURPLE_MID, '#A855F7', '#F3E8FF', '#FFFFFF']}
          locations={[0, 0.25, 0.48, 0.68, 0.88, 1]}
          style={[styles.heroGradient, { paddingTop: insets.top + 10 }]}
        >
          <View style={styles.heroGlowRay1} pointerEvents="none" />
          <View style={styles.heroGlowRay2} pointerEvents="none" />

          {/* Top Bar */}
          <View style={styles.heroTopBar}>
            <Pressable hitSlop={10} onPress={onBack} style={styles.heroBackCircle}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.heroTopTitle}>Refer a friend</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Animated Headline + Real Tea / Coffee PNG from assets/profile/ */}
          <View style={styles.heroBannerRow}>
            <View style={styles.heroHeadlineWrap}>
              <Text style={styles.heroHeadlineText}>Invite your friends</Text>
              <Text style={styles.heroHeadlineText}>to Evegah with a</Text>
              <View style={styles.phraseSlotClip}>
                <Animated.Text
                  style={[
                    styles.heroHeadlineHighlight,
                    { color: currentTreat.phraseColor },
                    phraseAnimStyle,
                  ]}
                >
                  {currentTreat.phrase}
                </Animated.Text>
              </View>

              <Text style={styles.heroSubline}>...and get a gift in return!</Text>
            </View>

            <Animated.View
              pointerEvents="none"
              style={[styles.heroTreatFloating, treatPropAnimStyle]}
            >
              <TreatArt type={currentTreat.id} />
            </Animated.View>
          </View>

          {/* Upgraded Modern Evegah Refer Card UI */}
          <View style={styles.referCardOuter}>
            <View style={styles.referCardBaseLedge} />

            <View style={styles.referCardShell}>
              {/* Top Royal Purple 3D Showcase Banner */}
              <LinearGradient
                colors={['#1E063B', '#3B0F70', '#581C87']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.referShowcaseHeader}
              >
                <View style={styles.referShowcaseOrb} />

                <View style={styles.referShowcaseLeft}>
                  <View style={styles.referClubPill}>
                    <Ionicons name="sparkles" size={11} color="#FDE047" />
                    <Text style={styles.referClubPillText}>EVEGAH REFER CLUB</Text>
                  </View>

                  <Text style={styles.referShowcaseTitle}>
                    Give ₹200,{'\n'}Get ₹200
                  </Text>
                  <Text style={styles.referShowcaseSub}>
                    Both you & your friend unlock ₹200 ride credits!
                  </Text>
                </View>

                <Animated.View style={[styles.referShowcaseRight, scooterFloatStyle]}>
                  <View style={styles.floatingCoinBadgeTop}>
                    <Text style={styles.floatingCoinText}>+₹200</Text>
                  </View>
                  <Image
                    source={require('../assets/home/vehicle-mink.png')}
                    style={styles.referScooterImg}
                    contentFit="contain"
                  />
                  <View style={styles.scooterGlowBase} />
                </Animated.View>
              </LinearGradient>

              {/* Quick Referral Stats Strip */}
              <View style={styles.referStatsBar}>
                <View style={styles.referStatCol}>
                  <Text style={styles.referStatVal}>{totalEarned}</Text>
                  <Text style={styles.referStatLbl}>Total Earned</Text>
                </View>
                <View style={styles.referStatDivider} />
                <View style={styles.referStatCol}>
                  <Text style={styles.referStatVal}>{friendsJoined}</Text>
                  <Text style={styles.referStatLbl}>Friends Joined</Text>
                </View>
                <View style={styles.referStatDivider} />
                <View style={styles.referStatCol}>
                  <Text style={styles.referStatVal}>₹200</Text>
                  <Text style={styles.referStatLbl}>Per Referral</Text>
                </View>
              </View>

              {/* Redeem to Wallet Action */}
              <Pressable
                onPress={handleRedeem}
                disabled={redeeming}
                style={({ pressed }) => [
                  styles.redeemBanner,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.redeemBannerLeft}>
                  <Ionicons name="wallet-outline" size={16} color={PURPLE} />
                  <Text style={styles.redeemBannerText}>
                    {redeeming ? 'Redeeming reward...' : 'Redeem rewards into Wallet balance'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={PURPLE} />
              </Pressable>

              {/* Referral Code & Share Body */}
              <View style={styles.referCardBody}>
                <View style={styles.codeHeaderRow}>
                  <Text style={styles.codeEyebrow}>YOUR PERSONAL REFERRAL CODE</Text>
                  <View style={styles.activeTagPill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeTagText}>Active</Text>
                  </View>
                </View>

                {/* Perforated Ticket Box for Referral Code */}
                <Pressable
                  onPress={handleCopyCode}
                  style={({ pressed }) => [
                    styles.ticketCodeBox,
                    pressed && { transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <View style={styles.ticketNotchLeft} />
                  <View style={styles.ticketNotchRight} />

                  <View style={styles.ticketCodeLeft}>
                    <Text style={styles.ticketCodeValue}>{referralCode}</Text>
                    <Text style={styles.ticketCodeHint}>
                      {copied ? 'Code copied to clipboard!' : 'Tap to copy code'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.ticketCopyBtn,
                      copied && styles.ticketCopyBtnSuccess,
                    ]}
                  >
                    <Ionicons
                      name={copied ? 'checkmark-circle' : 'copy-outline'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.ticketCopyBtnText}>
                      {copied ? 'COPIED' : 'COPY'}
                    </Text>
                  </View>
                </Pressable>

                {/* Primary Refer & Share Button */}
                <Pressable
                  onPress={handleShareReferral}
                  style={({ pressed }) => [
                    styles.primaryReferBtnWrap,
                    pressed && { transform: [{ translateY: 2 }] },
                  ]}
                >
                  <View style={styles.primaryReferBtnLedge} />
                  <LinearGradient
                    colors={[PURPLE_MID, PURPLE]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryReferBtnFace}
                  >
                    <Ionicons name="paper-plane" size={17} color="#FFFFFF" />
                    <Text style={styles.primaryReferBtnText}>
                      Refer a Friend Now
                    </Text>
                    <View style={styles.primaryReferBonusTag}>
                      <Text style={styles.primaryReferBonusTagText}>EARN ₹200</Text>
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Quick Share Channels */}
                <View style={styles.quickShareRow}>
                  <Pressable
                    onPress={handleShareReferral}
                    style={styles.quickSharePill}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#16A34A" />
                    <Text style={styles.quickSharePillText}>WhatsApp</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleCopyCode}
                    style={styles.quickSharePill}
                  >
                    <Ionicons name="link-outline" size={16} color={PURPLE} />
                    <Text style={styles.quickSharePillText}>Copy Link</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleShareReferral}
                    style={styles.quickSharePill}
                  >
                    <Ionicons name="share-social-outline" size={16} color={PURPLE} />
                    <Text style={styles.quickSharePillText}>More</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* How it works? Section */}
        <View style={styles.howSection}>
          <Text style={styles.sectionHeading}>How it works?</Text>

          <View style={styles.howList}>
            {HOW_IT_WORKS.map((item) => (
              <View key={item.id} style={styles.howRow}>
                <StepBadgeIcon type={item.type} />
                <Text style={styles.howRowText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQs Section */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeaderRow}>
            <Text style={styles.sectionHeading}>FAQs</Text>
            <Pressable
              onPress={() => setOpenFaqId(openFaqId ? null : FAQS[0].id)}
              style={styles.viewAllRow}
            >
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={14} color={PURPLE} />
            </Pressable>
          </View>

          <View style={styles.faqCardBox}>
            {FAQS.map((faq, index) => {
              const isOpen = openFaqId === faq.id;
              return (
                <View
                  key={faq.id}
                  style={[
                    styles.faqItemWrap,
                    index > 0 && styles.faqItemBorder,
                  ]}
                >
                  <Pressable
                    onPress={() =>
                      setOpenFaqId((curr) => (curr === faq.id ? null : faq.id))
                    }
                    style={styles.faqQuestionRow}
                  >
                    <Text style={styles.faqQuestionText}>{faq.q}</Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#6B7280"
                    />
                  </Pressable>
                  {isOpen ? (
                    <Text style={styles.faqAnswerText}>{faq.a}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* Terms of Service */}
        <View style={styles.termsFooterWrap}>
          <View style={styles.termsDashedWrap}>
            <Text style={styles.termsFooterText}>Terms of Service</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFF6',
  },
  stickyBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#18181B',
  },
  heroGradient: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 12,
  },
  heroGlowRay1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroGlowRay2: {
    position: 'absolute',
    top: 40,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  heroTopBar: {
    paddingHorizontal: 16,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBackCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTopTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroBannerRow: {
    marginTop: 8,
    paddingLeft: 20,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 164,
  },
  heroHeadlineWrap: {
    flex: 1,
    paddingRight: 6,
    zIndex: 2,
  },
  heroHeadlineText: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  phraseSlotClip: {
    height: 34,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroHeadlineHighlight: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroSubline: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  heroTreatFloating: {
    width: 148,
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -4,
  },
  treatStage: {
    width: 144,
    height: 152,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treatPhotoTea: {
    width: 132,
    height: 142,
    transform: [{ rotate: '-8deg' }],
  },
  treatPhotoCoffee: {
    width: 146,
    height: 152,
    transform: [{ rotate: '-4deg' }],
  },
  referCardOuter: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    position: 'relative',
  },
  referCardBaseLedge: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: -7,
    height: 34,
    borderRadius: 28,
    backgroundColor: '#D8B4FE',
  },
  referCardShell: {
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    shadowColor: PURPLE_DARK,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 9,
  },
  referShowcaseHeader: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  referShowcaseOrb: {
    position: 'absolute',
    right: -20,
    top: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
  },
  referShowcaseLeft: {
    flex: 1,
    paddingRight: 8,
  },
  referClubPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.45)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    marginBottom: 8,
  },
  referClubPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: 0.7,
  },
  referShowcaseTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  referShowcaseSub: {
    marginTop: 5,
    fontSize: 11.5,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  referShowcaseRight: {
    width: 118,
    height: 104,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  floatingCoinBadgeTop: {
    position: 'absolute',
    top: 0,
    right: 4,
    backgroundColor: '#FDE047',
    borderWidth: 1.5,
    borderColor: '#FEF9C3',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    zIndex: 5,
  },
  floatingCoinText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#78350F',
  },
  referScooterImg: {
    width: 112,
    height: 82,
    zIndex: 3,
  },
  scooterGlowBase: {
    marginTop: -6,
    width: 96,
    height: 12,
    borderRadius: 48,
    backgroundColor: 'rgba(253, 224, 71, 0.4)',
  },
  referStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7FF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEAF8',
    paddingVertical: 10,
  },
  referStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  referStatVal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PURPLE,
  },
  referStatLbl: {
    marginTop: 1,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6E6878',
  },
  referStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E5DCF5',
  },
  redeemBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  redeemBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  redeemBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PURPLE,
  },
  referCardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  codeEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6E6878',
    letterSpacing: 0.8,
  },
  activeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PURPLE,
  },
  activeTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PURPLE,
  },
  ticketCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7FF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  ticketNotchLeft: {
    position: 'absolute',
    left: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PURPLE,
  },
  ticketNotchRight: {
    position: 'absolute',
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PURPLE,
  },
  ticketCodeLeft: {
    flex: 1,
    paddingRight: 10,
  },
  ticketCodeValue: {
    fontSize: 21,
    fontWeight: '900',
    color: PURPLE_DARK,
    letterSpacing: 1.8,
  },
  ticketCodeHint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: PURPLE_MID,
  },
  ticketCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PURPLE,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  ticketCopyBtnSuccess: {
    backgroundColor: '#15803D',
  },
  ticketCopyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  primaryReferBtnWrap: {
    marginTop: 14,
    height: 50,
    position: 'relative',
  },
  primaryReferBtnLedge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -3,
    height: 48,
    borderRadius: 14,
    backgroundColor: PURPLE_DARK,
  },
  primaryReferBtnFace: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryReferBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  primaryReferBonusTag: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 4,
  },
  primaryReferBonusTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#78350F',
  },
  quickShareRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickSharePill: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F6F4FA',
    borderWidth: 1,
    borderColor: '#EAE4F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickSharePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#27272A',
  },
  howSection: {
    marginTop: 22,
    paddingHorizontal: 18,
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.3,
  },
  howList: {
    marginTop: 16,
    gap: 18,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howRowText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
    color: '#3F3F46',
  },
  faqSection: {
    marginTop: 30,
    paddingHorizontal: 18,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PURPLE,
  },
  faqCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1EFF6',
    paddingHorizontal: 16,
  },
  faqItemWrap: {
    paddingVertical: 16,
  },
  faqItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1EFF6',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#27272A',
  },
  faqAnswerText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: '#52525B',
  },
  termsFooterWrap: {
    marginTop: 28,
    alignItems: 'center',
  },
  termsDashedWrap: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#71717A',
    paddingBottom: 2,
  },
  termsFooterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#52525B',
  },
});
