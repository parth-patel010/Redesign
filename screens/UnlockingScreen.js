import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  ReduceMotion,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PURPLE = '#4A168C';
const FALLBACK = require('../assets/home/vehicle-city.png');
const STEPS = ['Code read', 'Near the scooter', 'Opening the lock'];

export default function UnlockingScreen({ scooter, onBack, onStart }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const pulse = useSharedValue(0);
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: step > 2 ? 0 : 0.35 * (1 - pulse.value),
    transform: [{ scale: 0.86 + pulse.value * 0.28 }],
  }));
  const done = step > 2;
  const name = scooter?.name || 'Evegah City';
  const code = scooter?.code || 'EV-1042';
  const tint = scooter?.tint || '#F3FBF6';
  const image = scooter?.image || FALLBACK;

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never }),
      -1,
      false,
    );
    const timers = [0, 1, 2].map((index) => setTimeout(() => setStep(index + 1), 600 + index * 800));
    return () => timers.forEach(clearTimeout);
  }, [pulse]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={[styles.art, { backgroundColor: tint }]}>
          <Image source={image} style={styles.scooter} contentFit="contain" />
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.id}>{code}</Text>

        <View style={styles.lockWrap}>
          {!done ? <Animated.View style={[styles.ring, ringStyle]} /> : null}
          {done ? (
            <Animated.View entering={ZoomIn.duration(420).springify()} style={styles.lock}>
              <Ionicons name="lock-open" size={28} color="#FFFFFF" />
            </Animated.View>
          ) : (
            <View style={styles.lock}>
              <Ionicons name="lock-closed" size={28} color="#FFFFFF" />
            </View>
          )}
        </View>

        <Text style={styles.title}>{done ? 'Unlocked' : 'Unlocking'}</Text>
        <Text style={styles.subtitle}>
          {done ? 'The scooter is ready.' : 'Stay next to the scooter.'}
        </Text>

        <View style={styles.steps}>
          {STEPS.map((label, index) => {
            const state = step > index + 1 || done ? 'done' : step === index + 1 ? 'now' : 'wait';
            return (
              <View key={label} style={styles.step}>
                <View style={[styles.dot, state === 'done' && styles.dotDone, state === 'now' && styles.dotNow]}>
                  {state === 'done' ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                </View>
                <Text style={[styles.stepText, state !== 'wait' && styles.stepTextOn]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {done ? (
          <Animated.View entering={FadeIn.duration(280)}>
            <Pressable
              onPress={onStart}
              onPressIn={() => {
                btnScale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
              }}
              onPressOut={() => {
                btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
              }}
            >
              <Animated.View style={[styles.start, btnStyle]}>
                <Text style={styles.startText}>Start ride</Text>
              </Animated.View>
            </Pressable>
          </Animated.View>
        ) : (
          <Text style={styles.wait}>This takes a moment</Text>
        )}
      </View>
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
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  art: {
    width: 200,
    height: 110,
    borderRadius: 24,
    backgroundColor: '#F3FBF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scooter: {
    width: 170,
    height: 96,
  },
  name: {
    marginTop: 16,
    color: '#1C1C1C',
    fontSize: 22,
    fontWeight: '800',
  },
  id: {
    marginTop: 4,
    color: '#8A8496',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  lockWrap: {
    marginTop: 28,
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: PURPLE,
  },
  lock: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 18,
    color: '#1C1C1C',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: '#6E6878',
    fontSize: 15,
  },
  steps: {
    marginTop: 28,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E4D4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotNow: {
    borderColor: PURPLE,
    backgroundColor: '#F6F1FC',
  },
  dotDone: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },
  stepText: {
    color: '#A39AAD',
    fontSize: 15,
    fontWeight: '600',
  },
  stepTextOn: {
    color: '#1C1C1C',
  },
  footer: {
    paddingHorizontal: 16,
    minHeight: 72,
    justifyContent: 'center',
  },
  start: {
    height: 52,
    borderRadius: 16,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  wait: {
    textAlign: 'center',
    color: '#8A8496',
    fontSize: 13,
    fontWeight: '600',
  },
});
