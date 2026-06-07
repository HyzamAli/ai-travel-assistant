import { create } from 'zustand';

// Minimal placeholder — Story 1.1 will define the full Bundle shape.
export type Bundle = { id: string };

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
