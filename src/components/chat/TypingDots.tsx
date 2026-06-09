import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DOT_DURATION = 400;

function useDotOpacity(delayMs: number) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: DOT_DURATION }),
          withTiming(0.3, { duration: DOT_DURATION }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [delayMs, opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

export function TypingDots() {
  const a = useDotOpacity(0);
  const b = useDotOpacity(150);
  const c = useDotOpacity(300);
  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, a]} />
      <Animated.View style={[styles.dot, b]} />
      <Animated.View style={[styles.dot, c]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#64748B',
  },
});
