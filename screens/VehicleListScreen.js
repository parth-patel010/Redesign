import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const { width: SCREEN_W } = Dimensions.get('window');
const PURPLE = '#300D4F';
const ACCENT_PURPLE = '#6300B5';
const CHIP_BG = '#F4ECFF';
const CHIP_BORDER = '#8E5CE6';

const LIST_VEHICLES = [
  {
    id: 'mink',
    year: '2026',
    name: 'Evegah Mink',
    tag: 'E-Scooter',
    edition: 'RXT Smart Li-Ion Edition',
    line: 'Smooth city miles',
    price: '₹250/day',
    emi: '₹3499/month',
    km: '70-90 km',
    fuel: 'Electric',
    transmission: 'Automatic',
    rto: 'GJ06',
    hub: 'HUB · Gotri Charging Zone, Vadodara',
    range: '70-90 km',
    speed: '30 km/h',
    tint: '#F6F1FC',
    image: require('../assets/home/vehicle-mink.png'),
  },
  {
    id: 'city',
    year: '2026',
    name: 'Evegah City',
    tag: 'E-Scooter',
    edition: 'Revotron Urban Commuter XM',
    line: 'Quiet across town',
    price: '₹349/day',
    emi: '₹6,599/month',
    km: '80-90 km',
    fuel: 'Electric',
    transmission: 'Automatic',
    rto: 'GJ06',
    hub: 'HUB · Manjalpur EV Hub, Vadodara',
    range: '80-90 km',
    speed: '45 km/h',
    tint: '#F3FBF6',
    image: require('../assets/home/vehicle-city.png'),
  },
  {
    id: 'fly',
    year: '2026',
    name: 'Evegah Fly',
    tag: 'E-Scooter',
    edition: 'Lite Everyday City Edition',
    line: 'Light for every day',
    price: '₹149/day',
    emi: '₹999/month',
    km: '40-60 km',
    fuel: 'Electric',
    transmission: 'Automatic',
    rto: 'GJ06',
    hub: 'HUB · Alkapuri Station, Vadodara',
    range: '40-60 km',
    speed: '25 km/h',
    tint: '#EEF3FF',
    image: require('../assets/home/vehicle-fly.png'),
  },
  {
    id: 'pro',
    year: '2026',
    name: 'Evegah Pro',
    tag: 'E-Scooter',
    edition: ' Sharp Dual-Battery Long Range',
    line: 'Built for longer rides',
    price: '₹279/day',
    emi: '₹1,799/month',
    km: '110-130 km',
    fuel: 'Electric',
    transmission: 'Automatic',
    rto: 'GJ06',
    hub: 'HUB · KPGU Campus Hub, Vadodara',
    range: '110-130 km',
    speed: '75 km/h',
    tint: '#FFF6F2',
    image: require('../assets/home/vehicle-pro.png'),
  },
];

export default function VehicleListScreen({
  onBack,
  onOpenLocation,
  onSelectVehicle,
}) {
  const insets = useSafeAreaInsets();
  const [savedIds, setSavedIds] = useState({});
  const [priceFilterActive, setPriceFilterActive] = useState(true);
  const [savedFilter, setSavedFilter] = useState(false);

  const toggleSave = (id) => {
    setSavedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topLeft}>
          <Pressable hitSlop={8} onPress={onBack} style={styles.menuBtn}>
            <Ionicons name="arrow-back" size={22} color={PURPLE} />
          </Pressable>
          <View style={styles.brandWrap}>
           
            <Text style={styles.brandTitle}>EVegah</Text>
          </View>
        </View>

        <View style={styles.topRight}>
          <Pressable style={styles.cityPill} onPress={onOpenLocation}>
            <Text style={styles.cityPillText}>Vadodara</Text>
            <Ionicons name="caret-down" size={12} color={PURPLE} />
          </Pressable>
          <Pressable style={styles.circleIcon}>
            <Ionicons name="search-outline" size={18} color={PURPLE} />
          </Pressable>
          <Pressable style={styles.circleIcon}>
            <Ionicons name="heart-outline" size={18} color={PURPLE} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      >
        <View style={styles.bannerWrap}>
          <Image
            source={require('../assets/home/ride-more-slide.png')}
            style={styles.bannerBg}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(180, 48, 24, 0.35)', 'rgba(255, 180, 90, 0.1)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.bannerLeftBadge}>
            <Ionicons name="sparkles" size={14} color="#FFD24C" />
            <Text style={styles.bannerHello}>HELLO,</Text>
            <Text style={styles.bannerNavratri}>NAVRATRI</Text>
          </View>
          <Image
            source={require('../assets/home/garba.png')}
            style={styles.bannerRightArt}
            contentFit="contain"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable style={[styles.filterChip, styles.filterChipActive]}>
            <Ionicons name="filter" size={14} color={PURPLE} />
            <Text style={[styles.filterChipText, styles.filterChipTextActive]}>Filter</Text>
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{priceFilterActive ? '1' : '0'}</Text>
            </View>
          </Pressable>

          <Pressable style={styles.filterChip}>
            <Ionicons name="swap-vertical" size={14} color={PURPLE} />
            <Text style={styles.filterChipText}>Sort</Text>
          </Pressable>

          <Pressable
            style={[styles.filterChip, priceFilterActive && styles.filterChipActive]}
            onPress={() => setPriceFilterActive((v) => !v)}
          >
            <Text style={[styles.filterChipText, priceFilterActive && styles.filterChipTextActive]}>
              Price Range
            </Text>
            <Ionicons name="caret-down" size={11} color={PURPLE} />
          </Pressable>

          <Pressable style={styles.filterChip}>
            <Text style={styles.filterChipText}>Make + Models</Text>
            <Ionicons name="caret-down" size={11} color={PURPLE} />
          </Pressable>
        </ScrollView>

        <View style={styles.subFilterRow}>
          <Pressable
            style={[styles.saveFilterPill, savedFilter && styles.saveFilterPillActive]}
            onPress={() => setSavedFilter((v) => !v)}
          >
            <Ionicons
              name={savedFilter ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color="#D94E43"
            />
            <Text style={styles.saveFilterText}>Save Filters</Text>
          </Pressable>

          {priceFilterActive ? (
            <Pressable
              style={[styles.filterChip, styles.filterChipActive]}
              onPress={() => setPriceFilterActive(false)}
            >
              <Text style={[styles.filterChipText, styles.filterChipTextActive]}>
                ₹149 - ₹299/d
              </Text>
              <Ionicons name="close" size={14} color={PURPLE} />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.resultsHeading}>
          <Text style={styles.resultsCount}>217</Text> EV Scooters under Rs 299/day in Vadodara
        </Text>

        {LIST_VEHICLES.map((item, index) => {
          const isSaved = !!savedIds[item.id];
          return (
            <Animated.View key={item.id} entering={cardEnter(index)} style={styles.cardWrap}>
              <Pressable
                style={styles.card}
                onPress={() => onSelectVehicle?.(item)}
              >
                <View style={styles.cardImageStage}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F3F2F7', '#EAE8F2']}
                    locations={[0, 0.62, 1]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.stageFloor} />
                  <Image source={item.image} style={styles.cardVehicleImg} contentFit="contain" />
                  <Pressable
                    hitSlop={10}
                    style={styles.cardHeart}
                    onPress={() => toggleSave(item.id)}
                  >
                    <Ionicons
                      name={isSaved ? 'heart' : 'heart-outline'}
                      size={24}
                      color={isSaved ? '#E0245E' : PURPLE}
                    />
                  </Pressable>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.year} {item.name}
                    </Text>
                    <Text style={styles.cardPrice}>{item.price}</Text>
                  </View>

                  <View style={styles.cardSubRow}>
                    <Text style={styles.cardEdition} numberOfLines={1}>
                      {item.edition}
                    </Text>
                    <View style={styles.emiWrap}>
                      <Text style={styles.cardEmi}>{item.emi}</Text>
                    </View>
                  </View>

                  <View style={styles.pillsRow}>
                    {[item.km, item.fuel, item.transmission, item.rto].map((pill) => (
                      <View key={pill} style={styles.specPill}>
                        <Text style={styles.specPillText}>{pill}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.hubRow}>
                    <View style={styles.hubDiamond}>
                      <Text style={styles.hubDiamondText}>e</Text>
                    </View>
                    <Text style={styles.hubText} numberOfLines={1}>
                      {item.hub}
                    </Text>
                  </View>

                  <View style={styles.assuredBadge}>
                    <View style={[styles.hubDiamond, styles.assuredDiamond]}>
                      <Text style={[styles.hubDiamondText, styles.assuredDiamondText]}>e</Text>
                    </View>
                    <Text style={styles.assuredText}>Assured</Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      <Pressable style={[styles.callFab, { bottom: Math.max(insets.bottom, 16) + 16 }]}>
        <Ionicons name="call" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandDiamond: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#E5254B',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDiamondText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    transform: [{ rotate: '-45deg' }],
  },
  brandTitle: {
    fontSize: 21,
    fontWeight: '800',
    fontStyle: 'italic',
    color: PURPLE,
    letterSpacing: -0.4,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F4F8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cityPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE,
  },
  circleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerWrap: {
    width: SCREEN_W,
    height: 118,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#D95B38',
  },
  bannerBg: {
    width: '100%',
    height: '100%',
  },
  bannerLeftBadge: {
    position: 'absolute',
    left: 24,
    top: 22,
    alignItems: 'center',
  },
  bannerHello: {
    marginTop: 2,
    fontSize: 19,
    fontWeight: '900',
    color: '#B6292B',
    backgroundColor: '#FFF0D6',
    paddingHorizontal: 8,
    borderRadius: 4,
    letterSpacing: 0.4,
  },
  bannerNavratri: {
    marginTop: -2,
    fontSize: 22,
    fontWeight: '900',
    color: '#B6292B',
    backgroundColor: '#FFF0D6',
    paddingHorizontal: 10,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  bannerRightArt: {
    position: 'absolute',
    right: 28,
    bottom: -4,
    width: 142,
    height: 120,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E0EA',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: CHIP_BG,
    borderColor: CHIP_BORDER,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PURPLE,
  },
  filterChipTextActive: {
    fontWeight: '700',
  },
  filterCountBadge: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: '#3C0E63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  subFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 10,
  },
  saveFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECA39B',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveFilterPillActive: {
    backgroundColor: '#FFF2F0',
  },
  saveFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: PURPLE,
  },
  resultsHeading: {
    marginTop: 18,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: PURPLE,
  },
  resultsCount: {
    fontWeight: '800',
  },
  cardWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEEAF5',
    overflow: 'hidden',
    shadowColor: '#1E0D36',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardImageStage: {
    height: 158,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  stageFloor: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: -28,
    height: 76,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-4deg' }],
  },
  cardVehicleImg: {
    width: 215,
    height: 138,
    marginTop: 6,
  },
  cardHeart: {
    position: 'absolute',
    top: 14,
    right: 16,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: PURPLE,
  },
  cardPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: PURPLE,
  },
  cardSubRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardEdition: {
    flex: 1,
    fontSize: 13,
    color: '#6C6676',
  },
  emiWrap: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#B59640',
    paddingBottom: 1,
  },
  cardEmi: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B59640',
  },
  pillsRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specPill: {
    backgroundColor: '#F6F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  specPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: PURPLE,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1EFF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  hubDiamond: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.2,
    borderColor: '#8B8596',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubDiamondText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8B8596',
    transform: [{ rotate: '-45deg' }],
  },
  hubText: {
    fontSize: 12,
    color: '#7D7788',
    fontWeight: '500',
  },
  assuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  assuredDiamond: {
    borderColor: ACCENT_PURPLE,
  },
  assuredDiamondText: {
    color: ACCENT_PURPLE,
  },
  assuredText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  callFab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#300D4F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
