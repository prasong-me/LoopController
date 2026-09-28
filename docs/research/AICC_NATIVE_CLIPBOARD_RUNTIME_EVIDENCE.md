# AICC Runtime Research — Native Clipboard Evidence

> Status: RESEARCH CAPTURED
> Date: 2026-09-29
> Scope: Runtime Verification Gate / Native Copy Gate
> Project: AICC (AI Conversation Controller)

## Purpose

This document captures externally verified browser/standards evidence needed for the AICC Native Copy Gate. It is research evidence, not runtime PASS evidence.

## Evidence Sources

### 1. MDN — Clipboard API
https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API

Key points:
- The Clipboard API provides asynchronous read/write access to the system clipboard.
- Clipboard access is restricted by secure-context and browser security requirements.
- Reading commonly depends on transient user activation, browser permissions, focus, or browser-specific prompts.
- Browser implementations differ; Chromium, Firefox, and Safari do not expose identical permission behavior.

### 2. MDN — Clipboard.writeText()
https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText

Key points:
- navigator.clipboard.writeText() writes text to the system clipboard.
- It requires a secure context.
- Access may be rejected with NotAllowedError.
- The API resolves after the clipboard has been updated.

### 3. MDN — Clipboard.readText()
https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText

Key points:
- navigator.clipboard.readText() reads textual data from the system clipboard.
- It requires a secure context.
- Access may fail with NotAllowedError or NotFoundError.
- A successful read returns the current textual clipboard contents.

### 4. W3C — Clipboard API and Events
https://www.w3.org/TR/clipboard-apis/

Current published technical reference reviewed: 2026-06-24 Working Draft.

Key points:
- The system clipboard is an OS-level data store exposed through browser APIs.
- Synthetic clipboard events do not modify the real system clipboard.
- A synthetic copy event must not be treated as proof that the OS clipboard changed.
- Clipboard access is a security-sensitive capability.
- The specification distinguishes trusted user-agent/user-interface actions from synthetic script-generated events.
- Clipboard read/write operations are permission/activation controlled.
- The specification explicitly models transient activation and clipboard permissions.

## AICC Evidence Rules Derived From Sources

1. AICC Native Copy evidence must distinguish:
   - Copy action requested/executed
   - Browser/runtime evidence that the real clipboard changed
   - Clipboard readback evidence
   - Captured payload equality

2. A synthetic dispatchEvent(new ClipboardEvent(...)) is not sufficient evidence of a real OS clipboard update.

3. A mock clipboard is not sufficient for Native Copy Gate PASS.

4. navigator.clipboard.readText() is evidence about the actual browser-accessible system clipboard only when executed in the real browser runtime under the browser's actual security/activation conditions.

5. Permission APIs must not be assumed to behave identically across browsers. Runtime preparation must document the actual browser and observed behavior.

6. The test must record the execution environment and the exact evidence path used for the clipboard assertion.

## AICC Native Copy Gate — Required Evidence

Minimum evidence package:

- Real browser runtime
- Real target page/fixture
- Actual native Copy control/action
- No mock clipboard
- No synthetic clipboard event used as the proof of copy
- Clipboard readback from the browser runtime when permitted
- Expected payload
- Actual captured payload
- Exact equality result
- Timestamped execution trace
- Browser/runtime version
- Security-context state
- Activation/permission conditions
- PASS / FAIL / BLOCKED decision

## Current Project Interpretation

The repository evolution ledger already records that Native Copy source logic exists but native/runtime evidence remains incomplete.

Therefore:

Native Copy Gate = RUNTIME VERIFICATION PENDING

A server-side Node.js/headless test that cannot access the real OS clipboard must remain BLOCKED for this gate; it must not be upgraded to PASS.

## Next Engineering Action

Do not create another mock clipboard harness.

Use the existing repository Browser Test Harness and execute it in a real browser runtime with actual clipboard access. Add or adapt only the minimum test/evidence code needed for the Native Copy Gate.

After runtime evidence exists, Gemini is used as Independent Reviewer / Engineering Historian to critique the evidence and identify gaps. Iris remains responsible for implementation, execution, defect fixing, and moving the project through the gate.

## External References

- MDN Clipboard API: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
- MDN Clipboard.writeText(): https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
- MDN Clipboard.readText(): https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText
- W3C Clipboard API and Events: https://www.w3.org/TR/clipboard-apis/