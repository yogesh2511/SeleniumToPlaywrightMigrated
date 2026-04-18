import { Before, After, ITestCaseHookParameter, Status } from '@cucumber/cucumber';
import { CustomWorld } from '../world/CustomWorld';
import { LoggerUtils } from '../../utils/LoggerUtils';
import { Config } from '../../utils/Config';

/**
 * APIHooks – replaces Java APIHooks.java.
 *
 * Key migrations:
 *  - RestAssured.filters() → axios interceptors / console logging controlled by DEBUG flag
 *  - RestAssured.reset() → clearing apiContext on the World object
 *  - ScenarioContextManager.clear() → world.apiContext = {}
 *
 * No browser is launched for API scenarios – only HTTP client state is managed.
 */

/**
 * Before @api scenarios – log start, set up debug interceptors if enabled.
 * Replaces Java APIHooks.beforeAPIScenario()
 */
Before({ tags: '@api' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`\n📡 Starting API Scenario: ${scenario.pickle.name}`);
  LoggerUtils.info(`Starting API Scenario: ${scenario.pickle.name}`);

  // Reset scenario-scoped API context
  this.apiContext = {};

  if (Config.isDebugMode()) {
    LoggerUtils.debug('DEBUG mode enabled – verbose request/response logging active.');
  }
});

/**
 * After @api scenarios – log failure, clear context.
 * Replaces Java APIHooks.afterAPIScenario()
 */
After({ tags: '@api' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  try {
    if (scenario.result?.status === Status.FAILED) {
      LoggerUtils.warn(`API Scenario FAILED: ${scenario.pickle.name}`);
    }
  } finally {
    // Clear API context (replaces RestAssured.reset() + ScenarioContextManager.clear())
    this.apiContext = {};
    LoggerUtils.info(`API Scenario finished: ${scenario.pickle.name}`);
  }
});
