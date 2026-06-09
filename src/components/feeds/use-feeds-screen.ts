import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { getBundles } from '@/services/bundles';
import { useFeedStore } from '@/store/feedStore';

type Status = 'loading' | 'ready' | 'error';

export function useFeedsScreen() {
  const bundles = useFeedStore((s) => s.bundles);
  const setBundles = useFeedStore((s) => s.setBundles);
  const [status, setStatus] = useState<Status>(
    bundles.length > 0 ? 'ready' : 'loading',
  );

  const sheetRef = useRef<BottomSheetModal>(null);
  const sheetIndex = useSharedValue(-1);

  const load = useCallback(() => {
    setStatus('loading');
    getBundles()
      .then((data) => {
        setBundles(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [setBundles]);

  useEffect(() => {
    if (bundles.length === 0) load();
  }, [bundles.length, load]);

  const openChatSheet = useCallback(() => {
    sheetRef.current?.present();
  }, [sheetIndex]);

  return { status, bundles, sheetRef, sheetIndex, load, openChatSheet };
}
