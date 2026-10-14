import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#4A168C';
const INDIGO = '#3D2CE0';
const PROFILE_HERO = require('../assets/profile/profile-hero.png');

const AVATAR_URI =
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80';

const SUB_TABS = ['Overview', 'Activity', 'Badges', 'Documents'];

const PERIODS = [
  {
    label: 'This Month',
    co2: '2,340 kg',
    delta: '12%',
    bars: [0.36, 0.46, 0.64, 0.42, 0.56, 0.72, 0.86],
  },
  {
    label: 'Last Month',
    co2: '2,085 kg',
    delta: '9%',
    bars: [0.32, 0.5, 0.44, 0.6, 0.52, 0.68, 0.74],
  },
  {
    label: 'All Time',
    co2: '12,450 kg',
    delta: '28%',
    bars: [0.48, 0.58, 0.7, 0.64, 0.78, 0.84, 0.94],
  },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProfileScreen({
  profile,
  verified,
  onEdit,
  onKyc,
  onRefer,
  onOffers,
  onGiftCard,
  onRedeemGiftCard,
  onHelp,
  onPreferences,
  onAbout,
  onSecurity,
  onOpenHome,
  onOpenMyRide,
  onOpenScan,
  onOpenWallet,
}) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Overview');
  const [periodIdx, setPeriodIdx] = useState(0);

  const rawName = profile?.name || '';
  const displayName =
    !rawName || rawName === 'Demo Reviewer' ? 'Himanshu Chavda' : rawName;
  const currentPeriod = PERIODS[periodIdx];

  const menuCategories = [
    {
      id: 'rides-experiences',
      title: 'Rides & experiences',
      items: [
        {
          id: 'bookings',
          icon: 'bicycle-outline',
          title: 'Your ride bookings',
          onPress: onOpenMyRide,
        },
        {
          id: 'history',
          icon: 'time-outline',
          title: 'Past rides & journey summary',
          onPress: onOpenMyRide,
        },
        {
          id: 'ride-help',
          icon: 'chatbubble-ellipses-outline',
          title: 'Ride help & support',
          onPress: onHelp,
        },
      ],
    },
    {
      id: 'gift-cards-rewards',
      title: 'Gift cards & rewards',
      items: [
        {
          id: 'buy-gift-card',
          icon: 'gift-outline',
          title: 'Buy Gift Card',
          badge: 'NEW',
          onPress: onGiftCard,
        },
        {
          id: 'claim-gift-card',
          icon: 'card-outline',
          title: 'Claim Gift Card',
          onPress: onRedeemGiftCard,
        },
        {
          id: 'offers',
          icon: 'pricetag-outline',
          title: 'Scratch Coupons & Offers',
          onPress: onOffers,
        },
        {
          id: 'wallet',
          icon: 'wallet-outline',
          title: 'Evegah Wallet & Credits',
          onPress: onOpenWallet,
        },
        {
          id: 'refer',
          icon: 'people-outline',
          title: 'Refer a friend',
          badge: 'Get ₹200',
          onPress: onRefer,
        },
      ],
    },
    {
      id: 'account-more',
      title: 'More & account',
      items: [
        {
          id: 'about',
          icon: 'information-circle-outline',
          title: 'About Evegah',
          onPress: onAbout,
        },
        {
          id: 'personal',
          icon: 'person-outline',
          title: 'Personal Information',
          onPress: onEdit,
        },
        {
          id: 'kyc',
          icon: 'document-text-outline',
          title: 'KYC & Rider Verification',
          badge: verified ? 'Verified' : 'Pending',
          onPress: onKyc,
        },
        {
          id: 'settings',
          icon: 'settings-outline',
          title: 'Settings & Preferences',
          onPress: onPreferences,
        },
        {
          id: 'logout',
          icon: 'log-out-outline',
          title: 'Account & Log Out',
          onPress: onSecurity,
        },
      ],
    },
  ];

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === 'Documents') {
      onKyc?.();
    } else if (tab === 'Badges') {
      onRefer?.();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Dark Indigo/Purple Skyline Header */}
        <LinearGradient
          colors={['#25084A', '#4A168C', '#6B21A8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={[styles.heroHeader, { paddingTop: insets.top + 10 }]}
        >
          <Image
            source={PROFILE_HERO}
            style={styles.heroArt}
            contentFit="contain"
            contentPosition="right bottom"
            pointerEvents="none"
          />

          {/* Header Bar */}
          <View style={styles.topBar}>
            <Pressable hitSlop={10} onPress={onOpenHome} style={styles.topIconBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.topBarTitle}>Profile</Text>
            <Pressable hitSlop={10} onPress={onPreferences} style={styles.topIconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Avatar */}
          <View style={styles.avatarRow}>
            <Pressable onPress={onEdit} style={styles.avatarOuter}>
              <Image
                source={{ uri: AVATAR_URI }}
                style={styles.avatarImage}
                contentFit="cover"
              />
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
              </View>
            </Pressable>
          </View>

          {/* Rider Info + Silver Member Card */}
          <View style={styles.identityRow}>
            <View style={styles.identityLeft}>
              <Text style={styles.riderName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.riderIdText}>
                Rider ID{'  '}
                <Text style={styles.riderIdCode}>#EVG45892</Text>
              </Text>
            </View>

            <Pressable onPress={onRefer} style={styles.memberBadge}>
              <View style={styles.crownWrap}>
                <Text style={styles.crownEmoji}>👑</Text>
              </View>
              <View>
                <Text style={styles.memberTitle}>Silver Member</Text>
                <Text style={styles.memberPoints}>320 Points</Text>
              </View>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Floating 3-Column Stats Card */}
        <Animated.View entering={cardEnter(0)} style={styles.statsCard}>
          <View style={styles.statCol}>
            <View style={styles.statIconWrap}>
              <Ionicons name="bicycle" size={22} color={INDIGO} />
            </View>
            <Text style={styles.statVal}>128</Text>
            <Text style={styles.statLbl}>Total Rides</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <View style={styles.statIconWrap}>
              <Ionicons name="location-outline" size={21} color={INDIGO} />
            </View>
            <Text style={styles.statVal}>3,420 km</Text>
            <Text style={styles.statLbl}>Distance</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <View style={styles.statIconWrap}>
              <Ionicons name="leaf" size={20} color="#34A853" />
            </View>
            <Text style={styles.statVal}>12,450 kg</Text>
            <Text style={styles.statLbl}>CO₂ Saved</Text>
          </View>
        </Animated.View>

        {/* Sub-Tabs Bar */}
        <View style={styles.subTabsBar}>
          {SUB_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => handleTabPress(tab)}
                style={styles.subTabBtn}
              >
                <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                  {tab}
                </Text>
                {isActive ? <View style={styles.subTabIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* This Month Impact Card */}
        <Animated.View entering={cardEnter(1)} style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Text style={styles.impactTitle}>This Month Impact</Text>
            <Pressable
              style={styles.periodDropdown}
              onPress={() => setPeriodIdx((prev) => (prev + 1) % PERIODS.length)}
            >
              <Text style={styles.periodDropdownText}>{currentPeriod.label}</Text>
              <Ionicons name="chevron-down" size={13} color="#4B5563" />
            </Pressable>
          </View>

          <View style={styles.impactBody}>
            <View style={styles.impactLeft}>
              <LinearGradient
                colors={['#E6F9EC', '#C8F1D6']}
                style={styles.leafCircle}
              >
                <Ionicons name="leaf" size={24} color="#289440" />
              </LinearGradient>

              <View style={styles.impactMetrics}>
                <Text style={styles.impactValue}>{currentPeriod.co2}</Text>
                <Text style={styles.impactSub}>CO₂ Saved</Text>
                <View style={styles.deltaPill}>
                  <Ionicons name="trending-up" size={11} color="#15803D" />
                  <Text style={styles.deltaText}>{currentPeriod.delta}</Text>
                </View>
              </View>
            </View>

            <View style={styles.chartWrap}>
              {DAYS.map((day, idx) => {
                const ratio = currentPeriod.bars[idx] || 0.5;
                return (
                  <View key={day} style={styles.chartCol}>
                    <View style={styles.chartTrack}>
                      <LinearGradient
                        colors={['#918BFF', '#5F56F8']}
                        style={[
                          styles.chartBar,
                          { height: `${Math.round(ratio * 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartDay}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Categorized Menu Cards (Matches Reference Category Layout in Evegah Purple Theme) */}
        <Animated.View entering={cardEnter(2)} style={styles.categoriesContainer}>
          {menuCategories.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              {/* Category Header with Left Vertical Purple Accent Bar */}
              <View style={styles.categoryHeaderRow}>
                <View style={styles.categoryLeftAccentBar} />
                <Text style={styles.categoryHeaderTitle}>{category.title}</Text>
              </View>

              {/* Category Items */}
              {category.items.map((item, idx) => {
                const isLast = idx === category.items.length - 1;
                return (
                  <View key={item.id}>
                    <Pressable
                      onPress={item.onPress}
                      style={({ pressed }) => [
                        styles.categoryItemRow,
                        pressed && styles.categoryItemPressed,
                      ]}
                    >
                      <View style={styles.categoryIconCircle}>
                        <Ionicons name={item.icon} size={18} color={PURPLE} />
                      </View>

                      <Text style={styles.categoryItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>

                      {item.badge ? (
                        <View style={styles.categoryBadgePill}>
                          <Text style={styles.categoryBadgeText}>
                            {item.badge}
                          </Text>
                        </View>
                      ) : null}

                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color="#9CA3AF"
                      />
                    </Pressable>

                    {!isLast ? <View style={styles.categoryRowDivider} /> : null}
                  </View>
                );
              })}
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.tab} onPress={onOpenHome}>
          <Ionicons name="home-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onOpenMyRide}>
          <Ionicons name="bicycle-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>My Rides</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onOpenScan}>
          <View style={styles.scanButton}>
            <Ionicons name="scan-outline" size={26} color="#FFFFFF" />
            <Ionicons name="qr-code" size={12} color="#FFFFFF" style={styles.scanQr} />
          </View>
          <Text style={styles.tabLabel}>Scan</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onOpenWallet}>
          <Ionicons name="wallet-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>Wallet</Text>
        </Pressable>
        <Pressable style={styles.tab}>
          <Ionicons name="person" size={22} color={PURPLE} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F5FA',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  heroHeader: {
    paddingHorizontal: 18,
    paddingBottom: 66,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  heroArt: {
    position: 'absolute',
    right: -20,
    bottom: 46,
    width: '108%',
    height: 210,
    opacity: 0.5,
  },
  skylineBuilding: {
    position: 'absolute',
    bottom: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.055)',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    padding: 4,
  },
  skylineWindows: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderStyle: 'dashed',
  },
  skylineTreesLeft: {
    position: 'absolute',
    left: -18,
    bottom: 24,
    width: 140,
    height: 48,
    borderRadius: 28,
    backgroundColor: 'rgba(14, 8, 46, 0.45)',
  },
  skylineTreesRight: {
    position: 'absolute',
    right: -18,
    bottom: 24,
    width: 150,
    height: 52,
    borderRadius: 30,
    backgroundColor: 'rgba(14, 8, 46, 0.45)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  topIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  avatarRow: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  avatarOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    padding: 2,
    backgroundColor: '#2D2178',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  onlineBadge: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#34C759',
  },
  identityRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  identityLeft: {
    flex: 1,
  },
  riderName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  riderIdText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.76)',
  },
  riderIdCode: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '600',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  crownWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 210, 30, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEmoji: {
    fontSize: 16,
  },
  memberTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberPoints: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsCard: {
    marginTop: -44,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1B1448',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrap: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statVal: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#17182B',
    letterSpacing: -0.2,
  },
  statLbl: {
    marginTop: 2,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#76798E',
  },
  statDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#ECEEF5',
  },
  subTabsBar: {
    marginTop: 14,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E9F2',
  },
  subTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E7187',
  },
  subTabTextActive: {
    color: INDIGO,
    fontWeight: '700',
  },
  subTabIndicator: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: -1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: INDIGO,
  },
  impactCard: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    shadowColor: '#1B1448',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  impactTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#17182B',
  },
  periodDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7F0',
    backgroundColor: '#FAFBFD',
  },
  periodDropdownText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
  },
  impactBody: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  impactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leafCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactMetrics: {
    justifyContent: 'center',
  },
  impactValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17182B',
    letterSpacing: -0.3,
  },
  impactSub: {
    marginTop: 1,
    fontSize: 11.5,
    color: '#76798E',
    fontWeight: '500',
  },
  deltaPill: {
    marginTop: 5,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  chartWrap: {
    flex: 1,
    maxWidth: 168,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 66,
    paddingTop: 4,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartTrack: {
    width: 9,
    height: 46,
    borderRadius: 5,
    backgroundColor: '#F2F3FA',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: 5,
  },
  chartDay: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '600',
    color: '#76798E',
  },
  categoriesContainer: {
    marginTop: 14,
    marginHorizontal: 16,
    gap: 14,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingTop: 14,
    paddingBottom: 4,
    shadowColor: '#1B1448',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLeftAccentBar: {
    width: 4,
    height: 22,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: PURPLE,
    marginRight: 12,
  },
  categoryHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#17182B',
    letterSpacing: -0.2,
  },
  categoryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  categoryItemPressed: {
    backgroundColor: '#F8F5FC',
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1E32',
  },
  categoryBadgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: PURPLE,
  },
  categoryRowDivider: {
    height: 1,
    backgroundColor: '#F1EFF7',
    marginLeft: 62,
    marginRight: 14,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: PURPLE,
    fontWeight: '700',
  },
  scanButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  scanQr: {
    position: 'absolute',
    top: 15,
    left: 15,
  },
});
