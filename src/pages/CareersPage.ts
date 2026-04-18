import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoggerUtils } from '../utils/LoggerUtils';

/**
 * CareersPage – replaces Java CareersPage.java.
 *
 * Key migrations:
 *  - driver.findElement(By.id(...)) → page.locator('#...')
 *  - driver.findElement(By.cssSelector(...)) → page.locator('css=...')
 *  - WaitUtils.waitForElementVisible → locator.waitFor() (Playwright auto-waits)
 *  - WaitUtils.waitForElementClickable → locator.click() (auto-waits by default)
 *  - JavaScriptUtils.clickElement → utils.jsClick()
 *  - PageFactory is not needed in Playwright (no @FindBy annotations)
 */
export class CareersPage extends BasePage {
  // Locators (replaces Java driver.findElement() field initializers)
  private readonly searchInput = () => this.page.locator('#typehead');
  private readonly searchButton = () => this.page.locator('#ph-search-backdrop');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Search for a job position by title.
   * Replaces CareersPage.searchForPosition(String position)
   *
   * Playwright auto-waits for the input to be visible before fill(),
   * so no explicit waitForElementVisible is needed.
   */
  async searchForPosition(position: string): Promise<void> {
    await this.searchInput().waitFor({ state: 'visible' });
    await this.searchInput().fill(position);
    LoggerUtils.info(`Searching for position: "${position}"`);
    await this.searchButton().click();
    LoggerUtils.info('Search button clicked.');
  }

  /**
   * Select the first matching job result.
   * Replaces CareersPage.selectFirstPosition()
   *
   * Uses JS click (same as Java's JavaScriptUtils.clickElement) because
   * the job list items may require scrolling.
   */
  async selectFirstPosition(): Promise<void> {
    LoggerUtils.info('Waiting for the first matching position to be clickable.');
    const firstPosition = this.page
      .locator("xpath=(//li[@class='jobs-list-item'])//*[contains(text(),'Automation')]")
      .first();

    await firstPosition.waitFor({ state: 'visible' });
    await this.utils.jsClick(firstPosition);
    LoggerUtils.info('First matching position clicked.');
  }
}
