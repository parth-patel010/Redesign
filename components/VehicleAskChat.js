import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PANEL_W = Math.min(300, Dimensions.get('window').width - 32);
const COLLAPSED = 56;
const OPEN_EASE = Easing.bezier(0.22, 1, 0.36, 1);

const PROMPTS = ['Daily price', 'Range', 'What to bring', 'Helmet'];

function includes(text, words) {
  return words.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\b)${escaped}`, 'i').test(text);
  });
}

function answerFor(raw, ride) {
  const text = raw.trim().toLowerCase();
  if (!text) return '';
  if (includes(text, ['hi', 'hello', 'hey', 'hii', 'yo'])) {
    return `Hi. Ask me anything about the ${ride.name} — price, range, charging, or what to carry to pickup.`;
  }
  if (includes(text, ['thank', 'thanks', 'thx'])) {
    return 'Glad that helped. Reserve this ride from the bottom of the page whenever you are ready.';
  }
  if (includes(text, ['deposit', 'security', 'refund'])) {
    return `The ride fare is separate from a ₹250 security deposit, paid at checkout. The reservation itself is fully refundable. ${ride.discount}`;
  }
  if (includes(text, ['price', 'cost', 'rate', 'fare', 'rent', 'charge me', 'how much', 'daily', 'per day', 'month'])) {
    return `${ride.name} is ${ride.price}, or ${ride.monthly} if you keep it longer. ${ride.discount}`;
  }
  if (includes(text, ['range', 'how far', 'kilometer', 'km', 'distance', 'battery life'])) {
    const reach = ride.range ? `Rated range is ${ride.range}. ` : '';
    const pace = ride.speed ? `Top speed is ${ride.speed}. ` : '';
    return `${reach}${pace}The pack is ${ride.battery} with a ${ride.motor} motor. A full charge takes ${ride.charge}.`;
  }
  if (includes(text, ['speed', 'fast', 'km/h', 'kmh'])) {
    return ride.speed
      ? `${ride.name} tops out at ${ride.speed}. The motor is ${ride.motor}.`
      : `${ride.name} uses a ${ride.motor} motor.`;
  }
  if (includes(text, ['charg', 'plug', 'socket', 'swap'])) {
    return `Charge the ${ride.battery} pack in about ${ride.charge}. Plug into a standard 15A socket, or swap at the nearest Evegah hub.`;
  }
  if (includes(text, ['helmet', 'insurance', 'cover'])) {
    return 'Yes. A sanitized helmet and comprehensive ride cover come with every booking.';
  }
  if (includes(text, ['licence', 'license', 'aadhaar', 'aadhar', 'kyc', 'bring', 'document', 'need to', 'reserve', 'book', 'requirement'])) {
    return 'Bring your original driving licence. Aadhaar KYC needs to be completed in the app before pickup. Then tap Reserve EV on this page.';
  }
  if (includes(text, ['pickup', 'drop', 'deliver', 'doorstep', 'hub', 'flexi'])) {
    return 'You can collect the scooter at the hub, or turn on doorstep pickup and drop and set both addresses on this page.';
  }
  if (includes(text, ['load', 'weight', 'carry', 'kg'])) {
    return `${ride.name} can carry ${ride.load}. Wheels are ${ride.wheels}.`;
  }
  if (includes(text, ['feature', 'spec', 'include', 'what does', 'have'])) {
    const list = ride.features.slice(0, 4).join(', ');
    return `${ride.name} (${ride.variant}) comes with ${list}.`;
  }
  if (includes(text, ['test'])) {
    return `You can book a test drive of the ${ride.name} from the button on this page. A licence check still applies at pickup.`;
  }
  return `I can help with the ${ride.name}. Try price, range, charging, helmet, or what to bring for pickup.`;
}

export default function VehicleAskChat({ open, onOpen, onClose, ride, dockBottom = 90 }) {
  const insets = useSafeAreaInsets();
  const expandedH = Math.min(430, Dimensions.get('window').height - dockBottom - insets.top - 16);
  const listRef = useRef(null);
  const replyTimer = useRef(null);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [keyboard, setKeyboard] = useState(0);
  const [messages, setMessages] = useState(() => [
    {
      id: 'hello',
      role: 'assistant',
      text: `Hi. Ask me anything about the ${ride.name}.`,
    },
  ]);
  const grow = useSharedValue(0);
  const shade = useSharedValue(0);

  useEffect(() => () => clearTimeout(replyTimer.current), []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboard(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboard(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      grow.value = withTiming(open ? 1 : 0, {
        duration: open ? 420 : 280,
        easing: open ? OPEN_EASE : Easing.in(Easing.cubic),
      });
      shade.value = withTiming(open ? 1 : 0, { duration: open ? 280 : 200 });
    });
    return () => cancelAnimationFrame(frame);
  }, [grow, open, shade]);

  useEffect(() => {
    const frame = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 40);
    return () => clearTimeout(frame);
  }, [messages, typing, keyboard]);

  const bubbleStyle = useAnimatedStyle(() => ({
    width: interpolate(grow.value, [0, 1], [COLLAPSED, PANEL_W]),
    height: interpolate(grow.value, [0, 1], [COLLAPSED, expandedH]),
    borderRadius: interpolate(grow.value, [0, 1], [28, 22]),
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(grow.value, [0.42, 0.82], [0, 1], Extrapolation.CLAMP),
  }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(grow.value, [0, 0.28], [1, 0], Extrapolation.CLAMP),
  }));
  const shadeStyle = useAnimatedStyle(() => ({
    opacity: shade.value * 0.28,
  }));

  const send = (value) => {
    const text = (value ?? draft).trim();
    if (!text || typing) return;
    Keyboard.dismiss();
    setDraft('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
    setTyping(true);
    const reply = answerFor(text, ride);
    clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: reply }]);
      setTyping(false);
    }, 650);
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.shade, shadeStyle]} pointerEvents={open ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.bubble, { right: 16, bottom: dockBottom + (Platform.OS === 'ios' && open ? keyboard : 0) }, bubbleStyle]}>
        <LinearGradient
          colors={['#885BF4', '#632CE6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.iconLayer, iconStyle]} pointerEvents={open ? 'none' : 'auto'}>
          <Pressable style={styles.iconHit} onPress={onOpen}>
            <Ionicons name="sparkles-sharp" size={22} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
        <Animated.View style={[styles.panelBody, bodyStyle]} pointerEvents={open ? 'auto' : 'none'}>
          <View style={styles.header}>
            <View style={styles.headerMark}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Ask me anything</Text>
              <Text style={styles.headerSub} numberOfLines={1}>{ride.name}</Text>
            </View>
            <Pressable hitSlop={8} style={styles.close} onPress={onClose}>
              <Ionicons name="close" size={18} color="#1C1C1C" />
            </Pressable>
          </View>
          <ScrollView
            ref={listRef}
            style={styles.thread}
            contentContainerStyle={styles.threadContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => {
              const mine = message.role === 'user';
              return (
                <View key={message.id} style={[styles.bubbleMsg, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.text}</Text>
                </View>
              );
            })}
            {typing ? (
              <View style={[styles.bubbleMsg, styles.bubbleTheirs]}>
                <Text style={styles.typing}>Typing…</Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.composer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prompts}>
              {PROMPTS.map((prompt) => (
                <Pressable key={prompt} style={styles.prompt} onPress={() => send(prompt)}>
                  <Text style={styles.promptText}>{prompt}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.inputRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Ask about this ride"
                placeholderTextColor="#9A94A6"
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={() => send()}
              />
              <Pressable
                style={[styles.send, (!draft.trim() || typing) && styles.sendOff]}
                onPress={() => send()}
                disabled={!draft.trim() || typing}
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    elevation: 40,
  },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#11141C',
  },
  bubble: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#632CE6',
    shadowColor: '#2E147A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 16,
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHit: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#632CE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    marginTop: 1,
    color: '#6E6878',
    fontSize: 12,
    fontWeight: '600',
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
  },
  bubbleMsg: {
    maxWidth: '86%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4F1FB',
    borderBottomLeftRadius: 6,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#632CE6',
    borderBottomRightRadius: 6,
  },
  bubbleText: {
    color: '#1C1C1C',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#FFFFFF',
  },
  typing: {
    color: '#6E6878',
    fontSize: 13,
    fontWeight: '600',
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  prompts: {
    gap: 8,
    paddingRight: 8,
  },
  prompt: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F4F1FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    color: '#632CE6',
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F6F6F8',
    paddingHorizontal: 14,
    color: '#1C1C1C',
    fontSize: 14,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#632CE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: {
    backgroundColor: '#C9B8EE',
  },
});
