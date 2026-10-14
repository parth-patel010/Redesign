import { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const PURPLE_DEEP = '#1A0836';
const PURPLE_PRIMARY = '#4A168C';
const EVEGAH_LOGO = require('../assets/login/evegah-logo.png');
const VEHICLE_PURPLE = require('../assets/home/vehicle-city.png');
const RIDER_IMG = require('../assets/login/otp-rider.png');

export default function OnboardingScreen({ onFinish }) {
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0); // 0 or 1
  const scrollRef = useRef(null);

  const handleNext = () => {
    if (currentSlide === 0) {
      scrollRef.current?.scrollTo({ x: SCREEN_W, animated: true });
      setCurrentSlide(1);
    } else {
      onFinish?.();
    }
  };

  const handleSkip = () => {
    onFinish?.();
  };

  const handleScrollEnd = (e) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentSlide(Math.max(0, Math.min(1, page)));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Paging ScrollView */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.pager}
      >
        {/* SLIDE 1 (Cleaner Rides Brighter Tomorrow) */}
        <View style={[styles.slide, { width: SCREEN_W }]}>
          <View style={[styles.slideHeader, { paddingTop: insets.top + 24 }]}>
            {/* Evegah Mobility Logo */}
            <View style={styles.logoRow}>
              <Image
                source={EVEGAH_LOGO}
                style={styles.brandLogo}
                contentFit="contain"
              />
              <View style={styles.mobilityBadge}>
                <Text style={styles.mobilityText}>Mobility</Text>
              </View>
            </View>

            <Text style={styles.slide1Headline}>
              Cleaner Rides{'\n'}Brighter Tomorrow
            </Text>
          </View>

          {/* Hero Illustration: EV Rider with Helmet & Backpack in Modern City */}
          <View style={styles.slide1ArtWrap}>
            {/* Background City Silhouette Soft Vectors */}
            <View style={styles.cityBackdrop}>
              <View style={[styles.cityTower, { height: 180, left: '10%' }]} />
              <View style={[styles.cityTower, { height: 230, left: '26%' }]} />
              <View style={[styles.cityTower, { height: 160, left: '44%' }]} />
              <View style={[styles.cityTower, { height: 210, left: '62%' }]} />
              <View style={[styles.cityTower, { height: 150, left: '80%' }]} />
              <View style={styles.roadPerspectiveStripe} />
            </View>

            {/* Rider & EV Scooter Asset */}
            <Animated.View
              entering={FadeInDown.duration(600).delay(150)}
              style={styles.riderCenterFrame}
            >
              <Image
                source={RIDER_IMG}
                style={styles.riderImage}
                contentFit="contain"
              />
            </Animated.View>
          </View>
        </View>

        {/* SLIDE 2 (Rent Your EV Ride Easily) */}
        <View style={[styles.slide, { width: SCREEN_W }]}>
          <View style={[styles.slideHeader, { paddingTop: insets.top + 24 }]}>
            <Text style={styles.slide2Title}>
              Rent Your{'\n'}EV Ride Easily
            </Text>

            <Text style={styles.slide2Sub}>
              Choose from a range of electric scooters and bikes, available
              across your city.
            </Text>
          </View>

          {/* Hero Illustration: Evegah Purple Scooter with Route Path & Location Pin */}
          <View style={styles.slide2ArtWrap}>
            {/* Modern City & Parks Landscape Background */}
            <View style={styles.landscapeBackdrop}>
              <View style={[styles.cityTower, { height: 140, left: '18%', backgroundColor: '#E2E8F0' }]} />
              <View style={[styles.cityTower, { height: 190, left: '36%', backgroundColor: '#CBD5E1' }]} />
              <View style={[styles.cityTower, { height: 160, left: '54%', backgroundColor: '#E2E8F0' }]} />
              <View style={[styles.cityTower, { height: 120, left: '72%', backgroundColor: '#CBD5E1' }]} />

              {/* Purple Route Ribbon */}
              <View style={styles.purpleRouteTrack}>
                <View style={styles.routeDashLine} />
              </View>

              {/* Destination Location Pin Pinpoint */}
              <View style={styles.destinationPinWrap}>
                <View style={styles.pinBubble}>
                  <Ionicons name="location" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.pinShadow} />
              </View>
            </View>

            {/* Main Evegah Electric Scooter Foreground */}
            <Animated.View
              entering={FadeInRight.duration(600).delay(150)}
              style={styles.vehicleForegroundWrap}
            >
              <Image
                source={VEHICLE_PURPLE}
                style={styles.vehicleForegroundImg}
                contentFit="contain"
              />
            </Animated.View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Controls Bar (SKIP | 4 Dots Indicator | Circular Chevron Button) */}
      <View
        style={[
          styles.bottomControlsBar,
          { paddingBottom: Math.max(insets.bottom + 16, 32) },
        ]}
      >
        {/* Skip Text Button */}
        <Pressable
          hitSlop={14}
          onPress={handleSkip}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>

        {/* 4 Dots Indicator */}
        <View style={styles.dotsIndicatorRow}>
          {[0, 1, 2, 3].map((dotIdx) => {
            const active = currentSlide === dotIdx;
            return (
              <View
                key={dotIdx}
                style={[
                  styles.dot,
                  active && styles.dotActive,
                ]}
              />
            );
          })}
        </View>

        {/* Circular Next / Finish Chevron Button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextCircleBtn,
            pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 },
          ]}
        >
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  slideHeader: {
    alignItems: 'flex-start',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  brandLogo: {
    width: 130,
    height: 38,
  },
  mobilityBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mobilityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  slide1Headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1238',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  slide1ArtWrap: {
    flex: 1,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 360,
  },
  cityBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cityTower: {
    position: 'absolute',
    bottom: 40,
    width: 44,
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  roadPerspectiveStripe: {
    width: '100%',
    height: 60,
    backgroundColor: '#E2E8F0',
    borderTopWidth: 2,
    borderTopColor: '#CBD5E1',
  },
  riderCenterFrame: {
    width: '100%',
    height: '85%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  riderImage: {
    width: '95%',
    height: '95%',
  },

  /* Slide 2 Specific Styles */
  slide2Title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E1238',
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  slide2Sub: {
    marginTop: 14,
    fontSize: 15,
    color: '#64748B',
    lineHeight: 23,
    fontWeight: '500',
  },
  slide2ArtWrap: {
    flex: 1,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 360,
  },
  landscapeBackdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  purpleRouteTrack: {
    position: 'absolute',
    top: '32%',
    left: '10%',
    right: '10%',
    height: 48,
    borderBottomWidth: 5,
    borderBottomColor: '#8B5CF6',
    borderStyle: 'solid',
    transform: [{ rotate: '-8deg' }],
    opacity: 0.65,
  },
  routeDashLine: {
    height: 2,
    width: '100%',
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    opacity: 0.8,
  },
  destinationPinWrap: {
    position: 'absolute',
    top: '22%',
    right: '18%',
    alignItems: 'center',
  },
  pinBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6D28D9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  pinShadow: {
    width: 14,
    height: 4,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginTop: 3,
  },
  vehicleForegroundWrap: {
    width: '100%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    marginTop: 40,
  },
  vehicleForegroundImg: {
    width: '90%',
    height: '90%',
  },

  /* Bottom Controls Bar */
  bottomControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    backgroundColor: '#FFFFFF',
  },
  skipBtn: {
    paddingVertical: 10,
    paddingRight: 16,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  dotsIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 22,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#1E1238',
  },
  nextCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E1238',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
});
