import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type BottomSheetProps = {
  children: ReactNode;
  footer?: ReactNode;
  snapPoints?: string[];
  onChange?: (index: number) => void;
  animatedIndex?: SharedValue<number>;
};

const DEFAULT_SNAP_POINTS = ['50%', '100%'];

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop {...props} appearsOnIndex={1} disappearsOnIndex={0} />
  );
}

export const BottomSheet = forwardRef<BottomSheetModal, BottomSheetProps>(
  function BottomSheet(
    {
      children,
      footer,
      snapPoints = DEFAULT_SNAP_POINTS,
      onChange,
      animatedIndex,
    },
    ref,
  ) {
    const renderFooter = useCallback(
      (footerProps: BottomSheetFooterProps) => (
        <BottomSheetFooter {...footerProps} bottomInset={0}>
          {footer}
        </BottomSheetFooter>
      ),
      [footer],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        onChange={onChange}
        animatedIndex={animatedIndex}
        backdropComponent={renderBackdrop}
        footerComponent={footer ? renderFooter : undefined}
        handleIndicatorStyle={styles.handle}
        keyboardBehavior='interactive'
        keyboardBlurBehavior='restore'
      >
        {children}
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  handle: { backgroundColor: '#CBD5E1' },
});
