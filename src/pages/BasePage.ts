import { Page } from '@playwright/test';
import { Config } from '../utils/Config';
import { PageUtils } from '../utils/PageUtils';
import { LoggerUtils } from '../utils/LoggerUtils';
import { expect } from '@playwright/test';

/**
 * BasePage – replaces Java BasePage.java.
 *
 * All page objects extend this class. It holds a reference to the
 * Playwright `Page` and a `PageUtils` helper instance, mirroring the
 * Java pattern of storing `WebDriver driver` and utility references.
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly utils: PageUtils;

  constructor(page: Page) {
    this.page = page;
    this.utils = new PageUtils(page, Config.getDefaultTimeout());
  }

  /** Navigate to a given URL – replaces BasePage.navigateTo(String url) */
  async navigateTo(url: string): Promise<void> {
    await this.utils.navigateTo(url);
  }

  /** Click element by XPath – replaces BasePage.clickElement(String locator) */
  async clickElement(xpath: string): Promise<void> {
    const locator = this.page.locator(`xpath=${xpath}`);
    await this.utils.waitForClickable(locator);
    await locator.click();
  }

  /** Enter text by XPath – replaces BasePage.enterText(String locator, String text) */
  async enterText(xpath: string, text: string): Promise<void> {
    const locator = this.page.locator(`xpath=${xpath}`);
    await locator.fill(text);
  }

  /** Get element text by XPath – replaces BasePage.getElementText(String locator) */
  async getElementText(xpath: string): Promise<string> {
    return await this.page.locator(`xpath=${xpath}`).innerText();
  }

  /** Verify page title matches expected – replaces Assert.assertEquals(driver.getTitle(), ...) */
  async verifyPageTitle(expectedTitle: string): Promise<void> {
    const actualTitle = await this.page.title();
    expect(actualTitle).toBe(expectedTitle);
    LoggerUtils.info(`Page title verified: "${actualTitle}"`);
  }
}
