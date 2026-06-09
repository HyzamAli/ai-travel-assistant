import { ChatSheet } from '@/components/chat/ChatSheet';
import { ThemedText } from '@/components/common/ThemedText';
import { BundleCard } from '@/components/feeds/BundleCard';
import { Fab } from '@/components/feeds/Fab';
import { useTheme } from '@/hooks/use-theme';
import { getBundles } from '@/services/bundles';
import { useFeedStore } from '@/store/feedStore';
import type { Bundle } from '@/types/bundle';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Status = 'loading' | 'ready' | 'error';

const renderItem = ({ item }: { item: Bundle }) => <BundleCard bundle={item} />;
const keyExtractor = (b: Bundle) => b.id;

const ListHeader = () => (
  <View style={styles.header}>
    <ThemedText type='title'>Discover</ThemedText>
    <ThemedText type='small' themeColor='textSecondary'>
      Trips picked for you
    </ThemedText>
  </View>
);

export function FeedsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bundles = useFeedStore((s) => s.bundles);
  const setBundles = useFeedStore((s) => s.setBundles);
  const [status, setStatus] = useState<Status>(
    bundles.length > 0 ? 'ready' : 'loading',
  );

  const sheetRef = useRef<BottomSheetModal>(null);
  const sheetIndex = useSharedValue(-1);

  // FAB is 56pt + 16pt bottom offset + insets.bottom, so the last card needs
  // ~88pt + insets.bottom of clearance to clear both the FAB and home indicator.
  const listContentStyle = useMemo(
    () => ({ paddingBottom: 88 + insets.bottom }),
    [insets.bottom],
  );

  const load = useCallback(() => {
    setStatus('loading');
    getBundles()
      .then((data) => {
        setBundles(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [setBundles]);

  useEffect(() => {
    if (bundles.length === 0) load();
  }, [bundles.length, load]);

  if (status === 'loading') {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ThemedText type='default'>Couldn't load trips.</ThemedText>
        <Pressable onPress={load} style={styles.retry}>
          <ThemedText type='linkPrimary'>Tap to retry</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <FlashList
        data={bundles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={listContentStyle}
      />
      <Fab
        onPress={() => sheetRef.current?.present()}
        sheetIndex={sheetIndex}
      />
      <ChatSheet ref={sheetRef} animatedIndex={sheetIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  retry: { paddingVertical: 8, paddingHorizontal: 16 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 4 },
});
