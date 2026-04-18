import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '../utils/Config';
import { LoggerUtils } from '../utils/LoggerUtils';
import { expect } from '@playwright/test';

/**
 * HomePage – replaces Java HomePage.java.
 *
 * Key migrations:
 *  - By.xpath(...) → page.locator('xpath=...')
 *  - WaitUtils.isElementPresent → locator.isVisible() with timeout
 *  - JavaScriptUtils.clickElement → utils.jsClick()
 *  - WaitUtils.waitForPageTitle → utils.waitForTitle()
 *  - Assert.assertEquals → expect(...).toBe(...)
 *  - WebElementHelper.cookiesHandler → utils.handleCookies()
 */
export class HomePage extends BasePage {
  // Locators (replaces Java By fields)
  private readonly careersLink = () =>
    this.page.locator("xpath=//a[normalize-space()='Careers']");
  private readonly menuButton = () =>
    this.page.locator("xpath=//button[@aria-label='Open global Navigation']");

  private readonly careerPageTitle =
    'Careers at Labcorp | Embrace Possibilities, Change Lives';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to LabCorp homepage and dismiss cookie consent.
   * Replaces HomePage.navigateTo()
   */
  async navigateTo(): Promise<void> {
    await this.page.goto(Config.getBaseUrl(), {
      waitUntil: 'domcontentloaded',
      timeout: Config.getDefaultTimeout(),
    });
    LoggerUtils.info(`Navigated to LabCorp homepage: ${Config.getBaseUrl()}`);
    await this.utils.handleCookies();
    LoggerUtils.info('Cookies handled.');
  }

  /**
   * Click Careers link – with fallback to hamburger menu.
   * Replaces HomePage.clickCareersLink()
   *
   * Playwright auto-waits, so no explicit WebDriverWait needed.
   * JS click is used as fallback when the element is behind a menu.
   */
  async clickCareersLink(): Promise<void> {
    try {
      await this.utils.handleCookies();
      LoggerUtils.info('Cookies handled.');

      const careersLocator = this.careersLink();
      const isVisible = await careersLocator.isVisible().catch(() => false);

      if (isVisible) {
        LoggerUtils.info('Careers link is visible – clicking directly.');
        await careersLocator.click();
      } else {
        LoggerUtils.info('Careers link not visible – opening hamburger menu.');
        await this.menuButton().click();
        LoggerUtils.info('Menu opened – clicking Careers via JS click.');
        await this.utils.jsClick(careersLocator);
        LoggerUtils.info('Careers link clicked via JS.');
      }

      await this.utils.waitForTitle(this.careerPageTitle);
      LoggerUtils.info(`Waiting for page title: "${this.careerPageTitle}"`);
      expect(await this.page.title()).toBe(this.careerPageTitle);
      LoggerUtils.info(`Page title verified: "${this.careerPageTitle}"`);
    } catch (e) {
      LoggerUtils.error('Failed to click Careers link', e);
      throw e;
    }
  }

  /**
   * Verify the page title equals the Careers page title.
   * Replaces HomePage.verifyPageTitle()
   */
  async verifyPageTitle(): Promise<void> {
    const currentTitle = await this.page.title();
    if (currentTitle === this.careerPageTitle) {
      LoggerUtils.info(`Page title is correct: "${currentTitle}"`);
    } else {
      throw new Error(
        `Expected page title: "${this.careerPageTitle}", but got: "${currentTitle}"`
      );
    }
  }
}
