import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet, last10, rupee, shortDate } from '../services/api';

const PURPLE = '#4A168C';
const PURPLE_DARK = '#25084A';
const PAGE = '#F7F7F8';

const DEFAULT_TRANSACTIONS = [
  {
    id: 'TXN-902148',
    title: 'EV Ride Reservation',
    detail: 'Gotri Zone · Evegah EV-1042',
    date: '28 Aug 2026, 04:30 PM',
    amount: '−₹120.00',
    credit: false,
    method: 'UPI · Google Pay',
    status: 'Completed',
    booking: 'EVG280826',
    category: 'ride',
    note: 'Evegah City · Gotri Hub to Gotri Hub · 2 hr ride',
  },
  {
    id: 'TXN-901844',
    title: 'Wallet Top-Up',
    detail: 'Razorpay UPI Payment',
    date: '28 Aug 2026, 01:15 PM',
    amount: '+₹500.00',
    credit: true,
    method: 'Razorpay UPI',
    status: 'Completed',
    category: 'topup',
    note: 'Instant wallet top-up via UPI',
  },
  {
    id: 'TXN-898420',
    title: 'Security Deposit Add',
    detail: 'Refundable Security Deposit',
    date: '27 Aug 2026, 09:20 AM',
    amount: '+₹250.00',
    credit: true,
    method: 'Wallet Main',
    status: 'Completed',
    category: 'deposit',
    note: '₹250.00 refundable deposit held for ride safety.',
  },
  {
    id: 'TXN-887123',
    title: 'Navratri Ride Cashback',
    detail: 'Festive Promo · NAVRATRI100',
    date: '25 Aug 2026, 08:45 PM',
    amount: '+₹100.00',
    credit: true,
    method: 'Promo Cashback',
    status: 'Completed',
    category: 'offers',
    note: 'Cashback credited to bonus wallet.',
  },
  {
    id: 'TXN-874219',
    title: 'EV Ride Hourly Extension',
    detail: 'Manjalpur Zone · EV-1039',
    date: '23 Aug 2026, 06:10 PM',
    amount: '−₹60.00',
    credit: false,
    method: 'Evegah Wallet',
    status: 'Completed',
    booking: 'EVG230819',
    category: 'ride',
    note: 'Extended rental for +1 hour.',
  },
  {
    id: 'TXN-865104',
    title: 'Welcome Bonus Credit',
    detail: 'Account Sign Up Reward',
    date: '20 Aug 2026, 11:00 AM',
    amount: '+₹50.00',
    credit: true,
    method: 'Evegah Credits',
    status: 'Completed',
    category: 'offers',
    note: 'First ride welcome bonus credit.',
  },
];

const FILTERS = [
  { id: 'all', label: 'All', icon: 'layers-outline' },
  { id: 'ride', label: 'Rides', icon: 'bicycle-outline' },
  { id: 'topup', label: 'Top-Up', icon: 'wallet-outline' },
  { id: 'deposit', label: 'Deposit', icon: 'shield-checkmark-outline' },
  { id: 'offers', label: 'Offers', icon: 'pricetag-outline' },
];

function getTxVisuals(tx) {
  const text = `${tx.title || ''} ${tx.detail || ''} ${tx.category || ''}`.toLowerCase();
  if (text.includes('offer') || text.includes('bonus') || text.includes('cashback')) {
    return {
      icon: 'pricetag',
      iconColor: '#F97316',
      iconBg: '#FFF4EC',
      pillText: 'Cashback',
      pillBg: '#FFF0E5',
      pillColor: '#EA580C',
    };
  }
  if (text.includes('ride') || text.includes('scooter') || text.includes('extension')) {
    return {
      icon: 'bicycle',
      iconColor: '#7C3AED',
      iconBg: '#F3EEFB',
      pillText: 'Ride Fare',
      pillBg: '#F4EEFC',
      pillColor: '#6D28D9',
    };
  }
  if (text.includes('deposit')) {
    return {
      icon: 'shield-checkmark',
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      pillText: 'Deposit',
      pillBg: '#E0EDFE',
      pillColor: '#1D4ED8',
    };
  }
  return {
    icon: tx.credit ? 'add' : 'arrow-up',
    iconColor: tx.credit ? '#16A34A' : '#4B5563',
    iconBg: tx.credit ? '#E8F8EF' : '#F3F4F6',
    pillText: tx.credit ? 'Credited' : 'Debited',
    pillBg: tx.credit ? '#E8F8EF' : '#F3F4F6',
    pillColor: tx.credit ? '#15803D' : '#4B5563',
  };
}

function buildInvoiceHtml(tx) {
  const isCredit = !!tx.credit;
  const amountStr = tx.amount || (isCredit ? '+₹500.00' : '−₹120.00');
  const dateStr = tx.date || '28 Aug 2026';
  const txnId = tx.id || `TXN-${Date.now().toString().slice(-8)}`;
  const bookingId = tx.booking || 'EVG280826';
  const method = tx.method || 'Razorpay UPI';
  const title = tx.title || 'Transaction';
  const detail = tx.detail || 'Evegah EV Services';
  const status = tx.status || 'Completed';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Evegah Transaction Receipt - ${txnId}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 36px 30px;
      color: #1C1C1C;
      background: #FFFFFF;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #F1ECF8;
    }
    .brand { font-size: 22px; font-weight: 900; color: #4A168C; letter-spacing: 2px; }
    .tagline { font-size: 11px; color: #8A8496; margin-top: 3px; letter-spacing: 0.5px; }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      background: #E8F8EF;
      color: #16A34A;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }
    .amount-box {
      margin: 24px 0 28px 0;
      padding: 22px;
      background: #FAF8FD;
      border-radius: 18px;
      border: 1px solid #EAE2F3;
      text-align: center;
    }
    .amount-label {
      font-size: 12px;
      color: #7E7690;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .amount-value {
      font-size: 34px;
      font-weight: 900;
      color: ${isCredit ? '#16A34A' : '#1C1C1C'};
      margin-top: 6px;
      letter-spacing: -0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    td {
      padding: 13px 0;
      border-bottom: 1px solid #F3EFF9;
      font-size: 13.5px;
    }
    td.label {
      color: #7E7690;
      font-weight: 600;
    }
    td.value {
      text-align: right;
      font-weight: 700;
      color: #1C1C1C;
    }
    .note-box {
      margin-top: 24px;
      padding: 14px 16px;
      background: #F7F5FA;
      border-radius: 12px;
      font-size: 12px;
      color: #5C5568;
      line-height: 1.5;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: #A39BB0;
      line-height: 1.6;
      border-top: 1px dashed #E5DFEF;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">EVEGAH</div>
      <div class="tagline">Zero Emission EV Mobility</div>
    </div>
    <div class="status-badge">${status}</div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Transaction Amount</div>
    <div class="amount-value">${amountStr}</div>
  </div>

  <table>
    <tr><td class="label">Transaction Title</td><td class="value">${title}</td></tr>
    <tr><td class="label">Category / Detail</td><td class="value">${detail}</td></tr>
    <tr><td class="label">Transaction ID</td><td class="value">${txnId}</td></tr>
    ${tx.booking ? `<tr><td class="label">Booking Reference</td><td class="value">${bookingId}</td></tr>` : ''}
    <tr><td class="label">Date &amp; Time</td><td class="value">${dateStr}</td></tr>
    <tr><td class="label">Payment Method</td><td class="value">${method}</td></tr>
    <tr><td class="label">Status</td><td class="value">${status}</td></tr>
  </table>

  ${tx.note ? `<div class="note-box"><strong>Note:</strong> ${tx.note}</div>` : ''}

  <div class="footer">
    Evegah Clean Mobility Pvt. Ltd. · Vadodara, Gujarat · India<br/>
    Support: support@evegah.com · Helpline: +91 9999999999<br/>
    This is an electronically generated receipt. No physical signature is required.
  </div>
</body>
</html>`;
}

export default function TransactionScreen({ tx: initialTx, onBack, phone, onOpenHelp }) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState(DEFAULT_TRANSACTIONS);
  const [selectedTx, setSelectedTx] = useState(initialTx || null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // If initialTx was provided on open, make sure it's active
  useEffect(() => {
    if (initialTx) {
      setSelectedTx(initialTx);
    }
  }, [initialTx]);

  // Fetch live transactions if phone provided
  const loadTransactions = async () => {
    const mobile = last10(phone);
    if (!mobile) return;
    try {
      const body = await apiGet(`/wallet/transactions?mobile=${mobile}`);
      const list = body?.data || [];
      if (list.length > 0) {
        const mapped = list.map((item) => {
          const kind = String(item.type || '').toLowerCase();
          const credit = kind === 'credit' || kind.includes('add') || kind.includes('deposit');
          const isDeposit = kind.includes('deposit');
          const isRide = kind.includes('ride') || kind.includes('booking');
          const category = isRide ? 'ride' : isDeposit ? 'deposit' : credit ? 'topup' : 'other';
          return {
            id: String(item.transaction_id || item.id || `TXN-${item.id}`),
            title: item.title || (credit ? 'Wallet Top-Up' : 'EV Ride Payment'),
            detail: item.subtitle || item.payment_method || 'Razorpay UPI',
            date: shortDate(item.created_at) || 'Recent',
            amount: rupee(item.amount, credit),
            credit,
            method: item.payment_method || 'UPI',
            status: item.status || 'Completed',
            booking: item.booking_id || item.booking || undefined,
            category,
            note: item.note || undefined,
          };
        });
        setTransactions(mapped);
      }
    } catch {
      // Fallback to default mock list
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [phone]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const copyToClipboard = async (text, key) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 1500);
  };

  const handleDownloadPdf = async (item) => {
    if (!item) return;
    try {
      setIsExporting(true);
      const html = buildInvoiceHtml(item);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Evegah Receipt - ${item.id || 'Transaction'}`,
      });
    } catch (err) {
      Alert.alert('Export Error', 'Unable to generate receipt PDF at this time.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter and search
  const filteredList = useMemo(() => {
    return transactions.filter((item) => {
      // Filter by category
      if (activeFilter !== 'all') {
        const text = `${item.title || ''} ${item.detail || ''} ${item.category || ''}`.toLowerCase();
        if (activeFilter === 'ride' && !text.includes('ride') && !text.includes('scooter') && item.category !== 'ride') {
          return false;
        }
        if (activeFilter === 'topup' && !text.includes('top-up') && !text.includes('add') && item.category !== 'topup') {
          return false;
        }
        if (activeFilter === 'deposit' && !text.includes('deposit') && item.category !== 'deposit') {
          return false;
        }
        if (activeFilter === 'offers' && !text.includes('offer') && !text.includes('bonus') && !text.includes('cashback') && item.category !== 'offers') {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const haystack = `${item.title || ''} ${item.detail || ''} ${item.id || ''} ${item.booking || ''} ${item.amount || ''} ${item.method || ''}`.toLowerCase();
        return haystack.includes(query);
      }
      return true;
    });
  }, [transactions, activeFilter, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    transactions.forEach((item) => {
      const rawNum = Math.abs(parseFloat(String(item.amount || '0').replace(/[^0-9.]/g, '')) || 0);
      if (item.credit) totalIn += rawNum;
      else totalOut += rawNum;
    });
    return {
      inflow: `₹${Math.round(totalIn).toLocaleString('en-IN')}`,
      outflow: `₹${Math.round(totalOut).toLocaleString('en-IN')}`,
      count: transactions.length,
    };
  }, [transactions]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={10} style={styles.roundBackBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <Pressable
          hitSlop={10}
          style={styles.roundActionBtn}
          onPress={() => {
            if (filteredList.length > 0) {
              handleDownloadPdf(filteredList[0]);
            } else {
              Alert.alert('Notice', 'No transactions found to download.');
            }
          }}
          disabled={isExporting}
        >
          <Ionicons name="download-outline" size={18} color={PURPLE} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
      >
        {/* Financial Summary Card (Evegah Signature Gradient) */}
        <Animated.View entering={cardEnter(0)} style={styles.summaryCardWrapper}>
          <LinearGradient
            colors={['#25084A', '#4A168C', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryCardGlow} pointerEvents="none" />
            <View style={styles.summaryHeaderRow}>
              <View>
                <Text style={styles.summaryKicker}>FINANCIAL OVERVIEW</Text>
                <Text style={styles.summaryTitle}>Wallet Activity</Text>
              </View>
              <View style={styles.summaryBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#4ADE80" />
                <Text style={styles.summaryBadgeText}>100% Verified</Text>
              </View>
            </View>

            <View style={styles.summaryMetricsRow}>
              <View style={styles.summaryMetricCol}>
                <Text style={styles.metricLabel}>Total Spent</Text>
                <Text style={styles.metricValueOut}>{stats.outflow}</Text>
                <View style={styles.metricSubRow}>
                  <Ionicons name="arrow-up-circle" size={12} color="#F87171" />
                  <Text style={styles.metricSubText}>Debited for rides</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryMetricCol}>
                <Text style={styles.metricLabel}>Total Added</Text>
                <Text style={styles.metricValueIn}>{stats.inflow}</Text>
                <View style={styles.metricSubRow}>
                  <Ionicons name="arrow-down-circle" size={12} color="#4ADE80" />
                  <Text style={styles.metricSubText}>Top-up &amp; Deposits</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={cardEnter(1)} style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={17} color="#8A8496" style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by ID, booking, or amount..."
              placeholderTextColor="#A39BB0"
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 ? (
              <Pressable hitSlop={8} onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                <Ionicons name="close-circle" size={17} color="#8A8496" />
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {/* Filter Chips */}
        <Animated.View entering={cardEnter(2)} style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
            {FILTERS.map((f) => {
              const active = activeFilter === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setActiveFilter(f.id)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Ionicons name={f.icon} size={14} color={active ? '#FFFFFF' : '#6E6878'} />
                  <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Transactions <Text style={styles.sectionCount}>({filteredList.length})</Text>
          </Text>
          {activeFilter !== 'all' || searchQuery ? (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
            >
              <Text style={styles.resetFilterText}>Reset filter</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Transaction Cards List */}
        {filteredList.length === 0 ? (
          <Animated.View entering={FadeIn.duration(250)} style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={32} color="#B6AEC4" />
            </View>
            <Text style={styles.emptyTitle}>No Transactions Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? `No results matching "${searchQuery}"` : 'There are no transactions in this category.'}
            </Text>
            <Pressable
              style={styles.emptyActionBtn}
              onPress={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
            >
              <Text style={styles.emptyActionText}>Show All Transactions</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={cardEnter(3)} style={styles.listCard}>
            {filteredList.map((item, index) => {
              const visuals = getTxVisuals(item);
              const isLast = index === filteredList.length - 1;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedTx(item)}
                  style={[styles.txItem, !isLast && styles.txItemBorder]}
                >
                  <View style={[styles.txIconWrap, { backgroundColor: visuals.iconBg }]}>
                    <Ionicons name={visuals.icon} size={18} color={visuals.iconColor} />
                  </View>

                  <View style={styles.txMainInfo}>
                    <View style={styles.txTopRow}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.txAmount, item.credit && styles.txAmountCredit]}>
                        {item.amount}
                      </Text>
                    </View>

                    <Text style={styles.txDetail} numberOfLines={1}>
                      {item.detail}
                    </Text>

                    <View style={styles.txBottomRow}>
                      <View style={styles.txDateRow}>
                        <Ionicons name="time-outline" size={11} color="#A39BB0" />
                        <Text style={styles.txDateText}>{item.date}</Text>
                      </View>
                      <View style={[styles.txStatusPill, { backgroundColor: visuals.pillBg }]}>
                        <Text style={[styles.txStatusText, { color: visuals.pillColor }]}>
                          {visuals.pillText}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={15} color="#C4BED0" style={styles.txChevron} />
                </Pressable>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>

      {/* Transaction Detail / Receipt Modal */}
      {selectedTx ? (
        <Modal
          visible={!!selectedTx}
          animationType="slide"
          presentationStyle="fullScreen"
          statusBarTranslucent
          onRequestClose={() => setSelectedTx(null)}
        >
          <View style={[styles.modalRoot, { paddingTop: insets.top + 6 }]}>
            <StatusBar style="dark" />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable
                hitSlop={10}
                style={styles.roundBackBtn}
                onPress={() => {
                  setSelectedTx(null);
                  if (initialTx && !phone) {
                    onBack?.();
                  }
                }}
              >
                <Ionicons name="close" size={20} color="#1C1C1C" />
              </Pressable>
              <Text style={styles.headerTitle}>Receipt Details</Text>
              <Pressable
                hitSlop={10}
                style={styles.roundActionBtn}
                onPress={() => handleDownloadPdf(selectedTx)}
                disabled={isExporting}
              >
                <Ionicons name="share-outline" size={18} color={PURPLE} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom, 20) + 20,
                paddingHorizontal: 16,
              }}
            >
              {/* Receipt Hero Card */}
              <Animated.View entering={FadeInDown.duration(280)} style={styles.receiptHeroCard}>
                <View style={styles.receiptStatusHalo}>
                  <View style={styles.receiptStatusCheck}>
                    <Ionicons name="checkmark-sharp" size={22} color="#FFFFFF" />
                  </View>
                </View>

                <Text style={styles.receiptStatusLabel}>{selectedTx.status || 'Payment Successful'}</Text>
                <Text style={[styles.receiptAmount, selectedTx.credit && styles.receiptAmountCredit]}>
                  {selectedTx.amount || (selectedTx.credit ? '+₹500.00' : '−₹120.00')}
                </Text>
                <Text style={styles.receiptTitle}>{selectedTx.title}</Text>
                <Text style={styles.receiptDetail}>{selectedTx.detail}</Text>
              </Animated.View>

              {/* Breakdown Details Card */}
              <Animated.View entering={FadeInDown.duration(320).delay(80)} style={styles.receiptDetailsCard}>
                <Text style={styles.receiptSectionHeading}>TRANSACTION SUMMARY</Text>

                {/* Reference ID with Copy */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Pressable
                    hitSlop={8}
                    style={styles.copyableRow}
                    onPress={() => copyToClipboard(selectedTx.id, 'id')}
                  >
                    <Text style={styles.detailValuePrimary}>{selectedTx.id}</Text>
                    <Ionicons
                      name={copiedKey === 'id' ? 'checkmark-circle' : 'copy-outline'}
                      size={15}
                      color={copiedKey === 'id' ? '#16A34A' : PURPLE}
                    />
                  </Pressable>
                </View>

                {/* Booking ID with Copy (if exists) */}
                {selectedTx.booking ? (
                  <View style={[styles.detailRow, styles.detailRowBorder]}>
                    <Text style={styles.detailLabel}>Booking Reference</Text>
                    <Pressable
                      hitSlop={8}
                      style={styles.copyableRow}
                      onPress={() => copyToClipboard(selectedTx.booking, 'booking')}
                    >
                      <Text style={styles.detailValuePrimary}>{selectedTx.booking}</Text>
                      <Ionicons
                        name={copiedKey === 'booking' ? 'checkmark-circle' : 'copy-outline'}
                        size={15}
                        color={copiedKey === 'booking' ? '#16A34A' : PURPLE}
                      />
                    </Pressable>
                  </View>
                ) : null}

                {/* Date & Time */}
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <Text style={styles.detailLabel}>Date &amp; Time</Text>
                  <Text style={styles.detailValue}>{selectedTx.date}</Text>
                </View>

                {/* Payment Method */}
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <View style={styles.methodPill}>
                    <Ionicons name="card-outline" size={13} color="#4A168C" />
                    <Text style={styles.methodPillText}>{selectedTx.method || 'UPI'}</Text>
                  </View>
                </View>

                {/* Status */}
                <View style={[styles.detailRow, styles.detailRowBorder]}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.successBadge}>
                    <View style={styles.successDot} />
                    <Text style={styles.successBadgeText}>{selectedTx.status || 'Completed'}</Text>
                  </View>
                </View>

                {/* Note (if exists) */}
                {selectedTx.note ? (
                  <View style={[styles.detailRow, styles.detailRowBorder]}>
                    <Text style={styles.detailLabel}>Details</Text>
                    <Text style={styles.detailNote}>{selectedTx.note}</Text>
                  </View>
                ) : null}
              </Animated.View>

              {/* Action Buttons */}
              <Animated.View entering={FadeInUp.duration(320).delay(120)} style={styles.modalActionButtons}>
                <Pressable
                  style={styles.downloadPdfBtn}
                  onPress={() => handleDownloadPdf(selectedTx)}
                  disabled={isExporting}
                >
                  <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.downloadPdfText}>
                    {isExporting ? 'Generating PDF...' : 'Download PDF Receipt'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.needHelpBtn}
                  onPress={() => {
                    setSelectedTx(null);
                    onOpenHelp?.();
                  }}
                >
                  <Ionicons name="help-buoy-outline" size={17} color={PURPLE} />
                  <Text style={styles.needHelpText}>Need Help with this Ride?</Text>
                </Pressable>
              </Animated.View>
            </ScrollView>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF5',
  },
  roundBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3EEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3EEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1C1C1C',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  summaryCardWrapper: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  summaryCardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryKicker: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D8B4FE',
    letterSpacing: 1.2,
  },
  summaryTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  summaryMetricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E9D5FF',
    marginBottom: 2,
  },
  metricValueOut: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  metricValueIn: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4ADE80',
    letterSpacing: -0.2,
  },
  metricSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metricSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C4B5FD',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginHorizontal: 12,
  },
  searchRow: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#ECE7F3',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1C1C1C',
    height: '100%',
  },
  searchClearBtn: {
    padding: 4,
  },
  filtersWrapper: {
    marginTop: 12,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3F0',
  },
  filterChipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  filterLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#5C5568',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1C',
    letterSpacing: -0.2,
  },
  sectionCount: {
    color: '#8A8496',
    fontWeight: '600',
  },
  resetFilterText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PURPLE,
  },
  listCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEBF5',
    overflow: 'hidden',
    shadowColor: '#160E29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  txItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F4F1F8',
  },
  txIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txMainInfo: {
    flex: 1,
  },
  txTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  txTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1C',
  },
  txAmount: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1C1C1C',
  },
  txAmountCredit: {
    color: '#16A34A',
  },
  txDetail: {
    fontSize: 12,
    color: '#7E7690',
    fontWeight: '500',
    marginTop: 2,
  },
  txBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  txDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  txDateText: {
    fontSize: 11,
    color: '#9E97AA',
    fontWeight: '500',
  },
  txStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  txChevron: {
    marginLeft: 6,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE7F3',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F6F3FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1C',
  },
  emptySub: {
    fontSize: 13,
    color: '#8A8496',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3EEFB',
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE,
  },

  // Modal Styles
  modalRoot: {
    flex: 1,
    backgroundColor: PAGE,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptHeroCard: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEBF5',
    shadowColor: '#160E29',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  receiptStatusHalo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E8F8EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  receiptStatusCheck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptStatusLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  receiptAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1C1C1C',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  receiptAmountCredit: {
    color: '#16A34A',
  },
  receiptTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1C1C',
    marginTop: 6,
    textAlign: 'center',
  },
  receiptDetail: {
    fontSize: 13,
    color: '#7E7690',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  receiptDetailsCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFEBF5',
  },
  receiptSectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A8496',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  detailRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3EFF8',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7E7690',
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  detailValuePrimary: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PURPLE,
  },
  copyableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3EEFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  methodPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F8EF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  successDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  successBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  detailNote: {
    maxWidth: '60%',
    textAlign: 'right',
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalActionButtons: {
    marginTop: 18,
    gap: 10,
  },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PURPLE,
    height: 52,
    borderRadius: 16,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  downloadPdfText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  needHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DAEE',
    height: 48,
    borderRadius: 16,
  },
  needHelpText: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: '700',
  },
});
