import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#4A168C';
const GOLD = '#E0A106';
const WORDS = ['', 'Poor', 'Not great', 'It was okay', 'Really good', 'Excellent'];
const ISSUES = ['Battery', 'Brakes', 'App', 'Motor', 'Cleanliness', 'Tyre'];

function Star({ on, onPress }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      hitSlop={6}
      onPress={() => {
        scale.value = withSpring(1.18, { damping: 8, stiffness: 320 }, () => {
          scale.value = withSpring(1, { damping: 12, stiffness: 220 });
        });
        onPress();
      }}
    >
      <Animated.View style={style}>
        <Ionicons name={on ? 'star' : 'star-outline'} size={36} color={on ? GOLD : '#D9D4E0'} />
      </Animated.View>
    </Pressable>
  );
}

export default function EndRideScreen({ vehicle, trip, receipt, summary, onDone }) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [issues, setIssues] = useState([]);
  const [note, setNote] = useState('');
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const low = rating > 0 && rating <= 3;

  const toggleIssue = (item) => {
    setIssues((current) => (
      current.includes(item) ? current.filter((name) => name !== item) : [...current, item]
    ));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingTop: insets.top + 28 }}
      >
        <Animated.View entering={ZoomIn.duration(480).springify()} style={styles.markWrap}>
          <View style={styles.mark}>
            <Ionicons name="lock-closed" size={26} color="#FFFFFF" />
          </View>
        </Animated.View>
        <Animated.Text entering={cardEnter(0)} style={styles.title}>Ride complete</Animated.Text>
        <Animated.Text entering={cardEnter(0)} style={styles.subtitle}>The scooter is locked.</Animated.Text>

        <Animated.View entering={cardEnter(1)} style={styles.card}>
          <Text style={styles.vehicle}>{vehicle?.name || 'Your scooter'}</Text>
          <Text style={styles.route} numberOfLines={1}>
            {trip?.pickupName || 'Pickup'}  →  {trip?.dropName || 'Drop'}
          </Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{summary?.elapsed || '00:00'}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statLine} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{summary?.distance || '0.0'} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statLine} />
            <View style={styles.stat}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{receipt?.bookingId || 'EVG'}</Text>
              <Text style={styles.statLabel}>Ride</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.Text entering={cardEnter(2)} style={styles.ask}>How was the ride?</Animated.Text>
        <Animated.View entering={cardEnter(2)} style={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Star key={value} on={rating >= value} onPress={() => setRating(value)} />
          ))}
        </Animated.View>
        {rating > 0 ? (
          <Animated.Text entering={FadeIn.duration(220)} style={styles.word}>
            {WORDS[rating]}
          </Animated.Text>
        ) : (
          <Text style={styles.wordMuted}>Tap a star</Text>
        )}

        {low ? (
          <Animated.View entering={FadeIn.duration(280)} style={styles.issues}>
            <Text style={styles.issueTitle}>What should we look at?</Text>
            <View style={styles.chips}>
              {ISSUES.map((item) => {
                const on = issues.includes(item);
                return (
                  <Pressable key={item} onPress={() => toggleIssue(item)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {rating > 0 ? (
          <Animated.View entering={FadeIn.duration(280)}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={low ? 'Tell us a little more' : 'Add a note, if you want'}
              placeholderTextColor="#A39AAD"
              multiline
              style={styles.note}
            />
          </Animated.View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          onPress={onDone}
          onPressIn={() => {
            btnScale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
        >
          <Animated.View style={[styles.done, btnStyle]}>
            <Text style={styles.doneText}>Done</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  markWrap: {
    alignItems: 'center',
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
    color: '#1C1C1C',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: '#6E6878',
    fontSize: 15,
  },
  card: {
    marginTop: 22,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  vehicle: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  route: {
    marginTop: 4,
    color: '#6E6878',
    fontSize: 13,
  },
  stats: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '600',
  },
  statLine: {
    width: 1,
    height: 28,
    backgroundColor: '#E8E4EE',
  },
  ask: {
    marginTop: 28,
    textAlign: 'center',
    color: '#1C1C1C',
    fontSize: 18,
    fontWeight: '700',
  },
  stars: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  word: {
    marginTop: 10,
    textAlign: 'center',
    color: PURPLE,
    fontSize: 14,
    fontWeight: '700',
  },
  wordMuted: {
    marginTop: 10,
    textAlign: 'center',
    color: '#A39AAD',
    fontSize: 14,
    fontWeight: '600',
  },
  issues: {
    marginTop: 22,
    marginHorizontal: 16,
  },
  issueTitle: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  chips: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
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
  note: {
    marginTop: 16,
    marginHorizontal: 16,
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    color: '#1C1C1C',
    fontSize: 15,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F7F7F8',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  done: {
    height: 52,
    borderRadius: 16,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
