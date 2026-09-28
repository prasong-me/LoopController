import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

test('TC-RUNTIME-NATIVE-COPY-001 — native Copy + OS clipboard readback', async ({ page, context }, testInfo) => {
  test.skip(
    process.env.AICC_NATIVE_COPY_RUNTIME !== '1',
    'Native Copy Gate requires an explicitly enabled real-browser runtime run; ordinary CI/headless runs are not gate evidence.'
  );

  const origin = 'http://127.0.0.1:4173';
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });

  await page.goto(origin + '/tests/generic-web-loop/index.html?name=A', { waitUntil: 'domcontentloaded' });

  const runtime = await page.evaluate(() => ({
    browser: navigator.userAgent,
    secureContext: window.isSecureContext,
    clipboardAvailable: !!navigator.clipboard,
    userActivationApi: !!navigator.userActivation
  }));

  expect(runtime.secureContext).toBe(true);
  expect(runtime.clipboardAvailable).toBe(true);
  expect(runtime.userActivationApi).toBe(true);

  const message = 'native-copy-gate-' + Date.now();
  await page.locator('#message').fill(message);
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.locator('#status')).toHaveText('READY_TO_COPY', { timeout: 5000 });
  const expectedPayload = await page.locator('#response').textContent();
  expect(expectedPayload).toBeTruthy();

  const copyButton = page.getByRole('button', { name: 'Copy' });
  await expect(copyButton).toBeEnabled();

  // Browser automation input is evidence of the browser path, not a human-interaction claim.
  // The test uses the real fixture Copy control and never uses HTMLElement.click(),
  // dispatchEvent(), or a clipboard shortcut.
  await copyButton.click();

  await expect(page.locator('#status')).toHaveText('COPIED', { timeout: 5000 });
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  const trace = await page.evaluate(() => window.testApi.getCopyTrace());

  const copyClick = trace.find(item => item.phase === 'COPY_CLICK');
  const writeResolved = trace.find(item => item.phase === 'CLIPBOARD_WRITE_RESOLVED');

  expect(copyClick).toBeTruthy();
  expect(copyClick.isTrusted).toBe(true);
  expect(copyClick.userActivation).toBe(true);
  expect(writeResolved).toBeTruthy();
  expect(clipboardText).toBe(expectedPayload);

  const evidence = {
    testCase: 'TC-RUNTIME-NATIVE-COPY-001',
    timestamp: new Date().toISOString(),
    inputSource: 'playwright-browser-automation',
    humanInteractionClaim: false,
    url: page.url(),
    runtime,
    permissionPreparation: ['clipboard-read', 'clipboard-write'],
    expectedPayload,
    clipboardText,
    exactMatch: clipboardText === expectedPayload,
    copyClick,
    writeResolved,
    status: await page.locator('#status').textContent()
  };

  await testInfo.attach('native-copy-evidence.json', {
    body: JSON.stringify(evidence, null, 2),
    contentType: 'application/json'
  });

  await fs.mkdir('test-results', { recursive: true });
  await fs.writeFile('test-results/native-copy-evidence.json', JSON.stringify(evidence, null, 2));

  expect(evidence.exactMatch).toBe(true);
});
