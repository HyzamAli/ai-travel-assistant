import { useChatStore, type Message } from '@/store/chatStore';
import type { FlashListRef } from '@shopify/flash-list';
import { useEffect, useRef } from 'react';

export function useChatSheet() {
  const messages = useChatStore((s) => s.messages);
  const listRef = useRef<FlashListRef<Message>>(null);
  const prevMessageCount = useRef(0);

  //tracks length of last message. Updates for each word update in token based streaming
  const lastContentLen = useChatStore((s) => {
    const last = s.messages[s.messages.length - 1];
    return last ? last.content.length : 0;
  });

  useEffect(() => {
    if (messages.length === 0) return;
    //ensures that list auto-scrolls for new messages, as well as new tokens for existing streaming messages
    const isNewMessage = messages.length !== prevMessageCount.current;
    prevMessageCount.current = messages.length;
    const id = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: isNewMessage });
    }, 30);
    return () => clearTimeout(id);
  }, [messages.length, lastContentLen]);

  return { messages, listRef };
}
