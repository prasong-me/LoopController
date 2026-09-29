import { test, expect } from '@playwright/test';

const ORIGIN = 'http://127.0.0.1:4173';
const fixture = () => `${ORIGIN}/tests/generic-web/index.html`;

async function load(page) {
  await page.goto(fixture(), { waitUntil: 'domcontentloaded' });
}

test.describe('AICC Pattern Verification — Generic Web Harness', () => {
  test('semantic/DOM pattern records, persists, resolves, and executes', async ({ page }) => {
    await load(page);

    const result = await page.evaluate(() => {
      window.domPatternTest = new AICCCustomClickPatterns({ controller: null });
      window.domPatternTest.arm();
      return { armed: window.domPatternTest.recording };
    });
    expect(result.armed).toBe(true);

    await page.locator('#patternTarget').click();

    const state = await page.evaluate(() => ({
      recording: window.domPatternTest.recording,
      saved: window.domPatternTest.lastTarget || null
    }));
    expect(state.recording).toBe(false);
    expect(state.saved).toBeTruthy();

    const execution = await page.evaluate(async () => {
      const pattern = window.domPatternTest.add('DOM verification', { intervalMs: 0, count: 3 });
      return { pattern, result: await window.domPatternTest.run(pattern) };
    });

    expect(execution.result.ok).toBe(true);
    expect(execution.result.clicks).toBe(3);
    expect(await page.locator('#patternClicks').textContent()).toBe('3');
  });

  test('screen-position pattern records ordered coordinates and enforces ten-point maximum', async ({ page }) => {
    await load(page);

    await page.evaluate(() => {
      window.screenPatternTest = new AICCScreenClickPatterns({ controller: null });
      window.screenPatternTest.startNew('A');
      window.screenPatternTest.arm('A');
    });

    const target = page.locator('#screenTarget1');
    const box = await target.boundingBox();
    if (!box) throw new Error('screenTarget1 has no bounding box');

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    const point = await page.evaluate(() => window.screenPatternTest.currentPoints[0]);
    expect(point.order).toBe(1);
    expect(point.page).toBe('A');
    expect(point.xRatio).toBeGreaterThanOrEqual(0);
    expect(point.xRatio).toBeLessThanOrEqual(1);
    expect(point.yRatio).toBeGreaterThanOrEqual(0);
    expect(point.yRatio).toBeLessThanOrEqual(1);

    const max = await page.evaluate(() => {
      const p = window.screenPatternTest;
      p.startNew('A');
      for (let i = 0; i < 10; i++) p.currentPoints.push({
        order: i + 1, page: 'A', x: 1, y: 1, xRatio: 0.01, yRatio: 0.01
      });
      try {
        p.arm('A');
        return { rejected: false, recording: p.recording };
      } catch (error) {
        return { rejected: true, message: String(error.message) };
      }
    });

    expect(max.rejected).toBe(true);
    expect(max.message).toContain('Maximum 10');
  });

  test('screen-position paired pattern retains page routing metadata', async ({ page }) => {
    await load(page);

    const pattern = await page.evaluate(() => {
      const p = new AICCScreenClickPatterns({ controller: null });
      p.startNew('A');
      p.currentPoints = [
        { order: 1, page: 'A', x: 10, y: 10, xRatio: 0.1, yRatio: 0.1 },
        { order: 2, page: 'B', x: 20, y: 20, xRatio: 0.2, yRatio: 0.2 }
      ];
      return p.save('paired verification', {
        pageMode: 'paired',
        pageAUrl: 'https://example.invalid/a',
        pageBUrl: 'https://example.invalid/b',
        intervalMs: 0,
        count: 2
      });
    });

    expect(pattern.pageMode).toBe('paired');
    expect(pattern.points).toHaveLength(2);
    expect(pattern.points.map(p => p.page)).toEqual(['A', 'B']);
    expect(pattern.points.at(-1).end).toBe(true);
  });
});
