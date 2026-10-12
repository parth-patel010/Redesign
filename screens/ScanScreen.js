import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const PURPLE = '#4A168C';

export default function ScanScreen({ onOpenHome, onOpenMyRide, onOpenProfile, onOpenWallet, onFindNearby, onScan, onBluetooth }) {
  const insets = useSafeAreaInsets();
  const [flashOn, setFlashOn] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <View style={styles.headCopy}>
            <Text style={styles.title}>Scan to Unlock</Text>
            <Text style={styles.subtitle}>
              Scan the QR code on the scooter to unlock and start your ride.
            </Text>
          </View>
          <Pressable style={styles.helpPill}>
            <Ionicons name="help-circle-outline" size={16} color={PURPLE} />
            <Text style={styles.helpText}>How it works?</Text>
          </Pressable>
        </View>

        <Pressable onPress={onScan}>
        <Animated.View entering={cardEnter(0)} style={styles.scanner}>
          <Text style={styles.alignText}>Align QR code within the frame</Text>
          <Text style={styles.tapHint}>Tap the frame to scan</Text>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <Pressable onPress={() => setFlashOn((on) => !on)} style={styles.flash}>
            <Ionicons name={flashOn ? 'flash' : 'flash-outline'} size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.flashLabel}>Flashlight</Text>
        </Animated.View>
        </Pressable>

        <Animated.View entering={cardEnter(1)}>
        <Pressable style={styles.secureCard}>
          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark" size={20} color={PURPLE} />
          </View>
          <View style={styles.secureCopy}>
            <Text style={styles.secureTitle}>Safe & Secure</Text>
            <Text style={styles.secureSub}>
              Every ride is protected with smart security and IoT tracking.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#B0B0B6" />
        </Pressable>
        </Animated.View>

        <Text style={styles.section}>Other options</Text>
        <Animated.View entering={cardEnter(2)} style={styles.optionRow}>
          <Pressable style={styles.optionCard}>
            <View style={[styles.optionIcon, { backgroundColor: '#F3EEF8' }]}>
              <Ionicons name="keypad" size={18} color={PURPLE} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Enter Scooter ID</Text>
              <Text style={styles.optionSub}>Manually enter ID</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C4C4C8" />
          </Pressable>
          <Pressable onPress={onFindNearby} style={styles.optionCard}>
            <View style={[styles.optionIcon, { backgroundColor: '#F3EEF8' }]}>
              <Ionicons name="location" size={18} color={PURPLE} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Find Nearby</Text>
              <Text style={styles.optionSub}>View on map</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C4C4C8" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={cardEnter(3)}>
          <Pressable onPress={onBluetooth} style={styles.secureCard}>
            <View style={styles.secureIcon}>
              <Ionicons name="bluetooth" size={20} color={PURPLE} />
            </View>
            <View style={styles.secureCopy}>
              <Text style={styles.secureTitle}>Bluetooth</Text>
              <Text style={styles.secureSub}>Unlock a scooter next to you</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B0B0B6" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={cardEnter(4)}>
        <Pressable style={styles.greenCard}>
          <View style={styles.greenIcon}>
            <Ionicons name="leaf" size={18} color="#1F8A4C" />
          </View>
          <View style={styles.secureCopy}>
            <Text style={styles.greenTitle}>Ride Green, Save Earth!</Text>
            <Text style={styles.greenSub}>
              Choose e-scooters for a cleaner and greener city.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8FBF9F" />
        </Pressable>
        </Animated.View>
      </ScrollView>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.tab} onPress={onOpenHome}>
          <Ionicons name="home-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onOpenMyRide}>
          <Ionicons name="bicycle-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>My Rides</Text>
        </Pressable>
        <Pressable style={styles.tab}>
          <View style={styles.scanButton}>
            <Ionicons name="scan-outline" size={26} color="#FFFFFF" />
            <Ionicons name="qr-code" size={12} color="#FFFFFF" style={styles.scanQr} />
          </View>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Scan</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onOpenWallet}>
          <Ionicons name="wallet-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>Wallet</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onOpenProfile}>
          <Ionicons name="person-outline" size={22} color="#8A8A8A" />
          <Text style={styles.tabLabel}>Profile</Text>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headCopy: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#161616',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#8A8A8A',
  },
  helpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  helpText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  scanner: {
    marginTop: 18,
    height: 300,
    borderRadius: 24,
    backgroundColor: '#1B1430',
    overflow: 'hidden',
    alignItems: 'center',
  },
  alignText: {
    marginTop: 22,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: '#D7C4FF',
  },
  cornerTL: {
    top: 64,
    left: 36,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 64,
    right: 36,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 78,
    left: 36,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 78,
    right: 36,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  flash: {
    position: 'absolute',
    bottom: 36,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashLabel: {
    position: 'absolute',
    bottom: 14,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  tapHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  secureCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F0F0F2',
  },
  secureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureCopy: {
    flex: 1,
  },
  secureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  secureSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: '#8A8A8A',
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#6E6E6E',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F2',
    gap: 10,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    minHeight: 38,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1C',
  },
  optionSub: {
    marginTop: 2,
    fontSize: 11,
    color: '#8A8A8A',
  },
  greenCard: {
    marginTop: 12,
    backgroundColor: '#F3FBF6',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#D9F0E2',
  },
  greenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F6EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B6B3A',
  },
  greenSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: '#6A9A7C',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
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
    elevation: 6,
  },
  scanQr: {
    position: 'absolute',
    top: 15,
    left: 15,
  },
});
