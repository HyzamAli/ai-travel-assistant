import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
} from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePerfFpsSampler } from './fpsSampler';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function MetricText<T extends string | number>({
  sv,
  style,
}: {
  sv: SharedValue<T>;
  style?: TextStyle;
}) {
  const animatedProps = useAnimatedProps(() => {
    const text = String(sv.value);
    return { text, defaultValue: text };
  });
  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents='none'
      underlineColorAndroid='transparent'
      style={style}
      animatedProps={animatedProps as any}
    />
  );
}

function JsBusyLabel({
  sv,
  style,
}: {
  sv: SharedValue<number>;
  style?: TextStyle;
}) {
  const animatedProps = useAnimatedProps(() => {
    const text = sv.value ? 'BUSY' : 'OK';
    return { text, defaultValue: text };
  });
  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents='none'
      underlineColorAndroid='transparent'
      style={style}
      animatedProps={animatedProps as any}
    />
  );
}

export default function PerfOverlay(): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const [isMetricsVisible, setMetricsVisible] = useState(false);
  const [isSummaryActive, setSummaryActive] = useState(false);
  const [summaryP50, setSummaryP50] = useState('—');
  const [summaryP95, setSummaryP95] = useState('—');
  const [summaryWorst, setSummaryWorst] = useState('—');

  const {
    fps,
    badFrameCount,
    jsBusy,
    resetBadFrameCount,
    startSummarySession,
    stopSummarySession,
    resetSummarySession,
    getSummaryStats,
  } = usePerfFpsSampler();

  useEffect(() => {
    const refresh = () => {
      const { p50, p95, worst } = getSummaryStats();
      setSummaryP50(p50);
      setSummaryP95(p95);
      setSummaryWorst(worst);
    };

    if (isSummaryActive && isMetricsVisible) {
      refresh();
      const interval = setInterval(refresh, 500);
      return () => clearInterval(interval);
    }

    refresh();
    return undefined;
  }, [getSummaryStats, isSummaryActive, isMetricsVisible]);

  const jsBusyDotStyle = useAnimatedStyle(() => ({
    backgroundColor: jsBusy.value ? '#dc2626' : '#16a34a',
  }));

  const toggle = () => {
    setMetricsVisible((v) => !v);
  };

  return (
    <View
      pointerEvents='box-none'
      style={[StyleSheet.absoluteFill, styles.root]}
    >
      {isMetricsVisible && (
        <View
          style={[styles.panelContainer, { top: 52 + insets.top }]}
        >
          <View style={styles.panelInner} pointerEvents='auto'>
            <Text style={styles.title}>Perf Overlay</Text>
            <View style={styles.row}>
              <View style={styles.metricColumn}>
                <Text style={styles.label}>FPS</Text>
                <MetricText sv={fps} style={styles.placeholder} />
              </View>
              <View style={styles.metricColumn}>
                <Text style={styles.label}>Bad frames</Text>
                <MetricText sv={badFrameCount} style={styles.placeholder} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.metricColumn}>
                <Text style={styles.label}>JS busy</Text>
                <View style={styles.jsBusyStatusRow}>
                  <JsBusyLabel sv={jsBusy} style={styles.placeholder} />
                  <Animated.View style={[styles.jsBusyDot, jsBusyDotStyle]} />
                </View>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.metricColumn}>
                <Text style={styles.label}>Session P50</Text>
                <Text style={styles.placeholder}>{summaryP50}</Text>
              </View>
              <View style={styles.metricColumn}>
                <Text style={styles.label}>Session P95</Text>
                <Text style={styles.placeholder}>{summaryP95}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.metricColumn}>
                <Text style={styles.label}>Worst frame</Text>
                <Text style={styles.placeholder}>{summaryWorst}</Text>
              </View>
              <View style={styles.summaryControlRow}>
                <Pressable
                  style={styles.summaryButton}
                  onPress={() => {
                    if (isSummaryActive) {
                      stopSummarySession();
                      setSummaryActive(false);
                    } else {
                      resetSummarySession();
                      setSummaryP50('—');
                      setSummaryP95('—');
                      setSummaryWorst('—');
                      startSummarySession();
                      setSummaryActive(true);
                    }
                  }}
                >
                  <Text style={styles.resetText}>
                    {isSummaryActive ? 'Stop session' : 'Start session'}
                  </Text>
                </Pressable>
              </View>
            </View>
            <Pressable style={styles.resetButton} onPress={resetBadFrameCount}>
              <Text style={styles.resetText}>Reset bad frames</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View
        style={[styles.toggleContainer, { top: 16 + insets.top }]}
        pointerEvents='box-none'
      >
        <Pressable
          accessibilityLabel='Toggle performance overlay'
          accessibilityRole='button'
          onPress={toggle}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>Perf</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 9999,
  },
  panelContainer: {
    position: 'absolute',
    start: 16,
    width: 220,
    height: 260,
  },
  panelInner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 12,
  },
  title: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricColumn: {
    gap: 4,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
  },
  placeholder: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    padding: 0,
    margin: 0,
  },
  jsBusyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jsBusyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  summaryControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  resetButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  resetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleContainer: {
    position: 'absolute',
    start: 16,
  },
  toggleButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    elevation: 6,
  },
  toggleText: {
    color: '#fff',
    fontWeight: '600',
  },
});
