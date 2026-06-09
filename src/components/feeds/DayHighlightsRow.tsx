import type { DayHighlight } from '@/types/bundle';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type DayHighlightRowProps = { highlights: DayHighlight[] };

export function DayHighlightsRow({ highlights }: DayHighlightRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {highlights.map((h) => (
        <View key={h.iconName} style={styles.chip}>
          <Ionicons name={h.iconName} size={14} color='#334155' />
          <Text style={styles.text}>{h.title}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
});
