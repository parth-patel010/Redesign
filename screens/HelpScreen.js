import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { getKnowledge, getSystemSettings } from '../services/api';
const SUPPORT_ART = require('../assets/help/support-art.png');

const PURPLE = '#4A168C';
const PHONE = '+919876543210';
const EMAIL = 'support@evegah.com';

const FAQS = [
  { q: 'How do I unlock a scooter?', a: 'Open Scan and tap the frame, or unlock a scooter next to you from Bluetooth.' },
  { q: 'What if the battery dies mid-ride?', a: 'If the battery drops below 10%, park in a zone and end the ride. You can swap scooters.' },
  { q: 'Where should I park?', a: 'Park in an Evegah zone shown on the map.' },
  { q: 'How do I top up my wallet?', a: 'Open Wallet, add an amount, and pay with UPI or card.' },
  { q: 'How do I cancel a booking?', a: 'Call or email support. They will help with the booking.' },
  { q: 'How can I change my pickup time?', a: 'Set the time on the rent page before you pay. After that, call support.' },
  { q: 'How does the security deposit work?', a: 'The deposit is ₹250 and refundable. Pay it at checkout, or later before pickup.' },
  { q: 'What if the scooter has a problem?', a: 'Park in a zone, end the ride, and call support.' },
];

const PROMPTS = ['Unlock', 'Parking', 'Wallet', 'Deposit'];

function replyFor(text) {
  const q = text.toLowerCase();
  if (q.includes('unlock') || q.includes('scan') || q.includes('bluetooth')) {
    return 'Open Scan and frame the code, or connect from Bluetooth if the scooter is beside you.';
  }
  if (q.includes('battery') || q.includes('charge')) {
    return 'If the battery falls under 10%, park in a zone and end the ride. You can take another scooter.';
  }
  if (q.includes('park') || q.includes('zone')) {
    return 'Park inside an Evegah zone on the map so the ride can close cleanly.';
  }
  if (q.includes('wallet') || q.includes('upi') || q.includes('pay')) {
    return 'Open Wallet, choose an amount, and pay with UPI. The balance is ready for the next ride.';
  }
  if (q.includes('cancel') || q.includes('booking')) {
    return 'Share the booking id here, or call +91 98765 43210 and the team will close it.';
  }
  if (q.includes('deposit')) {
    return 'The security deposit is ₹250. It is paid at checkout and returned after a clean ride.';
  }
  if (q.includes('helmet')) {
    return 'A helmet is included with the ride and shows on your bill.';
  }
  return 'I can help with unlocking, parking, the wallet, or a booking. You can also call +91 98765 43210.';
}

export default function HelpScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const [chatOn, setChatOn] = useState(false);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [faqs, setFaqs] = useState(FAQS);
  const [supportPhone, setSupportPhone] = useState(PHONE);
  const [supportEmail, setSupportEmail] = useState(EMAIL);
  const [messages, setMessages] = useState([
    { id: 'hi', from: 'team', text: 'Hi, this is Evegah support. Ask about a ride, the wallet, or parking.' },
  ]);

  useEffect(() => {
    getKnowledge()
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) {
          const apiFaqs = rows.map((r) => ({
            q: r.title,
            a: r.description,
          }));
          setFaqs((prev) => [...apiFaqs, ...prev]);
        }
      })
      .catch(() => {});

    getSystemSettings()
      .then((body) => {
        const gen = body?.data?.general;
        if (gen?.support_phone) setSupportPhone(gen.support_phone);
        if (gen?.support_email) setSupportEmail(gen.support_email);
      })
      .catch(() => {});
  }, []);

  const needle = query.trim().toLowerCase();
  const visible = faqs.filter((item) => item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle));

  const send = (text) => {
    const body = text.trim();
    if (!body || typing) return;
    const mine = { id: `${Date.now()}`, from: 'me', text: body };
    setMessages((list) => [...list, mine]);
    setDraft('');
    setTyping(true);
    setTimeout(() => {
      setMessages((list) => [...list, { id: `${Date.now()}-r`, from: 'team', text: replyFor(body) }]);
      setTyping(false);
    }, 700);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>SUPPORT</Text>
            <Text style={styles.title}>We're here to help</Text>
            <Text style={styles.subtitle}>Mon – Sun, 8:00 AM to 10:00 PM</Text>
          </View>
          <Image source={SUPPORT_ART} style={styles.heroArt} contentFit="contain" contentPosition="right" />
        </Animated.View>

        <Pressable onPress={() => setChatOn(true)}>
          <LinearGradient
            colors={['#7C3AED', '#6D28D9', '#5B21B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.live}
          >
            <View style={styles.liveIcon}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.liveCopy}>
              <Text style={styles.liveTitle}>Live chat</Text>
              <Text style={styles.liveText}>Talk with support about a ride</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        <View style={styles.contacts}>
          <Pressable style={styles.contact} onPress={() => Linking.openURL(`tel:${supportPhone}`)}>
            <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={18} color={PURPLE} />
            </View>
            <Text style={styles.contactTitle}>Call</Text>
            <Text style={styles.contactText}>{supportPhone}</Text>
          </Pressable>
          <Pressable style={styles.contact} onPress={() => Linking.openURL(`mailto:${supportEmail}`)}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={18} color={PURPLE} />
            </View>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactText}>{supportEmail}</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#8A8496" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search questions"
            placeholderTextColor="#A39AAD"
            style={styles.field}
          />
        </View>

        <Text style={styles.section}>Frequently asked questions</Text>
        <Animated.View layout={LinearTransition.duration(320)} entering={cardEnter(2)} style={styles.list}>
          {visible.length === 0 ? (
            <Text style={styles.empty}>No matching question.</Text>
          ) : (
            visible.map((item, index) => {
              const on = open === item.q;
              return (
                <Animated.View
                  key={item.q}
                  layout={LinearTransition.duration(320).easing(Easing.out(Easing.cubic))}
                  style={[styles.row, index > 0 && styles.rowLine]}
                >
                  <Pressable onPress={() => setOpen(on ? null : item.q)}>
                    <View style={styles.rowTop}>
                      <Text style={styles.question}>{item.q}</Text>
                      <Ionicons name={on ? 'chevron-up' : 'chevron-down'} size={16} color="#8A8496" />
                    </View>
                    {on ? (
                      <Animated.Text
                        entering={FadeInDown.duration(320).easing(Easing.out(Easing.cubic))}
                        style={styles.answer}
                      >
                        {item.a}
                      </Animated.Text>
                    ) : null}
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>

      {chatOn ? (
        <KeyboardAvoidingView style={styles.chatRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.chatHead, { paddingTop: insets.top + 8 }]}>
            <Pressable hitSlop={8} style={styles.back} onPress={() => setChatOn(false)}>
              <Ionicons name="chevron-down" size={20} color="#1C1C1C" />
            </Pressable>
            <View>
              <Text style={styles.chatTitle}>Live chat</Text>
              <Text style={styles.chatSub}>Evegah support</Text>
            </View>
            <View style={styles.headerSide} />
          </View>
          <ScrollView contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
            {messages.map((item) => (
              <View key={item.id} style={[styles.bubble, item.from === 'me' ? styles.bubbleMe : styles.bubbleTeam]}>
                <Text style={[styles.bubbleText, item.from === 'me' && styles.bubbleTextMe]}>{item.text}</Text>
              </View>
            ))}
            {typing ? <Text style={styles.typing}>Support is typing…</Text> : null}
            <View style={styles.prompts}>
              {PROMPTS.map((prompt) => (
                <Pressable key={prompt} style={styles.prompt} onPress={() => send(prompt)}>
                  <Text style={styles.promptText}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a message"
              placeholderTextColor="#A39AAD"
              style={styles.composerField}
              onSubmitEditing={() => send(draft)}
            />
            <Pressable style={styles.send} onPress={() => send(draft)}>
              <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F4FA',
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
    fontWeight: '800',
  },
  headerSide: {
    width: 36,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#F3EEFB',
    borderRadius: 24,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 118,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroCopy: {
    flex: 1,
    zIndex: 1,
  },
  heroArt: {
    width: 176,
    height: 128,
  },
  kicker: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 6,
    color: '#1C1430',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    color: '#6E6878',
    fontSize: 13,
  },
  live: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveCopy: {
    flex: 1,
  },
  liveTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  liveText: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
  },
  contacts: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
  },
  contact: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3EEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '800',
  },
  contactText: {
    color: '#6E6878',
    fontSize: 12,
    fontWeight: '600',
  },
  searchWrap: {
    marginTop: 14,
    marginHorizontal: 16,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  field: {
    flex: 1,
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 18,
    color: '#1C1430',
    fontSize: 18,
    fontWeight: '800',
  },
  list: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  empty: {
    paddingVertical: 18,
    color: '#8A8496',
    textAlign: 'center',
  },
  row: {
    paddingVertical: 14,
  },
  rowLine: {
    borderTopWidth: 1,
    borderTopColor: '#F4F1F7',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  question: {
    flex: 1,
    color: '#1C1C1C',
    fontSize: 14,
    fontWeight: '700',
  },
  answer: {
    marginTop: 8,
    color: '#6E6878',
    fontSize: 13,
    lineHeight: 19,
  },
  chatRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  chatHead: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F1F7',
  },
  chatTitle: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  chatSub: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  thread: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleTeam: {
    alignSelf: 'flex-start',
    backgroundColor: '#F6F1FC',
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: PURPLE,
  },
  bubbleText: {
    color: '#1C1C1C',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: '#FFFFFF',
  },
  typing: {
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '600',
  },
  prompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  prompt: {
    borderRadius: 999,
    backgroundColor: '#F6F1FC',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  promptText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  composer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F1F7',
  },
  composerField: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F7F5FB',
    paddingHorizontal: 14,
    color: '#1C1C1C',
    fontSize: 15,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
