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
