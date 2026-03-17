import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class ScreenshotMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private screenshotDir: string;
  private counter = 0;

  constructor(private page: Page, baseDir: string = './e2e-screenshots') {
    this.screenshotDir = path.join(baseDir, `run-${Date.now()}`);
    fs.mkdirSync(this.screenshotDir, { recursive: true });
  }

  start() {
    this.intervalId = setInterval(async () => {
      try {
        const filename = `screenshot-${String(this.counter++).padStart(4, '0')}.png`;
        await this.page.screenshot({
          path: path.join(this.screenshotDir, filename),
          fullPage: true
        });
      } catch (e) {
        // Page may be navigating, ignore
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  cleanup() {
    this.stop();
    if (fs.existsSync(this.screenshotDir)) {
      fs.rmSync(this.screenshotDir, { recursive: true, force: true });
    }
  }

  getScreenshotDir() {
    return this.screenshotDir;
  }
}
