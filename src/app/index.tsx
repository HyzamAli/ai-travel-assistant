import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BundleCard } from '@/components/bundle-card';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { getBundles } from '@/services/bundles';
import { useFeedStore } from '@/store/feedStore';
import type { Bundle } from '@/types/bundle';

type Status = 'loading' | 'ready' | 'error';

const renderItem = ({ item }: { item: Bundle }) => <BundleCard bundle={item} />;
const keyExtractor = (b: Bundle) => b.id;

const ListHeader = () => (
  <View style={styles.header}>
    <ThemedText type="title">Discover</ThemedText>
    <ThemedText type="small" themeColor="textSecondary">
      Trips picked for you
    </ThemedText>
  </View>
);

export default function FeedScreen() {
  const theme = useTheme();
  const bundles = useFeedStore((s) => s.bundles);
  const setBundles = useFeedStore((s) => s.setBundles);
  const [status, setStatus] = useState<Status>(
    bundles.length > 0 ? 'ready' : 'loading',
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
      <SafeAreaView
        style={[styles.centered, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: theme.background }]}
      >
        <ThemedText type="default">Couldn't load trips.</ThemedText>
        <Pressable onPress={load} style={styles.retry}>
          <ThemedText type="linkPrimary">Tap to retry</ThemedText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <FlashList
        data={bundles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  retry: { paddingVertical: 8, paddingHorizontal: 16 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 4 },
  listContent: { paddingBottom: 24 },
});
