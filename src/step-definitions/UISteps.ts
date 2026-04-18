import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world/CustomWorld';
import { HomePage } from '../pages/HomePage';
import { CareersPage } from '../pages/CareersPage';
import { JobDetailsPage } from '../pages/JobDetailsPage';
import { ApplicationPage } from '../pages/ApplicationPage';
import { LoggerUtils } from '../utils/LoggerUtils';
import { Page } from 'playwright';

/**
 * UISteps – replaces Java UISteps.java (Cucumber step definitions).
 *
 * Key migrations:
 *  - Java new HomePage() in each step → pages instantiated with this.page from World
 *  - Java static/shared references → stored on CustomWorld between steps
 *  - driver.switchTo().window() → Playwright Page objects captured via context events
 *  - Assert.* → Playwright expect() (done inside page objects)
 *  - @Given/@When/@Then annotations → Cucumber-JS Given/When/Then functions
 *
 * Page objects are stored on CustomWorld to share state between steps,
 * replacing Java's PicoContainer dependency injection.
 */

// ─── Page object references stored on World ──────────────────────────────────
// (replaces Java's private fields in UISteps that persisted across steps)
declare module '../support/world/CustomWorld' {
  interface CustomWorld {
    homePage: HomePage;
    careersPage: CareersPage;
    jobDetailsPage: JobDetailsPage;
    applicationPage: ApplicationPage;
    applicationTab: Page;
  }
}

// ─── UI Step Definitions ─────────────────────────────────────────────────────

/**
 * Replaces: UISteps.navigateToHomepage()
 */
Given('I navigate to LabCorp homepage', async function (this: CustomWorld) {
  this.homePage = new HomePage(this.page);
  await this.homePage.navigateTo();
});

/**
 * Replaces: UISteps.clickCareersLink()
 */
When('I click on Careers link', async function (this: CustomWorld) {
  await this.homePage.clickCareersLink();
});

/**
 * Replaces: UISteps.searchForPosition(String position)
 */
When('I search for {string} position', async function (this: CustomWorld, position: string) {
  this.careersPage = new CareersPage(this.page);
  await this.careersPage.searchForPosition(position);
});

/**
 * Replaces: UISteps.selectFirstPosition()
 */
When('I select the first matching position', async function (this: CustomWorld) {
  await this.careersPage.selectFirstPosition();
});

/**
 * Replaces: UISteps.verifyJobDetails(Map<String,String> expectedDetails)
 *
 * Cucumber-JS DataTable with header row → array of objects.
 * The Java feature table used "Field"/"Value" columns.
 */
Then(
  'I should see the correct job details:',
  async function (this: CustomWorld, dataTable: { hashes: () => Array<{ Field: string; Value: string }> }) {
    this.jobDetailsPage = new JobDetailsPage(this.page);
    const rows = dataTable.hashes();

    const get = (field: string): string =>
      (rows.find((r) => r['Field'] === field)?.['Value'] ?? '').trim();

    await this.jobDetailsPage.verifyJobTitle(get('Job Title'));
    LoggerUtils.info(`Verified job title: ${get('Job Title')}`);

    await this.jobDetailsPage.verifyJobLocation(get('Job Location'));
    LoggerUtils.info(`Verified job location: ${get('Job Location')}`);

    await this.jobDetailsPage.verifyJobId(get('Job ID'));
    LoggerUtils.info(`Verified job ID: ${get('Job ID')}`);

    await this.jobDetailsPage.verifyDescriptionText(get('Description Text'));
    LoggerUtils.info(`Verified description: ${get('Description Text')}`);

    await this.jobDetailsPage.verifyDescriptionText(get('Qualifications'));
    LoggerUtils.info(`Verified qualifications: ${get('Qualifications')}`);

    await this.jobDetailsPage.verifyDescriptionText(get('Responsibilities'));
    LoggerUtils.info(`Verified responsibilities: ${get('Responsibilities')}`);

    await this.jobDetailsPage.verifyDescriptionText(get('Requirement1'));
    await this.jobDetailsPage.verifyDescriptionText(get('Requirement2'));
    LoggerUtils.info(`Verified requirement: ${get('Requirement2')}`);
    await this.jobDetailsPage.verifyDescriptionText(get('Requirement3'));
    LoggerUtils.info(`Verified requirement: ${get('Requirement3')}`);
  }
);

/**
 * Replaces: UISteps.clickApplyNow()
 *
 * Playwright-specific: we capture the new page (tab) that opens when
 * "Apply Now" is clicked. This replaces Java's driver.getWindowHandle()
 * + driver.switchTo().window() pattern.
 */
When('I click on Apply Now button', async function (this: CustomWorld) {
  // Set up listener BEFORE the click that triggers the new tab
  const newPagePromise = this.context.waitForEvent('page');

  await this.jobDetailsPage.clickApplyNow();
  LoggerUtils.info('Clicked on Apply Now button');

  // Capture the newly opened tab
  this.applicationTab = await newPagePromise;
  await this.applicationTab.waitForLoadState('domcontentloaded');
  LoggerUtils.info('New application tab captured.');
});

/**
 * Replaces: UISteps.iShouldSeeTheSameOnTheApplicationPage(String title)
 *
 * Uses the captured application tab Page object.
 */
Then(
  'I should see the same {string} on the application page',
  async function (this: CustomWorld, title: string) {
    this.applicationPage = new ApplicationPage(this.page);
    this.applicationPage.setNewPage(this.applicationTab);
    await this.applicationPage.pageTitleVerification(title);
    LoggerUtils.info(`Verified application page title: "${title}"`);
  }
);

/**
 * Replaces: UISteps.clickReturnToJobSearch()
 */
When('I click to return to job search', async function (this: CustomWorld) {
  await this.jobDetailsPage.clickReturnToJobSearch();
  LoggerUtils.info('Clicked to return to job search');
});

/**
 * Replaces: UISteps.verifySearchResultsPage()
 */
Then('I should be back to the search results page', async function (this: CustomWorld) {
  await this.applicationPage.backToJobDetails();
  LoggerUtils.info('Verified back to search results page');
});
