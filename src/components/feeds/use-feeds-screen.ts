import { getBundles } from '@/services/bundles';
import { useFeedStore } from '@/store/feedStore';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';

type Status = 'loading' | 'ready' | 'error';

export function useFeedsScreen() {
  const bundles = useFeedStore((s) => s.bundles);
  const setBundles = useFeedStore((s) => s.setBundles);
  const [status, setStatus] = useState<Status>(
    bundles.length > 0 ? 'ready' : 'loading',
  );

  const sheetRef = useRef<BottomSheetModal>(null);

  const fetchBundles = useCallback(() => {
    getBundles()
      .then((data) => {
        setBundles(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [setBundles]);

  const load = useCallback(() => {
    setStatus('loading');
    fetchBundles();
  }, [fetchBundles]);

  useEffect(() => {
    if (bundles.length === 0) fetchBundles();
  }, [bundles.length, fetchBundles]);

  const openChatSheet = useCallback(() => {
    sheetRef.current?.present();
  }, []);

  return { status, bundles, sheetRef, load, openChatSheet };
}
