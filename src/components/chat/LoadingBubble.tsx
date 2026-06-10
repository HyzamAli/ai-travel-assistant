import { TypingDots } from '@/components/chat/TypingDots';
import { StyleSheet, View } from 'react-native';

export function LoadingBubble() {
  return (
    <View style={styles.bubbleRow}>
      <View style={styles.bubble}>
        <TypingDots />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
});
