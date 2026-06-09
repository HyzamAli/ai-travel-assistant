import { StyleSheet, Text, View } from 'react-native';

import type { Message } from '@/store/chatStore';

type Props = { message: Message };

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <View style={isUser ? styles.userRow : styles.assistantRow}>
      <View style={isUser ? styles.userBubble : styles.assistantBubble}>
        <Text style={isUser ? styles.userText : styles.assistantText}>
          {message.content}
        </Text>
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
  userText: { color: '#FFFFFF', fontSize: 15, lineHeight: 21 },
  assistantText: { color: '#0F172A', fontSize: 15, lineHeight: 21 },
});
