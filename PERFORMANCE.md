# PERFORMANCE.md

Submission for FR4.2 — methodology, a 60-second session snapshot, one bottleneck investigated with before/after evidence, and one honest trade-off.

> **TODO markers** in §2 and §3 are empirical values to fill in after running the capture protocol below. The capture protocol is part of the spec — without it, the numbers aren't reproducible.

---

## 1. Methodology

Implementation: [`src/components/perf/fpsSampler.ts`](./src/components/perf/fpsSampler.ts), surfaced by [`src/components/perf/PerfOverlay.tsx`](./src/components/perf/PerfOverlay.tsx). Mounted once at the root via [`src/app/_layout.tsx`](./src/app/_layout.tsx).

### What we measure

| Metric          | Thread | Source                                                                                          | Update cadence                  |
| --------------- | ------ | ----------------------------------------------------------------------------------------------- | ------------------------------- |
| FPS             | UI     | `useFrameCallback` — `timeSincePreviousFrame` summed into a 1-second window, then `frames / s`. | 1 Hz                            |
| Bad frame count | UI     | Same callback. Increments when `timeSincePreviousFrame > 22.2 ms` (i.e. below 45 FPS — FR3.4).  | Per bad frame                   |
| JS-busy         | JS     | Separate `requestAnimationFrame` loop. Flips to `BUSY` when a tick is > 100 ms after the prior. | Per RAF tick, debounced on flip |
| Session p50/p95 | UI→JS  | `timeSincePreviousFrame` pushed to a JS-side ring buffer via `runOnJS` while a session is open. | Stats computed on demand        |

### Why each choice

- **`useFrameCallback` for FPS** — Reanimated's worklet runs on the UI thread, so the measurement itself doesn't compete with the JS thread it would otherwise distort. A `requestAnimationFrame` loop on the JS thread would show JS-thread tick rate, not native frame production rate. The label is suffixed `UI` so the reading source is unambiguous in the overlay.
- **Bad-frame threshold = 22.2 ms** — That's the frame budget at 45 FPS (`1000 / 45 ≈ 22.2`), matching FR3.4 verbatim.
- **JS-busy = RAF tick gap > 100 ms** — Long tasks, GC pauses, big synchronous setState bursts all delay the next RAF tick. 100 ms is the empirical threshold beyond which a user perceives a stall. Writes to the shared value are guarded — `jsBusy.value` only mutates when the boolean actually flips, so derived consumers (the dot color, the status label) don't re-evaluate every tick.
- **Session summary = ring buffer of 3600 samples** — Sized for ~60 s @ 60 FPS to match the brief's "60-second scroll session" (FR4.2). The buffer lives on the JS thread; the UI-thread worklet pushes each sample via `runOnJS(commitSample)` when a session is active. p50/p95 are computed on demand by sorting a copy of the live region — the ring itself stays unsorted so live writes aren't blocked by stats reads.
- **Why a JS-side ring buffer, not a shared-value array** — Reanimated 3 does not reliably propagate array-element mutations between runtimes. Mutating `summaryBuffer.value[i] = x` from a worklet may not be visible to JS-side readers, which would silently report `0 ms` for every percentile. Pushing per-sample via `runOnJS` sidesteps that footgun at the cost of one bridge crossing per frame *only* while a session is active (see §4).

### What the overlay does NOT cost

The visible metrics (FPS, bad frames, JS-busy label) bind directly to shared values via `Animated.createAnimatedComponent(TextInput)` + `useAnimatedProps`. No `setState`, no `runOnJS` — the text content updates on the UI thread by writing to the input's `text` prop. React only re-renders when:

- The user opens or closes the overlay panel (mount/unmount).
- The user starts, stops, or refreshes a session (session summary `useState`s, gated to once per 500 ms while a session is active and the panel is visible).

The panel is conditionally mounted (`{isMetricsVisible && <Panel />}`), so when hidden, `useAnimatedProps` / `useAnimatedStyle` / the summary `setInterval` all unmount. Sampler keeps running so stats are continuous; only the UI surface stops working.

---

## 2. 60-second scroll session

### Capture protocol

1. Boot the iOS simulator (or Android emulator) in **release-style configuration** — `npm run ios -- --configuration Release` (or use a production build via `eas build --profile preview --platform ios`). Dev-mode JSI overhead and React strict-mode double-renders distort numbers.
2. Cold-start the app on the feed screen.
3. Tap **Perf** to open the overlay.
4. Tap **Start session**.
5. Scroll the feed continuously for **60 seconds** — natural fling cadence, no stalls. Don't expand cards or open the chat sheet during the capture (those are separate measurements, §3 covers one).
6. Tap **Stop session**.
7. Read p50 / p95 / worst frame from the overlay.

### Results

| Metric                    | Value         |
| ------------------------- | ------------- |
| p50 frame time            | **TODO** ms   |
| p95 frame time            | **TODO** ms   |
| Worst frame               | **TODO** ms   |
| Average FPS (derived)     | **TODO** FPS  |
| Bad frame count over 60 s | **TODO**      |
| Device / build            | **TODO** (e.g. iPhone 15 sim, iOS 17.4, release-style build) |

### Interpretation

NFR1 targets: feed idle scroll ≥58 FPS, 100-item virtualisation no drops below 55 FPS. In frame-time terms: p50 ≤ 17.2 ms, p95 ≤ 18.2 ms. The worst frame is the spike — a single 50 ms frame is invisible to the user; a stream of 30 ms frames isn't.

**TODO** (post-capture): one sentence on whether the numbers hit NFR1, and if not, where the misses cluster (e.g. during image decode, during first paint, etc.).

---

## 3. Bottleneck case study — perf overlay's own React cost

NFR2 explicitly demands the overlay must "not meaningfully impact the FPS it is measuring." This is the case study: how much does the overlay cost itself?

### Hypothesis

The first implementation drove the visible metrics via a conventional React pattern:

```ts
// Before
useAnimatedReaction(
  () => fpsLabel.value,
  (value) => { runOnJS(setFpsText)(value); },
);
// + same pattern for bad frames and JS-busy
```

That triggers:

- **One `setState` per second** for FPS (each `useAnimatedReaction → runOnJS → setState` fires once per FPS publish).
- **One `setState` per bad frame** for the bad-frame counter — clustered during janky scroll, this can fire many times per second.
- **One `setState` per JS-busy flip** — usually rare, but unbounded if the JS thread is genuinely thrashing.
- **Permanent mount** of the panel with `opacity: 0` when "hidden", so all three reactions keep firing.

In aggregate: the overlay does measurable React work *exactly when* the system is most stressed (during jank bursts) — the opposite of what you want from instrumentation.

### Fix

- FPS, bad-frame count, and JS-busy label bind directly to shared values via `Animated.createAnimatedComponent(TextInput)` + `useAnimatedProps`. Text content updates on the UI thread, no React render.
- `jsBusy.value` writes are guarded — only assigned when the boolean actually flips.
- Panel is conditionally mounted (`{isMetricsVisible && …}`) — all animated reactions and the summary `setInterval` unmount when hidden.

Commit: [`cb21724`](#) — _Story 3.1–3.5: perf overlay (FPS, bad frames, JS busy, p50/p95)_

### Capture protocol — before/after

To capture "before," temporarily revert `PerfOverlay.tsx` to the `useState` + `useAnimatedReaction` pattern. The simplest path: check out the file at its first staged state and re-run §2's capture protocol.

```bash
# Capture "after" first (current code)
npm run ios -- --configuration Release
# Run §2 capture protocol with the overlay panel OPEN throughout. Record p50/p95.

# Save the after-state and switch to before-state
git stash -- src/components/perf/PerfOverlay.tsx src/components/perf/fpsSampler.ts
# Hand-revert PerfOverlay.tsx to the useState pattern (re-add fpsText/badFrameText/jsBusyText
# state + the three useAnimatedReaction blocks; render the panel unconditionally).
# (Or: cherry-pick from a local branch where you preserved the original.)

# Capture "before"
npm run ios -- --configuration Release
# Run §2 capture protocol with the overlay panel OPEN throughout. Record p50/p95.

# Restore
git checkout -- src/components/perf/PerfOverlay.tsx src/components/perf/fpsSampler.ts
git stash pop  # if you stashed other work
```

Run two captures for each version (the variance on simulator FPS is non-trivial) and report medians.

### Results

| Scenario                                   | p50 (ms)    | p95 (ms)    | Worst (ms)  | Bad frames / 60 s |
| ------------------------------------------ | ----------- | ----------- | ----------- | ----------------- |
| Overlay closed (baseline)                  | **TODO**    | **TODO**    | **TODO**    | **TODO**          |
| Overlay open — `useState` pattern (before) | **TODO**    | **TODO**    | **TODO**    | **TODO**          |
| Overlay open — shared-value bind (after)   | **TODO**    | **TODO**    | **TODO**    | **TODO**          |

**TODO** (post-capture): one sentence summarizing the delta. If `after` is within ~1 FPS of the closed baseline, NFR2 is satisfied — the overlay no longer measurably distorts what it's measuring.

---

## 4. Honest trade-off — per-frame `runOnJS` while a session is open

The ring buffer lives on the JS thread, and the worklet pushes samples via `runOnJS(commitSample)(timeSincePreviousFrame)` for every frame while a session is active.

- **Cost** — one JS-bridge dispatch per frame, ≈ 60/s. With JSI this is cheap (a single number argument, no serialization), but it is non-zero. Estimated ≤ 0.1 ms/frame of JS-thread time on a modern device — meaningful only if the JS thread is *already* close to saturated.
- **Alternative considered** — keep the ring buffer in a `useSharedValue<number[]>` and mutate it in the worklet directly. That avoids the runOnJS entirely. But Reanimated 3 does not reliably propagate array-element mutations between runtimes: `getSummaryStats` on the JS thread would read stale or zero values. p50/p95 would silently report wrong numbers.
- **What we chose** — pay the per-frame dispatch cost, *but only while a session is active*. When the session is stopped, the `if (sessionActive.value) { runOnJS(...) }` branch is skipped on the UI thread — zero overhead. The user explicitly opts into the cost by tapping **Start session**, and the overlay's own self-measurement (§3) is captured with the session *closed* so it doesn't double-count.

The trade is: correctness over a marginal idle saving, accepting a small known cost when measurement is explicitly active.

---

## 5. Known limitations of the measurement

- **Simulator ≠ device.** All numbers here are from a host simulator/emulator. Real-device FPS is the truth; simulator FPS is a proxy capped by the host (often ProMotion 120 Hz capable iOS sims will report higher than a target device). For a hiring artifact this is acceptable per FR4.3 (recording on emulator); for production-readiness, repeat on a mid-range Android.
- **No JS-thread FPS, only JS-busy.** `useFrameCallback` measures the UI thread. The JS-thread frame rate isn't separately surfaced — the JS-busy indicator catches the failure mode (long tasks) without claiming to report a JS-thread FPS number. A second RAF tick-rate counter is a one-evening add if needed.
- **Sample window is 60 s.** Longer sessions wrap and overwrite; the ring buffer is fixed-size to match the spec exactly. p50/p95 are over the most recent ≤ 3600 samples.

---

## See also

- [`README.md`](./README.md) — setup, state management rationale, broader limitations
- [`requirements.md`](./requirements.md) — FR/NFR breakdown
- [`src/components/perf/fpsSampler.ts`](./src/components/perf/fpsSampler.ts) — the sampler hook
- [`src/components/perf/PerfOverlay.tsx`](./src/components/perf/PerfOverlay.tsx) — the visible panel
