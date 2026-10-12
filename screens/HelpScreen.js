import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#4A168C';
const PHONE = '+919876543210';
const EMAIL = 'support@evegah.com';

const FAQS = [
  {
    q: 'How do I unlock a scooter?',
    a: 'Open Scan and tap the frame, or unlock a scooter next to you from Bluetooth.',
  },
  {
    q: 'What if the battery dies mid-ride?',
    a: 'If the battery drops below 10%, park in a zone and end the ride. You can swap scooters.',
  },
  {
    q: 'Where should I park?',
    a: 'Park in an Evegah zone shown on the map.',
  },
  {
    q: 'How do I top up my wallet?',
    a: 'Open Wallet, add an amount, and pay with UPI or card.',
  },
  {
    q: 'How do I cancel a booking?',
    a: 'Call or email support. They will help with the booking.',
  },
  {
    q: 'How can I change my pickup time?',
    a: 'Set the time on the rent page before you pay. After that, call support.',
  },
  {
    q: 'How does the security deposit work?',
    a: 'The deposit is ₹250 and refundable. Pay it at checkout, or later before pickup.',
  },
  {
    q: 'What if the scooter has a problem?',
    a: 'Park in a zone, end the ride, and call support.',
  },
];

export default function HelpScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const needle = query.trim().toLowerCase();
  const visible = FAQS.filter((item) => item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Safety & Help</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <Text style={styles.kicker}>Support</Text>
          <Text style={styles.title}>We are here</Text>
          <Text style={styles.subtitle}>Mon – Sun, 8:00 AM to 10:00 PM</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search questions"
            placeholderTextColor="#A39AAD"
            style={styles.field}
          />
        </Animated.View>

        <Animated.View entering={cardEnter(1)} style={styles.contacts}>
          <Pressable onPress={() => Linking.openURL(`tel:${PHONE}`)} style={styles.contact}>
            <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={18} color={PURPLE} />
            </View>
            <View style={styles.contactCopy}>
              <Text style={styles.contactTitle}>Call</Text>
              <Text style={styles.contactText}>+91 98765 43210</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C8C8CC" />
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`mailto:${EMAIL}`)} style={[styles.contact, styles.contactLine]}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={18} color={PURPLE} />
            </View>
            <View style={styles.contactCopy}>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactText}>{EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C8C8CC" />
          </Pressable>
        </Animated.View>

        <Text style={styles.section}>Questions</Text>
        <Animated.View entering={cardEnter(2)} style={styles.list}>
          {visible.length === 0 ? (
            <Text style={styles.empty}>No matching question.</Text>
          ) : (
            visible.map((item, index) => {
              const on = open === item.q;
              return (
                <Pressable
                  key={item.q}
                  onPress={() => setOpen(on ? null : item.q)}
                  style={[styles.row, index > 0 && styles.rowLine]}
                >
                  <View style={styles.rowTop}>
                    <Text style={styles.question}>{item.q}</Text>
                    <Ionicons name={on ? 'chevron-up' : 'chevron-down'} size={16} color="#8A8496" />
                  </View>
                  {on ? (
                    <Animated.Text entering={FadeIn.duration(180)} style={styles.answer}>
                      {item.a}
                    </Animated.Text>
                  ) : null}
                </Pressable>
              );
            })
          )}
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
  },
  field: {
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F7F7F8',
    paddingHorizontal: 14,
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '600',
  },
  contacts: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  contactLine: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCopy: {
    flex: 1,
  },
  contactTitle: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  contactText: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 13,
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 20,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
  },
  row: {
    paddingVertical: 14,
  },
  rowLine: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  question: {
    flex: 1,
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  answer: {
    marginTop: 8,
    color: '#6E6878',
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    paddingVertical: 18,
    color: '#8A8496',
    fontSize: 14,
  },
});
