import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FabBtnProps = {
  onPress: () => void;
};

export function Fab({ onPress }: FabBtnProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.fab, { bottom: insets.bottom + 16 }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole='button'
        accessibilityLabel='Ask Crew AI'
      >
        <Ionicons name='sparkles' size={24} color='#FFFFFF' />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
