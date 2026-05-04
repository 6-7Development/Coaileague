/**
 * Browser Automation Tool — STUB
 * ─────────────────────────────────────────────────────────────────────────────
 * Puppeteer removed from production dependencies — it caused 25-30 minute
 * Railway builds by downloading ~200MB of Chromium on every deploy.
 *
 * Trinity's screenshot/render-verify actions are development/audit features,
 * not operational. They return a graceful 'not available' response.
 *
 * PDF generation (pay stubs, DARs, UoF reports) uses pdfkit — no browser needed.
 * If browser automation is needed in future, wire it as an optional Railway addon
 * service, not a build-time dependency.
 */

import { createLogger } from '../../lib/logger';
const log = createLogger('BrowserAutomationTool');

const NOT_AVAILABLE = 'Browser automation not available in this environment. Screenshots require a separate browser service.';

interface ScreenshotResult {
  success: boolean;
  width?: number;
  height?: number;
  errorMessage?: string;
  buffer?: Buffer;
}

interface ScreenshotOptions {
  url: string;
  fullPage?: boolean;
  deviceName?: string;
}

class BrowserAutomationTool {
  async captureScreenshot(_options: ScreenshotOptions): Promise<ScreenshotResult> {
    log.info('[BrowserAutomation] Screenshot requested but browser automation is not configured');
    return { success: false, errorMessage: NOT_AVAILABLE };
  }

  async captureMultipleViewports(_url: string): Promise<ScreenshotResult[]> {
    return [{ success: false, errorMessage: NOT_AVAILABLE }];
  }

  async launchBrowser(): Promise<void> {
    log.debug('[BrowserAutomation] Browser launch skipped — not configured');
  }

  async closeBrowser(): Promise<void> {}

  async getBrowser(): Promise<null> { return null; }
}

export const browserAutomationTool = new BrowserAutomationTool();
