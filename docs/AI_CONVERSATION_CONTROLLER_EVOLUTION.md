# AI Conversation Controller — Implementation Evolution & Defect Ledger

> Repository: `prasong-me/LoopController`
> Branch: `test/generic-controller-ui`
> Baseline: `test/ai-conversation-tampermonkey`
> Head audited: `33ad0a40224cecccc77ebfdc733e90792bf9408c`
> Branch delta: 22 commits ahead of baseline, 0 behind.
> Audit date: 2026-09-28
>
> This document records how the implementation evolved, what each relevant revision changed, what defect or limitation was discovered afterward, and whether the behavior was actually verified.
>
> Important distinction:
> - **Implemented** = source code contains the feature.
> - **Unit/Mock verified** = exercised in a simulated environment.
> - **Browser E2E verified** = exercised in a real browser page/tab.
> - **Native/runtime verified** = exercised against the actual runtime capability being claimed.
> - A later audit can downgrade an earlier PASS when its evidence is found to prove less than the contract requires.

## 1. Evolution map

```
Original GPT ↔ Gemini userscript
        ↓
Generic Web Controller test harness
        ↓
Generic workflow / readiness / copy gate
        ↓
DOM/semantic click Pattern
        ↓
Separate Screen Position Pattern
        ↓
Pattern integrated into userscript
        ↓
Generic-domain controller + controller-owned storage
        ↓
v4.1 external source supplied for audit
        ↓
Current status: implementation improved, but acceptance not yet established
```

## 2. Revision-by-revision record

### R01 — Generic Web Controller validation
**Commit:** `de1740abc85e6245a806f86a8b88f2278810a1c1`
**Message:** `test: record generic web controller validation`

**What changed**
- Added `tests/generic-web/TEST_REPORT.md`.
- Recorded the first generic-web integration test before GPT/Gemini-specific adapters.
- Covered Shadow DOM controller UI, blocking shield, floating menu, sizing, status overlay, checkpoint state, generic runtime, response processing, Copy flow and lock/unlock.
- Recorded Chromium 144 headless/CDP validation.

**Evidence at the time**
- Reported PASS for the generic fixture.
- Explicitly marked GPT, Gemini, real tab handoff, refresh/recovery, Web Pair persistence and production packaging as not yet tested.

**Later interpretation**
- This was useful as the generic UI baseline.
- It did **not** prove GPT/Gemini or real cross-tab behavior.

---

### R02 — Generic workflow harness added
**Commit:** `befc08d36c8609883f9d1e4107881ed9a561a29b`
**Message:** `test: add generic workflow harness to page`

**What changed**
- Reworked `tests/generic-web/index.html`.
- Added the generic workflow runtime to the fixture.
- Simulated response generation in multiple chunks.
- Copy remained disabled during processing and became enabled only after generation.

**Purpose**
- Establish a controlled ordinary web target where readiness and Copy behavior can be exercised independently of GPT/Gemini.

**Known limitation**
- Fixture behavior is not equivalent to a production AI site's DOM lifecycle.

---

### R03 — Semantic-first custom DOM click Pattern
**Commit:** `3d81a5bf8e6e0efa3b5dad514a68bfb8059b536c`
**Message:** `feat(generic-web): add semantic custom click pattern runtime`

**What changed**
- Added `tests/generic-web/aicc-generic-click-patterns.js`.
- Recorder captures semantic target metadata:
  - tag
  - id
  - role
  - aria-label
  - name
  - text
  - type
  - data-testid
  - viewport position metadata
- Replay resolves the target again before each click.
- Target is scrolled into view.
- Missing/disabled targets fail instead of blindly clicking.
- Added interval and repeat-count support.

**Architectural significance**
- Established Pattern as a reusable interaction primitive rather than raw coordinate storage.
- Coordinates were deliberately treated as metadata/fallback, not the primary identity.

**Later finding**
- This is a DOM locator/semantic-metadata pattern, not yet a complete intent-level semantic Pattern contract.

---

### R04 — DOM Pattern menu integrated
**Commit:** `f9182c682f4f6be070533ba995a49b58fad1f6e9`
**Message:** `feat(generic-web): add custom click pattern menu`

**What changed**
- Added Pattern controls to the generic controller UI.
- Added record, save, list/select and run operations.
- Added Pattern status messages.
- Existing controller drag and configurable font/menu size remained available.

**Later finding**
- The UI was still only an early Pattern console, not the final saved-control manager required by the broader Controller contract.

---

### R05 — DOM Pattern target fixture
**Commit:** `99e4585b07cc53f04d771c30e3c684e50550971a`
**Message:** `test(generic-web): add custom click pattern target`

**What changed**
- Added a dedicated target button and click counter to the generic test page.
- Made the DOM Pattern executable against a deterministic fixture.

**Purpose**
- Provide a concrete target for Pattern recording/replay validation.

---

### R06 — DOM Pattern report
**Commit:** `8b61d5aabe2389d629575939646876639af8074a`
**Message:** `test(generic-web): ...`

**What changed**
- Updated the generic test report for the DOM Pattern layer.
- Recorded implementation state and test scope.

**Later finding**
- Browser execution evidence for this new Pattern layer was not equivalent to full production-runtime verification.

---

### R07 — Separate Screen Position Pattern
**Commit:** `cdd48c3fbc9ef683c3376f2527a9d649b5d63fec`
**Message:** `feat(generic-web): add screen position click pattern runtime`

**What changed**
- Added `tests/generic-web/aicc-screen-click-patterns.js`.
- Deliberately separated Screen Position Pattern from DOM/semantic Pattern.
- Recorded up to 10 viewport positions.
- Stored normalized viewport ratios.
- Added marker visualization.
- Added single/paired-page metadata and repeat/interval controls.
- Added adapter hook for page activation.

**Architectural significance**
- Confirmed that screen-position automation is a distinct primitive and must not be conflated with semantic DOM targeting.

**Known limitation**
- Generic fallback dispatches DOM click; that is not OS-level native pointer injection.

---

### R08 — Screen Pattern END/native pointer hook fix
**Commit:** `105348affb39c1f9415433ce7e5dee3efa03e2c0`
**Message:** `fix(screen-pattern): mark only final position as END and allow native pointer adapter`

**What changed**
- Fixed marker semantics so only the actual final point is marked END.
- Added optional `pointerClick(x,y)` adapter.
- Preserved DOM-event fallback when native pointer adapter is absent.

**Later finding**
- Native pointer capability remained an adapter hook, not evidence that Tampermonkey itself can inject OS-level pointer input.

---

### R09 — Separate Screen Pattern UI
**Commit:** `fa414e62e19631260e60b7a2f73d85cba9921af9`
**Message:** `feat(generic-web): add separate screen position pattern menu`

**What changed**
- Added a separate UI section for Screen Position Pattern.
- Kept DOM Pattern and Screen Position Pattern visually distinct.
- Added single/paired page mode, Page A/B URL fields, interval and count controls.

**Later architectural correction**
- URL-specific Page A/B fields were later removed from the generic Pattern layer because Pattern should not be intrinsically tied to one website pair.

---

### R10 — Screen Pattern test targets
**Commit:** `a43828d2cfa557bb7ea62fdd35fbacecd2ab2f3e`
**Message:** `test(generic-web): add screen position targets`

**What changed**
- Added screen-position target elements to the generic test fixture.
- Created deterministic targets for coordinate recording/replay.

**Known limitation**
- Fixture coordinate replay is not evidence of native OS pointer input.

---

### R11 — Screen Pattern design/evidence documentation
**Commit:** `a415d714428f12e0f75417d9b453a596804fa59f`
**Message:** `docs(generic-web): record screen position pattern design`

**What changed**
- Documented Screen Position Pattern as a separate family.
- Documented maximum 10 positions.
- Documented viewport coordinates/ratios.
- Documented single/paired page concept.
- Explicitly documented that generic fallback is not OS-level native pointer injection.
- Marked browser execution as pending until recording, ordering, limits, routing, interval/count and native pointer integration are exercised.

**Important**
- This commit already established the correct evidence discipline: implementation must not be reported as fully PASS before the required runtime tests exist.

---

### R12 — Integrate Screen Pattern into main userscript
**Commit:** `d04121be608ac741f46f9324ed9c47d46471bdc1`
**Message:** `integrate screen position pattern into main userscript`

**What changed**
- Raised userscript version from 0.1.0-test to 0.2.0-test.
- Added updateURL/downloadURL.
- Integrated Screen Position Pattern into the main userscript.
- Added Pattern UI and persistence wiring.

**Defect discovered**
- Initialization order was wrong: the Pattern class was used before it was safely defined/available in the main userscript execution path.

**Result**
- Integration was not accepted as-is.

---

### R13 — Fix userscript Pattern initialization order
**Commit:** `4941d488f3a139d258f894aaa56f9b2629619f33`
**Message:** `fix userscript screen pattern initialization order`

**What changed**
- Moved/embedded the Screen Pattern implementation before its use.
- Kept Screen Position Pattern separate from the existing workflow.
- Added marker/record/replay logic directly to the userscript.
- Preserved paired-page adapter hook and local pattern storage.

**Result**
- Initialization-order defect addressed.
- Runtime E2E still required.

---

### R14 — Generalize controller across domains / controller-owned Pattern storage
**Commit:** `33ad0a40224cecccc77ebfdc733e90792bf9408c`
**Message:** `generalize controller across domains and own pattern storage`

**Major architectural change**
- Userscript renamed from GPT ↔ Gemini-specific to Generic Web.
- Version changed from 0.2.0-test to 0.3.0-test.
- `@match` changed to `*://*/*`.
- Added controller-owned `AICCStorage` using GM storage.
- Added current-context abstraction:
  - protocol
  - origin
  - hostname
  - pathname
  - href
- Screen Pattern storage moved from page `localStorage` to controller-owned GM storage.
- Added Pattern context scopes:
  - page
  - site
  - global
- Generic pages no longer exit before loading the controller.
- GPT/Gemini adapters became optional workflow participants.
- Generic pages receive controller/Pattern UI without pretending to be GPT/Gemini.
- Removed hard-coded Page A/B URL ownership from Screen Pattern UI.
- Renamed the UI concept to Interaction Pattern.

**Critical architectural significance**
- This is the point where Pattern became a generic reusable primitive and Controller became a consumer of that primitive.
- It reduced coupling between Pattern storage and target website storage.
- It moved the project toward runtime/domain agnosticism.

**Later audit findings**
- The existing workflow still contained legacy `GM_setClipboard(response, 'text')` behavior, which conflicts with the later strict Native Copy Gate requirement.
- Screen Pattern still used a coordinate replay model and did not itself prove native pointer injection.
- Full E2E after this refactor was not yet run.

---

## 3. External v4.1 revision — supplied for audit, not yet a repository revision

**Source:** v4.1 code supplied in conversation on 2026-09-28.

This version is recorded separately because it is not represented by a repository commit in the audited branch.

### Claimed fixes
- Storage abstraction with LocalStorage and Tampermonkey adapters.
- Atomic-ish checkpoint wrapper.
- Control repository CRUD methods.
- Response stability window.
- 8 readiness gates including Action Area Stability.
- Strict Native Copy verification with `navigator.clipboard.readText()`.
- Tampermonkey handoff adapter.
- AWAITING_HANDOFF state.
- Turn increment.
- DOM + screen Pattern metadata.
- Draggable console.
- Mock browser verification harness.

### Audit result
The source was **not accepted as fully verified**.

Defects found during audit:
1. The reported Native Copy empty-clipboard test does not match the supplied mock behavior: the mock Copy button writes data before `readText()`.
2. Clipboard verification in the harness is a mock clipboard, not the actual browser/OS clipboard.
3. `activateParticipant()` only calls `window.focus()`; it does not identify or activate a specific participant tab.
4. Handoff tests use an in-memory storage object, not real cross-tab Tampermonkey storage.
5. A→B→A was simulated by calling `resumeFromHandoff()`; participant B did not execute a real workflow.
6. SEND was still a log/commented mock rather than real input discovery + submission.
7. Readiness retained stale DOM references across the stability window.
8. Generation state was not revalidated after the stability window.
9. The Pattern implementation mixed DOM and screen data in one Pattern object rather than maintaining separate Pattern families.
10. DOM locator generation was still a locator strategy, not a true semantic intent model.
11. DPR was stored but not actually used during replay.
12. UI drag existed, but the broader Controller UI contract (shield, persistent position, pointer events, sizing/settings, console behavior) was not fully implemented in the supplied source.
13. Recovery/checkpoint resume behavior was not present in the supplied v4.1 source as a complete executable subsystem.
14. The reported evidence artifact was not demonstrably generated by the supplied test runner.

**Status of v4.1**
- Source improvement: **SUBSTANTIAL**
- Mock/unit evidence: **PARTIAL**
- Browser E2E evidence: **INSUFFICIENT**
- Native/cross-tab evidence: **NOT VERIFIED**
- Acceptance: **NOT ACCEPTED**

---

## 4. Defect lineage

### D01 — Response stability
**Original problem:** fixed waiting / insufficient stability semantics.
**First correction:** continuous stability window.
**Current state:** concept implemented, but must be tested against changing DOM and generation lifecycle.

### D02 — Native Copy fallback
**Original problem:** DOM text / GM clipboard fallback could falsely satisfy Copy.
**Correction:** strict `navigator.clipboard.readText()` path in v4.1.
**Current state:** production logic improved; actual browser/OS evidence still required.

### D03 — Cross-tab storage
**Original problem:** `localStorage` cannot be treated as a cross-origin participant bus.
**Correction:** introduced Tampermonkey GM storage adapter and listener abstraction.
**Current state:** adapter exists; real two-tab E2E still required.

### D04 — Participant activation
**Original problem:** no real participant/tab activation.
**Correction attempted:** `window.focus()` + handoff notification.
**Current state:** still incomplete; participant identity and real tab activation capability are not established.

### D05 — A→B→A execution
**Original problem:** state changed but second participant did not truly execute.
**Correction attempted:** AWAITING_HANDOFF + resumeFromHandoff.
**Current state:** state-machine behavior exists, but full participant execution is not proven.

### D06 — Capture data-flow
**Original problem:** captured content was returned but not propagated into context.
**Correction:** explicit `context.capturedContent` assignment before handoff.
**Current state:** source-level correction present.

### D07 — Readiness gate count
**Original problem:** claimed 8 gates but implementation previously had 7.
**Correction:** Action Area Stability added.
**Current state:** gate count now exists in v4.1, but lifecycle needs stronger re-discovery/revalidation.

### D08 — Semantic Pattern
**Original problem:** Pattern risked becoming coordinate-only automation.
**Correction:** DOM target metadata/semantic-first resolver added.
**Current state:** reusable DOM locator Pattern exists; true intent-level semantic Pattern remains to be formalized.

### D09 — Screen Pattern separation
**Original problem:** screen coordinates and DOM semantics could become conflated.
**Correction:** separate Screen Position Pattern family and separate UI.
**Current state:** architectural separation exists, but later genericization changed its context model.

### D10 — Screen Pattern END marker
**Original problem:** marker could be labelled END based on temporary array length rather than actual final state.
**Correction:** explicit `point.end` marker.
**Current state:** corrected.

### D11 — Screen Pattern native pointer
**Original problem:** DOM click fallback could be mistaken for native pointer input.
**Correction:** optional `pointerClick(x,y)` runtime adapter.
**Current state:** adapter hook only; native OS pointer behavior is not verified.

### D12 — Pattern website coupling
**Original problem:** Pattern UI stored explicit Page A/B URLs and implied website ownership.
**Correction:** generic context scopes page/site/global and controller-owned storage.
**Current state:** significantly improved; Pattern is no longer intrinsically AI-pair-specific.

### D13 — Main userscript initialization
**Original problem:** Screen Pattern class integration order was unsafe.
**Correction:** initialization-order fix.
**Current state:** source-level defect addressed.

### D14 — Evidence discipline
**Original problem:** implementation, mock test and real runtime verification were being treated too similarly.
**Correction:** this evolution ledger explicitly separates implementation from unit/mock, browser E2E and native/runtime evidence.
**Current state:** ongoing; no PASS is considered final until its claimed runtime is actually exercised.

---

## 5. Current architecture trajectory

The implementation has moved through these architectural stages:

### Stage A — AI-specific controller
```
GPT ↔ Gemini
   ↓
hard-coded web adapters
   ↓
persistent state
```

### Stage B — Generic Web test target
```
Generic Controller
   ↓
Generic Web fixture
   ↓
readiness / Copy / shield / checkpoint tests
```

### Stage C — Reusable interaction Pattern
```
Pattern
├── DOM / semantic-first locator
└── Screen position
```

### Stage D — Runtime/domain decoupling
```
Controller Core
      ↓
Runtime / participant capabilities
      ↓
Generic Web / GPT / Gemini / future runtimes
```

### Stage E — Current target architecture
```
Controller Core
 ├── Control / Workflow
 ├── Run / Checkpoint
 ├── Recovery
 ├── Participant / Handoff
 └── Policy
        ↓
Interaction Pattern Layer
 ├── DOM/Semantic Pattern
 └── Screen Position Pattern
        ↓
Runtime Adapter
 ├── Browser DOM
 ├── Tab activation
 ├── Clipboard
 ├── Native pointer
 └── Future extension/native runtimes
```

---

## 6. Evidence status at current head

| Area | Current evidence |
|---|---|
| Generic Web fixture | Browser evidence exists from earlier phase |
| Generic controller UI | Browser evidence exists from earlier phase |
| DOM Pattern implementation | Implemented; later browser execution must be re-established |
| Screen Pattern implementation | Implemented; browser/native evidence incomplete |
| GM storage abstraction | Source-level implementation exists |
| Real cross-origin tab handoff | Not established by current v4.1 evidence |
| Real participant activation | Not established |
| Real A→B→A execution | Not established by v4.1 evidence |
| Strict Native Copy | Source path improved; native runtime evidence incomplete |
| Recovery after refresh | Design exists in project history; current v4.1 supplied source does not establish full executable recovery |
| GPT adapter | Not yet accepted |
| Gemini adapter | Not yet accepted |
| Production userscript | Not accepted |
| Overall acceptance | **NOT ACCEPTED** |

---

## 7. Rules for future revisions

Every future implementation revision must record:

1. Parent commit / baseline.
2. Exact defect being addressed.
3. Files changed.
4. Behavioral contract changed.
5. Test added or modified.
6. Exact execution environment.
7. Raw test result.
8. Whether the evidence is mock, unit, browser E2E or native/runtime.
9. Known limitations.
10. Remaining defects.
11. New commit SHA.

A test report must never upgrade a mock result into native/runtime PASS without actually exercising the claimed runtime.

Git history remains the authoritative chronological record; this document is the human-readable defect/evolution index. GitHub supports comparing commits and reviewing changed files to reconstruct such evolution. citeturn0search0turn0search2
