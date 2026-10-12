import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#4A168C';

export default function TransactionScreen({ tx, onBack }) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  if (!tx) return null;

  const copy = async () => {
    if (!tx.booking) return;
    await Clipboard.setStringAsync(tx.booking);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const rows = [
    { label: 'Date', value: tx.date },
    { label: 'Status', value: tx.status || 'Completed' },
    { label: 'Method', value: tx.method },
    tx.booking ? { label: 'Booking', value: tx.booking, copy: true } : null,
    tx.note ? { label: 'Note', value: tx.note } : null,
  ].filter(Boolean);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <Text style={styles.kicker}>{tx.credit ? 'Added' : 'Paid'}</Text>
          <Text style={styles.title}>{tx.title}</Text>
          <Text style={styles.detail}>{tx.detail}</Text>
          {tx.amount ? (
            <Text style={[styles.amount, tx.credit && styles.amountIn]}>{tx.amount}</Text>
          ) : (
            <Text style={styles.noAmount}>Amount is on the Razorpay receipt</Text>
          )}
        </Animated.View>

        <Animated.View entering={cardEnter(1)} style={styles.list}>
          {rows.map((row, index) => (
            <View key={row.label} style={[styles.row, index > 0 && styles.rowLine]}>
              <Text style={styles.label}>{row.label}</Text>
              <View style={styles.valueWrap}>
                <Text style={styles.value}>{row.value}</Text>
                {row.copy ? (
                  <Pressable hitSlop={8} onPress={copy}>
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={PURPLE} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </Animated.View>

        {copied ? (
          <Animated.Text entering={FadeIn.duration(180)} style={styles.copied}>
            Booking copied
          </Animated.Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1C1C1C',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSide: {
    width: 36,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  kicker: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    marginTop: 6,
    color: '#1C1C1C',
    fontSize: 22,
    fontWeight: '800',
  },
  detail: {
    marginTop: 6,
    color: '#6E6878',
    fontSize: 14,
  },
  amount: {
    marginTop: 14,
    color: '#1C1C1C',
    fontSize: 28,
    fontWeight: '800',
  },
  amountIn: {
    color: '#1F8A4C',
  },
  noAmount: {
    marginTop: 14,
    color: '#8A8496',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  row: {
    paddingVertical: 14,
  },
  rowLine: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  label: {
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '700',
  },
  valueWrap: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: {
    flex: 1,
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  copied: {
    marginTop: 12,
    marginHorizontal: 20,
    color: '#1F8A4C',
    fontSize: 13,
    fontWeight: '700',
  },
});
