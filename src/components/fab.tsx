import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

type Props = {
  onPress: () => void;
  sheetIndex: SharedValue<number>;
};

export function Fab({ onPress, sheetIndex }: Props) {
  const insets = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      sheetIndex.value,
      [-1, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          sheetIndex.value,
          [-1, 0],
          [1, 0.5],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      style={[styles.fabOuter, { bottom: insets.bottom + 16 }, animatedStyle]}
    >
      <Pressable
        onPress={onPress}
        android_ripple={ANDROID_RIPPLE}
        style={styles.fabInner}
        accessibilityRole="button"
        accessibilityLabel="Ask Crew AI"
      >
        <Ionicons name="sparkles" size={24} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

const FAB_SIZE = 56;

const ANDROID_RIPPLE = {
  color: 'rgba(255,255,255,0.2)',
  borderless: false,
} as const;

const styles = StyleSheet.create({
  // Outer carries the shadow. iOS clips a layer's shadow when overflow:hidden
  // is set on the same view, so the shadow/border/radius split is structural.
  fabOuter: {
    position: 'absolute',
    right: 16,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  // Inner clips the Android ripple to the circle.
  fabInner: {
    flex: 1,
    borderRadius: FAB_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
