import {
  BottomSheetBackdrop,
  BottomSheetFlashList,
  BottomSheetFooter,
  BottomSheetModal,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import type { FlashListRef } from '@shopify/flash-list';
import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatComposer } from '@/components/ChatComposer';
import { MessageBubble } from '@/components/MessageBubble';
import { useChatStore, type Message } from '@/store/chatStore';

type Props = {
  animatedIndex: SharedValue<number>;
};

const SNAP_POINTS = ['50%', '92%'];

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop {...props} appearsOnIndex={1} disappearsOnIndex={0} />
  );
}

function renderFooter(props: BottomSheetFooterProps) {
  return (
    <BottomSheetFooter {...props} bottomInset={0}>
      <ChatComposer />
    </BottomSheetFooter>
  );
}

const renderItem = ({ item }: { item: Message }) => (
  <MessageBubble message={item} />
);
const keyExtractor = (m: Message) => m.id;

export const AiSheet = forwardRef<BottomSheetModal, Props>(function AiSheet(
  { animatedIndex },
  ref,
) {
  const insets = useSafeAreaInsets();
  const messages = useChatStore((s) => s.messages);
  const listRef = useRef<FlashListRef<Message>>(null);

  // Reserve worst-case composer height (input maxHeight 120 + row paddings + hairline
  // ≈ 152) + safe area, so the last message clears the footer even when the user
  // drafts a multi-line message. Sheet never overlaps the status bar, so no top inset.
  const listContentStyle = useMemo(
    () => ({ paddingTop: 12, paddingBottom: 160 + insets.bottom }),
    [insets.bottom],
  );
  const emptyStyle = useMemo(
    () => [styles.empty, { paddingBottom: 160 + insets.bottom }],
    [insets.bottom],
  );

  useEffect(() => {
    if (messages.length === 0) return;
    // Defer one tick so the new item is laid out before we scroll.
    const id = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 30);
    return () => clearTimeout(id);
  }, [messages.length]);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      animatedIndex={animatedIndex}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      handleIndicatorStyle={styles.handle}
      keyboardBehavior='interactive'
      keyboardBlurBehavior='restore'
    >
      <View style={styles.container}>
        {messages.length === 0 ? (
          <View style={emptyStyle}>
            <Text style={styles.emptyTitle}>Ask Crew AI</Text>
            <Text style={styles.emptyBody}>
              Plan trips, compare picks, or get day-by-day ideas. Start a
              conversation below.
            </Text>
          </View>
        ) : (
          <BottomSheetFlashList
            ref={listRef as never}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={listContentStyle}
          />
        )}
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  handle: { backgroundColor: '#CBD5E1' },
  container: { flex: 1 },
  empty: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  emptyBody: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
});
