import { setWorldConstructor, World, IWorldOptions, setDefaultTimeout } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';

// Set global timeout for Cucumber steps to 60 seconds
setDefaultTimeout(60 * 1000);
import { Config } from '../../utils/Config';
import { LoggerUtils } from '../../utils/LoggerUtils';

/**
 * CustomWorld – the Cucumber World object.
 *
 * Replaces Java's Cucumber Dependency-Injection (PicoContainer/Guice) pattern
 * where pages were passed between step definition classes.
 *
 * In Playwright + Cucumber-JS, the World holds browser state and is shared
 * across all step definitions within one scenario.
 */
export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  /** Shared API response store – replaces Java ScenarioContextManager */
  apiContext: Record<string, unknown> = {};

  constructor(options: IWorldOptions) {
    super(options);
  }

  /** Launch browser and create a fresh BrowserContext */
  async openBrowser(): Promise<void> {
    const browserName = Config.getBrowser();
    const headless = Config.isHeadless();

    LoggerUtils.info(`Launching browser: ${browserName} | headless: ${headless}`);

    switch (browserName.toLowerCase()) {
      case 'firefox':
        this.browser = await firefox.launch({ headless });
        break;
      case 'webkit':
        this.browser = await webkit.launch({ headless });
        break;
      default:
        this.browser = await chromium.launch({
          headless,
          args: [
            ...(Config.isNotificationsDisabled() ? ['--disable-notifications'] : []),
          ],
        });
    }

    this.context = await this.browser.newContext({
      viewport: null, // maximize equivalent
    });
    this.page = await this.context.newPage();

    // Set default navigation timeout
    this.page.setDefaultNavigationTimeout(Config.getDefaultTimeout());
    this.page.setDefaultTimeout(Config.getDefaultTimeout());

    LoggerUtils.info('Browser launched and new page created.');
  }

  /** Capture screenshot bytes (used in AfterStep on failure) */
  async captureScreenshot(): Promise<Buffer> {
    if (!this.page) throw new Error('Page not initialized');
    return await this.page.screenshot({ fullPage: true });
  }

  /** Close browser and clean up */
  async closeBrowser(): Promise<void> {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    LoggerUtils.info('Browser closed.');
  }
}

setWorldConstructor(CustomWorld);
