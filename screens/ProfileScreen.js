import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#4A168C';

const ACTIONS = [
  { icon: 'person-outline', label: 'Edit Profile' },
  { icon: 'document-text-outline', label: 'KYC Documents' },
  { icon: 'gift-outline', label: 'Refer & Earn' },
  { icon: 'pricetag-outline', label: 'Offers' },
];

const SUPPORT = [
  { icon: 'shield-checkmark-outline', label: 'Safety & Help' },
  { icon: 'options-outline', label: 'Preferences' },
  { icon: 'information-circle-outline', label: 'About Evegah' },
];

export default function ProfileScreen({ profile, verified, onEdit, onKyc, onRefer, onOffers, onHelp, onPreferences, onAbout, onSecurity, onOpenHome, onOpenMyRide, onOpenScan, onOpenWallet }) {
  const insets = useSafeAreaInsets();
  const name = profile?.name || 'Demo Reviewer';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Profile</Text>

        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{letters.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.heroCopy}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{name}</Text>
                <Pressable hitSlop={8} style={styles.edit} onPress={onEdit}>
                  <Ionicons name="create-outline" size={16} color={PURPLE} />
                </Pressable>
              </View>
              <Text style={styles.phone}>{profile?.phone || '+91 9999999999'}</Text>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, verified && styles.statusDotOn]} />
                <Text style={[styles.status, verified && styles.statusOn]}>
                  {verified ? 'Verified rider' : 'Unverified rider'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.account}>Manage your Evegah account</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Rides</Text>
            </View>
            <View style={styles.statRule} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>0.0</Text>
              <Text style={styles.statLabel}>kg CO₂</Text>
            </View>
            <View style={styles.statRule} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>120</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.section}>EveClub</Text>
        <Animated.View entering={cardEnter(1)} style={styles.club}>
          <View style={styles.clubTop}>
            <View style={styles.tierMark}>
              <Ionicons name="ribbon" size={18} color={PURPLE} />
            </View>
            <View style={styles.clubCopy}>
              <Text style={styles.clubTier}>Bronze member</Text>
              <Text style={styles.clubHint}>Your membership</Text>
            </View>
            <View style={styles.points}>
              <Text style={styles.pointsValue}>120</Text>
              <Text style={styles.pointsLabel}>Eve points</Text>
            </View>
          </View>
          <View style={styles.track}>
            <View style={styles.trackFill} />
          </View>
          <View style={styles.clubFoot}>
            <Text style={styles.progressLabel}>Progress to Silver</Text>
            <Text style={styles.progressLeft}>24% · 380 pts left</Text>
          </View>
        </Animated.View>

        <Text style={styles.section}>Quick actions</Text>
        <Animated.View entering={cardEnter(2)} style={styles.actionGrid}>
          {ACTIONS.map((item) => (
            <Pressable
              key={item.label}
              onPress={
                {
                  'Edit Profile': onEdit,
                  'KYC Documents': onKyc,
                  'Refer & Earn': onRefer,
                  Offers: onOffers,
                }[item.label]
              }
              style={styles.actionCard}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={item.icon} size={18} color={PURPLE} />
              </View>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        <Text style={styles.section}>Support</Text>
        <Animated.View entering={cardEnter(3)} style={styles.list}>
          {SUPPORT.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={
                {
                  'Safety & Help': onHelp,
                  Preferences: onPreferences,
                  'About Evegah': onAbout,
                }[item.label]
              }
              style={[styles.row, index > 0 && styles.rowLine]}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={item.icon} size={18} color={PURPLE} />
              </View>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#C8C8CC" />
            </Pressable>
          ))}
        </Animated.View>

        <Pressable onPress={onSecurity} style={styles.logout}>
          <Ionicons name="log-out-outline" size={18} color="#A33B3B" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>

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
    backgroundColor: '#F7F7F8',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: '#8A8A8A',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#141414',
    letterSpacing: -0.4,
  },
  edit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginTop: 16,
    backgroundColor: '#F6F1FC',
    borderRadius: 24,
    padding: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroCopy: {
    flex: 1,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#E4D4F5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  phone: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3A',
  },
  statusPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C4A15A',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6E6248',
  },
  statusDotOn: {
    backgroundColor: '#1F8A4C',
  },
  statusOn: {
    color: '#1F8A4C',
  },
  account: {
    marginTop: 14,
    fontSize: 13,
    color: '#7A7388',
  },
  stats: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#141414',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#8A8A8A',
  },
  statRule: {
    width: 1,
    height: 28,
    backgroundColor: '#F0EAF8',
  },
  section: {
    marginTop: 26,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#8A8A8A',
  },
  club: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F2',
  },
  clubTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierMark: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubCopy: {
    flex: 1,
  },
  clubTier: {
    fontSize: 17,
    fontWeight: '700',
    color: '#141414',
  },
  clubHint: {
    marginTop: 2,
    fontSize: 13,
    color: '#8A8A8A',
  },
  points: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: PURPLE,
  },
  pointsLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#8A8A8A',
  },
  track: {
    marginTop: 16,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0EAF8',
    overflow: 'hidden',
  },
  trackFill: {
    width: '24%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: PURPLE,
  },
  clubFoot: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6E6E6E',
  },
  progressLeft: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F2',
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 10,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F2',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowLine: {
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1C',
  },
  logout: {
    marginTop: 22,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0D5D5',
    backgroundColor: '#FFF8F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A33B3B',
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
