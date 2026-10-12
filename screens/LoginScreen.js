import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Image as RNImage,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { indianMobileValidationMessage, isValidIndianMobile } from '../utils/phoneValidation';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PRIMARY = '#FAC638';
const PRIMARY_MUTED = '#E8D48A';
const EVEGAH_PURPLE = '#4F2CA0';
const EVEGAH_PURPLE_MUTED = '#C4B6DE';
const VIDEO_WIDTH = 1492;
const VIDEO_HEIGHT = 1440;
const BANNER_HEIGHT = SCREEN_W * (VIDEO_HEIGHT / VIDEO_WIDTH);
const TOAST_OFFSCREEN_Y = -120;
const TOAST_ENTER_MS = 560;
const TOAST_EXIT_MS = 480;
const TOAST_VISIBLE_MS = 4000;
const TOAST_EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const TOAST_EASE_IN = Easing.bezier(0.4, 0, 0.2, 1);
const LITTLE_UP = 56;
const SCOOTER_WIDTH = 60;
const SCOOTER_HEIGHT = 32;
const TRAIL_WIDTH = 30;
const RIDE_GROUP_WIDTH = SCOOTER_WIDTH + TRAIL_WIDTH;
const ROAD_DASHES = Array.from({ length: 16 }, (_, index) => index);
const BOTTOM_ASSET_W = 2172;
const BOTTOM_ASSET_H = 325;
const BOTTOM_ASSET_HEIGHT = SCREEN_W * (BOTTOM_ASSET_H / BOTTOM_ASSET_W);
const INTRO_VIDEO = require('../assets/intro-ride.mp4');
const INTRO_VIDEO_REVERSE = require('../assets/intro-ride-reverse.mp4');
// Digit 1–10 of the Indian mobile number, matched to a time in the ride clip.
// The last time stops before the clip ends so the picture does not flash.
const DIGIT_VIDEO_TIMES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9.7];
const GLIDE_RATE = 1.5;
const CLIP_SECONDS = 10.93;

function clipSpan(duration) {
  return duration > 1 ? duration : CLIP_SECONDS;
}

function toReverseTime(originalTime, duration) {
  const span = clipSpan(duration);
  return Math.min(span, Math.max(0, span - originalTime));
}

function toOriginalTime(reverseTime, duration) {
  return Math.max(0, clipSpan(duration) - reverseTime);
}

export default function LoginScreen({ onContinue }) {
  const insets = useSafeAreaInsets();
  const forwardPlayer = useVideoPlayer(INTRO_VIDEO, (video) => {
    video.loop = false;
    video.muted = true;
    video.playbackRate = GLIDE_RATE;
    video.timeUpdateEventInterval = 0.03;
    video.currentTime = 0;
    video.pause();
  });
  const reversePlayer = useVideoPlayer(INTRO_VIDEO_REVERSE, (video) => {
    video.loop = false;
    video.muted = true;
    video.playbackRate = GLIDE_RATE;
    video.timeUpdateEventInterval = 0.03;
    video.pause();
  });
  const [playingReverse, setPlayingReverse] = useState(false);

  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastTick, setToastTick] = useState(0);
  const [riding, setRiding] = useState(false);

  const phoneInputRef = useRef(null);
  const toastTimerRef = useRef(null);
  const toastHidingRef = useRef(false);
  const targetTimeRef = useRef(0);
  const directionRef = useRef(0);
  const clipRef = useRef('forward');
  const revealTokenRef = useRef(0);
  const reverseArmedRef = useRef(false);

  const currentOriginalTime = () => {
    if (clipRef.current === 'reverse') {
      return toOriginalTime(reversePlayer.currentTime || 0, reversePlayer.duration);
    }
    return forwardPlayer.currentTime || 0;
  };

  const showForward = (originalTime) => {
    reverseArmedRef.current = false;
    const token = ++revealTokenRef.current;
    reversePlayer.pause();
    forwardPlayer.playbackRate = GLIDE_RATE;
    const needsSeek = Math.abs((forwardPlayer.currentTime ?? 0) - originalTime) > 0.2;
    if (needsSeek) forwardPlayer.currentTime = originalTime;
    clipRef.current = 'forward';

    const reveal = () => {
      if (revealTokenRef.current !== token) return;
      setPlayingReverse(false);
      forwardPlayer.play();
    };

    if (!needsSeek) {
      reveal();
      return;
    }

    const startedAt = Date.now();
    const tick = () => {
      if (revealTokenRef.current !== token) return;
      const at = forwardPlayer.currentTime ?? 0;
      if (Math.abs(at - originalTime) < 0.25 || Date.now() - startedAt > 200) {
        reveal();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const showReverse = (originalTime) => {
    const reverseTime = toReverseTime(originalTime, reversePlayer.duration);
    const token = ++revealTokenRef.current;
    forwardPlayer.pause();
    reversePlayer.playbackRate = GLIDE_RATE;
    const needsSeek = Math.abs((reversePlayer.currentTime ?? 0) - reverseTime) > 0.2;
    // Seek while the forward clip is still on screen, so the long jump
    // does not clear the picture to black.
    if (needsSeek) reversePlayer.currentTime = reverseTime;
    clipRef.current = 'reverse';
    reverseArmedRef.current = false;

    const reveal = () => {
      if (revealTokenRef.current !== token) return;
      reverseArmedRef.current = true;
      setPlayingReverse(true);
      reversePlayer.play();
    };

    if (!needsSeek) {
      reveal();
      return;
    }

    const startedAt = Date.now();
    const tick = () => {
      if (revealTokenRef.current !== token) return;
      const at = reversePlayer.currentTime ?? 0;
      if (Math.abs(at - reverseTime) < 0.25 || Date.now() - startedAt > 200) {
        reveal();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  useEffect(() => {
    const count = Math.min(phone.length, 10);
    const target = DIGIT_VIDEO_TIMES[count];
    targetTimeRef.current = target;
    const now = currentOriginalTime();

    if (Math.abs(target - now) <= 0.04) {
      directionRef.current = 0;
      forwardPlayer.pause();
      reversePlayer.pause();
      return;
    }

    if (target > now) {
      // Already gliding forward: only move the stop point. Calling play()
      // or seeking on every digit makes the Android surface flash black.
      if (directionRef.current === 1 && clipRef.current === 'forward' && forwardPlayer.playing) {
        return;
      }
      directionRef.current = 1;
      if (clipRef.current === 'forward') {
        forwardPlayer.playbackRate = GLIDE_RATE;
        forwardPlayer.play();
      } else {
        showForward(now);
      }
      return;
    }

    if (directionRef.current === -1 && clipRef.current === 'reverse' && reversePlayer.playing) {
      return;
    }
    directionRef.current = -1;
    if (clipRef.current === 'reverse') {
      reversePlayer.playbackRate = GLIDE_RATE;
      reversePlayer.play();
    } else {
      showReverse(now);
    }
  }, [phone.length, forwardPlayer, reversePlayer]);

  useEventListener(forwardPlayer, 'timeUpdate', ({ currentTime }) => {
    if (directionRef.current !== 1 || clipRef.current !== 'forward') return;
    const target = targetTimeRef.current;
    if (currentTime + 0.04 < target) return;
    directionRef.current = 0;
    forwardPlayer.pause();
    reversePlayer.currentTime = toReverseTime(target, reversePlayer.duration);
  });

  useEventListener(reversePlayer, 'timeUpdate', ({ currentTime }) => {
    if (!reverseArmedRef.current) return;
    if (directionRef.current !== -1 || clipRef.current !== 'reverse') return;
    const originalTime = toOriginalTime(currentTime, reversePlayer.duration);
    const target = targetTimeRef.current;
    if (originalTime > target + 0.04) return;
    directionRef.current = 0;
    reverseArmedRef.current = false;
    reversePlayer.pause();
    forwardPlayer.currentTime = target;
  });

  const sheetOffset = useSharedValue(0);
  const btnScale = useSharedValue(1);
  const textShift = useSharedValue(0);
  const textFade = useSharedValue(1);
  const arrowShift = useSharedValue(0);
  const lineShift = useSharedValue(40);
  const scooterX = useSharedValue(-RIDE_GROUP_WIDTH);
  const buttonWidthRef = useRef(280);
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(TOAST_OFFSCREEN_Y);
  const toastScale = useSharedValue(0.96);

  const slideEase = Easing.bezier(0.25, 0.1, 0.25, 1);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => {
      revealTokenRef.current += 1;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      cancelAnimation(sheetOffset);
      const duration = e.duration > 0 ? e.duration : 280;
      sheetOffset.value = withTiming(-LITTLE_UP, { duration, easing: slideEase });
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

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetOffset.value }],
  }));

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const continueTextStyle = useAnimatedStyle(() => ({
    opacity: textFade.value,
    transform: [{ translateY: textShift.value }],
  }));
  const arrowSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowShift.value }],
  }));
  const rideLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lineShift.value }],
  }));
  const scooterSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scooterX.value }],
  }));

  const toastAnimStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslateY.value }, { scale: toastScale.value }],
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
        if (finished) {
          runOnJS(finishHideToast)();
        }
      }
    );
  }, [finishHideToast, toastOpacity, toastScale, toastTranslateY]);

  const showInvalidToast = useCallback(
    (message = 'Invalid number') => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastHidingRef.current = false;
      setToastMessage(message);
      setToastTick((t) => t + 1);
      toastTimerRef.current = setTimeout(hideToast, TOAST_VISIBLE_MS);
    },
    [hideToast]
  );

  const finishRide = useCallback(() => {
    setRiding(false);
    onContinue?.(phone);
  }, [onContinue, phone]);

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
    };
  }, []);

  const dismissInputs = () => {
    phoneInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const handlePhoneChange = (text) => {
    const next = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(next);
    if (next.length === 10) {
      const err = indianMobileValidationMessage(next);
      if (err) showInvalidToast(err);
    }
  };

  const ready = phone.length === 10 && isValidIndianMobile(phone);

  const handleContinue = () => {
    if (phone.length !== 10) {
      showInvalidToast('Please enter a valid 10-digit mobile number');
      return;
    }

    const err = indianMobileValidationMessage(phone);
    if (err) {
      showInvalidToast(err);
      return;
    }

    dismissInputs();
    if (riding) return;
    setRiding(true);

    textShift.value = 0;
    textFade.value = 1;
    arrowShift.value = 0;
    lineShift.value = 40;
    textShift.value = withTiming(-46, { duration: 420, easing: Easing.out(Easing.cubic) });
    textFade.value = withTiming(0, { duration: 360 });
    arrowShift.value = withTiming(72, { duration: 480, easing: Easing.out(Easing.cubic) });
    lineShift.value = withDelay(
      500,
      withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    scooterX.value = -RIDE_GROUP_WIDTH;
    scooterX.value = withDelay(
      920,
      withTiming(
        buttonWidthRef.current,
        { duration: 2200, easing: Easing.inOut(Easing.cubic) },
        (finished) => {
          if (!finished) return;
          lineShift.value = withTiming(40, { duration: 420, easing: Easing.in(Easing.cubic) }, (roadDone) => {
            if (!roadDone) return;
            textShift.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) });
            textFade.value = withTiming(1, { duration: 360 });
            arrowShift.value = withTiming(
              0,
              { duration: 480, easing: Easing.out(Easing.cubic) },
              (backDone) => {
                if (backDone) runOnJS(finishRide)();
              },
            );
          });
        },
      ),
    );
  };

  return (
    <Pressable style={styles.root} onPress={dismissInputs}>
      <StatusBar style="dark" />

      {toastMessage ? (
        <Animated.View
          style={[styles.toast, { top: Math.max(insets.top, 12) + 8 }, toastAnimStyle]}
          pointerEvents="none"
        >
          <Ionicons name="close-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}

      <View style={styles.banner} pointerEvents="none">
        <VideoView
          player={playingReverse ? reversePlayer : forwardPlayer}
          style={styles.bannerVideo}
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture={false}
          surfaceType="textureView"
        />
      </View>

      <Animated.View
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 8) }, sheetAnimStyle]}
      >
        <View style={styles.handle} />

        <View style={[styles.sheetContent, { paddingBottom: BOTTOM_ASSET_HEIGHT + insets.bottom + 12 }]}>
          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Image
              source={require('../assets/login/evegah-logo.png')}
              style={styles.welcomeLogo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.subtitle}>
            India's Smartest EV Rental Mobility
          </Text>

          <Pressable
            style={styles.field}
            onPress={() => phoneInputRef.current?.focus()}
          >
            <View style={styles.countryCode}>
              <View style={styles.flagWrap}>
                <Image
                  source={require('../assets/login/india-flag-seeklogo.png')}
                  style={styles.flag}
                  contentFit="cover"
                />
              </View>
              <Text style={styles.countryText}>+91</Text>
            </View>
            <View style={styles.divider} />
            <TextInput
              ref={phoneInputRef}
              style={styles.fieldInput}
              placeholder="Enter Mobile Number"
              placeholderTextColor="#A8A8A8"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={handlePhoneChange}
              cursorColor={EVEGAH_PURPLE}
              selectionColor={EVEGAH_PURPLE}
              autoCapitalize="none"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          </Pressable>

          <Pressable style={styles.checkboxRow} onPress={() => setRememberMe((v) => !v)}>
            <Ionicons
              name={rememberMe ? 'checkbox' : 'square-outline'}
              size={20}
              color={EVEGAH_PURPLE}
            />
            <Text style={styles.checkboxText}>Remember me for faster login</Text>
          </Pressable>

          <Pressable
            onPress={handleContinue}
            disabled={!ready || loading || riding}
            style={styles.continuePressable}
            onPressIn={() => {
              if (!ready || loading || riding) return;
              btnScale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
            }}
            onPressOut={() => {
              btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
            }}
          >
            <Animated.View
              onLayout={(event) => {
                buttonWidthRef.current = event.nativeEvent.layout.width;
              }}
              style={[styles.continueBtn, !ready && styles.continueBtnDisabled, btnAnimStyle]}
            >
              {loading ? (
                <ActivityIndicator color="#111111" />
              ) : (
                <>
                  <Animated.Text
                    style={[
                      styles.continueText,
                      !ready && styles.continueTextDisabled,
                      continueTextStyle,
                    ]}
                  >
                    Continue
                  </Animated.Text>
                  <Animated.View
                    style={[
                      styles.arrowCircle,
                      !ready && styles.arrowCircleDisabled,
                      arrowSlideStyle,
                    ]}
                  >
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </Animated.View>
                  {riding ? (
                    <>
                      <Animated.View style={[styles.rideLine, rideLineStyle]} pointerEvents="none">
                        {ROAD_DASHES.map((dash) => (
                          <View key={dash} style={styles.roadDash} />
                        ))}
                      </Animated.View>
                      <Animated.View style={[styles.scooterWrap, scooterSlideStyle]} pointerEvents="none">
                        <View style={styles.speedLines}>
                          <View style={[styles.speedDash, styles.speedDashLong]} />
                          <View style={[styles.speedDash, styles.speedDashMid]} />
                          <View style={[styles.speedDash, styles.speedDashShort]} />
                        </View>
                        <RNImage
                          source={require('../assets/login/evegah-scooter.png')}
                          style={styles.scooter}
                          resizeMode="contain"
                        />
                      </Animated.View>
                    </>
                  ) : null}
                </>
              )}
            </Animated.View>
          </Pressable>

          <Text style={styles.terms}>By continuing you agree to our</Text>
          <Text style={styles.termsLinks}>
            <Text style={styles.termsLink}>Terms of Service</Text>
            {'  •  '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
        <Image
          source={require('../assets/login/login-bottom-asset.png')}
          style={[styles.bottomAsset, { bottom: insets.bottom }]}
          contentFit="contain"
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    overflow: 'hidden',
  },
  banner: {
    width: '100%',
    height: BANNER_HEIGHT,
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: '#F4F5F7',
  },
  bannerVideo: {
    width: '100%',
    height: BANNER_HEIGHT,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: SCREEN_H * 0.64,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  sheetContent: {
    paddingHorizontal: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: EVEGAH_PURPLE,
    marginBottom: 16,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: -0.3,
    lineHeight: 22,
    includeFontPadding: false,
  },
  welcomeLogo: {
    width: 100,
    height: 28,
    marginLeft: 4,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#7A7A7A',
    textAlign: 'center',
  },
  field: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C4C4C4',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 50,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flagWrap: {
    width: 28,
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  flag: {
    width: '100%',
    height: '100%',
  },
  countryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: EVEGAH_PURPLE,
    marginHorizontal: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C2C2C',
    paddingVertical: 0,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  checkboxText: {
    fontSize: 13,
    fontWeight: '500',
    color: EVEGAH_PURPLE,
  },
  continuePressable: {
    marginTop: 14,
    backgroundColor: 'transparent',
  },
  continueBtn: {
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: EVEGAH_PURPLE,
    overflow: 'hidden',
  },
  continueBtnDisabled: {
    backgroundColor: EVEGAH_PURPLE_MUTED,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  continueTextDisabled: {
    color: '#6E5A8A',
  },
  arrowCircle: {
    position: 'absolute',
    right: 8,
    top: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircleDisabled: {
    backgroundColor: '#6B5B2A',
  },
  rideLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 14,
    height: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roadDash: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#111111',
  },
  scooterWrap: {
    position: 'absolute',
    left: 0,
    bottom: 16,
    width: RIDE_GROUP_WIDTH,
    height: SCOOTER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedLines: {
    width: TRAIL_WIDTH,
    height: 16,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  speedDash: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#111111',
  },
  speedDashLong: {
    width: 22,
  },
  speedDashMid: {
    width: 14,
  },
  speedDashShort: {
    width: 8,
  },
  scooter: {
    width: SCOOTER_WIDTH,
    height: SCOOTER_HEIGHT,
  },
  terms: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: '#808080',
  },
  termsLinks: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: 12,
  },
  termsLink: {
    color: EVEGAH_PURPLE,
    fontWeight: '600',
  },
  bottomAsset: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    height: BOTTOM_ASSET_HEIGHT,
    opacity: 0.4,
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
