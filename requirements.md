# Crew | SDE3 RN — Requirements Breakdown

Source: `CREW_SDE3_RN-Hiring.pdf`
Timeline: **3–4 days**

---

## Functional Requirements

### FR1 — Trip Discovery Feed (Screen 1)
- **FR1.1** Vertically scrolling feed of **100+ travel bundle cards** (flights+stays, villas, experiences).
- **FR1.2** Data sourced from a **local mocked JSON file** (no real API), with a **simulated loading delay**.
- **FR1.3** Each card displays:
  - Remote hero image
  - Destination name
  - Trip type badge (e.g. "Flight + Stay", "Villa", "Experience")
  - Price
  - Duration
  - Star rating
- **FR1.4** Each card has an **expandable "Details" section**; tapping it reveals a **nested horizontal scroll** with 3–4 day-by-day highlights (text + icon only, no images).
- **FR1.5** Images load from **remote URLs only** with **explicit width/height declared**, with a **low-fidelity placeholder** while loading.
- **FR1.6** Demonstrate **image caching** with placeholder images.
- **FR1.7** A **Floating Action Button (FAB)** opens the AI bottom sheet **without unmounting or re-rendering the feed**.

### FR2 — Ask Crew AI Bottom Sheet (Screen 2)
- **FR2.1** Bottom sheet **slides over the feed** while the feed remains live and scrollable behind it.
- **FR2.2** Two snap points — **half-height (peek)** and **full-height** — draggable between both.
- **FR2.3** Chat interface for trip-planning queries.
- **FR2.4** AI responses appear **token-by-token (progressive)**. Per the Technical Constraints table, the PDF *allows* mocked AI responses with a delay (no real streaming required), so the simplest compliant path is a mocked progressive reveal; using the Anthropic API for true streaming is the stretch option.
- **FR2.5** **Chat history preserved** across open/close cycles for the **session lifetime**.
- **FR2.6** **Keyboard-aware input** field — rises with the keyboard when sheet is at full height.
- **FR2.7** **Loading indicator** between the user message and the first response token.

### FR3 — Performance Overlay Component
- **FR3.1** **Built from scratch** — must NOT use React Native's developer menu.
- **FR3.2** Toggled via a **floating button**.
- **FR3.3** **Live FPS display**.
- **FR3.4** **Frame drop counter** — increments each time a frame falls below 45 FPS.
- **FR3.5** **JS thread busy indicator** — shows when the JS thread is blocked.
- **FR3.6** **Session summary**: p50 frame time, p95 frame time, single worst frame recorded.

### FR4 — Deliverables (artifact-level functional requirements)
- **FR4.1** `README.md` — setup instructions, state management rationale, known limitations.
- **FR4.2** `PERFORMANCE.md` — FPS methodology, ≥1 bottleneck with before/after evidence, p50 + p95 from a 60-second scroll session, one honest trade-off.
- **FR4.3** **2–3 minute screen recording** — feed scrolling with the overlay active AND the chat bottom sheet in use, simultaneously.
- **FR4.4** Public **GitHub repository**.

---

## Non-Functional Requirements

### NFR1 — Performance Targets
| Interaction | Target |
|---|---|
| Feed idle scroll | **≥58 FPS** on a mid-range Android device or simulator |
| Bottom sheet open/close animation | **Zero** frame drops below 45 FPS |
| Card expand/collapse | **≥55 FPS** throughout the full animation |
| AI streaming + list scroll simultaneously | **No visible jank** on either surface |
| 100-item feed continuous scroll | Virtualisation must **not** drop below **55 FPS** |

### NFR2 — Threading & Responsiveness
- Bottom sheet **gesture animation** and **feed scroll** must both run on the **UI thread simultaneously**.
- Opening/closing the sheet must produce **no visible jank** on the feed behind it.
- The performance overlay itself must **not meaningfully impact** the FPS it is measuring.

### NFR3 — Technical Stack Constraints
| Area | Requirement |
|---|---|
| Starting point | **Expo project v54+** |
| Navigation | **Expo Router** |
| State management | Your choice — **must be justified** in README |
| AI model | Mocked responses with delay acceptable (no real streaming required) |
| Feed data | Local JSON file + mock loading delay |
| Images | Remote URLs only — **no bundled local images** |

### NFR4 — Code Quality / Engineering Posture
- Demonstrate ability to **reason about performance** (where bottlenecks come from and how to fix them).
- Instrumentation must be production-useful — overlay should be something you'd "actually leave on while debugging."
- Submission is reviewed primarily through the **performance lens**, not feature count.

### NFR5 — Timeline
- **3–4 days** to complete.
