# Generic Web Controller Test Report

Date: 2026-09-28

## Scope

First integration test before attaching any GPT/Gemini-specific adapter.

Tested components:
- Generic Controller Shadow DOM UI
- Full-screen transparent interaction shield
- Floating menu
- Menu sizing
- Status font sizing
- Processing/status overlay
- Checkpoint state
- Generic Web Runtime Adapter
- Response processing -> ready -> native Copy flow
- Capture verification
- Lock/unlock behavior

## Browser Test

Runtime: Chromium 144 headless via Chrome DevTools Protocol.

Target: ordinary public web page (example.com) with a controlled generic text-web fixture injected into the page.

Result: PASS

Verified:
1. Controller host and Shadow DOM mounted.
2. Floating menu rendered.
3. Status font range accepts 8px and 50px.
4. Menu size range accepts configured minimum and maximum.
5. Starting a workflow activates the blocking shield.
6. Underlying page interaction was blocked while the shield was active.
7. Stopping the workflow removed the shield and restored page interaction.
8. Checkpoint retained the current semantic step.
9. Processing elapsed display rendered 00:05 correctly.
10. Generic workflow waited while the response was processing.
11. Copy remained unavailable while processing.
12. Workflow captured only after Copy became actionable.
13. Native Copy action was invoked.
14. Capture verification succeeded.
15. Final workflow result was CAPTURED.

## Syntax Test

- aicc-generic-controller.js: PASS
- aicc-generic-workflow.js: PASS

## Not Yet Tested

- GPT adapter
- Gemini adapter
- Real browser tab handoff
- Real page refresh/recovery
- Saved Web Pair persistence
- Production userscript packaging

These remain intentionally outside the first generic-web validation phase.

## Custom Click Pattern Layer

Implemented in commit sequence on branch `test/generic-controller-ui`.

- Added `tests/generic-web/aicc-generic-click-patterns.js`.
- Added a separate menu section: **รูปแบบการกดอัตโนมัติ**.
- Supports target recording, pattern name, click interval in milliseconds, click count, save, select, and run.
- Target resolution is semantic-first; stored viewport position is metadata/fallback only.
- Target is re-resolved and scrolled into view before each click.
- Missing or disabled targets fail the pattern instead of blindly clicking.
- Generic test page now contains a dedicated target button and click counter.

**Test status for this new layer: IMPLEMENTED / browser execution pending.**


## Separate Screen-Position Pattern

Implemented as a separate pattern family from the DOM/semantic click pattern.

### Configuration
- Page mode: **single page** or **paired pages**.
- User supplies Page A URL and, when paired, Page B URL.
- Each recorded position belongs to Page A or Page B.
- Maximum: **10 screen positions per pattern**.
- Each position stores viewport coordinates plus normalized viewport ratios.
- Each position is displayed with a numbered marker; the final saved position is marked **END**.
- The pattern has the same configurable interval and repeat-count controls as the first pattern family.

### Runtime model
- Screen coordinates are intentionally separate from DOM/semantic target matching.
- `elementFromPoint()` is used to inspect the element currently underneath a saved viewport coordinate; this is appropriate for coordinate-based hit testing. citeturn0search0
- A production browser runtime can supply a native pointer-click adapter for the stored coordinates. The generic test fallback dispatches a click on the resolved element; this is not yet evidence of OS-level native pointer injection.
- Page activation for paired mode is exposed as an adapter callback rather than hard-coded to a browser/tab implementation.

### Test status
**IMPLEMENTED / browser execution pending** for the new screen-position pattern family. It must not be reported as fully PASS until recording, marker ordering, 10-position limit, single/paired page routing, interval/count execution, and native pointer-click integration are exercised.
