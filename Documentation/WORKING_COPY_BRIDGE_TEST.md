# Working Copy Bridge Test

Purpose: verify that this repository can be opened, synchronized, edited, committed, and pushed through Working Copy on iOS.

## Verification sequence

1. Clone or open `prasong-me/LoopController` in Working Copy.
2. Checkout branch `test/working-copy-bridge`.
3. Open this file.
4. Change the line below.
5. Commit the change locally.
6. Push the branch.
7. Confirm the new commit appears on GitHub.

## Mutable test value

CHANGE-ME

## Expected result

A commit containing the edited `CHANGE-ME` value is visible on the `test/working-copy-bridge` branch.

This file is isolated under Documentation and does not modify application source code.
