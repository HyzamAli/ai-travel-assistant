import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type Props = {
  animatedIndex: SharedValue<number>;
};

const SNAP_POINTS = ['50%', '92%'];

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={1}
      disappearsOnIndex={0}
    />
  );
}

export const AISheet = forwardRef<BottomSheetModal, Props>(function AISheet(
  { animatedIndex },
  ref,
) {
  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      animatedIndex={animatedIndex}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Ask Crew AI</Text>
        <Text style={styles.subtitle}>
          Chat interface lands in Story 2.2.
        </Text>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  handle: { backgroundColor: '#CBD5E1' },
  content: {
    flex: 1,
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
  },
});
