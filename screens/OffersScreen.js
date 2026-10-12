import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet } from '../services/api';

const PURPLE = '#4A168C';

const OFFERS = [
  {
    code: 'EVE20',
    title: '₹40 off this ride',
    detail: 'Apply this on checkout',
  },
  {
    code: 'GET100',
    title: 'Flat ₹100 off',
    detail: 'Min booking ₹300 · till 31 Dec 2026',
    best: true,
  },
  {
    code: 'WELCOME50',
    title: '₹50 off your first ride',
    detail: 'Valid till 31 Dec 2026',
  },
  {
    code: 'RIDER50',
    title: '₹50 off your next 3 rides',
    detail: 'Min booking ₹150 · till 31 Dec 2026',
  },
  {
    code: 'GREENWEEK',
    title: '50% off next 3 rides',
    detail: 'Max ₹50 a ride · till 30 Nov',
  },
  {
    code: 'FESTIVE25',
    title: '₹25 off Pro rides',
    detail: 'Evegah Pro only · till 15 Dec',
  },
];

export default function OffersScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [offers, setOffers] = useState(OFFERS);
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    apiGet('/coupons')
      .then((body) => {
        const rows = (body?.data || []).filter((item) => !item.status || item.status === 'Active');
        if (!rows.length) return;
        setOffers(rows.map((item) => ({
          code: item.code,
          title: item.title || item.code,
          detail: item.description || 'Save on your next ride',
          best: item.code === 'GET100',
        })));
      })
      .catch(() => {});
  }, []);

  const apply = () => {
    const code = query.trim().toUpperCase();
    if (!code) return;
    const found = offers.find((offer) => offer.code === code);
    setNote(found ? `${found.code} is active` : 'That code is not active');
  };

  const copy = async (code) => {
    await Clipboard.setStringAsync(code);
    setCopied(code);
    setTimeout(() => setCopied((current) => (current === code ? '' : current)), 1400);
  };

  const active = query.trim().toUpperCase();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Offers</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <Text style={styles.kicker}>Promotions</Text>
          <Text style={styles.title}>Save on a ride</Text>
          <Text style={styles.subtitle}>EVE20 is the code checkout can apply.</Text>
          <View style={styles.fieldRow}>
            <TextInput
              value={query}
              onChangeText={(value) => {
                setQuery(value.toUpperCase());
                setNote('');
              }}
              placeholder="Enter a code"
              placeholderTextColor="#A39AAD"
              autoCapitalize="characters"
              style={styles.field}
            />
            <Pressable onPress={apply} style={styles.apply}>
              <Text style={styles.applyText}>Apply</Text>
            </Pressable>
          </View>
          {note ? <Text style={styles.note}>{note}</Text> : null}
        </Animated.View>

        <Animated.View entering={cardEnter(1)} style={styles.list}>
          {offers.map((offer, index) => {
            const on = active === offer.code && note.endsWith('is active');
            return (
              <View key={offer.code} style={[styles.row, index > 0 && styles.rowLine, on && styles.rowOn]}>
                <View style={styles.copy}>
                  <View style={styles.codeRow}>
                    <Text style={styles.code}>{offer.code}</Text>
                    {offer.best ? <Text style={styles.best}>Best</Text> : null}
                  </View>
                  <Text style={styles.rowTitle}>{offer.title}</Text>
                  <Text style={styles.rowText}>{offer.detail}</Text>
                </View>
                <Pressable hitSlop={8} onPress={() => copy(offer.code)} style={styles.copyBtn}>
                  <Ionicons name={copied === offer.code ? 'checkmark' : 'copy-outline'} size={15} color={PURPLE} />
                  <Text style={styles.copyText}>{copied === offer.code ? 'Copied' : 'Copy'}</Text>
                </Pressable>
              </View>
            );
          })}
        </Animated.View>
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
    padding: 16,
  },
  kicker: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    marginTop: 6,
    color: '#1C1C1C',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: '#6E6878',
    fontSize: 14,
    lineHeight: 20,
  },
  fieldRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  field: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F7F7F8',
    paddingHorizontal: 14,
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  apply: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  note: {
    marginTop: 10,
    color: PURPLE,
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowLine: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  rowOn: {
    backgroundColor: '#F6F1FC',
    marginHorizontal: -14,
    paddingHorizontal: 14,
  },
  copy: {
    flex: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  code: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  best: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#F6F1FC',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rowTitle: {
    marginTop: 4,
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  rowText: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F6F1FC',
  },
  copyText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
});
