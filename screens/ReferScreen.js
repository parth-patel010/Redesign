import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet, last10 } from '../services/api';

const PURPLE = '#4A168C';
const CODE = 'EVEGAH100';

const STEPS = [
  { n: '1', title: 'Share your code', text: 'Send your code to a friend.' },
  { n: '2', title: 'They take a ride', text: 'They sign up and finish their first ride.' },
  { n: '3', title: 'You both earn', text: 'You get 100 points. They get 50.' },
];

export default function ReferScreen({ phone, name, onBack }) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState(CODE);
  const [earned, setEarned] = useState('420');
  const [friends, setFriends] = useState('12');
  const [used, setUsed] = useState('320');
  const [ready, setReady] = useState('100');

  useEffect(() => {
    const mobile = last10(phone);
    if (!mobile) return;
    apiGet(`/referral?mobile=${encodeURIComponent(mobile)}&name=${encodeURIComponent(name || 'Rider')}`)
      .then((body) => {
        const data = body?.data;
        if (!data) return;
        if (data.referralCode) setCode(data.referralCode);
        setEarned(String(data.totalEarned ?? 420));
        setFriends(String(data.friendsJoined ?? 12));
        setUsed(String(data.pointsRedeemed ?? 320));
        setReady(String(data.availablePoints ?? 100));
      })
      .catch(() => {});
  }, [phone, name]);

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const share = () => {
    Share.share({
      message: `Ride with Evegah. Use my code ${code}. I get 100 points and you get 50.`,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <Text style={styles.kicker}>EvePoints</Text>
          <Text style={styles.title}>Invite a friend</Text>
          <Text style={styles.subtitle}>You get 100 points. They get 50 on their first ride.</Text>
        </Animated.View>

        <Animated.View entering={cardEnter(1)} style={styles.codeCard}>
          <Text style={styles.label}>Your code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{code}</Text>
            <Pressable hitSlop={8} onPress={copy} style={styles.copy}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={PURPLE} />
              <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
            </Pressable>
          </View>
          {copied ? (
            <Animated.Text entering={FadeIn.duration(200)} style={styles.copied}>
              Code copied
            </Animated.Text>
          ) : null}
          <Pressable onPress={share} style={styles.share}>
            <Ionicons name="share-outline" size={16} color="#FFFFFF" />
            <Text style={styles.shareText}>Share</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={cardEnter(2)} style={styles.stats}>
          <Stat value={earned} label="Earned" />
          <View style={styles.statLine} />
          <Stat value={friends} label="Friends" />
          <View style={styles.statLine} />
          <Stat value={used} label="Used" />
        </Animated.View>

        <Text style={styles.section}>How it works</Text>
        <Animated.View entering={cardEnter(3)} style={styles.steps}>
          {STEPS.map((step, index) => (
            <View key={step.n} style={[styles.step, index > 0 && styles.stepLine]}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.n}</Text>
              </View>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={cardEnter(4)} style={styles.ready}>
          <Text style={styles.readyTitle}>{ready} points ready</Text>
          <Text style={styles.readyText}>Use them on a ride or an offer.</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    backgroundColor: '#F6F1FC',
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
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: '#6E6878',
    fontSize: 14,
    lineHeight: 20,
  },
  codeCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
  },
  label: {
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '700',
  },
  codeRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    color: PURPLE,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F6F1FC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 36,
  },
  copyText: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '700',
  },
  copied: {
    marginTop: 8,
    color: '#1F8A4C',
    fontSize: 12,
    fontWeight: '700',
  },
  share: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    backgroundColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  stats: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#1C1C1C',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '600',
  },
  statLine: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F1F3',
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 20,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  steps: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  stepLine: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: '800',
  },
  stepCopy: {
    flex: 1,
  },
  stepTitle: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  stepText: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 13,
  },
  ready: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
  },
  readyTitle: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  readyText: {
    marginTop: 4,
    color: '#6E6878',
    fontSize: 13,
  },
});
