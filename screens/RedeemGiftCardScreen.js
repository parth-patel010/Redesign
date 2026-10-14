import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PURPLE = '#4A168C';
const PURPLE_DARK = '#26084D';
const PURPLE_MID = '#6B21A8';

function HeroGiftBoxArt({ side }) {
  const isLeft = side === 'left';
  return (
    <View
      pointerEvents="none"
      style={[
        styles.heroGiftWrap,
        isLeft ? styles.heroGiftLeft : styles.heroGiftRight,
      ]}
    >
      <View>
        <LinearGradient
          colors={['#FDE68A', '#D97706', '#92400E']}
          style={styles.giftBowCenter}
        />
        <View
          style={[styles.giftBowWing, { left: 10, transform: [{ rotate: '-28deg' }] }]}
        />
        <View
          style={[styles.giftBowWing, { right: 10, transform: [{ rotate: '28deg' }] }]}
        />
      </View>

      <LinearGradient
        colors={['#C084FC', '#9333EA', '#6B21A8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.giftBoxTopCube}
      >
        <LinearGradient
          colors={['#FEF08A', '#D97706']}
          style={styles.giftRibbonVert}
        />
        <LinearGradient
          colors={['#FEF08A', '#D97706']}
          style={styles.giftRibbonHoriz}
        />
      </LinearGradient>

      <LinearGradient
        colors={['#4A168C', '#2E0E56']}
        style={styles.giftBoxBottomBase}
      >
        <View style={styles.giftBaseStripe} />
      </LinearGradient>
    </View>
  );
}

export default function RedeemGiftCardScreen({ onBack, onHelp }) {
  const insets = useSafeAreaInsets();
  const [cardCode, setCardCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [claimedToast, setClaimedToast] = useState(false);

  const digitsCode = cardCode.replace(/\D/g, '').slice(0, 16);
  const digitsPin = pin.replace(/\D/g, '').slice(0, 6);
  const canClaim = digitsCode.length === 16 && digitsPin.length === 6;

  const handleCodeChange = (text) => {
    const clean = text.replace(/\D/g, '').slice(0, 16);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardCode(formatted);
  };

  const handleClaim = () => {
    if (!canClaim) return;
    setClaimedToast(true);
    setTimeout(() => {
      setClaimedToast(false);
      setCardCode('');
      setPin('');
    }, 2400);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}
      >
        {/* Top Evegah Purple Hero Banner (Matches Image 3 in Evegah Purple Theme) */}
        <LinearGradient
          colors={[PURPLE_DARK, PURPLE, PURPLE_MID, '#D8B4FE', '#F6F5FA']}
          locations={[0, 0.34, 0.62, 0.86, 1]}
          style={[styles.heroBanner, { paddingTop: insets.top + 10 }]}
        >
          <View style={styles.mandalaRingTopRight} pointerEvents="none" />
          <View style={styles.mandalaRingBottomLeft} pointerEvents="none" />
          <Text style={[styles.heroSparkle, { top: 54, left: 48 }]}>✦</Text>
          <Text style={[styles.heroSparkle, { top: 68, right: 64 }]}>✧</Text>
          <Text style={[styles.heroSparkle, { top: 120, left: 92 }]}>•</Text>
          <Text style={[styles.heroSparkle, { top: 112, right: 98 }]}>✦</Text>

          <View style={styles.heroTopBar}>
            <Pressable hitSlop={10} onPress={onBack} style={styles.heroBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable hitSlop={10} onPress={onHelp} style={styles.heroFaqPill}>
              <Text style={styles.heroFaqText}>FAQs</Text>
            </Pressable>
          </View>

          <View style={styles.heroTitleBlock}>
            <Text style={styles.heroTitleTop}>Gift</Text>
            <Text style={styles.heroTitleBottom}>Cards</Text>
          </View>

          <HeroGiftBoxArt side="left" />
          <HeroGiftBoxArt side="right" />
        </LinearGradient>

        {/* Redeem Form Card */}
        <View style={styles.redeemFormCard}>
          <Text style={styles.redeemHeading}>
            Enter the 16 digit code and 6 digit PIN to redeem your gift card
          </Text>

          <View style={styles.inputBox}>
            <TextInput
              value={cardCode}
              onChangeText={handleCodeChange}
              placeholder="Enter gift card code"
              placeholderTextColor="#8A8496"
              keyboardType="number-pad"
              maxLength={19}
              style={styles.textInput}
            />
          </View>

          <View style={[styles.inputBox, styles.pinInputRow]}>
            <TextInput
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter PIN"
              placeholderTextColor="#8A8496"
              keyboardType="number-pad"
              secureTextEntry={!showPin}
              maxLength={6}
              style={styles.textInput}
            />
            <Pressable hitSlop={10} onPress={() => setShowPin((v) => !v)}>
              <Ionicons
                name={showPin ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={PURPLE}
              />
            </Pressable>
          </View>
        </View>

        {/* NOTE Section */}
        <View style={styles.noteSection}>
          <Text style={styles.noteHeading}>NOTE</Text>

          <View style={styles.noteBulletRow}>
            <Text style={styles.noteDot}>•</Text>
            <Text style={styles.noteText}>
              Gift card amount will be added to Evegah Money Wallet
            </Text>
          </View>

          <View style={styles.noteBulletRow}>
            <Text style={styles.noteDot}>•</Text>
            <Text style={styles.noteText}>
              Gift card amount added will be valid for 1 year from the date of
              redemption
            </Text>
          </View>

          <View style={styles.noteBulletRow}>
            <Text style={styles.noteDot}>•</Text>
            <Text style={styles.noteText}>
              Claimed gift card cannot be transferred to a bank account or
              another Evegah Money account
            </Text>
          </View>
        </View>
      </ScrollView>

      {claimedToast ? (
        <View style={[styles.toastBanner, { bottom: insets.bottom + 110 }]}>
          <Ionicons name="checkmark-circle" size={18} color="#FDE047" />
          <Text style={styles.toastBannerText}>
            Gift Card verified & added to your Evegah Money Wallet!
          </Text>
        </View>
      ) : null}

      {/* Bottom Sticky Footer */}
      <View
        style={[
          styles.bottomFooter,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Text style={styles.termsLine}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsHighlight}>terms & conditions</Text>
        </Text>

        <Pressable
          onPress={handleClaim}
          disabled={!canClaim}
          style={[
            styles.claimBtn,
            canClaim ? styles.claimBtnActive : styles.claimBtnDisabled,
          ]}
        >
          <Text style={styles.claimBtnText}>Verify phone and Claim</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F5FA',
  },
  heroBanner: {
    minHeight: 245,
    paddingHorizontal: 16,
    paddingBottom: 26,
    position: 'relative',
    overflow: 'hidden',
  },
  mandalaRingTopRight: {
    position: 'absolute',
    top: -36,
    right: -36,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 12,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mandalaRingBottomLeft: {
    position: 'absolute',
    bottom: 24,
    left: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 10,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroSparkle: {
    position: 'absolute',
    color: 'rgba(253, 230, 138, 0.65)',
    fontSize: 12,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  heroBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFaqPill: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFaqText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroTitleBlock: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  heroTitleTop: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '400',
    color: '#FDE68A',
    letterSpacing: -0.5,
  },
  heroTitleBottom: {
    marginTop: -4,
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '400',
    color: '#FDE68A',
    letterSpacing: -1,
  },
  heroGiftWrap: {
    position: 'absolute',
    bottom: 18,
    width: 84,
    height: 76,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  heroGiftLeft: {
    left: -8,
    transform: [{ rotate: '14deg' }],
  },
  heroGiftRight: {
    right: -8,
    transform: [{ rotate: '-14deg' }],
  },
  giftBowCenter: {
    width: 14,
    height: 10,
    borderRadius: 5,
    zIndex: 4,
  },
  giftBowWing: {
    position: 'absolute',
    top: -6,
    width: 22,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  giftBoxTopCube: {
    width: 72,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  giftRibbonVert: {
    width: 11,
    height: '100%',
  },
  giftRibbonHoriz: {
    position: 'absolute',
    width: '100%',
    height: 9,
  },
  giftBoxBottomBase: {
    marginTop: -4,
    width: 66,
    height: 18,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    alignItems: 'center',
  },
  giftBaseStripe: {
    width: 10,
    height: '100%',
    backgroundColor: '#FDE68A',
  },
  redeemFormCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE7F5',
  },
  redeemHeading: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 16,
  },
  inputBox: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#C4BDD4',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 14,
  },
  pinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#18181B',
  },
  noteSection: {
    marginTop: 22,
    paddingHorizontal: 20,
    gap: 12,
  },
  noteHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#6E6878',
    marginBottom: 2,
  },
  noteBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteDot: {
    fontSize: 15,
    lineHeight: 20,
    color: '#6E6878',
  },
  noteText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#6E6878',
  },
  toastBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: PURPLE_DARK,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 40,
  },
  toastBannerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#ECE7F5',
  },
  termsLine: {
    textAlign: 'center',
    fontSize: 12.5,
    color: '#6E6878',
    marginBottom: 12,
  },
  termsHighlight: {
    color: PURPLE,
    fontWeight: '700',
  },
  claimBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnActive: {
    backgroundColor: PURPLE,
  },
  claimBtnDisabled: {
    backgroundColor: '#ACAAB8',
  },
  claimBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
