# Crew Take-Home — Stories & Tasks

Maps the requirements in [`requirements.md`](./requirements.md) to actionable stories and tasks. Story acceptance criteria cite the originating FR/NFR IDs.

Legend: `[ ]` open · `[x]` done · `(FRx.y)` ties to a requirement.

---

## Epic 0 — Project Foundation

### Story 0.1 — Bootable Expo skeleton
**As a developer, I need a runnable Expo v54+ project with Expo Router so I can start building screens.** (NFR3)

**Acceptance Criteria**
- Project lives in `swiggy-crew-starter/` and runs on iOS sim + Android emulator.
- Expo SDK version is 54 or higher.
- Routing handled by Expo Router (file-based, `app/` directory).
- Reanimated, Gesture Handler, and chosen list/image/sheet libs installed and importable.

**Tasks**
- [ ] Run `npx create-expo-app@latest` with the TypeScript + Expo Router template.
- [ ] Verify SDK version in `package.json` (expo ≥ 54).
- [ ] Decide managed-workflow + dev-client strategy; document.
- [ ] Install: `@shopify/flash-list`, `expo-image`, `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-gesture-handler`.
- [ ] Wire `GestureHandlerRootView` + `BottomSheetModalProvider` at the root layout.
- [ ] Add Reanimated Babel plugin; verify no warnings on cold start.
- [ ] Smoke test: blank `/` route renders on both platforms.

### Story 0.2 — Pick & justify state management
**As a reviewer, I want a clear rationale for the state library so I understand the engineering trade-offs.** (NFR3)

**Acceptance Criteria**
- One library chosen (Zustand / Context+useReducer / Jotai / Redux Toolkit).
- Rationale written in README covering: bundle size, re-render granularity, dev ergonomics, fit for chat + feed state.

**Tasks**
- [x] Compare top 2 options for this app's state shape (feed cache, chat history, overlay metrics).
- [x] Implement minimal store boilerplate.
- [x] Draft rationale paragraph for README.

---

## Epic 1 — Trip Discovery Feed (Screen 1)

### Story 1.1 — Mock data layer
**As the feed, I need 100+ realistic travel bundles loaded from a local file with a simulated network delay.** (FR1.1, FR1.2)

**Acceptance Criteria**
- JSON file with ≥100 bundles covering at least 3 trip types.
- Each bundle has: id, destination, tripType, price, duration, rating, heroImageUrl (remote), 3–4 day-by-day highlights `{ title, iconName }`.
- Fetcher exposes `getBundles(): Promise<Bundle[]>` with 600–1200 ms artificial delay.

**Tasks**
- [x] Define `Bundle` and `DayHighlight` TypeScript types.
- [x] Generate `mocks/bundles.json` (script or hand-curate).
- [x] Source 100+ remote hero image URLs (Unsplash/Pexels/Picsum).
- [x] Implement `services/bundles.ts` with delayed promise.
- [x] Add unit-level sanity check that all entries validate against the type.

### Story 1.2 — Render the scrollable feed
**As a user, I want to scroll through travel bundles smoothly so I can browse trips.** (FR1.1, FR1.3, NFR1)

**Acceptance Criteria**
- Vertical list of bundle cards using FlashList (or justified alternative).
- Each card shows hero image, destination, trip-type badge, price, duration, star rating.
- Idle scroll ≥58 FPS; 100-item virtualisation does not drop below 55 FPS. (NFR1)

**Tasks**
- [x] Build `BundleCard` presentational component.
- [x] Build `FeedScreen` at `app/index.tsx` consuming the mock service.
- [x] Verify FlashList recycle behavior (`recyclingKey` on image, stable `keyExtractor`). FlashList v2 no longer needs `estimatedItemSize` — precise measurement replaces it.
- [x] React Compiler is on, so no manual `React.memo`. Card avoids inline styles/handlers by hoisting `renderItem`/`keyExtractor`/`StyleSheet.create` to module scope and pre-building per-`tripType` badge styles.
- [x] Loading state (spinner) while service resolves.
- [x] Error/retry state.

### Story 1.3 — Remote image loading with placeholder & cache
**As a user, I want images to appear quickly with a soft placeholder so the feed feels instant.** (FR1.5, FR1.6)

**Acceptance Criteria**
- Images load from remote URLs only (no local bundling). (NFR3)
- Explicit width & height declared on every image. (FR1.5)
- Low-fidelity placeholder visible during load (blurhash, tiny PNG, or color block).
- Repeat scrolls hit cache, not network.

**Tasks**
- [x] Replace RN `Image` with `expo-image`. (Done in 1.2 to avoid rework.)
- [x] Add placeholder + `transition` props. Used a layered `LinearGradient` (`#DBEAFE` → `#FFFFFF` diagonal) with a centered `compass-outline` Ionicon instead of a blurhash — spec allows "color block," and a designed gradient + icon reads as a deliberate loading state rather than a flat grey.
- [x] Set `cachePolicy="memory-disk"`. (Done in 1.2.)
- [ ] Verify caching: scroll down, back up, watch network panel. (Manual; document in PERFORMANCE.md alongside Story 5.2.)

### Story 1.4 — Expandable Details with nested horizontal scroll
**As a user, I want to tap a card to see day-by-day highlights so I can preview the trip.** (FR1.4)

**Acceptance Criteria**
- Tap on card toggles a Details section (animated height/opacity).
- Details contains a horizontal ScrollView/FlashList of 3–4 day highlight chips (icon + text, no images).
- Expand/collapse animation ≥55 FPS throughout. (NFR1)
- Only one card expanded at a time *or* multi-expand — make a call and document.

**Tasks**
- [x] Add `expandedId` state. (Lives in `feedStore`; single-expand semantics — tapping a second card collapses the first. Switching to multi-expand would mean reshaping the store to `Set<string>`.)
- [x] Animate height with Reanimated. `useSharedValue` + `useEffect` + `withTiming(220ms)` driving height + opacity on a hairline-bordered details container. Fixed `DETAILS_HEIGHT` constant avoids on-tap measurement work.
- [x] Build `DayHighlightsRow` with horizontal `ScrollView` (not FlashList — 3–4 items don't need virtualisation).
- [x] Use `@expo/vector-icons` Ionicons. (Already wired in 1.3.)
- [x] Card uses a narrow zustand selector (`s.expandedId === bundle.id`), so only the two affected cards re-render per toggle. Caveat: when a card recycles into a new bundle slot, the shared value carries over and the recycled card briefly animates to its new state — visible only at extreme scroll speeds; revisit in 4.1 if it shows up.

### Story 1.5 — Floating action button to open AI sheet
**As a user, I want a persistent FAB so I can summon the AI assistant anywhere on the feed.** (FR1.7, NFR2)

**Acceptance Criteria**
- FAB anchored bottom-right, above safe area.
- Tapping opens the bottom sheet **without unmounting or re-rendering the feed**. (FR1.7)
- FAB hides or fades when sheet is at full height (optional polish).

**Tasks**
- [x] Build `Fab` component. Circular Animated.View, sparkles Ionicon, positioned via `useSafeAreaInsets`. Opacity + scale interpolated from sheet `animatedIndex` shared value — fade entirely on UI thread, no React state involvement.
- [x] Trigger sheet via `sheetRef.current?.present()` (gorhom v5 imperative modal API). Wired in `app/index.tsx` `onPress`.
- [x] FeedScreen does not re-render on open/close: sheet open state lives in a Reanimated shared value + a stable `useRef`. No props or selectors observe it, so the React tree above the sheet stays untouched.

---

## Epic 2 — Ask Crew AI Bottom Sheet (Screen 2)

### Story 2.1 — Sheet container with snap behavior
**As a user, I want a draggable bottom sheet with peek and full states so I can choose how much screen the chat takes.** (FR2.1, FR2.2)

**Acceptance Criteria**
- Two snap points: ~50% (peek) and ~92% (full).
- Draggable smoothly between snaps; gesture and feed scroll both on the UI thread. (NFR2)
- Sheet open/close has **zero frame drops below 45 FPS**. (NFR1)
- Feed remains visible and scrollable behind the sheet.

**Tasks**
- [x] Used `BottomSheetModal` (not `BottomSheet`). JSX lives in FeedScreen but the modal portals to the root via `BottomSheetModalProvider` (wired in `_layout.tsx`), so "mount at root" is satisfied without threading refs through layout context.
- [x] `snapPoints={['50%', '92%']}` + `enableDynamicSizing={false}` (gorhom v5 defaults dynamic sizing to true; must disable for fixed snap points).
- [x] `enablePanDownToClose` enabled — sheet returns to -1 (closed), FAB reappears.
- [x] Backdrop: `BottomSheetBackdrop` with `appearsOnIndex={1}, disappearsOnIndex={0}`. At peek (0) → no backdrop, feed remains visible *and tappable* behind the sheet (FR2.1). At full (1) → backdrop blocks feed taps (correct modal behavior).

### Story 2.2 — Chat UI with history
**As a user, I want my conversation preserved while the app is open so I don't lose context when I close the sheet.** (FR2.3, FR2.5)

**Acceptance Criteria**
- Message list of `{ id, role: 'user'|'assistant', content, status }`.
- New user messages appear immediately; assistant messages stream in below.
- History survives close→reopen within the session (clears on app restart). (FR2.5)
- Auto-scroll to latest message.

**Tasks**
- [ ] Define `Message` type & chat store (chosen state lib).
- [ ] Build `MessageList` (FlashList inside BottomSheetScrollView or `BottomSheetFlashList`).
- [ ] Build `MessageBubble` (user vs assistant variants).
- [ ] Send-message action: append user msg → kick off assistant response.

### Story 2.3 — Progressive (streamed) assistant responses
**As a user, I want the assistant's reply to appear progressively so it feels alive.** (FR2.4)

**Acceptance Criteria**
- After sending, a loading indicator shows until the first token. (FR2.7)
- Tokens render incrementally (mocked tokenizer is acceptable per spec; real Anthropic streaming is a stretch).
- Streaming + feed scroll simultaneously produces no visible jank. (NFR1)

**Tasks**
- [ ] Implement `mockStreamReply(prompt)` async generator yielding tokens with jitter.
- [ ] Batch token appends (e.g. flush every 16ms) to avoid 1-render-per-token storms.
- [ ] Loading indicator component (typing dots) shown until first token.
- [ ] **Stretch:** wire Anthropic SDK with API key from `expo-constants`; gate behind env flag.

### Story 2.4 — Keyboard-aware input
**As a user typing on the keyboard, I want the input to stay visible at full height.** (FR2.6)

**Acceptance Criteria**
- At full-height snap, opening keyboard pushes the input above it.
- At peek snap, opening keyboard behavior is documented (e.g. auto-snap to full).
- No layout shift on iOS notch / Android nav bars.

**Tasks**
- [ ] Use `BottomSheetTextInput` from `@gorhom/bottom-sheet` (handles keyboard offset).
- [ ] Test on both platforms.
- [ ] Decide peek+keyboard behavior; document in README.

---

## Epic 3 — Performance Overlay

### Story 3.1 — Overlay toggle & shell
**As a developer, I want a floating button to toggle a performance HUD so I can leave it on while debugging.** (FR3.1, FR3.2)

**Acceptance Criteria**
- Floating button visible in dev builds (optionally toggleable in prod).
- Tapping shows/hides the overlay panel.
- Overlay is positioned above all screens including the bottom sheet.

**Tasks**
- [ ] Build `PerfOverlay` component rendered at root.
- [ ] Position absolute, `pointerEvents="box-none"` so it doesn't block touches.
- [ ] Toggle button separate from RN dev menu. (FR3.1)

### Story 3.2 — Live FPS measurement
**As a developer, I want a live FPS readout so I can spot drops in real time.** (FR3.3, NFR2)

**Acceptance Criteria**
- FPS updates ~once per second.
- Reading reflects UI-thread frame rate (preferred) — JS-thread reading documented as a known limitation if used.
- Overlay's own render cost is negligible (e.g. updates via Reanimated shared value, not setState every frame).

**Tasks**
- [ ] Try Reanimated `useFrameCallback` to measure UI-thread frames.
- [ ] Fall back to a `requestAnimationFrame` loop for JS-thread frames; clearly label.
- [ ] Display via `Animated.Text` driven by shared value (no React re-render per frame).

### Story 3.3 — Frame-drop counter
**As a developer, I want a counter of bad frames so I know how often I jank.** (FR3.4)

**Acceptance Criteria**
- Counter increments each time a frame falls below 45 FPS (frame time > ~22.2 ms).
- Visible alongside FPS reading.
- Resettable.

**Tasks**
- [ ] In the frame callback, compare `dt` to threshold and increment a shared counter.
- [ ] Reset button.

### Story 3.4 — JS-thread busy indicator
**As a developer, I want a visual cue when the JS thread is blocked so I can correlate hangs with user actions.** (FR3.5)

**Acceptance Criteria**
- Indicator turns "busy" when JS-thread RAF loop misses its tick by > 100ms.
- Recovers automatically when JS thread frees up.

**Tasks**
- [ ] Run a JS-side RAF loop that timestamps each tick.
- [ ] If `now - lastTick > 100ms`, mark busy; clear after a healthy tick.
- [ ] Render via shared value to avoid being part of the problem.

### Story 3.5 — Session summary
**As a developer, I want p50/p95/worst frame stats over a session so I can post numbers in PERFORMANCE.md.** (FR3.6, FR4.2)

**Acceptance Criteria**
- Continuously samples frame times into a ring buffer.
- Surfaces p50 frame time, p95 frame time, and the single worst frame recorded.
- Has a "start session / stop session / copy summary" affordance.

**Tasks**
- [ ] Ring buffer sized for ~60s @ 60fps (~3600 samples).
- [ ] Quantile calc on demand (sort copy → index).
- [ ] Buttons: Start, Stop, Reset, Copy-to-clipboard (`expo-clipboard`).

---

## Epic 4 — Performance Hardening

### Story 4.1 — Hit all FPS targets
**As a reviewer, I want measured evidence that every target in the spec is met.** (NFR1, NFR2)

**Acceptance Criteria**
- Feed idle scroll ≥58 FPS on a mid-range Android device / emulator.
- Bottom sheet open/close: zero drops below 45 FPS.
- Card expand/collapse ≥55 FPS throughout.
- AI streaming + feed scroll: no visible jank.

**Tasks**
- [ ] Run 60s scroll session with overlay; record p50/p95/worst.
- [ ] Identify worst offender (likely image loading, inline functions, or re-renders).
- [ ] Apply fix; re-measure; capture before/after.
- [ ] Repeat for sheet animation if needed.

---

## Epic 5 — Deliverables

### Story 5.1 — README.md
**As a reviewer, I want clear setup steps and design rationale.** (FR4.1)

**Acceptance Criteria**
- Setup: install, run iOS, run Android, env vars.
- State management rationale (from Story 0.2).
- Known limitations.
- Link to demo recording.

**Tasks**
- [ ] Write setup section.
- [ ] Write state mgmt rationale.
- [ ] Write limitations.

### Story 5.2 — PERFORMANCE.md
**As a reviewer, I want concrete perf evidence and trade-off honesty.** (FR4.2)

**Acceptance Criteria**
- FPS methodology — how the tracker works, sampling rate, why.
- ≥1 identified bottleneck with before/after metrics.
- p50 + p95 frame times from a 60-second scroll session.
- One honest trade-off (e.g. memory vs render time).

**Tasks**
- [ ] Draft methodology section.
- [ ] Capture before/after numbers from Story 4.1.
- [ ] Write trade-off section.

### Story 5.3 — Demo recording
**As a reviewer, I want to see it work in one 2–3 min video.** (FR4.3)

**Acceptance Criteria**
- 2–3 minutes.
- Shows feed scrolling with overlay active.
- Shows bottom sheet in use during scroll.
- Hosted somewhere durable (YouTube unlisted / Loom / repo asset).

**Tasks**
- [ ] Script the demo flow (≤30s setup, scroll, expand card, open sheet, chat, scroll while streaming, show summary).
- [ ] Record on Android emulator (matches review env).
- [ ] Upload & link from README.

### Story 5.4 — Public GitHub repo
**As a reviewer, I need a public URL to clone and review.** (FR4.4)

**Acceptance Criteria**
- Repo is public.
- Default branch builds clean from a fresh clone.
- README, PERFORMANCE.md, demo link all present.

**Tasks**
- [ ] `git init`, sensible `.gitignore`.
- [ ] Push to GitHub.
- [ ] Sanity check via fresh clone in a temp dir.

---

## Out of Scope (explicitly)
- Real booking flow.
- Persistent chat history across app restarts (spec says session lifetime only).
- Authentication.
- Backend API.
- Bundling images locally (forbidden by NFR3).
