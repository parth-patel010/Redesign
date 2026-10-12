import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#4A168C';

export default function PreferencesScreen({ prefs, onChange, onBack }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Text style={styles.section}>Notifications</Text>
        <Animated.View entering={cardEnter(0)} style={styles.card}>
          <Row
            icon="notifications-outline"
            title="Push notifications"
            text="Ride updates and low battery alerts"
            trailing={
              <Switch
                value={Boolean(prefs?.push)}
                onValueChange={(push) => onChange?.({ ...prefs, push })}
                trackColor={{ false: '#E6E1EC', true: PURPLE }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <Row
            icon="mail-outline"
            title="Email offers"
            text="Weekly summaries and discounts"
            line
            trailing={
              <Switch
                value={Boolean(prefs?.email)}
                onValueChange={(email) => onChange?.({ ...prefs, email })}
                trackColor={{ false: '#E6E1EC', true: PURPLE }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </Animated.View>

        <Text style={styles.section}>Language</Text>
        <Animated.View entering={cardEnter(1)} style={styles.card}>
          <Row
            icon="language-outline"
            title="English"
            text="The app stays in English"
            trailing={<Ionicons name="checkmark" size={18} color={PURPLE} />}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Row({ icon, title, text, trailing, line }) {
  return (
    <View style={[styles.row, line && styles.rowLine]}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={18} color={PURPLE} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
      {trailing}
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
  section: {
    marginTop: 18,
    marginBottom: 10,
    marginHorizontal: 20,
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowLine: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F3',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F6F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  text: {
    marginTop: 2,
    color: '#6E6878',
    fontSize: 12,
  },
});
