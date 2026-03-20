import { test, expect } from '@playwright/test';
import { generateTestData } from './fixtures';

test.describe('Dashboard Tab (browser e2e)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="drop-zone"], text=Drop .jsonl', { timeout: 10000 });
  });

  test('loads the app with drop zone', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toContain('Drop');
  });

  test('loads JSONL data via file input', async ({ page }) => {
    const data = generateTestData(16);
    const blob = Buffer.from(data, 'utf-8');

    // Create a DataTransfer-compatible file upload
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count()) {
      await fileInput.setInputFiles({
        name: 'test.jsonl',
        mimeType: 'application/x-jsonlines',
        buffer: blob,
      });
      // Wait for data to load
      await page.waitForTimeout(1000);
      const body = await page.textContent('body');
      // Should show some rollout data
      expect(body!.length).toBeGreaterThan(100);
    }
  });

  test('dashboard tab renders sections after data load', async ({ page }) => {
    const data = generateTestData(16);
    const blob = Buffer.from(data, 'utf-8');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count()) {
      await fileInput.setInputFiles({
        name: 'test.jsonl',
        mimeType: 'application/x-jsonlines',
        buffer: blob,
      });
      await page.waitForTimeout(1500);

      // Click dashboard tab if present
      const dashTab = page.getByText('Dashboard', { exact: false });
      if (await dashTab.count()) {
        await dashTab.first().click();
        await page.waitForTimeout(500);

        // Should see section headers
        const body = await page.textContent('body');
        expect(body).toContain('Charts');
        expect(body).toContain('Rollouts');
      }
    }
  });

  test('sections are collapsible', async ({ page }) => {
    const data = generateTestData(16);
    const blob = Buffer.from(data, 'utf-8');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count()) {
      await fileInput.setInputFiles({
        name: 'test.jsonl',
        mimeType: 'application/x-jsonlines',
        buffer: blob,
      });
      await page.waitForTimeout(1500);

      const dashTab = page.getByText('Dashboard', { exact: false });
      if (await dashTab.count()) {
        await dashTab.first().click();
        await page.waitForTimeout(500);

        // Find a section header with "Charts" and click to collapse
        const chartsHeader = page.locator('button', { hasText: 'Charts' }).first();
        if (await chartsHeader.count()) {
          // Check that chart cards are visible
          const svgsBefore = await page.locator('svg').count();
          expect(svgsBefore).toBeGreaterThan(0);

          await chartsHeader.click();
          await page.waitForTimeout(200);

          // After collapse, fewer SVGs should be visible
          const svgsAfter = await page.locator('svg').count();
          expect(svgsAfter).toBeLessThan(svgsBefore);
        }
      }
    }
  });

  test('view and type sections render per-category charts', async ({ page }) => {
    const data = generateTestData(16);
    const blob = Buffer.from(data, 'utf-8');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count()) {
      await fileInput.setInputFiles({
        name: 'test.jsonl',
        mimeType: 'application/x-jsonlines',
        buffer: blob,
      });
      await page.waitForTimeout(1500);

      const dashTab = page.getByText('Dashboard', { exact: false });
      if (await dashTab.count()) {
        await dashTab.first().click();
        await page.waitForTimeout(500);

        const body = await page.textContent('body');
        // Should have view breakdowns
        expect(body).toContain('view:');
        // Should have type breakdowns
        expect(body).toContain('type:');
      }
    }
  });

  test('sparkline charts render SVG paths', async ({ page }) => {
    const data = generateTestData(16);
    const blob = Buffer.from(data, 'utf-8');

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count()) {
      await fileInput.setInputFiles({
        name: 'test.jsonl',
        mimeType: 'application/x-jsonlines',
        buffer: blob,
      });
      await page.waitForTimeout(1500);

      const dashTab = page.getByText('Dashboard', { exact: false });
      if (await dashTab.count()) {
        await dashTab.first().click();
        await page.waitForTimeout(500);

        // Check SVG paths exist (sparklines)
        const paths = await page.locator('svg path').count();
        expect(paths).toBeGreaterThan(0);

        // Check data point circles exist
        const circles = await page.locator('svg circle').count();
        expect(circles).toBeGreaterThan(0);
      }
    }
  });
});
