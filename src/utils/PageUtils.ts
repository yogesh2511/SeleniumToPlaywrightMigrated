import { Page, Locator } from '@playwright/test';
import { LoggerUtils } from './LoggerUtils';

/**
 * PageUtils – merges Java's WebElementHelper + JavaScriptUtils + WaitUtils.
 *
 * In Playwright, explicit waits are built into every action (auto-wait),
 * so most Selenium wait wrappers are replaced with Playwright's native
 * locator methods. This utility adds helpers for edge-cases.
 */
export class PageUtils {
  private readonly page: Page;
  private readonly defaultTimeout: number;

  constructor(page: Page, defaultTimeout = 30_000) {
    this.page = page;
    this.defaultTimeout = defaultTimeout;
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.defaultTimeout });
    LoggerUtils.info(`Navigated to: ${url}`);
  }

  // ─── Wait Utilities (replaces WaitUtils.java) ────────────────────────────

  /** Wait for a locator to be visible – replaces waitForElementVisible */
  async waitForVisible(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: this.defaultTimeout });
  }

  /** Wait for a locator to be clickable – replaces waitForElementClickable */
  async waitForClickable(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: this.defaultTimeout });
  }

  /** Wait for element to disappear – replaces waitForElementToDisappear */
  async waitForHidden(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout: this.defaultTimeout });
  }

  /** Wait for page title – replaces WaitUtils.waitForPageTitle */
  async waitForTitle(expectedTitle: string): Promise<void> {
    await this.page.waitForFunction(
      (title) => document.title === title,
      expectedTitle,
      { timeout: this.defaultTimeout }
    );
  }

  /** Check element is present – replaces WaitUtils.isElementPresent */
  async isPresent(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'attached', timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  }

  // ─── JavaScript Utilities (replaces JavaScriptUtils.java) ────────────────

  /** Scroll element into view – replaces JavaScriptUtils.scrollToElement */
  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /** Scroll to top of page */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  /** Scroll to bottom of page */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  /**
   * JS click – replaces JavaScriptUtils.clickElement.
   * Use when normal click is blocked by overlays.
   */
  async jsClick(locator: Locator): Promise<void> {
    await locator.evaluate((el) => (el as HTMLElement).click());
    LoggerUtils.debug('JS click executed');
  }

  /**
   * JS enter text – replaces JavaScriptUtils.enterText.
   * Sets value directly on the DOM element.
   */
  async jsEnterText(locator: Locator, text: string): Promise<void> {
    await this.scrollToElement(locator);
    await locator.evaluate((el, val) => {
      (el as HTMLInputElement).focus();
      (el as HTMLInputElement).value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, text);
    LoggerUtils.debug(`JS enterText: "${text}"`);
  }

  // ─── Cookies Pop-up Handler (replaces WebElementHelper.cookiesHandler) ───

  /**
   * Dismisses the "Accept All Cookies" popup if present.
   * Uses soft-failure: logs and continues if not found.
   */
  async handleCookies(): Promise<void> {
    try {
      const cookieBtn = this.page.locator(':text("Accept All Cookies")').first();
      if (await this.isPresent(cookieBtn)) {
        await cookieBtn.click({ timeout: 5_000 });
        LoggerUtils.info('Cookie consent accepted.');
      } else {
        LoggerUtils.info('Cookie consent not displayed or already accepted.');
      }
    } catch (e) {
      LoggerUtils.warn(`Cookie handler failed: ${String(e)}`);
    }
  }

  // ─── Multi-Window / Tab Utilities (replaces WebElementHelper) ────────────

  /**
   * Wait for a new page/tab to open and return it.
   * Replaces Java's switchTo().window() with window handle iteration.
   */
  async waitForNewPage(): Promise<Page> {
    return new Promise((resolve) => {
      this.page.context().once('page', (newPage: Page) => resolve(newPage));
    });
  }

  /**
   * Close all pages except the original one.
   * Replaces WebElementHelper.closeAllChildWindows.
   */
  async closeAllChildPages(): Promise<void> {
    const allPages = this.page.context().pages();
    for (const p of allPages) {
      if (p !== this.page) {
        await p.close();
        LoggerUtils.info('Closed child page/tab.');
      }
    }
  }

  /**
   * Switch focus to a new tab and wait for URL/title to stabilize.
   * Replaces WebElementHelper.switchToWindowWithRedirect + waitForRedirectToComplete.
   */
  async switchToNewTabAndWait(expectedTitle: string): Promise<Page> {
    const newPage = await this.waitForNewPage();
    await newPage.waitForLoadState('domcontentloaded');

    // Poll until URL stabilizes (replaces Thread.sleep loop)
    let previousUrl = '';
    for (let i = 0; i < 10; i++) {
      const currentUrl = newPage.url();
      if (currentUrl === previousUrl) break;
      previousUrl = currentUrl;
      await newPage.waitForTimeout(500);
    }

    await newPage.waitForFunction(
      (title) => document.title === title,
      expectedTitle,
      { timeout: 15_000 }
    );

    LoggerUtils.info(`Switched to new tab. Title: ${await newPage.title()}`);
    return newPage;
  }
}
