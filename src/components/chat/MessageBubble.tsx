import { StyleSheet, Text, View } from 'react-native';

import { TypingDots } from '@/components/chat/TypingDots';
import type { Message } from '@/store/chatStore';

type Props = { message: Message };

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isWaiting = message.status === 'sending';
  const isError = message.status === 'error';

  let bubbleStyle = isUser ? styles.userBubble : styles.assistantBubble;
  let textStyle = isUser ? styles.userText : styles.assistantText;
  if (isError) {
    bubbleStyle = styles.errorBubble;
    textStyle = styles.errorText;
  }

  return (
    <View style={isUser ? styles.userRow : styles.assistantRow}>
      <View style={bubbleStyle}>
        {isWaiting ? (
          <TypingDots />
        ) : (
          <Text style={textStyle}>{message.content}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  assistantRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    maxWidth: '78%',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    maxWidth: '78%',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  userText: { color: '#FFFFFF', fontSize: 15, lineHeight: 21 },
  assistantText: { color: '#0F172A', fontSize: 15, lineHeight: 21 },
  errorText: { color: '#991B1B', fontSize: 15, lineHeight: 21 },
});
