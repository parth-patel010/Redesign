import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PURPLE = '#4A168C';
const BUTTON = '#C5B4E6';
const DIGITS = 4;
const INVALID_OTP = '1111';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const RIDER_WIDTH = Math.round(SCREEN_W * 0.86);
const GREY = '#E4E4E7';
const GREEN = '#3DDC84';
const RED = '#E5484D';
const TOAST_OFFSCREEN_Y = -120;
const TOAST_ENTER_MS = 560;
const TOAST_EXIT_MS = 480;
const TOAST_VISIBLE_MS = 4000;
const TOAST_EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const TOAST_EASE_IN = Easing.bezier(0.4, 0, 0.2, 1);

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length < 10) return `+91 ${digits}`;
  return `+91 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
}

const OtpBox = forwardRef(function OtpBox({ value, onChangeText, onKeyPress, inputRef }, ref) {
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const tone = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    pop() {
      cancelAnimation(scale);
      scale.value = 1;
      scale.value = withSequence(
        withTiming(1.08, { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
      );
    },
    fail() {
      cancelAnimation(shakeX);
      cancelAnimation(tone);
      tone.value = withTiming(-1, { duration: 160 });
      shakeX.value = withSequence(
        withTiming(-9, { duration: 45 }),
        withTiming(9, { duration: 45 }),
        withTiming(-7, { duration: 40 }),
        withTiming(7, { duration: 40 }),
        withTiming(-4, { duration: 35 }),
        withTiming(4, { duration: 35 }),
        withTiming(0, { duration: 35 }),
      );
    },
    success(index) {
      cancelAnimation(tone);
      cancelAnimation(scale);
      const delay = index * 75;
      tone.value = withDelay(delay, withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }));
      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(1.06, { duration: 100, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
        ),
      );
    },
    reset() {
      cancelAnimation(tone);
      cancelAnimation(shakeX);
      shakeX.value = withTiming(0, { duration: 80 });
      tone.value = withTiming(0, { duration: 180 });
    },
  }));

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }, { scale: scale.value }],
    borderColor: interpolateColor(tone.value, [-1, 0, 1], [RED, GREY, GREEN]),
    backgroundColor: interpolateColor(tone.value, [-1, 0, 1], ['#FDECEC', GREY, '#E8F9EF']),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(tone.value, [-1, 0, 1], [RED, '#1C1C1C', '#178A45']),
  }));

  return (
    <Animated.View style={[styles.codeBox, boxStyle]}>
      <AnimatedTextInput
        ref={inputRef}
        style={[styles.codeInput, textStyle]}
        value={value}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        keyboardType="number-pad"
        maxLength={1}
        selectTextOnFocus
        cursorColor={PURPLE}
        selectionColor={PURPLE}
      />
    </Animated.View>
  );
});

export default function OtpScreen({ phone, onEdit, onSuccess }) {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState(Array(DIGITS).fill(''));
  const [toastMessage, setToastMessage] = useState(null);
  const [toastTick, setToastTick] = useState(0);
  const inputs = useRef([]);
  const boxes = useRef([]);
  const clearTimer = useRef(null);
  const successTimer = useRef(null);
  const toastTimerRef = useRef(null);
  const toastHidingRef = useRef(false);
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(TOAST_OFFSCREEN_Y);
  const toastScale = useSharedValue(0.96);
  const ready = code.every((digit) => digit.length === 1);
  const riderX = useSharedValue(SCREEN_W);
  const sheetOffset = useSharedValue(0);
  const slideEase = Easing.bezier(0.25, 0.1, 0.25, 1);

  useEffect(() => {
    riderX.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [riderX]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      cancelAnimation(sheetOffset);
      const duration = e.duration > 0 ? e.duration : 280;
      const lift = Math.min(Math.round(e.endCoordinates.height * 0.72), 340);
      sheetOffset.value = withTiming(-lift, { duration, easing: slideEase });
    });

    const onHide = Keyboard.addListener(hideEvent, (e) => {
      cancelAnimation(sheetOffset);
      const duration = e.duration > 0 ? e.duration : 280;
      sheetOffset.value = withTiming(0, { duration, easing: slideEase });
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [sheetOffset, slideEase]);

  const riderSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: riderX.value }],
  }));

  const sheetLiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetOffset.value }],
  }));

  const finishHideToast = useCallback(() => {
    toastHidingRef.current = false;
    setToastMessage(null);
  }, []);

  const hideToast = useCallback(() => {
    if (toastHidingRef.current) return;
    toastHidingRef.current = true;
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    cancelAnimation(toastOpacity);
    cancelAnimation(toastTranslateY);
    cancelAnimation(toastScale);
    toastOpacity.value = withTiming(0, { duration: 360, easing: TOAST_EASE_IN });
    toastScale.value = withTiming(0.97, { duration: TOAST_EXIT_MS, easing: TOAST_EASE_IN });
    toastTranslateY.value = withTiming(
      TOAST_OFFSCREEN_Y,
      { duration: TOAST_EXIT_MS, easing: TOAST_EASE_IN },
      (finished) => {
        if (finished) runOnJS(finishHideToast)();
      },
    );
  }, [finishHideToast, toastOpacity, toastScale, toastTranslateY]);

  const showToast = useCallback(
    (message) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastHidingRef.current = false;
      setToastMessage(message);
      setToastTick((tick) => tick + 1);
      toastTimerRef.current = setTimeout(hideToast, TOAST_VISIBLE_MS);
    },
    [hideToast],
  );

  useLayoutEffect(() => {
    if (!toastMessage) {
      toastOpacity.value = 0;
      toastTranslateY.value = TOAST_OFFSCREEN_Y;
      toastScale.value = 0.96;
      return;
    }
    cancelAnimation(toastOpacity);
    cancelAnimation(toastTranslateY);
    cancelAnimation(toastScale);
    toastTranslateY.value = TOAST_OFFSCREEN_Y;
    toastScale.value = 0.96;
    toastOpacity.value = 0;
    toastOpacity.value = withTiming(1, { duration: 420, easing: TOAST_EASE_OUT });
    toastTranslateY.value = withTiming(0, { duration: TOAST_ENTER_MS, easing: TOAST_EASE_OUT });
    toastScale.value = withTiming(1, { duration: TOAST_ENTER_MS, easing: TOAST_EASE_OUT });
  }, [toastMessage, toastTick, toastOpacity, toastScale, toastTranslateY]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const toastAnimStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslateY.value }, { scale: toastScale.value }],
  }));

  const judge = (digits) => {
    const entered = digits.join('');
    if (entered.length < DIGITS) return;
    if (entered === INVALID_OTP) {
      boxes.current.forEach((box) => box?.fail());
      showToast('Invalid OTP');
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => {
        setCode((current) => (current.join('') === entered ? Array(DIGITS).fill('') : current));
        boxes.current.forEach((box) => box?.reset());
        inputs.current[0]?.focus();
      }, 720);
      return;
    }

    boxes.current.forEach((box, index) => box?.success(index));
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => onSuccess?.(), 780);
  };

  const setDigit = (index, value) => {
    const nextDigit = value.replace(/\D/g, '').slice(-1);
    const next = code.map((digit, digitIndex) => (digitIndex === index ? nextDigit : digit));
    setCode(next);
    if (nextDigit) boxes.current[index]?.pop();
    if (nextDigit && index < DIGITS - 1) inputs.current[index + 1]?.focus();
    if (next.every((digit) => digit.length === 1)) judge(next);
  };

  const onKeyPress = (index, key) => {
    if (key !== 'Backspace') return;
    if (code[index]) {
      const next = code.map((digit, digitIndex) => (digitIndex === index ? '' : digit));
      setCode(next);
      boxes.current[index]?.reset();
      return;
    }
    if (index > 0) inputs.current[index - 1]?.focus();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {toastMessage ? (
        <Animated.View
          style={[styles.toast, { top: Math.max(insets.top, 12) + 8 }, toastAnimStyle]}
          pointerEvents="none"
        >
          <Ionicons name="close-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}

      <Animated.View style={[styles.body, sheetLiftStyle]}>
        <View style={styles.hero}>
          <LinearGradient
            colors={['#2A085C', '#5424A8', '#7A42D4', '#5424A8', '#2A085C']}
            locations={[0, 0.22, 0.5, 0.78, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[styles.riderWrap, riderSlideStyle]}>
            <Image
              source={require('../assets/login/otp-rider.png')}
              style={styles.rider}
              contentFit="contain"
            />
            <View style={styles.speedLines}>
              <View style={[styles.speedDash, styles.speedDashLong]} />
              <View style={[styles.speedDash, styles.speedDashMid]} />
              <View style={[styles.speedDash, styles.speedDashShort]} />
            </View>
          </Animated.View>
        </View>

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 22) }]}>
          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>Enter the 4-digit code we sent to</Text>

          <View style={styles.phonePill}>
            <Text style={styles.phoneText}>{formatPhone(phone)}</Text>
            <Pressable onPress={onEdit} hitSlop={8}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.codeRow}>
            {code.map((digit, index) => (
              <OtpBox
                key={index}
                ref={(node) => {
                  boxes.current[index] = node;
                }}
                inputRef={(node) => {
                  inputs.current[index] = node;
                }}
                value={digit}
                onChangeText={(value) => setDigit(index, value)}
                onKeyPress={({ nativeEvent }) => onKeyPress(index, nativeEvent.key)}
              />
            ))}
          </View>

          <Text style={styles.resendLine}>
            Didn't receive the code?{' '}
            <Text
              style={styles.resendLink}
              onPress={() => {
                if (clearTimer.current) clearTimeout(clearTimer.current);
                setCode(Array(DIGITS).fill(''));
                boxes.current.forEach((box) => box?.reset());
                inputs.current[0]?.focus();
              }}
            >
              Resend OTP
            </Text>
          </Text>

          <Pressable
            style={[styles.verifyBtn, ready && styles.verifyBtnReady, !ready && styles.verifyBtnDisabled]}
            disabled={!ready}
            onPress={() => judge(code)}
          >
            <Text style={styles.verifyText}>VERIFY & CONTINUE</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PURPLE,
  },
  body: {
    flex: 1,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  riderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
  rider: {
    width: RIDER_WIDTH,
    height: Math.round(RIDER_WIDTH * 0.92),
  },
  speedLines: {
    position: 'absolute',
    right: -6,
    top: '48%',
    width: 52,
    height: 34,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  speedDash: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  speedDashLong: {
    width: 52,
  },
  speedDashMid: {
    width: 34,
  },
  speedDashShort: {
    width: 18,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 26,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#8A8A8A',
  },
  phonePill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    backgroundColor: '#F3EEF8',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: PURPLE,
  },
  editText: {
    fontSize: 14,
    fontWeight: '700',
    color: PURPLE,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 22,
  },
  codeBox: {
    width: 62,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GREY,
    backgroundColor: GREY,
    overflow: 'hidden',
  },
  codeInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1C',
    paddingVertical: 0,
  },
  resendLine: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 13,
    color: '#8A8A8A',
  },
  resendLink: {
    color: PURPLE,
    fontWeight: '700',
  },
  verifyBtn: {
    marginTop: 22,
    height: 52,
    borderRadius: 14,
    backgroundColor: BUTTON,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyBtnReady: {
    backgroundColor: PURPLE,
  },
  verifyBtnDisabled: {
    opacity: 0.75,
  },
  verifyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  toast: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 12,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
