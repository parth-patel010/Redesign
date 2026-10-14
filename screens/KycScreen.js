import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { cardEnter } from '../utils/cardEnter';
import { SketchVerify } from '../components/Sketches';

const PURPLE = '#4A168C';

const STEPS = [
  { key: 'selfie', title: 'Live photo', text: 'A clear photo of your face', icon: 'person-outline' },
  { key: 'front', title: 'Aadhaar front', text: 'The side with your photo', icon: 'card-outline' },
  { key: 'back', title: 'Aadhaar back', text: 'The side with your address', icon: 'card-outline' },
];

export default function KycScreen({ kyc, onBack, onStep }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(null);
  const doneCount = STEPS.filter((step) => kyc?.[step.key]).length;
  const verified = doneCount === STEPS.length;

  const locked = (key) => {
    if (key === 'front') return !kyc?.selfie;
    if (key === 'back') return !kyc?.front;
    return false;
  };

  const take = (key) => {
    if (busy || kyc?.[key] || locked(key)) return;
    setBusy(key);
    setTimeout(() => {
      onStep?.(key);
      setBusy(null);
    }, 1100);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Verify account</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <SketchVerify width={210} height={140} />
          <Text style={styles.kicker}>{verified ? 'VERIFIED' : 'KYC'}</Text>
          <Text style={styles.title}>{verified ? 'You are verified' : 'A photo, then Aadhaar'}</Text>
          <Text style={styles.subtitle}>
            {verified
              ? 'Your photo and Aadhaar are on file. You can rent without another check.'
              : 'Take a live photo, then both sides of your Aadhaar.'}
          </Text>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${(doneCount / STEPS.length) * 100}%` }]} />
          </View>
          <Text style={styles.count}>{doneCount} of {STEPS.length} complete</Text>
        </Animated.View>

        {STEPS.map((step, index) => {
          const complete = Boolean(kyc?.[step.key]);
          const isLocked = locked(step.key);
          const holding = busy === step.key;
          return (
            <Animated.View key={step.key} entering={cardEnter(index + 1)}>
              <Pressable
                disabled={complete || isLocked || Boolean(busy)}
                onPress={() => take(step.key)}
                style={styles.card}
              >
                <View style={[styles.icon, complete && styles.iconOn]}>
                  <Ionicons name={complete ? 'checkmark' : step.icon} size={18} color={complete ? '#FFFFFF' : PURPLE} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.stepNo}>Step {index + 1}</Text>
                  <Text style={styles.rowTitle}>{step.title}</Text>
                  <Text style={styles.rowText}>
                    {holding ? 'Hold still' : isLocked ? 'Finish the step above first' : step.text}
                  </Text>
                </View>
                {complete ? (
                  <Text style={styles.done}>Done</Text>
                ) : isLocked ? (
                  <Ionicons name="lock-closed" size={16} color="#C8C0D4" />
                ) : (
                  <Text style={styles.take}>{holding ? '…' : 'Take'}</Text>
                )}
              </Pressable>
            </Animated.View>
          );
        })}

        {verified ? (
          <Animated.Text entering={FadeIn.duration(280)} style={styles.note}>
            You can rent without another document check.
          </Animated.Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F6F4F8',
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
    backgroundColor: '#F7F5FB',
    borderRadius: 28,
    padding: 18,
    alignItems: 'flex-start',
  },
  kicker: {
    marginTop: 8,
    color: PURPLE,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 6,
    color: '#1C1C1C',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    color: '#6E6878',
    fontSize: 14,
    lineHeight: 20,
  },
  track: {
    marginTop: 16,
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E7DFF2',
    overflow: 'hidden',
  },
  trackFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: PURPLE,
  },
  count: {
    marginTop: 8,
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EAF6',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOn: {
    backgroundColor: PURPLE,
  },
  copy: {
    flex: 1,
  },
  stepNo: {
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '700',
  },
  rowTitle: {
    marginTop: 2,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '800',
  },
  rowText: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 13,
  },
  done: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '800',
  },
  take: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: '800',
  },
  note: {
    marginTop: 16,
    marginHorizontal: 20,
    color: '#6E6878',
    fontSize: 13,
    lineHeight: 18,
  },
});
