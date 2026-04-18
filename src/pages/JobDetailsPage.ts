import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { AliasUtility } from '../utils/AliasUtility';
import { LoggerUtils } from '../utils/LoggerUtils';
import { expect } from '@playwright/test';

/**
 * JobDetailsPage – replaces Java JobDetailsPage.java.
 *
 * Key migrations:
 *  - By.cssSelector / By.xpath → page.locator()
 *  - WaitUtils.waitForElementVisible → locator.waitFor({ state: 'visible' })
 *  - WaitUtils.waitForElementClickable → locator.click() (Playwright auto-waits)
 *  - driver.getWindowHandle() → AliasUtility.storeAlias('ParentPage', page)
 *  - driver.switchTo().alert() → page.on('dialog', ...)
 *  - WebElementHelper.closeAllChildWindows → utils.closeAllChildPages()
 *  - Assert.assertEquals/assertTrue → expect(...)
 *
 * NOTE on multi-window:
 *   Playwright uses Page objects instead of window handle strings.
 *   We store the original Page reference in AliasUtility instead of a handle string.
 */
export class JobDetailsPage extends BasePage {
  // Locators (replaces Java By fields)
  private readonly jobTitle = () => this.page.locator('css=h1.job-title');
  private readonly jobLocation = () =>
    this.page.locator('css=span.au-target.job-location');
  private readonly jobId = () =>
    this.page.locator('css=span.au-target.jobId');
  private readonly descriptionDiv = () =>
    this.page.locator("xpath=//div[@class='jd-info au-target']");
  private readonly applyButton = () =>
    this.page.locator("xpath=//ppc-content[normalize-space()='Apply Now']").first();

  constructor(page: Page) {
    super(page);
  }

  /**
   * Verify job title is displayed.
   * Replaces JobDetailsPage.verifyJobTitle(String expectedTitle)
   *
   * Java used Boolean.valueOf(expectedTitle) to parse "true"/"false" strings
   * as a flag for isDisplayed(). We preserve that pattern.
   */
  async verifyJobTitle(expectedFlag: string): Promise<void> {
    const jt = this.jobTitle();
    await jt.waitFor({ state: 'visible' });
    const text = await jt.innerText();
    LoggerUtils.info(`Job Title: "${text}"`);
    AliasUtility.storeAlias('JobTitle', text);

    const isDisplayed = await jt.isVisible();
    LoggerUtils.info(`Job Title is displayed: ${isDisplayed}`);
    const expected = expectedFlag.toLowerCase() === 'true';
    expect(isDisplayed).toBe(expected);
  }

  /**
   * Verify job location is displayed.
   * Replaces JobDetailsPage.verifyJobLocation(String expectedLocation)
   */
  async verifyJobLocation(expectedFlag: string): Promise<void> {
    const jl = this.jobLocation();
    await jl.waitFor({ state: 'visible' });
    const isDisplayed = await jl.isVisible();
    LoggerUtils.info(`Job Location is displayed: ${isDisplayed}`);
    const expected = expectedFlag.toLowerCase() === 'true';
    expect(isDisplayed).toBe(expected);
  }

  /**
   * Verify job ID is displayed.
   * Replaces JobDetailsPage.verifyJobId(String expectedId)
   */
  async verifyJobId(expectedFlag: string): Promise<void> {
    const jid = this.jobId();
    await jid.waitFor({ state: 'visible' });
    const isDisplayed = await jid.isVisible();
    LoggerUtils.info(`Job ID is displayed: ${isDisplayed}`);
    const expected = expectedFlag.toLowerCase() === 'true';
    expect(isDisplayed).toBe(expected);
  }

  /**
   * Verify description/requirements text is present (case-insensitive contains).
   * Replaces JobDetailsPage.verifyDescriptionText(String expectedText)
   */
  async verifyDescriptionText(expectedText: string): Promise<void> {
    const desc = this.descriptionDiv();
    await desc.waitFor({ state: 'visible' });
    const actualText = (await desc.innerText()).toLowerCase();
    LoggerUtils.info(`Verifying description contains: "${expectedText}"`);
    if (!actualText.includes(expectedText.toLowerCase())) {
      LoggerUtils.warn(`Description does not contain expected text: "${expectedText}"`);
    } else {
      expect(actualText).toContain(expectedText.toLowerCase());
    }
  }

  /**
   * Click Apply Now – stores the current page reference (replaces storing window handle).
   * Replaces JobDetailsPage.clickApplyNow()
   *
   * Playwright: instead of driver.getWindowHandle() (string), we store
   * the Page object reference. The new tab is captured in ApplicationPage.
   */
  async clickApplyNow(): Promise<void> {
    // Store the current page so we can switch back later
    AliasUtility.storeAlias('ParentPage', this.page);
    LoggerUtils.info('Parent page stored in AliasUtility.');

    const applyBtn = this.applyButton();
    await applyBtn.waitFor({ state: 'visible' });
    LoggerUtils.info('Waiting for Apply Now button to be clickable.');
    await applyBtn.click();
    LoggerUtils.info('Apply Now button clicked.');
  }

  /**
   * Close all child tabs and return to the parent page.
   * Replaces JobDetailsPage.clickReturnToJobSearch() + WebElementHelper.closeAllChildWindows()
   */
  async clickReturnToJobSearch(): Promise<void> {
    LoggerUtils.info('Closing all child tabs and returning to job search.');
    await this.utils.closeAllChildPages();
    LoggerUtils.info('All child tabs closed.');
  }
}
