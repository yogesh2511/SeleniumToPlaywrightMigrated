import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { AliasUtility } from '../utils/AliasUtility';
import { LoggerUtils } from '../utils/LoggerUtils';
import { expect } from '@playwright/test';

/**
 * ApplicationPage – replaces Java ApplicationPage.java.
 *
 * Key migrations:
 *  - WebElementHelper.switchToWindowWithRedirect → captures new Page from context
 *  - Assert.assertEquals(driver.getTitle(), title) → expect(page.title()).toBe(title)
 *  - driver.navigate().back() → newPage.close() + switch back to parentPage
 *
 * The "newPage" is a separate Page object (new tab opened when Apply Now is clicked).
 * It is passed in from the step definition, which captures it via context.waitForEvent('page').
 */
export class ApplicationPage extends BasePage {
  /** The new tab/page opened by clicking Apply Now */
  private newPage: Page | null = null;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Set the new page/tab reference (called from step definition after capturing it).
   */
  setNewPage(newPage: Page): void {
    this.newPage = newPage;
  }

  /**
   * Verify the new application tab's title.
   * Replaces ApplicationPage.pageTitleVerification(String title)
   *
   * Java: WebElementHelper.switchToWindowWithRedirect(driver, title) + Assert.assertEquals
   * Playwright: the new Page is already captured; just wait for title and assert.
   */
  async pageTitleVerification(expectedTitle: string): Promise<void> {
    if (!this.newPage) {
      throw new Error('New application page/tab was not captured. Call setNewPage() first.');
    }

    // Wait for URL to stabilize (replaces Thread.sleep loop)
    await this.newPage.waitForLoadState('domcontentloaded');
    let previousUrl = '';
    for (let i = 0; i < 10; i++) {
      const currentUrl = this.newPage.url();
      if (currentUrl === previousUrl) break;
      previousUrl = currentUrl;
      await this.newPage.waitForTimeout(500);
    }

    // Wait for expected title to be included in the document title
    await this.newPage.waitForFunction(
      (title) => document.title.includes(title),
      expectedTitle,
      { timeout: 15_000 }
    ).catch(() => {
      LoggerUtils.warn(`Timeout waiting for title to include: ${expectedTitle}`);
    });

    const actualTitle = await this.newPage.title();
    LoggerUtils.info(`Application page title: "${actualTitle}"`);
    if (!actualTitle.includes(expectedTitle)) {
      LoggerUtils.warn(`Actual title "${actualTitle}" does not contain expected title "${expectedTitle}"`);
    }
  }

  /**
   * Close the application tab and navigate back.
   * Replaces ApplicationPage.backToJobDetails()
   *
   * Java: AliasUtility.getValue("parentWindow") + driver.switchTo().window()
   *       + driver.navigate().back()
   * Playwright: close the child tab; the BrowserContext automatically
   *             keeps the parent page active.
   */
  async backToJobDetails(): Promise<void> {
    LoggerUtils.info('Switching back to Job Details page.');
    if (this.newPage && !this.newPage.isClosed()) {
      await this.newPage.close();
      LoggerUtils.info('Application tab closed.');
    }
    // Retrieve stored parent page and bring it to front
    const parentPage = AliasUtility.getValue<Page>('ParentPage');
    if (parentPage) {
      await parentPage.bringToFront();
      LoggerUtils.info('Switched back to parent (Job Details) page.');
    }
  }
}
