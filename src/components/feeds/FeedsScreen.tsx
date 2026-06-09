import { ChatSheet } from '@/components/chat/ChatSheet';
import { BundleCard } from '@/components/feeds/BundleCard';
import { Fab } from '@/components/feeds/Fab';
import { useFeedsScreen } from '@/components/feeds/use-feeds-screen';
import type { Bundle } from '@/types/bundle';
import { FlashList } from '@shopify/flash-list';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const renderItem = ({ item }: { item: Bundle }) => <BundleCard bundle={item} />;
const keyExtractor = (b: Bundle) => b.id;

const ListHeader = () => (
  <View style={styles.header}>
    <Text style={styles.title}>Discover</Text>
    <Text style={styles.subtitle}>Trips picked for you</Text>
  </View>
);

export function FeedsScreen() {
  const insets = useSafeAreaInsets();
  const { status, bundles, sheetRef, load, openChatSheet } = useFeedsScreen();

  if (status === 'loading') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.body}>Couldn&apos;t load trips.</Text>
        <Pressable onPress={load} style={styles.retry}>
          <Text style={styles.link}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlashList
        data={bundles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
      />
      <Fab onPress={openChatSheet} />
      <ChatSheet ref={sheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  retry: { paddingVertical: 8, paddingHorizontal: 16 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 4 },
  title: { fontSize: 48, lineHeight: 52, fontWeight: '600', color: '#0F172A' },
  subtitle: { fontSize: 14, lineHeight: 20, color: '#64748B' },
  body: { fontSize: 16, lineHeight: 24, color: '#0F172A' },
  link: { fontSize: 14, lineHeight: 20, color: '#2563EB', fontWeight: '600' },
});
