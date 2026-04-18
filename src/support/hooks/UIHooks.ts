import { Before, After, Status, ITestCaseHookParameter } from '@cucumber/cucumber';
import { CustomWorld } from '../world/CustomWorld';
import { AliasUtility } from '../../utils/AliasUtility';
import { LoggerUtils } from '../../utils/LoggerUtils';

/**
 * UIHooks – replaces Java UIHooks.java.
 *
 * Key migrations:
 *  - @Before("@ui") DriverManager.initDriver() → world.openBrowser()
 *  - @After("@ui") TakesScreenshot → page.screenshot()
 *  - scenario.attach() → world.attach() (Cucumber-JS built-in)
 *  - DriverManager.quitDriver() → world.closeBrowser()
 */

/**
 * Before @ui scenarios – launch browser.
 * Replaces Java UIHooks.beforeUIScenario()
 */
Before({ tags: '@ui' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`\n🚀 Starting UI Scenario: ${scenario.pickle.name}`);
  LoggerUtils.info(`Starting UI Scenario: ${scenario.pickle.name}`);
  await this.openBrowser();
});

/**
 * After @ui scenarios – take screenshot on failure, then close browser.
 * Replaces Java UIHooks.afterUIScenario()
 */
After({ tags: '@ui' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === Status.FAILED) {
    LoggerUtils.warn(`Scenario FAILED: ${scenario.pickle.name} – capturing screenshot.`);
    try {
      const screenshot = await this.captureScreenshot();
      await this.attach(screenshot, 'image/png');
      LoggerUtils.info('Screenshot attached to Cucumber report.');
    } catch (e) {
      LoggerUtils.error('Could not capture screenshot', e);
    }
  }

  // Clear runtime aliases between scenarios
  AliasUtility.clear();

  await this.closeBrowser();
  LoggerUtils.info(`UI Scenario finished: ${scenario.pickle.name}`);
});
