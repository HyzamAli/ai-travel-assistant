import { useChatStore } from '@/store/chatStore';
import { Message } from '@/types/message';
import type { FlashListRef } from '@shopify/flash-list';
import { useEffect, useRef } from 'react';

export function useChatSheet() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  //used to determine if LoadingBubble should be shown and if auto-scroll should be smooth
  const lastRole = useChatStore((s) => s.messages[s.messages.length - 1]?.role);
  const isLoading = isStreaming && lastRole !== 'assistant';

  const listRef = useRef<FlashListRef<Message>>(null);
  const prevMessageCount = useRef(0);

  //tracks length of last message. Updates for each word update in token based streaming
  const lastContentLen = useChatStore((s) => {
    const last = s.messages[s.messages.length - 1];
    return last ? last.content.length : 0;
  });

  useEffect(() => {
    if (messages.length === 0 && !isLoading) return;
    //ensures that list auto-scrolls for new messages, new tokens for streaming
    //messages, and when the LoadingBubble footer appears/disappears
    const isNewMessage = messages.length !== prevMessageCount.current;
    prevMessageCount.current = messages.length;
    const id = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: isNewMessage });
    }, 30);
    return () => clearTimeout(id);
  }, [messages.length, lastContentLen, isLoading]);

  return { messages, listRef, isLoading };
}
