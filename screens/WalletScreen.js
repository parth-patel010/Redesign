import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet, last10, rupee, shortDate } from '../services/api';

const PURPLE = '#4A168C';
const PURPLE_DARK = '#25084A';
const PAGE = '#F7F7F8';
const WALLET_HERO = require('../assets/wallet/wallet-hero.png');
const WALLET_CARD = require('../assets/wallet/wallet-card.png');
const OFFER_BG = require('../assets/wallet/offer-bg.png');
const OFFER_SCOOTER = require('../assets/home/vehicle-mink.png');
const AMOUNTS = [100, 250, 500, 1000];

const ACTIONS = [
  { id: 'add', icon: 'add', label: 'Add Money' },
  { id: 'out', icon: 'arrow-down', label: 'Withdraw' },
  { id: 'history', icon: 'time-outline', label: 'History' },
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

function txLook(item) {
  const text = `${item.title || ''} ${item.detail || ''}`.toLowerCase();
  if (text.includes('offer') || text.includes('bonus')) {
    return { icon: 'pricetag', bg: '#FFF4EC', color: '#F97316', pill: 'Credited', pillBg: '#E8F8EF', pillFg: '#16A34A' };
  }
  if (text.includes('ride') || text.includes('scooter')) {
    return { icon: 'bicycle', bg: '#F3EEFB', color: '#7C3AED', pill: 'Paid', pillBg: '#F4F1F7', pillFg: '#6E6878' };
  }
  return { icon: 'add', bg: '#E8F8EF', color: '#16A34A', pill: item.credit ? 'Success' : 'Paid', pillBg: item.credit ? '#E8F8EF' : '#F4F1F7', pillFg: item.credit ? '#16A34A' : '#6E6878' };
}

function moneyLabel(value) {
  return `₹${Math.abs(Math.round(Number(value) || 0)).toLocaleString('en-IN')}`;
}

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
  const scrollRef = useRef(null);
  const [rows, setRows] = useState(TRANSACTIONS);
  const [balance, setBalance] = useState(null);
  const [added, setAdded] = useState(0);
  const [sheet, setSheet] = useState(null);
  const [picked, setPicked] = useState(250);
  const [custom, setCustom] = useState('');

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

  const mainNum = Number(balance?.main_balance || 0) + added;
  const bonusNum = Number(balance?.bonus_balance || 0);
  const totalNum = (balance ? Number(balance.total_balance || 0) : 0) + added;
  const main = moneyLabel(mainNum);
  const bonus = moneyLabel(bonusNum);
  const total = moneyLabel(totalNum);
  const amount = custom.trim() ? Math.max(0, Math.round(Number(custom) || 0)) : picked;

  const openSheet = (mode) => {
    setPicked(250);
    setCustom('');
    setSheet(mode);
  };

  const showHistory = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const confirmSheet = () => {
    if (!amount) return;
    if (sheet === 'add') {
      setAdded((value) => value + amount);
      setRows((current) => [
        {
          id: `add-${Date.now()}`,
          title: 'Wallet Top-Up',
          detail: 'Added in the app',
          date: 'Today',
          amount: rupee(amount, true),
          credit: true,
          method: 'Wallet',
          status: 'Completed',
        },
        ...current,
      ]);
    } else {
      const take = Math.min(amount, mainNum);
      if (take > 0) {
        setAdded((value) => value - take);
        setRows((current) => [
          {
            id: `out-${Date.now()}`,
            title: 'Withdrawal',
            detail: 'From main balance',
            date: 'Today',
            amount: rupee(take, false),
            credit: false,
            method: 'Wallet',
            status: 'Completed',
          },
          ...current,
        ]);
      }
    }
    setSheet(null);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#3B0764', '#5B21B6', '#7C3AED', '#E9D5FF', PAGE]}
          locations={[0, 0.28, 0.48, 0.72, 1]}
          style={[styles.hero, { paddingTop: insets.top + 4 }]}
        >
          <View style={styles.topBar}>
            <Pressable hitSlop={8} style={styles.round} onPress={onOpenHome}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable hitSlop={8} style={styles.historyBtn} onPress={showHistory}>
              <Ionicons name="time-outline" size={14} color="#FFFFFF" />
              <Text style={styles.historyText}>History</Text>
            </Pressable>
          </View>

          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>EVEGAH WALLET</Text>
              <Text style={styles.title}>Ready for{'\n'}the next ride</Text>
              <Text style={styles.heroSub}>Add money, unlock rides and{'\n'}enjoy exclusive offers.</Text>
            </View>
            <Image source={WALLET_HERO} style={styles.heroArt} contentFit="contain" pointerEvents="none" />
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceTop}>
              <View style={styles.balanceCopy}>
                <Text style={styles.balanceLabel}>Total balance</Text>
                <Text style={styles.balanceValue}>{total}</Text>
                <Pressable onPress={() => openSheet('add')} style={styles.addFace}>
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                  <Text style={styles.addText}>Add money</Text>
                </Pressable>
              </View>
              <Image source={WALLET_CARD} style={styles.cardArt} contentFit="contain" />
            </View>
            <View style={styles.cardRule} />
            <View style={styles.statsBar}>
              <View style={styles.statCol}>
                <View style={styles.statIcon}>
                  <Ionicons name="wallet-outline" size={13} color={PURPLE} />
                </View>
                <Text style={styles.statValue}>{main}</Text>
                <Text style={styles.statLabel}>Main{'\n'}Balance</Text>
              </View>
              <View style={styles.statRule} />
              <View style={styles.statCol}>
                <View style={styles.statIcon}>
                  <Ionicons name="gift-outline" size={13} color={PURPLE} />
                </View>
                <Text style={styles.statValue}>{bonus}</Text>
                <Text style={styles.statLabel}>Bonus</Text>
              </View>
              <View style={styles.statRule} />
              <View style={styles.statCol}>
                <View style={styles.statIcon}>
                  <Ionicons name="stats-chart-outline" size={13} color={PURPLE} />
                </View>
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
          <View style={styles.actions}>
            {ACTIONS.map((item) => (
              <Pressable
                key={item.id}
                style={styles.action}
                onPress={() => {
                  if (item.id === 'add') openSheet('add');
                  else if (item.id === 'out') openSheet('out');
                  else showHistory();
                }}
              >
                <View style={styles.actionIcon}>
                  <Ionicons
                    name={item.id === 'out' ? 'arrow-up' : item.icon}
                    size={15}
                    color={PURPLE}
                    style={item.id === 'out' ? styles.arrowUpRight : undefined}
                  />
                </View>
                <Text style={styles.actionLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Animated.View entering={enter(2)} style={styles.offer}>
            <Image source={OFFER_BG} style={styles.offerBg} contentFit="cover" pointerEvents="none" />
            <View style={styles.offerCopy}>
              <Text style={styles.offerKicker}>OFFERS</Text>
              <Text style={styles.offerTitle}>Ride more,{'\n'}save more</Text>
              <Text style={styles.offerSub}>Unlock exclusive offers on{'\n'}every Evegah ride.</Text>
              <Pressable hitSlop={6} onPress={onOffers} style={styles.offerLink}>
                <Text style={styles.offerLinkText}>View all offers</Text>
                <Ionicons name="arrow-forward" size={14} color="#3B0764" />
              </Pressable>
            </View>
            <Image source={OFFER_SCOOTER} style={styles.scooter} contentFit="contain" pointerEvents="none" />
          </Animated.View>

          <View style={styles.sectionRow}>
            <Text style={styles.section}>Recent Transactions</Text>
            <Pressable hitSlop={8} onPress={showHistory} style={styles.seeAll}>
              <Text style={styles.link}>See all</Text>
              <Ionicons name="chevron-forward" size={14} color="#8A8496" />
            </Pressable>
          </View>
          <Animated.View entering={enter(3)} style={styles.list}>
            {rows.map((item, index) => {
              const look = txLook(item);
              return (
                <Pressable key={item.id} onPress={() => onOpenTx?.(item)} style={[styles.tx, index > 0 && styles.txLine]}>
                  <View style={[styles.txIcon, { backgroundColor: look.bg }]}>
                    <Ionicons name={look.icon} size={14} color={look.color} />
                  </View>
                  <View style={styles.txMain}>
                    <Text style={styles.txTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.txDetail}>{item.date}</Text>
                  </View>
                  <View style={styles.txSide}>
                    {item.amount ? (
                      <Text style={[styles.txAmount, item.credit ? styles.credit : styles.debit]}>
                        {item.amount}
                      </Text>
                    ) : null}
                    <View style={[styles.pill, { backgroundColor: look.pillBg }]}>
                      <Text style={[styles.pillText, { color: look.pillFg }]}>{look.pill}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
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

      {sheet ? (
        <View style={styles.shade}>
          <Pressable style={styles.shadeFill} onPress={() => setSheet(null)} />
          <View style={[styles.money, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.moneyHandle} />
            <Text style={styles.moneyTitle}>{sheet === 'add' ? 'Add money' : 'Withdraw'}</Text>
            <Text style={styles.moneySub}>
              {sheet === 'add'
                ? 'Choose an amount to keep in your wallet.'
                : 'Main balance can be withdrawn. The ₹250 deposit stays refundable.'}
            </Text>
            <View style={styles.amountRow}>
              {AMOUNTS.map((value) => {
                const active = !custom.trim() && picked === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => {
                      setCustom('');
                      setPicked(value);
                    }}
                    style={[styles.amountChip, active && styles.amountChipOn]}
                  >
                    <Text style={[styles.amountText, active && styles.amountTextOn]}>₹{value}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              keyboardType="number-pad"
              placeholder="Other amount"
              placeholderTextColor="#A39BB0"
              style={styles.amountInput}
            />
            <Pressable style={styles.moneyBtn} onPress={confirmSheet}>
              <Text style={styles.moneyBtnText}>
                {sheet === 'add' ? `Add ${moneyLabel(amount)}` : `Withdraw ${moneyLabel(amount)}`}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE,
  },
  scroll: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 2,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  round: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  historyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroRow: {
    marginTop: 6,
    paddingRight: 96,
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    zIndex: 1,
  },
  kicker: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 3,
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroSub: {
    marginTop: 5,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 15,
  },
  heroArt: {
    position: 'absolute',
    right: -6,
    bottom: -20,
    width: 104,
    height: 90,
    opacity: 0.46,
    zIndex: 1,
  },
  balanceCard: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingTop: 10,
    paddingBottom: 0,
    overflow: 'hidden',
    zIndex: 2,
  },
  balanceTop: {
    paddingLeft: 14,
    paddingRight: 100,
    minHeight: 82,
    justifyContent: 'center',
  },
  balanceCopy: {
    flex: 1,
  },
  balanceLabel: {
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '600',
  },
  balanceValue: {
    marginTop: 0,
    color: '#1C1430',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addFace: {
    marginTop: 7,
    alignSelf: 'flex-start',
    height: 30,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#6D28D9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cardArt: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 120,
    height: 78,
    opacity: 0.78,
  },
  cardRule: {
    marginTop: 6,
    height: 1,
    backgroundColor: '#F1EEF6',
  },
  statsBar: {
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOuter: {
    marginTop: 18,
    position: 'relative',
  },
  ledge: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: -7,
    height: 34,
    borderRadius: 28,
    backgroundColor: '#D8B4FE',
  },
  shell: {
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
  },
  showcase: {
    minHeight: 168,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  showcaseCopy: {
    flex: 1,
    paddingRight: 6,
  },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  split: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
  },
  splitItem: {
    flex: 1,
    alignItems: 'center',
  },
  splitValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#141414',
  },
  splitLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#8A8496',
    fontWeight: '600',
  },
  splitRule: {
    width: 1,
    height: 24,
    backgroundColor: '#EDE9FE',
  },
  section: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1430',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8496',
  },
  sectionRow: {
    marginTop: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8496',
  },
  actions: {
    flexDirection: 'row',
    gap: 9,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  statRule: {
    width: 1,
    height: 22,
    backgroundColor: '#EDE9FE',
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: '#2A1848',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowUpRight: {
    transform: [{ rotate: '45deg' }],
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  offer: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#2A0A5C',
    paddingLeft: 14,
    paddingRight: 112,
    paddingVertical: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  offerBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  offerCopy: {
    zIndex: 1,
  },
  offerKicker: {
    color: '#E9D5FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  offerTitle: {
    marginTop: 3,
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  offerSub: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.78)',
  },
  offerLink: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  offerLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B0764',
  },
  scooter: {
    position: 'absolute',
    right: -12,
    bottom: -4,
    width: 136,
    height: 122,
    zIndex: 1,
  },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
  },
  tx: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  txLine: {
    borderTopWidth: 1,
    borderTopColor: '#F4F0FA',
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconIn: {
    backgroundColor: '#E7F6EC',
  },
  txIconOut: {
    backgroundColor: '#FDECEC',
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
    marginTop: 1,
    fontSize: 11,
    color: '#8A8A8A',
  },
  txSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
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
  shade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    elevation: 40,
    justifyContent: 'flex-end',
  },
  shadeFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 20, 28, 0.28)',
  },
  money: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  moneyHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4DCEF',
    marginBottom: 14,
  },
  moneyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1C',
  },
  moneySub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#8A8496',
  },
  amountRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  amountChip: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountChipOn: {
    backgroundColor: PURPLE,
  },
  amountText: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '800',
  },
  amountTextOn: {
    color: '#FFFFFF',
  },
  amountInput: {
    marginTop: 12,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F6F1FC',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1C1C1C',
  },
  moneyBtn: {
    marginTop: 16,
    height: 50,
    borderRadius: 16,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
