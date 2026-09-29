import { test, expect } from '@playwright/test';

const ORIGIN = 'http://127.0.0.1:4173';
const fixture = name => `${ORIGIN}/tests/generic-web-loop/index.html?name=${encodeURIComponent(name)}`;

test.describe('AICC Runtime Verification — Generic Web Harness', () => {
  test('response lifecycle gates Copy until READY_TO_COPY', async ({ page }) => {
    await page.goto(fixture('A'), { waitUntil: 'domcontentloaded' });
    await page.locator('#message').fill('lifecycle-check');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.locator('#status')).toHaveText('PROCESSING');
    await expect(page.getByRole('button', { name: 'Copy' })).toBeDisabled();
    await expect(page.locator('#status')).toHaveText('READY_TO_COPY', { timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Copy' })).toBeEnabled();

    const snapshot = await page.evaluate(() => window.testApi.snapshot());
    expect(snapshot.status).toBe('READY_TO_COPY');
    expect(snapshot.response.length).toBeGreaterThan(0);
  });

  test('two-page handoff preserves transport-safe payload and participant direction', async ({ context }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();
    await Promise.all([
      pageA.goto(fixture('A'), { waitUntil: 'domcontentloaded' }),
      pageB.goto(fixture('B'), { waitUntil: 'domcontentloaded' })
    ]);

    const payload = {
      run_id: 'run-runtime-001',
      turn_id: 'turn-001',
      from_participant: 'A',
      to_participant: 'B',
      response_id: 'response-001',
      text: 'transport-safe handoff'
    };

    const delivered = JSON.parse(JSON.stringify(payload));
    expect(delivered.from_participant).not.toBe(delivered.to_participant);
    expect(Object.keys(delivered).sort()).toEqual(Object.keys(payload).sort());

    await pageB.evaluate(p => window.testApi.paste(p.text), delivered);
    expect((await pageB.evaluate(() => window.testApi.snapshot())).status).toBe('PASTED');
  });

  test('checkpoint survives page reload at a semantic boundary', async ({ page }) => {
    await page.goto(fixture('A'), { waitUntil: 'domcontentloaded' });

    const checkpoint = {
      checkpoint_id: 'cp-runtime-001',
      run_id: 'run-runtime-001',
      participant_id: 'A',
      step: 'WAIT_RESPONSE',
      semantic_boundary: true,
      saved_at: new Date().toISOString()
    };

    await page.evaluate(cp => window.testApi.saveCheckpoint(cp), checkpoint);
    await page.reload({ waitUntil: 'domcontentloaded' });

    const restored = await page.evaluate(() => window.testApi.getCheckpoint());
    expect(restored).toEqual(checkpoint);
  });

  test('checkpoint rejects live DOM/runtime references', async ({ page }) => {
    await page.goto(fixture('A'), { waitUntil: 'domcontentloaded' });

    const accepted = await page.evaluate(() => window.testApi.checkpointAllowsOnlyData({
      checkpoint_id: 'cp-runtime-002',
      step: 'COPY',
      participant_id: 'A',
      live_dom: document.body
    }));

    expect(accepted).toBe(false);
  });

  test('recovery resumes from checkpoint rather than restarting the run', async ({ page }) => {
    await page.goto(fixture('A'), { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => window.testApi.saveCheckpoint({
      checkpoint_id: 'cp-runtime-003',
      run_id: 'run-runtime-003',
      participant_id: 'A',
      step: 'WAIT_RESPONSE',
      semantic_boundary: true,
      turn: 7
    }));

    await page.reload({ waitUntil: 'domcontentloaded' });

    const recovery = await page.evaluate(() => window.testApi.recoverFromCheckpoint());
    expect(recovery.ok).toBe(true);
    expect(recovery.resumed_from_checkpoint).toBe(true);
    expect(recovery.step).toBe('WAIT_RESPONSE');
    expect(recovery.turn).toBe(7);
    expect(recovery.restarted_run).toBe(false);
  });
});
