import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dimensions, Image as RNImage, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEventListener } from 'expo';
import { BlurTargetView, BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
  ZoomIn,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const { width: SCREEN_W } = Dimensions.get('window');
const PURPLE = '#4A168C';
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const TOAST_OFFSCREEN_Y = -120;
const TOAST_ENTER_MS = 560;
const TOAST_EXIT_MS = 480;
const TOAST_VISIBLE_MS = 4000;
const TOAST_EASE_IN = Easing.bezier(0.4, 0, 0.2, 1);
const INTRO_VIDEO = require('../assets/intro-ride.mp4');
const VIDEO_WIDTH = 1492;
const VIDEO_HEIGHT = 1440;
const BANNER_HEIGHT = Math.round(SCREEN_W * (VIDEO_HEIGHT / VIDEO_WIDTH));
const GLIDE_RATE = 1.5;
const SCOOTER_WIDTH = 60;
const SCOOTER_HEIGHT = 32;
const TRAIL_WIDTH = 30;
const RIDE_GROUP_WIDTH = SCOOTER_WIDTH + TRAIL_WIDTH;
const ROAD_DASHES = Array.from({ length: 16 }, (_, index) => index);
const VIDEO_MARKS = [0, 1.5, 3, 4.5, 6, 7.5, 9.2];
const PIN_COL = 60;
const LABEL_SLOT = 42;

const ZONES = [
  { id: 'gotri', name: 'Gotri', area: 'Gotri Main Road', distance: '1.2 km' },
  { id: 'manjalpur', name: 'Manjalpur', area: 'Manjalpur Main Road', distance: '2.8 km' },
  { id: 'aatapi', name: 'Aatapi', area: 'Ajwa Nimeta Road', distance: '4.5 km' },
  { id: 'kpgu', name: 'KPGU', area: 'Babaria Institute Campus', distance: '5.1 km' },
];

const TIMES = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'];
const CLOCK_SIZE = 248;
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfDay(offset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

const DAYS = Array.from({ length: 2 }, (_, index) => startOfDay(index));
const LATEST_DAY = (() => {
  const date = startOfDay(0);
  date.setMonth(date.getMonth() + 1);
  return date;
})();

function dayName(date, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

function clockToDate(day, time) {
  if (!day || !time) return null;
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3] === 'PM') hour += 12;
  const date = new Date(day);
  date.setHours(hour, Number(match[2]), 0, 0);
  return date;
}

function spanLabel(start, end) {
  const hours = Math.round((end.getTime() - start.getTime()) / 36e5);
  if (hours <= 0) return '';
  if (hours < 24) return `${hours} hr`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

function whenLabel(day, time) {
  if (!day || !time) return 'Add a time';
  const index = DAYS.findIndex((item) => item.getTime() === day.getTime());
  return `${dayName(day, index)} · ${time}`;
}

function shortDate(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

function presetIndex(day) {
  if (!day) return -1;
  return DAYS.findIndex((item) => item.getTime() === day.getTime());
}

function customDateLabel(day) {
  const index = presetIndex(day);
  if (!day || index >= 0) return 'Custom';
  return shortDate(day);
}

function customTimeLabel(time) {
  if (!time || TIMES.includes(time)) return 'Custom';
  return time;
}

function parseClock(value) {
  const match = String(value || '').match(/(\d+):(\d+)\s*(AM|PM)/);
  if (!match) return { hour: 6, minute: 0, meridiem: 'PM' };
  return { hour: Number(match[1]), minute: Number(match[2]), meridiem: match[3] };
}

function formatClock(hour, minute, meridiem) {
  return `${hour}:${String(minute).padStart(2, '0')} ${meridiem}`;
}

function ringSpot(index, count, radius) {
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  return {
    left: CLOCK_SIZE / 2 + Math.cos(angle) * radius - 18,
    top: CLOCK_SIZE / 2 + Math.sin(angle) * radius - 18,
  };
}

function monthCells(cursor) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(new Date(year, month, day));
  return cells;
}

function dayInWindow(day) {
  const time = day.getTime();
  return time >= startOfDay(0).getTime() && time <= LATEST_DAY.getTime();
}

function rangeCaption(start, end) {
  const fmt = (day) => day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (!start) return 'Tap a start date, then an end date';
  if (!end) return `${fmt(start)}  ·  tap the end date`;
  if (end.getTime() === start.getTime()) return fmt(start);
  return `${fmt(start)}  –  ${fmt(end)}`;
}

function PopupShell({ blurTarget, onClose, children }) {
  const progress = useSharedValue(0);
  const closing = useRef(false);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 420,
      easing: EASE,
      reduceMotion: ReduceMotion.Never,
    });
  }, [progress]);

  const requestClose = () => {
    if (closing.current) return;
    closing.current = true;
    progress.value = withTiming(0, {
      duration: 220,
      easing: TOAST_EASE_IN,
      reduceMotion: ReduceMotion.Never,
    }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 32 },
      { scale: 0.92 + progress.value * 0.08 },
    ],
  }));

  return (
    <View style={styles.popupRoot}>
      <Pressable style={StyleSheet.absoluteFill} onPress={requestClose}>
        <BlurView
          blurTarget={blurTarget}
          intensity={48}
          tint="light"
          blurMethod="dimezisBlurView"
          blurReductionFactor={2}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>
      <Animated.View style={[styles.popupCard, cardStyle]}>
        {children(requestClose)}
      </Animated.View>
    </View>
  );
}

function ClockPopup({ blurTarget, time, title, onClose, onConfirm }) {
  const parsed = parseClock(time);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(MINUTES.reduce((best, item) => (
    Math.abs(item - parsed.minute) < Math.abs(best - parsed.minute) ? item : best
  ), 0));
  const [meridiem, setMeridiem] = useState(parsed.meridiem);

  return (
    <PopupShell blurTarget={blurTarget} onClose={onClose}>
      {(requestClose) => (
        <>
          <Text style={styles.popupTitle}>{title}</Text>
          <View style={styles.meridiemRow}>
            {['AM', 'PM'].map((item) => {
              const on = meridiem === item;
              return (
                <Pressable key={item} onPress={() => setMeridiem(item)} style={[styles.meridiem, on && styles.meridiemOn]}>
                  <Text style={[styles.meridiemText, on && styles.meridiemTextOn]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.clock}>
            <Text style={styles.clockReadout}>{formatClock(hour, minute, meridiem)}</Text>
            {HOURS.map((item, index) => {
              const on = hour === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setHour(item)}
                  style={[styles.clockNum, ringSpot(index, 12, 92), on && styles.clockNumOn]}
                >
                  <Text style={[styles.clockNumText, on && styles.clockNumTextOn]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.minuteRow}>
            {MINUTES.map((item) => {
              const on = minute === item;
              return (
                <Pressable key={item} onPress={() => setMinute(item)} style={[styles.minute, on && styles.minuteOn]}>
                  <Text style={[styles.minuteText, on && styles.minuteTextOn]}>{String(item).padStart(2, '0')}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.popupActions}>
            <Pressable onPress={requestClose} style={styles.popupCancel}>
              <Text style={styles.popupCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onConfirm(formatClock(hour, minute, meridiem));
                requestClose();
              }}
              style={styles.popupSet}
            >
              <Text style={styles.popupSetText}>Set time</Text>
            </Pressable>
          </View>
        </>
      )}
    </PopupShell>
  );
}

function DatePopup({ blurTarget, pickupDay, dropDay, onClose, onConfirm }) {
  const seededStart = pickupDay && dayInWindow(pickupDay) ? pickupDay : null;
  const seededEnd = dropDay && seededStart && dropDay.getTime() >= seededStart.getTime() && dayInWindow(dropDay)
    ? dropDay
    : null;
  const focus = seededStart || startOfDay(0);
  const [cursor, setCursor] = useState(new Date(focus.getFullYear(), focus.getMonth(), 1));
  const [start, setStart] = useState(seededStart);
  const [end, setEnd] = useState(seededEnd);
  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const earliestMonth = startOfDay(0);
  const canPrev = cursor.getFullYear() > earliestMonth.getFullYear()
    || cursor.getMonth() > earliestMonth.getMonth();
  const canNext = cursor.getFullYear() < LATEST_DAY.getFullYear()
    || cursor.getMonth() < LATEST_DAY.getMonth();

  const pick = (day) => {
    if (!start || end) {
      setStart(day);
      setEnd(null);
      return;
    }
    if (day.getTime() < start.getTime()) {
      setStart(day);
      return;
    }
    setEnd(day);
  };

  return (
    <PopupShell blurTarget={blurTarget} onClose={onClose}>
      {(requestClose) => (
        <>
          <Text style={styles.popupTitle}>Select dates</Text>
          <Text style={styles.popupHint}>{rangeCaption(start, end)}</Text>
          <View style={styles.monthRow}>
            <Pressable
              disabled={!canPrev}
              onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              style={[styles.monthBtn, !canPrev && styles.monthBtnOff]}
            >
              <Ionicons name="chevron-back" size={18} color={canPrev ? '#1C1C1C' : '#C8C0D4'} />
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable
              disabled={!canNext}
              onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              style={[styles.monthBtn, !canNext && styles.monthBtnOff]}
            >
              <Ionicons name="chevron-forward" size={18} color={canNext ? '#1C1C1C' : '#C8C0D4'} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.weekText}>{item}</Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {monthCells(cursor).map((item, index) => {
              if (!item) return <View key={`e-${index}`} style={styles.calCell} />;
              const allowed = dayInWindow(item);
              const time = item.getTime();
              const startTime = start?.getTime();
              const endTime = end?.getTime();
              const isStart = startTime === time;
              const isEnd = endTime === time && endTime !== startTime;
              const inSpan = startTime != null && endTime != null && endTime > startTime && time > startTime && time < endTime;
              const showBand = (isStart && endTime > startTime) || isEnd || inSpan;
              return (
                <Pressable
                  key={item.toISOString()}
                  disabled={!allowed}
                  onPress={() => pick(item)}
                  android_ripple={{ color: 'transparent', borderless: true, radius: 18 }}
                  style={styles.calCell}
                >
                  {showBand ? (
                    <View
                      style={[
                        styles.calBand,
                        inSpan && styles.calBandMid,
                        isStart && styles.calBandStart,
                        isEnd && styles.calBandEnd,
                      ]}
                    />
                  ) : null}
                  <View style={[styles.calDay, (isStart || isEnd || (endTime === time)) && styles.calDayOn]}>
                    <Text
                      style={[
                        styles.calDayText,
                        !allowed && styles.calDayOff,
                        inSpan && styles.calDayBetween,
                        (isStart || isEnd || endTime === time) && styles.calDayTextOn,
                      ]}
                    >
                      {item.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.popupActions}>
            <Pressable onPress={requestClose} style={styles.popupCancel}>
              <Text style={styles.popupCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!start}
              onPress={() => {
                onConfirm(start, end || start);
                requestClose();
              }}
              style={[styles.popupSet, !start && styles.popupSetOff]}
            >
              <Text style={styles.popupSetText}>Set dates</Text>
            </Pressable>
          </View>
        </>
      )}
    </PopupShell>
  );
}

function missingStep({ pickupZone, dropPlace, pickupDay, pickupTime, dropDay, dropTime }) {
  if (!pickupZone) return 'Select place';
  if (!dropPlace) return 'Select drop place';
  if (!pickupDay) return 'Select date';
  if (!pickupTime) return 'Select time';
  if (!dropDay) return 'Select drop date';
  if (!dropTime) return 'Select drop time';
  return '';
}

function RideMarker({ title, name, spot }) {
  const width = useSharedValue(0);

  const onMeasure = (event) => {
    const next = Math.ceil(event.nativeEvent.layout.width);
    if (next < 8) return;
    if (width.value < 1) {
      width.value = next;
      return;
    }
    if (Math.abs(next - width.value) < 1) return;
    width.value = withTiming(next, { duration: 320, easing: EASE, reduceMotion: ReduceMotion.Never });
  };

  const labelStyle = useAnimatedStyle(() => {
    const box = width.value;
    return {
      width: box,
      opacity: box > 0 ? 1 : 0,
      transform: [{ translateX: -box / 2 }],
    };
  });

  return (
    <Animated.View entering={ZoomIn.duration(420).springify()} pointerEvents="none" style={[styles.ridePin, spot]}>
      <View pointerEvents="none" style={styles.pinMeasureHost}>
        <View collapsable={false} style={styles.pinMeasure} onLayout={onMeasure}>
          <Text style={styles.pinLabelText}>{title}</Text>
          <Text style={styles.pinPlace}>{name}</Text>
        </View>
      </View>
      <Animated.View style={[styles.pinLabel, labelStyle]}>
        <Text style={styles.pinLabelText} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.pinPlace} numberOfLines={1}>
          {name}
        </Text>
      </Animated.View>
      <View style={styles.pinHead}>
        <View style={styles.pinHole} />
      </View>
      <View style={styles.pinTip} />
    </Animated.View>
  );
}

export default function RentScreen({ vehicle, onBack, onContinue }) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(INTRO_VIDEO, (video) => {
    video.loop = false;
    video.muted = true;
    video.playbackRate = GLIDE_RATE;
    video.timeUpdateEventInterval = 0.05;
    video.currentTime = 0;
    video.pause();
  });
  const listRef = useRef(null);
  const blurTargetRef = useRef(null);
  const targetRef = useRef(0);
  const movingRef = useRef(false);
  const stepRef = useRef(0);
  const settledStepRef = useRef(-1);
  const tabX = useSharedValue(0);
  const [tabWidth, setTabWidth] = useState(0);
  const [mode, setMode] = useState('pickup');
  const [sameDrop, setSameDrop] = useState(true);
  const [pickupZone, setPickupZone] = useState(null);
  const [dropZone, setDropZone] = useState(null);
  const [pickupDay, setPickupDay] = useState(null);
  const [dropDay, setDropDay] = useState(null);
  const [pickupTime, setPickupTime] = useState(null);
  const [dropTime, setDropTime] = useState(null);
  const [clockFor, setClockFor] = useState(null);
  const [dateFor, setDateFor] = useState(null);
  const [rideSettled, setRideSettled] = useState(false);
  const [pickupPinned, setPickupPinned] = useState(false);
  const [datePinned, setDatePinned] = useState(false);
  const [dropPinned, setDropPinned] = useState(false);
  const [placePinned, setPlacePinned] = useState(false);
  const [riding, setRiding] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastTick, setToastTick] = useState(0);
  const toastTimerRef = useRef(null);
  const toastHidingRef = useRef(false);
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

  const dropPlace = sameDrop ? pickupZone : dropZone;
  const pickupAt = clockToDate(pickupDay, pickupTime);
  const dropAt = clockToDate(dropDay, dropTime);
  const duration = pickupAt && dropAt ? spanLabel(pickupAt, dropAt) : '';
  const showDuration = Boolean(pickupZone && dropPlace && pickupDay && pickupTime && dropDay && dropTime && duration);
  const ready = showDuration;
  const step = [pickupZone, dropPlace, pickupDay, pickupTime, dropDay, dropTime].filter(Boolean).length;
  stepRef.current = step;
  const pickupDayIndex = pickupDay ? DAYS.findIndex((item) => item.getTime() === pickupDay.getTime()) : -1;
  const pickupDayLabel = pickupDay
    ? (pickupDayIndex >= 0 ? dayName(pickupDay, pickupDayIndex) : shortDate(pickupDay))
    : '';
  const dropDayIndex = dropDay ? DAYS.findIndex((item) => item.getTime() === dropDay.getTime()) : -1;
  const dropDayLabel = dropDay
    ? (dropDayIndex >= 0 ? dayName(dropDay, dropDayIndex) : shortDate(dropDay))
    : '';

  const markSettled = () => {
    settledStepRef.current = stepRef.current;
    movingRef.current = false;
    player.pause();
    setRideSettled(true);
  };

  useEffect(() => {
    const target = VIDEO_MARKS[Math.min(step, VIDEO_MARKS.length - 1)];
    targetRef.current = target;
    const now = player.currentTime || 0;
    if (target <= now + 0.05) {
      markSettled();
      return;
    }
    if (movingRef.current && player.playing) return;
    movingRef.current = true;
    setRideSettled(false);
    player.playbackRate = GLIDE_RATE;
    player.play();
  }, [player, step]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (!movingRef.current) return;
    if (currentTime + 0.05 < targetRef.current) return;
    markSettled();
  });

  useEffect(() => {
    if (!rideSettled || settledStepRef.current !== step) return;
    if (pickupZone && step >= 2) setPickupPinned(true);
    if (pickupDay && step >= 3) setDatePinned(true);
    if (dropDay && step >= 4) setDropPinned(true);
    if (dropTime && dropPlace && step >= 6) setPlacePinned(true);
  }, [rideSettled, pickupZone, pickupDay, dropDay, dropTime, dropPlace, step]);

  useEffect(() => {
    const travel = Math.max((tabWidth - 8) / 2, 0);
    tabX.value = withTiming(mode === 'time' ? travel : 0, { duration: 320, easing: EASE });
  }, [mode, tabWidth, tabX]);

  useEffect(() => {
    if (mode !== 'drop') return;
    listRef.current?.scrollTo({ y: 0, animated: true });
  }, [mode]);

  const tabStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabX.value }],
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

  const showToast = useCallback((message) => {
    if (!message) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastHidingRef.current = false;
    setToastMessage(message);
    setToastTick((tick) => tick + 1);
    toastTimerRef.current = setTimeout(hideToast, TOAST_VISIBLE_MS);
  }, [hideToast]);

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
    toastOpacity.value = withTiming(1, { duration: 420, easing: EASE });
    toastTranslateY.value = withTiming(0, { duration: TOAST_ENTER_MS, easing: EASE });
    toastScale.value = withTiming(1, { duration: TOAST_ENTER_MS, easing: EASE });
  }, [toastMessage, toastTick, toastOpacity, toastScale, toastTranslateY]);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const toastAnimStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslateY.value }, { scale: toastScale.value }],
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

  const finishRide = () => {
    setRiding(false);
    onContinue?.({
      pickupName: pickupZone?.name,
      dropName: dropPlace?.name,
      pickupAt: pickupAt?.getTime() || null,
      dropAt: dropAt?.getTime() || null,
    });
  };

  const playContinueRide = () => {
    if (riding) return;
    setRiding(true);
    textShift.value = 0;
    textFade.value = 1;
    arrowShift.value = 0;
    lineShift.value = 40;
    textShift.value = withTiming(-46, { duration: 420, easing: Easing.out(Easing.cubic) });
    textFade.value = withTiming(0, { duration: 360 });
    arrowShift.value = withTiming(72, { duration: 480, easing: Easing.out(Easing.cubic) });
    lineShift.value = withDelay(500, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
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
            arrowShift.value = withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }, (backDone) => {
              if (backDone) runOnJS(finishRide)();
            });
          });
        },
      ),
    );
  };

  const choosePickup = (zone) => {
    setPickupZone(zone);
    if (sameDrop) setDropZone(zone);
    if (!pickupDay) setMode('time');
  };

  const chooseDrop = (zone) => {
    if (!pickupZone) {
      showToast('Select place');
      return;
    }
    setDropZone(zone);
    setMode('time');
  };

  const choosePickupDay = (day) => {
    if (!pickupZone) {
      showToast('Select place');
      return;
    }
    if (!dropPlace) {
      showToast('Select drop place');
      return;
    }
    const nextDropDay = dropDay && dropDay.getTime() < day.getTime() ? day : dropDay;
    setPickupDay(day);
    if (nextDropDay !== dropDay) setDropDay(nextDropDay);
  };

  const chooseDropDay = (day) => {
    if (!pickupZone) {
      showToast('Select place');
      return;
    }
    if (!dropPlace) {
      showToast('Select drop place');
      return;
    }
    if (!pickupDay) {
      showToast('Select date');
      return;
    }
    if (!pickupTime) {
      showToast('Select time');
      return;
    }
    setDropDay(day);
  };

  const choosePickupTime = (time) => {
    if (!pickupZone) {
      showToast('Select place');
      return;
    }
    if (!dropPlace) {
      showToast('Select drop place');
      return;
    }
    if (!pickupDay) {
      showToast('Select date');
      return;
    }
    setPickupTime(time);
  };

  const chooseDropTime = (time) => {
    if (!pickupZone) {
      showToast('Select place');
      return;
    }
    if (!dropPlace) {
      showToast('Select drop place');
      return;
    }
    if (!pickupDay) {
      showToast('Select date');
      return;
    }
    if (!pickupTime) {
      showToast('Select time');
      return;
    }
    if (!dropDay) {
      showToast('Select drop date');
      return;
    }
    setDropTime(time);
  };

  const openClock = (which) => {
    if (!pickupZone) {
      showToast('Select place');
      return;
    }
    if (!dropPlace) {
      showToast('Select drop place');
      return;
    }
    if (!pickupDay) {
      showToast('Select date');
      return;
    }
    if (which === 'drop') {
      if (!pickupTime) {
        showToast('Select time');
        return;
      }
      if (!dropDay) {
        showToast('Select drop date');
        return;
      }
    }
    setClockFor(which);
  };

  const openDate = () => {
    if (!pickupZone) {
      showToast('Select place');
      return;
    }
    if (!dropPlace) {
      showToast('Select drop place');
      return;
    }
    setDateFor('range');
  };

  return (
    <View style={styles.root}>
      <BlurTargetView ref={blurTargetRef} collapsable={false} style={styles.blurTarget}>
      <StatusBar style="dark" />
      <View style={styles.bannerWrap}>
        <VideoView
          player={player}
          style={styles.bannerVideo}
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture={false}
          surfaceType="textureView"
        />
        <Pressable hitSlop={8} style={[styles.back, { top: insets.top + 8 }]} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        {pickupPinned && pickupZone ? (
          <RideMarker title="Pickup" name={pickupZone.name} spot={styles.pickupSpot} />
        ) : null}
        {datePinned && pickupDayLabel ? (
          <RideMarker title="Date" name={pickupDayLabel} spot={styles.dateSpot} />
        ) : null}
        {dropPinned && dropDayLabel ? (
          <RideMarker title="Drop" name={dropDayLabel} spot={styles.dropSpot} />
        ) : null}
        {placePinned && dropPlace ? (
          <RideMarker title="Drop" name={dropPlace.name} spot={styles.placeSpot} />
        ) : null}
      </View>

      <View style={styles.tripBar}>
        <Text style={styles.kicker}>Rent your EV · {vehicle?.name || 'Your scooter'}</Text>
        <View style={styles.tripRow}>
          <View style={styles.tripEnd}>
            <Text style={styles.tripKicker}>Pickup</Text>
            <Text style={styles.tripPlace} numberOfLines={1}>
              {pickupZone?.name || 'Select'}
            </Text>
            <Text style={[styles.tripWhen, pickupTime && styles.tripWhenOn]} numberOfLines={1}>
              {pickupDay && pickupTime ? whenLabel(pickupDay, pickupTime) : 'Select'}
            </Text>
          </View>
          <View style={styles.tripMid}>
            {showDuration ? (
              <Animated.Text entering={FadeIn.duration(320)} style={styles.tripDuration}>
                {duration}
              </Animated.Text>
            ) : null}
          </View>
          <View style={[styles.tripEnd, styles.tripEndRight]}>
            <Text style={styles.tripKicker}>Drop</Text>
            <Text style={styles.tripPlace} numberOfLines={1}>
              {dropPlace?.name || 'Select'}
            </Text>
            <Text style={[styles.tripWhen, dropTime && styles.tripWhenOn]} numberOfLines={1}>
              {dropDay && dropTime ? whenLabel(dropDay, dropTime) : 'Select'}
            </Text>
          </View>
        </View>
      </View>

        <View style={styles.sheetClip}>
        <ScrollView
          ref={listRef}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 108 }}
        >
        <Animated.View entering={cardEnter(0)} style={styles.sheet}>
          <View
            style={styles.tabs}
            onLayout={(event) => setTabWidth(event.nativeEvent.layout.width)}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.tabMark, { width: Math.max((tabWidth - 8) / 2, 0) }, tabStyle]}
            />
            <Pressable style={styles.tab} onPress={() => setMode(mode === 'drop' ? 'drop' : 'pickup')}>
              <Text style={[styles.tabText, mode !== 'time' && styles.tabTextOn]}>Place</Text>
            </Pressable>
            <Pressable
              style={styles.tab}
              onPress={() => {
                const missed = missingStep({ pickupZone, dropPlace, pickupDay: true, pickupTime: true, dropDay: true, dropTime: true });
                if (missed) {
                  showToast(missed);
                  return;
                }
                setMode('time');
              }}
            >
              <Text style={[styles.tabText, mode === 'time' && styles.tabTextOn]}>When</Text>
            </Pressable>
          </View>

          {mode === 'time' ? (
            <Animated.View key="time" entering={FadeIn.duration(320)}>
              <Text style={styles.sheetTitle}>Pickup</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
                {DAYS.map((day, index) => {
                  const on = pickupDay?.getTime() === day.getTime();
                  return (
                    <Pressable key={day.toISOString()} onPress={() => choosePickupDay(day)} style={[styles.day, on && styles.dayOn]}>
                      <Text style={[styles.dayText, on && styles.dayTextOn]}>{dayName(day, index)}</Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={openDate}
                  style={[styles.day, presetIndex(pickupDay) < 0 && pickupDay && styles.dayOn]}
                >
                  <Text style={[styles.dayText, presetIndex(pickupDay) < 0 && pickupDay && styles.dayTextOn]}>
                    {customDateLabel(pickupDay)}
                  </Text>
                </Pressable>
              </ScrollView>
              <View style={styles.timeGrid}>
                {TIMES.map((time) => {
                  const on = pickupTime === time;
                  return (
                    <Pressable key={`p-${time}`} onPress={() => choosePickupTime(time)} style={[styles.time, on && styles.timeOn]}>
                      <Text style={[styles.timeText, on && styles.timeTextOn]}>{time}</Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => openClock('pickup')}
                  style={[styles.time, pickupTime && !TIMES.includes(pickupTime) && styles.timeOn]}
                >
                  <Text style={[styles.timeText, pickupTime && !TIMES.includes(pickupTime) && styles.timeTextOn]}>
                    {customTimeLabel(pickupTime)}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.sheetTitle, styles.sheetTitleGap]}>Drop</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
                {DAYS.map((day, index) => {
                  const blocked = pickupDay && day.getTime() < pickupDay.getTime();
                  const on = dropDay?.getTime() === day.getTime();
                  return (
                    <Pressable
                      key={`d-${day.toISOString()}`}
                      disabled={blocked}
                      onPress={() => chooseDropDay(day)}
                      style={[styles.day, on && styles.dayOn, blocked && styles.dayOff]}
                    >
                      <Text style={[styles.dayText, on && styles.dayTextOn, blocked && styles.dayTextOff]}>
                        {dayName(day, index)}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={openDate}
                  style={[styles.day, presetIndex(dropDay) < 0 && dropDay && styles.dayOn]}
                >
                  <Text style={[styles.dayText, presetIndex(dropDay) < 0 && dropDay && styles.dayTextOn]}>
                    {customDateLabel(dropDay)}
                  </Text>
                </Pressable>
              </ScrollView>
              <View style={styles.timeGrid}>
                {TIMES.map((time) => {
                  const on = dropTime === time;
                  return (
                    <Pressable key={`r-${time}`} onPress={() => chooseDropTime(time)} style={[styles.time, on && styles.timeOn]}>
                      <Text style={[styles.timeText, on && styles.timeTextOn]}>{time}</Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => openClock('drop')}
                  style={[styles.time, dropTime && !TIMES.includes(dropTime) && styles.timeOn]}
                >
                  <Text style={[styles.timeText, dropTime && !TIMES.includes(dropTime) && styles.timeTextOn]}>
                    {customTimeLabel(dropTime)}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : (
            <Animated.View key={mode} entering={FadeIn.duration(320)}>
              <View style={styles.sheetHead}>
                <Text style={[styles.sheetTitle, styles.sheetTitleInline]}>
                  {mode === 'drop' ? 'Where does it end?' : 'Where do you pick it up?'}
                </Text>
                {mode === 'drop' ? (
                  <Pressable hitSlop={8} onPress={() => setMode('pickup')}>
                    <Text style={styles.backLinkText}>Change pickup</Text>
                  </Pressable>
                ) : null}
              </View>
              {ZONES.map((zone) => {
                const selected = (mode === 'drop' ? dropZone?.id : pickupZone?.id) === zone.id;
                return (
                  <Pressable
                    key={zone.id}
                    onPress={() => (mode === 'drop' ? chooseDrop(zone) : choosePickup(zone))}
                    style={[styles.zone, selected && styles.zoneOn]}
                  >
                    <View style={[styles.zoneMark, selected && styles.zoneMarkOn]}>
                      {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                    </View>
                    <View style={styles.zoneCopy}>
                      <Text style={styles.zoneName}>{zone.name}</Text>
                      <Text style={styles.zoneArea}>{zone.area}</Text>
                    </View>
                    <Text style={styles.zoneDistance}>{zone.distance}</Text>
                  </Pressable>
                );
              })}

              {mode === 'pickup' ? (
                <View style={styles.sameRow}>
                  <Pressable
                    onPress={() => {
                      setSameDrop(true);
                      if (pickupZone) setDropZone(pickupZone);
                    }}
                    style={[styles.sameBtn, sameDrop && styles.sameBtnOn]}
                  >
                    <Text style={[styles.sameText, sameDrop && styles.sameTextOn]}>Same zone</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setSameDrop(false);
                      setDropZone(null);
                      setMode('drop');
                      listRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                    style={[styles.sameBtn, !sameDrop && styles.sameBtnOn]}
                  >
                    <Text style={[styles.sameText, !sameDrop && styles.sameTextOn]}>Other zone</Text>
                  </Pressable>
                </View>
              ) : null}
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
        </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          disabled={riding}
          onPress={() => {
            const missed = missingStep({ pickupZone, dropPlace, pickupDay, pickupTime, dropDay, dropTime });
            if (missed) {
              showToast(missed);
              return;
            }
            playContinueRide();
          }}
          onPressIn={() => {
            if (!ready || riding) return;
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
            style={[styles.cta, ready && styles.ctaOn, btnAnimStyle]}
          >
            <Animated.Text style={[styles.ctaText, ready && styles.ctaTextOn, continueTextStyle]}>
              Continue
            </Animated.Text>
            <Animated.View style={[styles.arrowCircle, !ready && styles.arrowCircleOff, arrowSlideStyle]}>
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
          </Animated.View>
        </Pressable>
      </View>
      </BlurTargetView>
      {clockFor ? (
        <ClockPopup
          blurTarget={blurTargetRef}
          title={clockFor === 'drop' ? 'Drop time' : 'Pickup time'}
          time={clockFor === 'drop' ? dropTime : pickupTime}
          onClose={() => setClockFor(null)}
          onConfirm={(time) => {
            if (clockFor === 'drop') chooseDropTime(time);
            else choosePickupTime(time);
          }}
        />
      ) : null}
      {dateFor ? (
        <DatePopup
          blurTarget={blurTargetRef}
          pickupDay={pickupDay}
          dropDay={dropDay}
          onClose={() => setDateFor(null)}
          onConfirm={(start, end) => {
            setPickupDay(start);
            setDropDay(end);
          }}
        />
      ) : null}
      {toastMessage ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { top: Math.max(insets.top, 12) + 8 }, toastAnimStyle]}
        >
          <Ionicons name="close-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  blurTarget: {
    flex: 1,
  },
  sheetClip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  kicker: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '700',
  },
  bannerWrap: {
    width: '100%',
    height: BANNER_HEIGHT,
    backgroundColor: '#F4F5F7',
  },
  bannerVideo: {
    width: '100%',
    height: BANNER_HEIGHT,
  },
  back: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  ridePin: {
    position: 'absolute',
    width: PIN_COL,
    paddingTop: LABEL_SLOT,
    alignItems: 'center',
    zIndex: 3,
  },
  pickupSpot: {
    left: '12%',
    top: '22%',
  },
  dateSpot: {
    left: '26%',
    top: '31%',
  },
  dropSpot: {
    left: '57%',
    top: '28%',
  },
  placeSpot: {
    left: '81%',
    top: '22%',
  },
  pinMeasureHost: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SCREEN_W,
    opacity: 0,
    alignItems: 'flex-start',
  },
  pinMeasure: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinLabel: {
    position: 'absolute',
    top: 0,
    left: PIN_COL / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    overflow: 'hidden',
  },
  pinLabelText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
  },
  pinPlace: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '800',
  },
  pinHead: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHole: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  pinTip: {
    width: 0,
    height: 0,
    marginTop: -6,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: PURPLE,
  },
  tripBar: {
    marginTop: -28,
    marginBottom: 14,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    zIndex: 2,
    shadowColor: '#1A1030',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  tripRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tripEnd: {
    flex: 1,
  },
  tripEndRight: {
    alignItems: 'flex-end',
  },
  tripKicker: {
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tripPlace: {
    marginTop: 4,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  tripWhen: {
    marginTop: 2,
    color: '#B0A8BC',
    fontSize: 12,
  },
  tripWhenOn: {
    color: PURPLE,
    fontWeight: '600',
  },
  tripMid: {
    minWidth: 64,
    alignItems: 'center',
    paddingTop: 16,
  },
  tripDuration: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '700',
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    position: 'relative',
  },
  tab: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    color: '#8A8496',
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextOn: {
    color: '#1C1C1C',
  },
  tabMark: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  sheetTitle: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sheetTitleInline: {
    flex: 1,
    marginBottom: 0,
  },
  sheetTitleGap: {
    marginTop: 18,
  },
  zone: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEF2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  zoneOn: {
    borderColor: PURPLE,
    backgroundColor: '#F8F4FC',
  },
  zoneMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D9D4E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneMarkOn: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },
  zoneCopy: {
    flex: 1,
    marginLeft: 12,
  },
  zoneName: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  zoneArea: {
    marginTop: 1,
    color: '#8A8496',
    fontSize: 12,
  },
  zoneDistance: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  sameRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  sameBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sameBtnOn: {
    backgroundColor: '#F3EAFB',
  },
  sameText: {
    color: '#8A8496',
    fontSize: 13,
    fontWeight: '700',
  },
  sameTextOn: {
    color: PURPLE,
  },
  backLinkText: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: '700',
  },
  dayRow: {
    gap: 8,
    paddingRight: 8,
  },
  day: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: {
    backgroundColor: PURPLE,
  },
  dayOff: {
    opacity: 0.35,
  },
  dayText: {
    color: '#3C3846',
    fontSize: 13,
    fontWeight: '600',
  },
  dayTextOn: {
    color: '#FFFFFF',
  },
  dayTextOff: {
    color: '#8A8496',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  time: {
    width: '31%',
    flexGrow: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOn: {
    backgroundColor: '#F3EAFB',
    borderWidth: 1,
    borderColor: PURPLE,
  },
  timeText: {
    color: '#3C3846',
    fontSize: 13,
    fontWeight: '600',
  },
  timeTextOn: {
    color: PURPLE,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  cta: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EEEAF3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  ctaOn: {
    backgroundColor: PURPLE,
  },
  ctaText: {
    color: '#8A8496',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaTextOn: {
    color: '#FFFFFF',
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
  arrowCircleOff: {
    backgroundColor: '#C8C0D4',
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
  popupRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 80,
    elevation: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  popupCard: {
    width: '100%',
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#2A085C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 16,
  },
  popupTitle: {
    color: '#1C1C1C',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  popupHint: {
    marginTop: 4,
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  meridiemRow: {
    marginTop: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#F4F4F6',
    borderRadius: 12,
    padding: 4,
  },
  meridiem: {
    width: 64,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meridiemOn: {
    backgroundColor: PURPLE,
  },
  meridiemText: {
    color: '#8A8496',
    fontSize: 13,
    fontWeight: '700',
  },
  meridiemTextOn: {
    color: '#FFFFFF',
  },
  clock: {
    marginTop: 16,
    alignSelf: 'center',
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    backgroundColor: '#F6F1FC',
  },
  clockReadout: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: CLOCK_SIZE / 2 - 12,
    textAlign: 'center',
    color: PURPLE,
    fontSize: 18,
    fontWeight: '800',
  },
  clockNum: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockNumOn: {
    backgroundColor: PURPLE,
  },
  clockNumText: {
    color: '#1C1C1C',
    fontSize: 14,
    fontWeight: '700',
  },
  clockNumTextOn: {
    color: '#FFFFFF',
  },
  minuteRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  minute: {
    width: 42,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteOn: {
    backgroundColor: PURPLE,
  },
  minuteText: {
    color: '#3C3846',
    fontSize: 12,
    fontWeight: '700',
  },
  minuteTextOn: {
    color: '#FFFFFF',
  },
  monthRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F6',
  },
  monthBtnOff: {
    opacity: 0.45,
  },
  monthLabel: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  weekRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  weekText: {
    width: '14.28%',
    textAlign: 'center',
    color: '#8A8496',
    fontSize: 12,
    fontWeight: '700',
  },
  calGrid: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calBand: {
    position: 'absolute',
    top: 4,
    height: 36,
    backgroundColor: '#E7D6F6',
  },
  calBandMid: {
    left: 0,
    right: 0,
  },
  calBandStart: {
    left: '50%',
    right: 0,
  },
  calBandEnd: {
    left: 0,
    right: '50%',
  },
  calDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexGrow: 0,
    flexShrink: 0,
    zIndex: 1,
  },
  calDayOn: {
    backgroundColor: PURPLE,
  },
  calDayText: {
    color: '#1C1C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  calDayOff: {
    color: '#C8C0D4',
  },
  calDayBetween: {
    color: PURPLE,
    fontWeight: '700',
  },
  calDayTextOn: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  popupActions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  popupCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCancelText: {
    color: '#3C3846',
    fontSize: 14,
    fontWeight: '700',
  },
  popupSet: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupSetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  popupSetOff: {
    opacity: 0.4,
  },
});
