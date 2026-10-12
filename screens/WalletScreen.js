import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet, last10, rupee, shortDate } from '../services/api';

const PURPLE = '#4A168C';
const WALLET_ART = require('../assets/home/wallet-art.png');
const SCOOTER_ART = require('../assets/home/wallet-scooter.png');

const ACTIONS = [
  { icon: 'add', label: 'Add Money' },
  { icon: 'arrow-down', label: 'Withdraw' },
  { icon: 'time-outline', label: 'History' },
  { icon: 'pricetag-outline', label: 'Offers' },
];

const TRANSACTIONS = [
  {
    id: 'topup',
    title: 'Wallet Top-Up',
    detail: 'Razorpay UPI Payment',
    date: '28 Aug 2026',
    amount: '',
    credit: true,
    method: 'Razorpay UPI',
    status: 'Completed',
  },
  {
    id: 'deposit',
    title: 'Security Deposit Add',
    detail: 'Refundable Security Deposit',
    date: '27 Aug 2026',
    amount: '+₹250.00',
    credit: true,
    method: 'Wallet',
    status: 'Completed',
    note: '₹250 is refundable.',
  },
  {
    id: 'ride',
    title: 'EV Ride Reservation Payment',
    detail: 'Gotri Zone · Evegah EV',
    date: '28 Aug 2026',
    amount: '−₹120.00',
    credit: false,
    method: 'UPI',
    status: 'Completed',
    booking: 'EVG280826',
    note: 'Evegah City · Gotri to Gotri',
  },
];

export default function WalletScreen({
  onOpenHome,
  onOpenMyRide,
  onOpenScan,
  onOpenProfile,
  onOffers,
  onOpenTx,
  phone,
  enterCards = true,
}) {
  const insets = useSafeAreaInsets();
  const enter = (index) => (enterCards ? cardEnter(index) : undefined);
  const [rows, setRows] = useState(TRANSACTIONS);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const mobile = last10(phone);
    if (!mobile) return;
    apiGet(`/wallet/balance?mobile=${mobile}`)
      .then((body) => {
        if (body?.data) setBalance(body.data);
      })
      .catch(() => {});
    apiGet(`/wallet/transactions?mobile=${mobile}`)
      .then((body) => {
        const list = body?.data || [];
        if (!list.length) return;
        setRows(list.map((item) => {
          const kind = String(item.type || '').toLowerCase();
          const credit = kind === 'credit' || kind.includes('add') || kind.includes('deposit');
          return {
            id: String(item.transaction_id || item.id),
            title: item.title,
            detail: item.subtitle || item.payment_method || '',
            date: shortDate(item.created_at),
            amount: rupee(item.amount, credit),
            credit,
            method: item.payment_method || '',
            status: item.status || 'Completed',
          };
        }));
      })
      .catch(() => {});
  }, [phone]);

  const main = balance ? `₹${Number(balance.main_balance || 0).toFixed(0)}` : '₹0';
  const bonus = balance ? `₹${Number(balance.bonus_balance || 0).toFixed(0)}` : '₹0';
  const total = balance ? `₹${Number(balance.total_balance || 0).toFixed(0)}` : '₹0';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <Text style={styles.title}>Wallet</Text>
          <Pressable hitSlop={8}>
            <Text style={styles.link}>Transactions</Text>
          </Pressable>
        </View>

        <Animated.View entering={enter(0)} style={styles.balanceCard}>
          <View style={styles.balanceCopy}>
            <Text style={styles.balanceLabel}>Your wallet balance</Text>
            <Text style={styles.balanceValue}>{total}</Text>
            <Text style={styles.balanceHint}>Total balance</Text>
            <Pressable style={styles.addBtn}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addText}>Add Money</Text>
            </Pressable>
          </View>
          <Image source={WALLET_ART} style={styles.walletArt} contentFit="contain" />
        </Animated.View>

        <Animated.View entering={enter(1)} style={styles.split}>
          <View style={styles.splitItem}>
            <Text style={styles.splitValue}>{main}</Text>
            <Text style={styles.splitLabel}>Main</Text>
          </View>
          <View style={styles.splitRule} />
          <View style={styles.splitItem}>
            <Text style={styles.splitValue}>{bonus}</Text>
            <Text style={styles.splitLabel}>Bonus</Text>
          </View>
          <View style={styles.splitRule} />
          <View style={styles.splitItem}>
            <Text style={styles.splitValue}>{total}</Text>
            <Text style={styles.splitLabel}>Total</Text>
          </View>
        </Animated.View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Quick actions</Text>
          <Pressable hitSlop={8} onPress={onOffers}>
            <Text style={styles.link}>Apply promo</Text>
          </Pressable>
        </View>
        <Animated.View entering={enter(2)} style={styles.actions}>
          {ACTIONS.map((item) => (
            <Pressable key={item.label} style={styles.action}>
              <Ionicons name={item.icon} size={20} color={PURPLE} />
              <Text style={styles.actionLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={enter(3)} style={styles.offer}>
          <View style={styles.offerCopy}>
            <Text style={styles.offerTitle}>Ride more, save more</Text>
            <Text style={styles.offerSub}>
              Unlock offers and benefits on every EV ride.
            </Text>
            <Pressable hitSlop={6} onPress={onOffers} style={styles.offerLink}>
              <Text style={styles.offerLinkText}>View all offers</Text>
              <Ionicons name="arrow-forward" size={14} color="#1F8A4C" />
            </Pressable>
          </View>
          <Image source={SCOOTER_ART} style={styles.scooter} contentFit="contain" />
        </Animated.View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Recent</Text>
          <Pressable hitSlop={8}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        <Animated.View entering={enter(4)} style={styles.list}>
          {rows.map((item, index) => (
            <Pressable key={item.id} onPress={() => onOpenTx?.(item)} style={[styles.tx, index > 0 && styles.txLine]}>
              <View style={styles.txMain}>
                <Text style={styles.txTitle}>{item.title}</Text>
                <Text style={styles.txDetail}>{item.detail}</Text>
              </View>
              <View style={styles.txSide}>
                {item.amount ? (
                  <Text style={[styles.txAmount, item.credit ? styles.credit : styles.debit]}>
                    {item.amount}
                  </Text>
                ) : null}
                <Text style={styles.txDate}>{item.date}</Text>
              </View>
            </Pressable>
          ))}
        </Animated.View>
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
        <Pressable style={styles.tab}>
          <Ionicons name="wallet" size={22} color={PURPLE} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Wallet</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onOpenProfile}>
          <Ionicons name="person-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>Profile</Text>
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
    paddingBottom: 28,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#141414',
    letterSpacing: -0.6,
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE,
  },
  balanceCard: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0F0F2',
    paddingLeft: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  balanceCopy: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#8A8A8A',
  },
  balanceValue: {
    marginTop: 4,
    fontSize: 36,
    fontWeight: '700',
    color: '#141414',
    letterSpacing: -0.8,
  },
  balanceHint: {
    marginTop: 2,
    fontSize: 13,
    color: '#8A8A8A',
  },
  addBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PURPLE,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  walletArt: {
    width: 132,
    height: 118,
    marginRight: 4,
  },
  split: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F0F0F2',
  },
  splitItem: {
    flex: 1,
    alignItems: 'center',
  },
  splitValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#141414',
  },
  splitLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#8A8A8A',
  },
  splitRule: {
    width: 1,
    height: 24,
    backgroundColor: '#EEEEF0',
  },
  sectionRow: {
    marginTop: 26,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#8A8A8A',
  },
  actions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F2',
    paddingVertical: 14,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1C',
    textAlign: 'center',
  },
  offer: {
    marginTop: 14,
    backgroundColor: '#F3FBF6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9F0E2',
    paddingLeft: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  offerCopy: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B6B3A',
  },
  offerSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#6A9A7C',
  },
  offerLink: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F8A4C',
  },
  scooter: {
    width: 120,
    height: 92,
    marginRight: 4,
  },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F2',
  },
  tx: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  txLine: {
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  txMain: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  txDetail: {
    marginTop: 2,
    fontSize: 12,
    color: '#8A8A8A',
  },
  txSide: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  credit: {
    color: '#1F8A4C',
  },
  debit: {
    color: '#A33B3B',
  },
  txDate: {
    marginTop: 2,
    fontSize: 11,
    color: '#8A8A8A',
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
