import { create } from 'zustand';
import type { Bundle } from '@/types/bundle';

type FeedState = {
  bundles: Bundle[];
  expandedId: string | null;
  setBundles: (bundles: Bundle[]) => void;
  toggleExpanded: (id: string) => void;
};

export const useFeedStore = create<FeedState>((set) => ({
  bundles: [],
  expandedId: null,
  setBundles: (bundles) => set({ bundles }),
  toggleExpanded: (id) =>
    set((state) => ({ expandedId: state.expandedId === id ? null : id })),
}));
