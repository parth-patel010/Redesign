import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet, apiPost, last10, shortDate } from '../services/api';

const PURPLE = '#4A168C';
const FILTERS = ['All', 'Rides', 'Wallet', 'Offers', 'System'];

function kindFor(type) {
  const value = String(type || '').toLowerCase();
  if (value.includes('ride') || value.includes('book')) return 'Rides';
  if (value.includes('pay') || value.includes('wallet')) return 'Wallet';
  if (value.includes('promo') || value.includes('offer')) return 'Offers';
  return 'System';
}

export default function NotificationsScreen({ notes, phone, onRead, onReadAll, onBack }) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
  const [items, setItems] = useState(notes || []);

  useEffect(() => {
    const mobile = last10(phone);
    if (!mobile) return;
    apiGet(`/notifications?mobile=${mobile}`)
      .then((body) => {
        const rows = body?.data || [];
        if (!rows.length) return;
        setItems(rows.map((item) => ({
          id: String(item.id),
          kind: kindFor(item.type),
          title: item.title,
          text: item.message,
          time: shortDate(item.created_at),
          read: Boolean(item.read),
        })));
      })
      .catch(() => {});
  }, [phone]);

  const handleReadAll = () => {
    setItems((list) => list.map((item) => ({ ...item, read: true })));
    const mobile = last10(phone);
    if (mobile) {
      apiPost('/notifications/mark-read', { all: true, mobile }).catch(() => {});
    }
    onReadAll?.();
  };

  const handleReadOne = (item) => {
    setItems((list) => list.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
    const mobile = last10(phone);
    if (mobile && !item.read) {
      apiPost('/notifications/mark-read', { id: item.id, mobile }).catch(() => {});
    }
    onRead?.(item.id);
  };

  const visible = items.filter((item) => filter === 'All' || item.kind === filter);
  const unread = items.some((item) => !item.read);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          hitSlop={8}
          disabled={!unread}
          onPress={handleReadAll}
          style={styles.mark}
        >
          <Text style={[styles.markText, !unread && styles.markOff]}>Read all</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((item) => {
          const on = filter === item;
          return (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        {visible.length === 0 ? (
          <Text style={styles.empty}>Nothing in {filter.toLowerCase()}.</Text>
        ) : (
          <Animated.View entering={cardEnter(0)} style={styles.list}>
            {visible.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => handleReadOne(item)}
                style={[styles.row, index > 0 && styles.rowLine]}
              >
                <View style={[styles.dot, item.read && styles.dotRead]} />
                <View style={styles.copy}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.text}>{item.text}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>
        )}
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
  mark: {
    minWidth: 64,
    alignItems: 'flex-end',
  },
  markText: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '700',
  },
  markOff: {
    color: '#C8C0D4',
  },
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: PURPLE,
  },
  chipText: {
    color: '#3C3846',
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextOn: {
    color: '#FFFFFF',
  },
  list: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  rowLine: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: PURPLE,
  },
  dotRead: {
    backgroundColor: '#E4DEEC',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  text: {
    marginTop: 4,
    color: '#6E6878',
    fontSize: 13,
    lineHeight: 18,
  },
  time: {
    marginTop: 6,
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    marginTop: 24,
    marginHorizontal: 20,
    color: '#8A8496',
    fontSize: 14,
  },
});
