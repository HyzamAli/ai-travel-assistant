# AI Travel Assistant

Expo SDK 56, Expo Router, React Native 0.85. Three surfaces:

- **Trip Discovery feed** — virtualised 100+ bundle list with expandable detail cards and a remote-image pipeline.
- **Ask Crew AI bottom sheet** — gorhom v5 modal sheet with peek/full snaps, in-session chat history, and a mocked progressive (streamed) reply.
- **Performance Overlay** — built from scratch on Reanimated's `useFrameCallback`; live FPS, bad-frame counter, JS-busy indicator, and a start/stop session summary (p50 / p95 / worst frame).

> Submission for FR4.1 — setup, state rationale, known limitations. Perf methodology and numbers live in [`PERFORMANCE.md`](./PERFORMANCE.md).

## Running locally

**Prerequisites**

- Node ≥ 20 (Expo SDK 56 requirement).
- For iOS: Xcode 16+ with an installed iOS simulator runtime.
- For Android: Android Studio with an AVD running API 34+; `ANDROID_HOME` exported.
- No `.env` or API keys required — chat replies are mocked. (If you wire the optional Anthropic streaming stretch, see [Known limitations](#known-limitations).)

**Install & run**

```bash
npm install
npm run ios       # iOS simulator (preferred for FPS demos: matches review env on Android emulator too)
npm run android   # Android emulator
npm run start     # Pick device interactively (also enables LAN device pairing)
```

**Regenerate mock feed**

```bash
npm run bundles:gen   # rewrites src/mocks/bundles.json (~100 entries, 3 trip types, remote hero URLs)
```

**Toggling the overlay**

Tap the **Perf** pill in the top-left of any screen. It renders above the bottom sheet and the FAB. The toggle button itself has `pointerEvents='auto'`; the surrounding container is `box-none` so it never blocks taps on the feed.

## Project layout

```
src/
  app/              # Expo Router screens (_layout.tsx wires providers + PerfOverlay)
  components/
    feed/           # BundleCard, FeedsScreen, DayHighlightsRow, Fab
    chat/           # ChatSheet, MessageList, MessageBubble, ChatComposer, TypingDots
    perf/           # PerfOverlay + fpsSampler hook
  services/         # bundles.ts (mocked fetcher), chat.ts, mockStream.ts
  store/            # Zustand stores (feed, chat)
  mocks/            # bundles.json
  types/            # Bundle, Message, DayHighlight
```

The root `_layout.tsx` mounts providers in this order: `GestureHandlerRootView → SafeAreaProvider → BottomSheetModalProvider → ThemeProvider → Stack`, with `<PerfOverlay />` portalled at the same level as `Stack` so it sits above every screen and every modal.

## State management — Zustand

**Pick: [Zustand 5](https://github.com/pmndrs/zustand).** Considered alternatives: Context + `useReducer`, Jotai, Redux Toolkit.

### What the state surface actually looks like

| Slice           | Shape                                                    | Update cadence                                        |
| --------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| Feed            | `bundles: Bundle[]` (≈100), `expandedId: string \| null` | Loaded once; `expandedId` flips on tap                |
| Chat            | `messages: Message[]`, `isStreaming: boolean`            | Append-only; bursty during streamed assistant replies |
| Overlay metrics | FPS, bad frames, JS-busy, p50/p95/worst                  | **~60 Hz — not in any React store**                   |

The overlay deliberately lives on Reanimated shared values and only crosses back to React once a second via `useAnimatedReaction → runOnJS`. Driving a React store at frame rate is the exact pathology the overlay is built to detect.

### Why Zustand over the alternatives

- **Bundle size** — ~1 KB gzipped. Redux Toolkit pulls ~13 KB + reselect for a state surface this small; Jotai's ~3 KB is competitive but still heavier.
- **Re-render granularity** — selectors (`useFeedStore(s => s.expandedId === bundle.id)`) re-render the subscriber only when _that_ slice changes. The feed is FlashList-virtualised, the chat is concurrently streaming, and we have a 58 FPS scroll target — Context's "every consumer re-renders on every change" model would force `useContextSelector` workarounds or split-provider gymnastics to keep up.
- **No extra provider** — the root layout is already four providers deep. Zustand is a hook; no tree mutation.
- **Dev ergonomics** — stores are plain hooks; trivial to mock per-test; no action constants, slices, or `dispatch` plumbing.
- **React Compiler interaction** — `experiments.reactCompiler: true` is on, so consumers get auto-memoised. The compiler does not control where renders are **triggered**, though; selectors remain the right tool for that, and Zustand's selector model composes cleanly with the compiler.

Jotai was the closest second — atomic granularity is excellent for chat token streaming — but for two small slices the per-atom file boilerplate doesn't pay back. If chat grows derived state (typing-indicator atoms, retry-state atoms, per-message status atoms), revisit.

### Stores

- [`src/store/feedStore.ts`](./src/store/feedStore.ts) — `bundles`, `expandedId`, `setBundles`, `toggleExpanded`.
- [`src/store/chatStore.ts`](./src/store/chatStore.ts) — `messages`, `isStreaming`, `appendMessage`, `updateMessage`, `setStreaming`, `reset`.

## Performance overlay — how it samples

Implementation in [`src/components/perf/fpsSampler.ts`](./src/components/perf/fpsSampler.ts).

- **FPS** — `useFrameCallback` runs on the UI thread; we accumulate `timeSincePreviousFrame` into a 1-second window, then publish `Math.round(frames * 1000 / totalMs)` to a shared value. Label suffixed `UI` to make the thread explicit.
- **Bad frames** — incremented inline in the same callback whenever `timeSincePreviousFrame > 22.2ms` (i.e. below 45 FPS, per FR3.4). Resettable.
- **JS busy** — separate `requestAnimationFrame` loop on the JS thread; if a tick is more than 100 ms after the previous one, the JS thread is considered blocked. Rendered as a red dot + `BUSY` label. This is the only metric that runs on JS, and it's intentional — it's the canary for the thread we can't measure with `useFrameCallback`.
- **Session summary** — `Start session` begins writing `timeSincePreviousFrame` into a 3600-slot ring buffer (~60s @ 60 fps). `Stop session` freezes it. p50/p95 are computed on-demand by sorting a copy and indexing — the buffer itself stays unsorted so live writes aren't blocked by stats reads.

The overlay updates React state at most once per second (one `setState` per metric per second). Everything in between stays on shared values.

## Bottom-sheet keyboard behavior

The Ask Crew AI sheet has two snaps: **peek (50%)** and **full (92%)**. The composer's `BottomSheetTextInput` (gorhom) plus the sheet's `keyboardBehavior='interactive'` / `keyboardBlurBehavior='restore'` lifts the footer above the keyboard at either snap — focusing the input at peek raises it without changing the sheet's index, and dismissing the keyboard restores the prior position. No bespoke focus or inset code was needed.

The backdrop uses `appearsOnIndex={1}, disappearsOnIndex={0}`: at peek (index 0) the feed remains tappable behind the sheet (FR2.1); at full (index 1) the backdrop blocks feed taps.

## Known limitations

Honest list of things that aren't ideal, with the reasoning so a reviewer can judge severity.

### Chat / AI

- **No real Anthropic streaming.** `services/mockStream.ts` is an async generator that yields word tokens with 30–90 ms jitter — the spec allows this. The Anthropic SDK path is plumbed conceptually (chat store statuses already include `'streaming'`) but not wired. Adding it means: `expo-constants` for the key, `EXPO_PUBLIC_ANTHROPIC_API_KEY` env var, and gating behind a flag so reviewers without a key still get the mocked path.
- **Chat history clears on cold start.** Zustand state is in-memory; close-and-reopen within the session keeps history (FR2.5), but a full app restart wipes it. The spec explicitly scopes persistence to "session lifetime," so this matches the brief — calling it out for completeness.
- **Send is disabled while streaming.** Prevents overlapping streams. A more polished UX would queue the next prompt; here we chose the simpler defence-in-depth (disabled button + early-return in `sendUserMessage`).

### Feed

- **Card recycle + Reanimated shared value carryover.** Each `BundleCard` owns a shared value driving the details expand. At very fast scroll, when FlashList recycles a card into a new bundle slot, the shared value momentarily animates from the previous height to the new one before settling. Only visible when actively flinging; not visible at normal scroll speed. The fix is resetting the shared value on `recyclingKey` change — deferred to perf hardening if it shows up in measurements.
- **Single-expand semantics.** Tapping a second card collapses the first. Picked deliberately because multi-expand makes the list height ambiguous for FlashList's precise-measurement path. Switching would mean reshaping `expandedId` → `Set<string>` and accepting some recycling-cost regression.
- **Image cache is RAM + disk via `expo-image` defaults.** No explicit eviction policy. Adequate for a 100-item local feed; would need attention for a long-lived production feed.

### Performance overlay

- **JS-thread FPS is not measured directly.** `useFrameCallback` only sees the UI thread. The JS-busy indicator (RAF loop with a 100 ms threshold) is the proxy for JS-thread health. Producing a true JS-thread FPS reading would require running our own RAF tick counter — doable, but the indicator already catches the failure modes that matter (long tasks, GC pauses, big setState bursts).
- **Overlay's React updates are ~1 Hz, not zero.** The visible FPS / bad-frame / JS-busy text uses `useAnimatedReaction → runOnJS(setState)` once per second. Rendering through `<Animated.Text>` driven directly by a shared value would shave off that one render per second, but the overlay's own self-cost would be hard to attribute if we did that. We chose legibility over a marginal saving; the cost is measured (see PERFORMANCE.md).
- **Session ring buffer is fixed at 3600 samples (~60 s).** Matches the spec's "60-second scroll session" exactly; longer sessions wrap and overwrite the oldest sample silently. p50/p95 are computed across whatever is currently in the buffer.
- **Overlay always available in dev and prod builds.** No gating on `__DEV__`. FR3.1 doesn't require gating, and reviewers running a production build still need it. Easy to gate later if shipped.

### Tooling

- **No automated tests.** TypeScript + the type-only validation in `services/bundles.ts` is the only static safety net. Given the 3–4 day timeline this is a deliberate trade — every hour spent on Jest plumbing is an hour not spent on perf measurement, which is the primary review lens (NFR4).
- **Web target is not supported.** `react-native-web` is included transitively but no work has gone into making the sheet / overlay behave on web. `npm run web` will start but the bottom sheet and FAB are visually untested there.

## See also

- [`requirements.md`](./requirements.md) — extracted FR/NFR spec
- [`PERFORMANCE.md`](./PERFORMANCE.md) — FPS methodology, bottleneck before/after, session p50/p95
