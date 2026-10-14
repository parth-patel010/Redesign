import { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PURPLE = '#4A168C';
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const TIMING = { duration: 780, easing: EASE, reduceMotion: ReduceMotion.Never };
const WALLET_ART = require('../assets/wallet/intro-wallet.png');
const INTRO_BG = require('../assets/wallet/intro-bg.jpg');

export default function WalletIntro({
  active = 'home',
  onOpenHome,
  onOpenMyRide,
  onOpenScan,
  onOpenProfile,
  onOpen,
  onDone,
}) {
  const insets = useSafeAreaInsets();
  const barH = Math.max(insets.bottom, 8) + 48;
  const sheetH = useSharedValue(0);
  const progress = useSharedValue(0);
  const iconY = useSharedValue(280);
  const iconOpacity = useSharedValue(0);
  const speed = useSharedValue(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const finished = useRef(false);
  const onOpenRef = useRef(onOpen);
  const onDoneRef = useRef(onDone);
  onOpenRef.current = onOpen;
  onDoneRef.current = onDone;

  const goWalletRef = useRef(() => {});
  goWalletRef.current = () => {
    if (finished.current) return;
    finished.current = true;
    onOpenRef.current?.();
    onDoneRef.current?.();
  };

  const goWallet = () => goWalletRef.current();

  const leave = (go) => {
    finished.current = true;
    onDoneRef.current?.();
    go?.();
  };

  useEffect(() => {
    const backup = setTimeout(() => {
      setSheetHeight((current) => current || Math.max(240, Dimensions.get('window').height - barH));
    }, 80);
    return () => clearTimeout(backup);
  }, [barH]);

  useEffect(() => {
    if (!sheetHeight) return undefined;
    sheetH.value = sheetHeight;
    iconY.value = sheetHeight * 0.46;
    let frame = 0;
    const kick = () => {
      frame = requestAnimationFrame(() => {
        progress.value = withDelay(
          280,
          withTiming(1, TIMING, (done) => {
            'worklet';
            if (!done) return;
            iconOpacity.value = withTiming(1, { duration: 180, easing: EASE, reduceMotion: ReduceMotion.Never });
            iconY.value = withTiming(0, { duration: 820, easing: EASE, reduceMotion: ReduceMotion.Never }, (ended) => {
              if (ended) runOnJS(goWalletRef.current)();
            });
            speed.value = withSequence(
              withTiming(1, { duration: 140, reduceMotion: ReduceMotion.Never }),
              withDelay(460, withTiming(0, { duration: 220, reduceMotion: ReduceMotion.Never })),
            );
          }),
        );
      });
    };
    kick();
    const fallback = setTimeout(() => goWalletRef.current(), 2600);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
    };
  }, [iconOpacity, iconY, progress, sheetH, sheetHeight, speed]);

  const purpleStyle = useAnimatedStyle(() => ({
    height: progress.value * sheetH.value,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ translateY: iconY.value }],
  }));
  const speedStyle = useAnimatedStyle(() => ({
    opacity: speed.value,
    transform: [{ translateY: (1 - speed.value) * 8 }, { scaleX: 0.65 + speed.value * 0.5 }],
  }));

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <StatusBar style="dark" />
      <View
        pointerEvents="none"
        style={[styles.sheet, { bottom: barH }]}
        onLayout={(event) => {
          const height = event.nativeEvent.layout.height;
          if (height > 1) setSheetHeight((current) => current || height);
        }}
      >
        <Animated.View style={[styles.purple, purpleStyle]}>
          <Image
            source={INTRO_BG}
            style={[styles.introBg, sheetHeight ? { height: sheetHeight } : null]}
            contentFit="cover"
            contentPosition="center"
          />
        </Animated.View>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.iconWrap, { bottom: barH }, iconStyle]}
      >
        <Image source={WALLET_ART} style={styles.icon} contentFit="contain" />
        <Animated.View style={[styles.speedLines, speedStyle]}>
          <View style={[styles.speedDash, styles.speedDashLong]} />
          <View style={[styles.speedDash, styles.speedDashMid]} />
          <View style={[styles.speedDash, styles.speedDashShort]} />
        </Animated.View>
      </Animated.View>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.tab} onPress={() => leave(onOpenHome)}>
          <Ionicons name={active === 'home' ? 'home' : 'home-outline'} size={22} color={active === 'home' ? PURPLE : '#8A8A8A'} />
          <Text style={[styles.tabLabel, active === 'home' && styles.tabLabelActive]}>Home</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={() => leave(onOpenMyRide)}>
          <Ionicons name={active === 'rides' ? 'bicycle' : 'bicycle-outline'} size={22} color={active === 'rides' ? PURPLE : '#8A8A8A'} />
          <Text style={[styles.tabLabel, active === 'rides' && styles.tabLabelActive]}>My Rides</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={() => leave(onOpenScan)}>
          <View style={styles.scanButton}>
            <Ionicons name="scan-outline" size={26} color="#FFFFFF" />
            <Ionicons name="qr-code" size={12} color="#FFFFFF" style={styles.scanQr} />
          </View>
          <Text style={[styles.tabLabel, active === 'scan' && styles.tabLabelActive]}>Scan</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={goWallet}>
          <Ionicons name="wallet" size={22} color={PURPLE} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Wallet</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={() => leave(onOpenProfile)}>
          <Ionicons name={active === 'profile' ? 'person' : 'person-outline'} size={22} color={active === 'profile' ? PURPLE : '#8A8A8A'} />
          <Text style={[styles.tabLabel, active === 'profile' && styles.tabLabelActive]}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  purple: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B1280',
    overflow: 'hidden',
  },
  introBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 210,
    height: 178,
  },
  speedLines: {
    marginTop: 6,
    width: 56,
    height: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedDash: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  speedDashLong: {
    width: 56,
  },
  speedDashMid: {
    width: 36,
  },
  speedDashShort: {
    width: 18,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    elevation: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    overflow: 'visible',
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
    elevation: 32,
    zIndex: 32,
  },
  scanQr: {
    position: 'absolute',
    top: 15,
    left: 15,
  },
});
