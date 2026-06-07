# Crew — Swiggy SDE3 RN Take-Home

Expo SDK 56, Expo Router, React Native 0.85. Trip Discovery feed + Ask Crew AI bottom sheet + custom Performance Overlay.

> Setup, demo link, and known-limitations write-up land in Story 5.1. This README currently covers only what's needed for Story 0.2.

## Running locally

```bash
npm install
npm run ios       # iOS simulator
npm run android   # Android emulator
```

## State management — Zustand

**Pick: [Zustand 5](https://github.com/pmndrs/zustand).** Considered alternatives: Context + `useReducer`, Jotai, Redux Toolkit.

### What the state surface actually looks like

| Slice | Shape | Update cadence |
| --- | --- | --- |
| Feed | `bundles: Bundle[]` (≈100), `expandedId: string \| null` | Loaded once; `expandedId` flips on tap |
| Chat | `messages: Message[]`, `isStreaming: boolean` | Append-only; bursty during streamed assistant replies |
| Overlay metrics | FPS, frame drops, JS-busy, p50/p95 | **~60 Hz — not in any React store** |

The overlay deliberately lives on Reanimated shared values fed into `<Animated.Text>`. Driving a React store at frame rate is the exact pathology the overlay is built to detect.

### Why Zustand over the alternatives

- **Bundle size** — ~1 KB gzipped. Redux Toolkit pulls ~13 KB + reselect for a state surface this small; Jotai's ~3 KB is competitive but still heavier.
- **Re-render granularity** — selectors (`useFeedStore(s => s.expandedId)`) only re-render the subscriber when *that* slice changes. The feed is FlashList-virtualised, the chat is concurrently streaming, and we have a 58 FPS scroll target — Context's "every consumer re-renders on every change" model would force `useContextSelector` workarounds or split-provider gymnastics to keep up.
- **No extra provider** — the root layout is already `GestureHandlerRootView → SafeAreaProvider → BottomSheetModalProvider → ThemeProvider → Stack`. Zustand is a hook, no tree mutation.
- **Dev ergonomics** — stores are plain hooks; trivial to mock per-test; no action constants, slices, or `dispatch` plumbing.
- **React Compiler interaction** — `experiments.reactCompiler: true` is on, so consumers get auto-memoised. The compiler does *not* control where renders are **triggered** though; selectors remain the right tool for that, and Zustand's selector model composes cleanly with the compiler.

Jotai was the closest second — atomic granularity is excellent for chat token streaming — but for two small slices the per-atom file boilerplate doesn't pay back. If chat grows derived state (e.g. typing-indicator atoms, retry-state atoms), revisit.

### Stores

- [`src/store/feedStore.ts`](./src/store/feedStore.ts) — `bundles`, `expandedId`, `setBundles`, `toggleExpanded`.
- [`src/store/chatStore.ts`](./src/store/chatStore.ts) — `messages`, `isStreaming`, `appendMessage`, `updateMessage`, `setStreaming`, `reset`.

`Bundle` is a placeholder type today; Story 1.1 fleshes it out. `Message` already matches the FR2.3/FR2.4 shape so Story 2.x can wire straight in.

## See also

- [`requirements.md`](./requirements.md) — extracted FR/NFR spec
- [`tasks.md`](./tasks.md) — stories & task breakdown
