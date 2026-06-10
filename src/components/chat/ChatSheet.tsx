import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { LoadingBubble } from '@/components/chat/LoadingBubble';
import { useChatSheet } from '@/components/chat/use-chat-sheet';
import { BottomSheet } from '@/components/modal/BottomSheet';
import { Message } from '@/types/message';
import {
  BottomSheetFlashList,
  type BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { forwardRef, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const renderItem = ({ item }: { item: Message }) => (
  <MessageBubble message={item} />
);
const keyExtractor = (m: Message) => m.id;

const EmptyState = () => (
  <View style={styles.empty}>
    <Text style={styles.emptyTitle}>Ask Crew AI</Text>
    <Text style={styles.emptyBody}>
      Plan trips, compare picks, or get day-by-day ideas. Start a conversation
      below.
    </Text>
  </View>
);

export const ChatSheet = forwardRef<BottomSheetModal>(
  function ChatSheet(_props, ref) {
    const insets = useSafeAreaInsets();
    const { messages, listRef, isLoading } = useChatSheet();
    const [footerHeight, setFooterHeight] = useState(0);
    const animatedIndex = useSharedValue(-1);

    const containerStyle = useAnimatedStyle(() => ({
      marginTop: interpolate(
        animatedIndex.value,
        [0, 1],
        [0, insets.top],
        Extrapolation.CLAMP,
      ),
    }));

    const listContentStyle = useMemo(
      () => ({ paddingTop: 12, paddingBottom: footerHeight }),
      [footerHeight],
    );

    const footer = useMemo(
      () => (
        <View onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
          <ChatComposer />
        </View>
      ),
      [],
    );

    return (
      <BottomSheet ref={ref} footer={footer} animatedIndex={animatedIndex}>
        <Animated.View style={[styles.container, containerStyle]}>
          <BottomSheetFlashList
            ref={listRef as never}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={listContentStyle}
            ListEmptyComponent={EmptyState}
            ListFooterComponent={isLoading ? LoadingBubble : undefined}
          />
        </Animated.View>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
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
