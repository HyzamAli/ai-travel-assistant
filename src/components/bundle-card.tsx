import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { DayHighlightsRow } from '@/components/day-highlights-row';
import { useFeedStore } from '@/store/feedStore';
import type { Bundle, TripType } from '@/types/bundle';
import {
  TRIP_TYPE_LABEL,
  formatDuration,
  formatPrice,
} from '@/utils/format';

type Props = { bundle: Bundle };

function handlePress(id: string) {
  useFeedStore.getState().toggleExpanded(id);
}

export function BundleCard({ bundle }: Props) {
  const isExpanded = useFeedStore((s) => s.expandedId === bundle.id);
  const progress = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isExpanded ? 1 : 0, { duration: 220 });
  }, [isExpanded, progress]);

  const detailsStyle = useAnimatedStyle(() => ({
    height: progress.value * DETAILS_HEIGHT,
    opacity: progress.value,
  }));

  return (
    <Pressable
      style={styles.card}
      onPress={() => handlePress(bundle.id)}
      android_ripple={ANDROID_RIPPLE}
    >
      <View style={styles.imageWrap}>
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons
          name="compass-outline"
          size={36}
          color="#64748B"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <Image
          source={bundle.heroImageUrl}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={bundle.id}
          transition={300}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.destination} numberOfLines={1}>
            {bundle.destination}
          </Text>
          <Text style={styles.rating}>★ {bundle.rating.toFixed(1)}</Text>
        </View>
        <View style={badgeContainer[bundle.tripType]}>
          <Text style={badgeText[bundle.tripType]}>
            {TRIP_TYPE_LABEL[bundle.tripType]}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.duration}>{formatDuration(bundle.duration)}</Text>
          <Text style={styles.price}>{formatPrice(bundle.price.amount)}</Text>
        </View>
      </View>
      <Animated.View style={[styles.details, detailsStyle]}>
        <DayHighlightsRow highlights={bundle.highlights} />
      </Animated.View>
    </Pressable>
  );
}

const IMAGE_HEIGHT = 190;
const CARD_RADIUS = 14;
const DETAILS_HEIGHT = 68;

const ANDROID_RIPPLE = { color: 'rgba(0,0,0,0.08)' } as const;

// Frozen tuples so LinearGradient props don't allocate per render.
const GRADIENT_COLORS = ['#DBEAFE', '#FFFFFF'] as const;
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END = { x: 1, y: 1 } as const;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    width: '100%',
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  body: { padding: 14, gap: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destination: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  rating: { fontSize: 14, fontWeight: '600', color: '#475569' },
  duration: { fontSize: 14, color: '#475569', fontWeight: '500' },
  price: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  details: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
});

const badgeBase = {
  alignSelf: 'flex-start',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 999,
} as const;
const badgeTextBase = { fontSize: 12, fontWeight: '600' } as const;

// Pre-built per-type styles so the card row hot path picks a frozen reference
// instead of allocating a style array each render.
const badgeContainer = StyleSheet.create({
  flightStay: { ...badgeBase, backgroundColor: '#DBEAFE' },
  villa: { ...badgeBase, backgroundColor: '#EDE9FE' },
  experience: { ...badgeBase, backgroundColor: '#FEF3C7' },
}) satisfies Record<TripType, ViewStyle>;

const badgeText = StyleSheet.create({
  flightStay: { ...badgeTextBase, color: '#1E3A8A' },
  villa: { ...badgeTextBase, color: '#5B21B6' },
  experience: { ...badgeTextBase, color: '#92400E' },
}) satisfies Record<TripType, TextStyle>;
