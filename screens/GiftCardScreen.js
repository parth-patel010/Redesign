import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const PURPLE = '#4A168C';
const PURPLE_DARK = '#26084D';
const PURPLE_MID = '#6B21A8';
const CARD_PREVIEW_W = Math.round(SCREEN_W * 0.72);
const CARD_PREVIEW_H = Math.round(CARD_PREVIEW_W * 0.62);

const OCCASIONS = [
  {
    id: 'evegah',
    label: 'Evegah',
    colors: ['#581C87', '#3B0764'],
    ribbonColor: '#FDE68A',
    subtitle: 'GIFT CARD',
    tagline: 'Give the gift of clean electric rides',
  },
  {
    id: 'birthday',
    label: 'Birthday',
    colors: ['#1E1B4B', '#0F172A'],
    ribbonColor: '#C084FC',
    subtitle: 'BIRTHDAY GIFT CARD',
    tagline: 'Wish them a joyful year of smooth rides',
  },
  {
    id: 'thankyou',
    label: 'Thank you',
    colors: ['#4C1D95', '#2E1065'],
    ribbonColor: '#F9A8D4',
    subtitle: 'THANK YOU CARD',
    tagline: 'Say thanks with effortless city mobility',
  },
  {
    id: 'anniversary',
    label: 'Anniversary',
    colors: ['#701A75', '#3B0764'],
    ribbonColor: '#FDE047',
    subtitle: 'ANNIVERSARY GIFT CARD',
    tagline: 'Celebrate special milestones together',
  },
];

const PRESET_AMOUNTS = [
  { id: '1000', label: '₹1,000', value: 1000, popular: false },
  { id: '2000', label: '₹2,000', value: 2000, popular: true },
  { id: '5000', label: '₹5,000', value: 5000, popular: false },
  { id: 'custom', label: 'Custom', value: null, popular: false },
];

function HeroGiftBoxArt({ side }) {
  const isLeft = side === 'left';
  return (
    <View
      pointerEvents="none"
      style={[
        styles.heroGiftWrap,
        isLeft ? styles.heroGiftLeft : styles.heroGiftRight,
      ]}
    >
      {/* 3D Wrapped Gift Box with Gold Ribbon Bow */}
      <View style={{ alignItems: 'center', position: 'relative', width: 54 }}>
        <LinearGradient
          colors={['#FDE68A', '#D97706', '#92400E']}
          style={styles.giftBowCenter}
        />
        <View
          style={[styles.giftBowWing, { left: 10, transform: [{ rotate: '-28deg' }] }]}
        />
        <View
          style={[styles.giftBowWing, { right: 10, transform: [{ rotate: '28deg' }] }]}
        />
      </View>

      <LinearGradient
        colors={['#C084FC', '#9333EA', '#6B21A8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.giftBoxTopCube}
      >
        <LinearGradient
          colors={['#FEF08A', '#D97706']}
          style={styles.giftRibbonVert}
        />
        <LinearGradient
          colors={['#FEF08A', '#D97706']}
          style={styles.giftRibbonHoriz}
        />
      </LinearGradient>

      <LinearGradient
        colors={['#4A168C', '#2E0E56']}
        style={styles.giftBoxBottomBase}
      >
        <View style={styles.giftBaseStripe} />
      </LinearGradient>
    </View>
  );
}

export default function GiftCardScreen({ onBack, onRedeem, onHelp }) {
  const insets = useSafeAreaInsets();
  const [selectedOccasionId, setSelectedOccasionId] = useState('evegah');
  const [selectedAmountId, setSelectedAmountId] = useState('2000');
  const [customAmount, setCustomAmount] = useState('3000');
  const [purchasedCards, setPurchasedCards] = useState([]);
  const [purchaseToast, setPurchaseToast] = useState(false);

  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [110, 175], [0, 1], 'clamp');
    const translateY = interpolate(scrollY.value, [110, 175], [-10, 0], 'clamp');
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const activeAmount =
    selectedAmountId === 'custom'
      ? Number(customAmount.replace(/[^0-9]/g, '')) || 1000
      : PRESET_AMOUNTS.find((a) => a.id === selectedAmountId)?.value || 2000;

  const handleContinue = () => {
    const occasion =
      OCCASIONS.find((o) => o.id === selectedOccasionId) || OCCASIONS[0];
    const newCard = {
      id: `GC-${Date.now().toString().slice(-6)}`,
      title: `Evegah ${occasion.label} Gift Card`,
      amount: activeAmount,
      date: 'Just now',
      code: `4829 ${Math.floor(1000 + Math.random() * 9000)} 9021 7742`,
    };
    setPurchasedCards((prev) => [newCard, ...prev]);
    setPurchaseToast(true);
    setTimeout(() => setPurchaseToast(false), 2600);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Sticky White Header on Scroll (Matches Image 2) */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.stickyHeader,
          { paddingTop: insets.top + 8 },
          stickyHeaderStyle,
        ]}
      >
        <Pressable hitSlop={10} onPress={onBack} style={styles.stickyBackCircle}>
          <Ionicons name="arrow-back" size={20} color="#18181B" />
        </Pressable>
        <Text style={styles.stickyTitle}>Gift Cards</Text>
        <Pressable hitSlop={10} onPress={onHelp} style={styles.stickyHelpPill}>
          <Ionicons name="chatbox-ellipses-outline" size={15} color="#18181B" />
          <Text style={styles.stickyHelpText}>Help</Text>
        </Pressable>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        {/* Top Evegah Purple Hero Banner (Matches Image 1 in Evegah Purple Theme) */}
        <LinearGradient
          colors={[PURPLE_DARK, PURPLE, PURPLE_MID, '#D8B4FE', '#F6F5FA']}
          locations={[0, 0.34, 0.62, 0.86, 1]}
          style={[styles.heroBanner, { paddingTop: insets.top + 10 }]}
        >
          {/* Decorative Mandala Rings & Sparkles */}
          <View style={styles.mandalaRingTopRight} pointerEvents="none" />
          <View style={styles.mandalaRingBottomLeft} pointerEvents="none" />
          <Text style={[styles.heroSparkle, { top: 54, left: 48 }]}>✦</Text>
          <Text style={[styles.heroSparkle, { top: 68, right: 64 }]}>✧</Text>
          <Text style={[styles.heroSparkle, { top: 120, left: 92 }]}>•</Text>
          <Text style={[styles.heroSparkle, { top: 112, right: 98 }]}>✦</Text>

          {/* Top Bar */}
          <View style={styles.heroTopBar}>
            <Pressable hitSlop={10} onPress={onBack} style={styles.heroBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable hitSlop={10} onPress={onHelp} style={styles.heroHelpPill}>
              <Ionicons name="chatbox-ellipses-outline" size={15} color="#FFFFFF" />
              <Text style={styles.heroHelpText}>Help</Text>
            </Pressable>
          </View>

          {/* Display Title: Gift Cards */}
          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroTitleTop}>Gift</Text>
            <Text style={styles.heroTitleBottom}>Cards</Text>
          </View>

          {/* Left & Right 3D Gift Boxes */}
          <HeroGiftBoxArt side="left" />
          <HeroGiftBoxArt side="right" />
        </LinearGradient>

        {/* Occasion Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.occasionTabsRow}
        >
          {OCCASIONS.map((occ) => {
            const active = occ.id === selectedOccasionId;
            return (
              <Pressable
                key={occ.id}
                onPress={() => setSelectedOccasionId(occ.id)}
                style={[
                  styles.occasionPill,
                  active && styles.occasionPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.occasionPillText,
                    active && styles.occasionPillTextActive,
                  ]}
                >
                  {occ.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Gift Card Design Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_PREVIEW_W + 20}
          contentContainerStyle={styles.cardCarouselTrack}
        >
          {OCCASIONS.map((occ) => {
            const isSelected = occ.id === selectedOccasionId;
            return (
              <Pressable
                key={occ.id}
                onPress={() => setSelectedOccasionId(occ.id)}
                style={styles.giftPreviewOuterWrap}
              >
                <View
                  style={[
                    styles.giftPreviewWhiteFrame,
                    !isSelected && styles.giftPreviewFrameDim,
                  ]}
                >
                  <LinearGradient
                    colors={occ.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.giftPreviewFace}
                  >
                    {/* Decorative Gift Ribbon Lines (matching Image 1) */}
                    <View
                      style={[
                        styles.cardRibbonLineH,
                        { backgroundColor: occ.ribbonColor },
                      ]}
                    />
                    <View
                      style={[
                        styles.cardRibbonLineV,
                        { backgroundColor: occ.ribbonColor },
                      ]}
                    />
                    <View style={styles.cardBowKnotWrap}>
                      <Ionicons
                        name="flower-outline"
                        size={36}
                        color={occ.ribbonColor}
                      />
                    </View>

                    {/* Center Evegah Brand & GIFT CARD Title */}
                    <View style={styles.cardCenterLogoWrap}>
                      <View style={styles.cardLogoWhitePill}>
                        <Image
                          source={require('../assets/login/evegah-logo.png')}
                          style={styles.cardEvegahLogo}
                          contentFit="contain"
                        />
                      </View>
                      <Text
                        style={[
                          styles.cardGiftSubText,
                          { color: occ.ribbonColor },
                        ]}
                      >
                        {occ.subtitle}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Floating Purple Checkmark Badge */}
                {isSelected ? (
                  <View style={styles.selectedCheckBadge}>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* CHOOSE AMOUNT Section */}
        <Text style={styles.sectionEyebrow}>CHOOSE AMOUNT</Text>

        <View style={styles.amountCardBox}>
          <View style={styles.amountTopRow}>
            <Text style={styles.amountLabel}>Gift card amount</Text>
            <Text style={styles.amountValueDisplay}>
              ₹{activeAmount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.amountPillsGrid}>
            {PRESET_AMOUNTS.map((item) => {
              const selected = item.id === selectedAmountId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedAmountId(item.id)}
                  style={[
                    styles.amountOptionTile,
                    selected && styles.amountOptionTileActive,
                  ]}
                >
                  <View style={styles.amountOptionCenter}>
                    <Text
                      style={[
                        styles.amountOptionText,
                        selected && styles.amountOptionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>

                  {item.popular ? (
                    <View style={styles.popularBottomStrip}>
                      <Text style={styles.popularBottomStripText}>POPULAR</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {selectedAmountId === 'custom' ? (
            <View style={styles.customInputWrap}>
              <Text style={styles.customCurrencyPrefix}>₹</Text>
              <TextInput
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="number-pad"
                placeholder="Enter amount (₹500 - ₹10,000)"
                placeholderTextColor="#9CA3AF"
                style={styles.customAmountInput}
                maxLength={5}
              />
            </View>
          ) : null}

          <View style={styles.amountCardDivider} />

          <View style={styles.haveGiftCardRow}>
            <Text style={styles.haveGiftCardLabel}>
              Do you have a gift card?{' '}
            </Text>
            <Pressable hitSlop={8} onPress={onRedeem} style={styles.redeemNowLinkWrap}>
              <Text style={styles.redeemNowLinkText}>Redeem now</Text>
            </Pressable>
          </View>
        </View>

        {/* FOR BULK PURCHASES Section (Matches Image 2) */}
        <Text style={styles.sectionEyebrow}>FOR BULK PURCHASES</Text>

        <View style={styles.bulkCardBox}>
          <View style={styles.bulkBulletRow}>
            <Text style={styles.bulkDot}>•</Text>
            <Text style={styles.bulkText}>
              Write to us at{' '}
              <Text style={styles.bulkEmailBold}>giftcards@evegah.com</Text>
            </Text>
          </View>

          <View style={styles.bulkBulletRow}>
            <Text style={styles.bulkDot}>•</Text>
            <Text style={styles.bulkText}>
              For corporate purchases, an invoice in the name of the company
              will be provided
            </Text>
          </View>

          <View style={styles.bulkBulletRow}>
            <Text style={styles.bulkDot}>•</Text>
            <Text style={styles.bulkText}>
              Gift cards will be shared within 2 working days, after receiving
              the payment
            </Text>
          </View>
        </View>

        {/* YOUR PURCHASE HISTORY Section (Matches Image 2) */}
        <Text style={styles.sectionEyebrow}>YOUR PURCHASE HISTORY</Text>

        {purchasedCards.length === 0 ? (
          <View style={styles.emptyHistoryWrap}>
            {[0, 1, 2].map((idx) => (
              <View key={idx} style={styles.skeletonStackItem}>
                <View style={styles.skeletonBackShadow} />
                <View style={styles.skeletonFrontCard}>
                  <View style={styles.skeletonIconBox} />
                  <View style={styles.skeletonLinesCol}>
                    <View style={styles.skeletonLineLong} />
                    <View style={styles.skeletonLineShort} />
                  </View>
                </View>
              </View>
            ))}

            <Text style={styles.emptyHistoryCaption}>
              You haven't purchased any gift cards yet
            </Text>
          </View>
        ) : (
          <View style={styles.purchasedListWrap}>
            {purchasedCards.map((card) => (
              <View key={card.id} style={styles.purchasedHistoryCard}>
                <View style={styles.purchasedHistoryIcon}>
                  <Ionicons name="gift" size={20} color={PURPLE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.purchasedHistoryTitle}>{card.title}</Text>
                  <Text style={styles.purchasedHistoryCode}>
                    Code: {card.code} • {card.date}
                  </Text>
                </View>
                <Text style={styles.purchasedHistoryAmount}>
                  ₹{card.amount}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {purchaseToast ? (
        <View style={[styles.toastBanner, { bottom: insets.bottom + 88 }]}>
          <Ionicons name="checkmark-circle" size={18} color="#FDE047" />
          <Text style={styles.toastBannerText}>
            ₹{activeAmount} Evegah Gift Card added to your history!
          </Text>
        </View>
      ) : null}

      {/* Bottom Sticky Continue Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continuePurpleBtn,
            pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
          ]}
        >
          <Text style={styles.continuePurpleBtnText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F5FA',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9F5',
  },
  stickyBackCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  stickyHelpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  stickyHelpText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#18181B',
  },
  heroBanner: {
    minHeight: 245,
    paddingHorizontal: 16,
    paddingBottom: 26,
    position: 'relative',
    overflow: 'hidden',
  },
  mandalaRingTopRight: {
    position: 'absolute',
    top: -36,
    right: -36,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 12,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mandalaRingBottomLeft: {
    position: 'absolute',
    bottom: 24,
    left: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 10,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroSparkle: {
    position: 'absolute',
    color: 'rgba(253, 230, 138, 0.65)',
    fontSize: 12,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  heroBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHelpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroHelpText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroTitleBlock: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  heroTitleTop: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '400',
    color: '#FDE68A',
    letterSpacing: -0.5,
  },
  heroTitleBottom: {
    marginTop: -4,
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '400',
    color: '#FDE68A',
    letterSpacing: -1,
  },
  heroGiftWrap: {
    position: 'absolute',
    bottom: 18,
    width: 84,
    height: 76,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  heroGiftLeft: {
    left: -8,
    transform: [{ rotate: '14deg' }],
  },
  heroGiftRight: {
    right: -8,
    transform: [{ rotate: '-14deg' }],
  },
  giftBowCenter: {
    width: 14,
    height: 10,
    borderRadius: 5,
    zIndex: 4,
  },
  giftBowWing: {
    position: 'absolute',
    top: -6,
    width: 22,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  giftBoxTopCube: {
    width: 72,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  giftRibbonVert: {
    width: 11,
    height: '100%',
  },
  giftRibbonHoriz: {
    position: 'absolute',
    width: '100%',
    height: 9,
  },
  giftBoxBottomBase: {
    marginTop: -4,
    width: 66,
    height: 18,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    alignItems: 'center',
  },
  giftBaseStripe: {
    width: 10,
    height: '100%',
    backgroundColor: '#FDE68A',
  },
  occasionTabsRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 10,
  },
  occasionPill: {
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  occasionPillActive: {
    backgroundColor: '#F3E8FF',
    borderColor: PURPLE,
    borderWidth: 1.5,
  },
  occasionPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#27272A',
  },
  occasionPillTextActive: {
    color: PURPLE,
    fontWeight: '700',
  },
  cardCarouselTrack: {
    paddingHorizontal: Math.round((SCREEN_W - CARD_PREVIEW_W) / 2),
    paddingTop: 4,
    paddingBottom: 22,
    gap: 16,
  },
  giftPreviewOuterWrap: {
    width: CARD_PREVIEW_W,
    alignItems: 'center',
    position: 'relative',
  },
  giftPreviewWhiteFrame: {
    width: CARD_PREVIEW_W,
    height: CARD_PREVIEW_H,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 8,
    shadowColor: '#2A0B52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  giftPreviewFrameDim: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  giftPreviewFace: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardRibbonLineH: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.55,
    transform: [{ rotate: '-4deg' }],
  },
  cardRibbonLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 42,
    width: 1,
    opacity: 0.55,
    transform: [{ rotate: '-4deg' }],
  },
  cardBowKnotWrap: {
    position: 'absolute',
    top: 12,
    left: 24,
    opacity: 0.75,
  },
  cardCenterLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLogoWhitePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardEvegahLogo: {
    width: 112,
    height: 30,
  },
  cardGiftSubText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  selectedCheckBadge: {
    marginTop: -18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PURPLE,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  sectionEyebrow: {
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 18,
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: '#6E6878',
  },
  amountCardBox: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE7F5',
  },
  amountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181B',
  },
  amountValueDisplay: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
  },
  amountPillsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  amountOptionTile: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  amountOptionTileActive: {
    backgroundColor: '#F3E8FF',
    borderColor: PURPLE,
    borderWidth: 1.5,
  },
  amountOptionCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  amountOptionTextActive: {
    color: PURPLE,
    fontWeight: '800',
  },
  popularBottomStrip: {
    height: 16,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularBottomStripText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  customInputWrap: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#FAF7FF',
  },
  customCurrencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: PURPLE,
    marginRight: 6,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
  },
  amountCardDivider: {
    height: 1,
    backgroundColor: '#F1EFF6',
    marginVertical: 14,
  },
  haveGiftCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  haveGiftCardLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#52525B',
  },
  redeemNowLinkWrap: {
    borderBottomWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: PURPLE,
    paddingBottom: 1,
  },
  redeemNowLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PURPLE,
  },
  bulkCardBox: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ECE7F5',
    marginBottom: 14,
  },
  bulkBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulkDot: {
    fontSize: 15,
    lineHeight: 20,
    color: '#6E6878',
  },
  bulkText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#52525B',
  },
  bulkEmailBold: {
    fontWeight: '700',
    color: '#27272A',
  },
  emptyHistoryWrap: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  skeletonStackItem: {
    width: 210,
    height: 54,
    marginBottom: 12,
    position: 'relative',
  },
  skeletonBackShadow: {
    position: 'absolute',
    left: -5,
    right: 5,
    bottom: -4,
    top: 4,
    borderRadius: 10,
    backgroundColor: '#D6D1E0',
  },
  skeletonFrontCard: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C4BDD4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
  },
  skeletonIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#CBD5E1',
  },
  skeletonLinesCol: {
    flex: 1,
    gap: 6,
  },
  skeletonLineLong: {
    width: '78%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  skeletonLineShort: {
    width: '52%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  emptyHistoryCaption: {
    marginTop: 8,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#27272A',
    textAlign: 'center',
  },
  purchasedListWrap: {
    paddingHorizontal: 16,
    gap: 10,
  },
  purchasedHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ECE7F5',
  },
  purchasedHistoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchasedHistoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  purchasedHistoryCode: {
    marginTop: 2,
    fontSize: 12,
    color: '#6E6878',
  },
  purchasedHistoryAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: PURPLE,
  },
  toastBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: PURPLE_DARK,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 40,
  },
  toastBannerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECE7F5',
  },
  continuePurpleBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continuePurpleBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
