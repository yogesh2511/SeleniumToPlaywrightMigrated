# 🚀 Selenium to Playwright Migration Framework (BDD + TypeScript)

Welcome to the **Playwright + TypeScript + Cucumber BDD** framework. This repository is the result of migrating a legacy Java-based Selenium and RestAssured automation framework into a modern, lightning-fast Node.js architecture.

This comprehensive guide is designed specifically for **Manual QA Engineers** and **Automation Testers** to easily understand the new architecture, set it up, run tests, and seamlessly transition their mindset from Java/Selenium to TypeScript/Playwright.

---

## 🛠️ 1. Architecture & Tech Stack

- **Core Automation Engine:** [Playwright](https://playwright.dev/) (Replaces Selenium WebDriver)
- **Language:** TypeScript (Replaces Java)
- **BDD Framework:** Cucumber-JS (Replaces Cucumber-JVM / TestNG)
- **API Testing Client:** Axios (Replaces RestAssured)
- **Design Pattern:** Page Object Model (POM)
- **Logging:** Winston (Replaces Log4j2)
- **State Management:** CustomWorld & AliasUtility (Replaces PicoContainer & ThreadLocal)

---

## 📦 2. Prerequisites & Setup

Before you begin, ensure you have the required tools installed on your local machine:

1. **Node.js (v18 or higher):** Download from [nodejs.org](https://nodejs.org/).
2. **IDE:** [Visual Studio Code](https://code.visualstudio.com/) (Highly recommended for TypeScript).
3. **Git:** Ensure you have Git installed.

### Installation Steps

1. **Open your Terminal** (or command prompt).
2. **Navigate** to this project directory:
   ```bash
   cd /path/to/playwright-framework
   ```
3. **Install Dependencies:**
   This command installs all the NPM packages listed in `package.json` (Playwright, Cucumber, Axios, TypeScript, etc.).
   ```bash
   npm install
   ```
4. **Install Browsers:**
   Playwright requires specific browser binaries to run tests. Install them using:
   ```bash
   npx playwright install chromium firefox webkit
   ```

---

## 🏃 3. Running the Tests

We have configured several simple `npm` scripts to execute your test suites. You do not need to configure complex XML files (like `testng.xml`) anymore!

| Execution Goal | Terminal Command | Description |
|---|---|---|
| **Run All Tests** | `npm run test` | Executes both UI and API scenarios in Headless mode. |
| **Run UI Tests Only** | `npm run test:ui` | Runs scenarios tagged with `@ui` in `cucumber.yml`. |
| **Run API Tests Only** | `npm run test:api` | Runs scenarios tagged with `@api`. |
| **Run Tests Visibly** | `npm run test:headed` | Opens an actual browser window (Headed mode) so you can watch the test execution. |

### 📊 Viewing Test Reports
After tests complete, Cucumber automatically generates reports in the `test-output` directory:
- **HTML Report:** Open `test-output/cucumber-report.html` in your browser for a beautiful, readable summary.
- **JSON Report:** Raw data output at `test-output/cucumber-report.json`.

---

## 📂 4. Project Directory Structure

Understanding where files live is the first step to mastering the framework.

```text
playwright-framework/
├── src/
│   ├── api/                 # API client wrapper (RestClient.ts using Axios) & TypeScript models
│   ├── features/            # Cucumber .feature files written in plain Gherkin (Given/When/Then)
│   │   ├── api/             # e.g., get_request.feature, post_request.feature
│   │   └── ui/              # e.g., labcorp_careers.feature
│   ├── fixtures/testdata/   # Static JSON files for payload injection (e.g., premium_order.json)
│   ├── pages/               # Page Object Model (POM) classes housing locators & UI interactions
│   ├── step-definitions/    # Code that ties Gherkin steps to POM actions (UISteps.ts, ApiSteps.ts)
│   ├── support/             # Framework backbone:
│   │   ├── hooks/           # Before and After actions (Browser launch, screenshot on failure)
│   │   └── world/           # CustomWorld.ts - Holds shared browser state for the scenario
│   └── utils/               # Helper classes (Config.ts, LoggerUtils.ts, PageUtils.ts)
├── .env                     # Centralized environment variables (Base URLs, Browser selection)
├── cucumber.yml             # Cucumber configuration rules and profile definitions
├── package.json             # NPM dependencies and script commands
└── tsconfig.json            # TypeScript compiler configuration
```

---

## 🔄 5. Migration Guide: From Java/Selenium to TS/Playwright

If you are coming from the old Java framework, here is a detailed breakdown of how concepts were migrated and how your workflow improves.

### A. State Management & Dependency Injection
- **Selenium (Java):** You relied on `PicoContainer` to inject Page Objects across different step definition classes.
- **Playwright (TypeScript):** We use **Cucumber World (`CustomWorld.ts`)**. Think of it as a shared container for a single scenario. The `page` and all Page Objects are instantiated and stored inside the `CustomWorld` via `this.page` or `this.homePage`. No complex DI required!

### B. Smart Auto-Waiting (No more explicit waits!)
- **Selenium (Java):** Required `WebDriverWait`, explicit wrappers (`WaitUtils.waitForElementVisible()`), and random `Thread.sleep()` when things got flaky.
- **Playwright:** Built-in **Auto-waiting**. When you call `await locator.click()`, Playwright automatically waits for the element to be attached, visible, stable (not animating), and ready to receive events. `WaitUtils.java` has been fully removed.

### C. Locators and Page Objects
- **Selenium (Java):** Used `@FindBy(xpath = "//button")` and `PageFactory.initElements()`.
- **Playwright:** Uses native `Locator` objects. They are lazily evaluated and highly resilient.
  ```typescript
  // Playwright approach in JobDetailsPage.ts
  private readonly applyButton = () => this.page.locator("xpath=//ppc-content[normalize-space()='Apply Now']").first();
  ```

### D. Multi-Window and Tab Handling
- **Selenium (Java):** You had to grab `driver.getWindowHandle()`, store the string in a hashmap (`AliasUtility`), loop through all open handles, and switch contexts with `driver.switchTo().window(handle)`.
- **Playwright:** Uses a `BrowserContext` that can natively track multiple `Page` objects. When clicking a button that opens a new tab, you simply capture the new `Page` event:
  ```typescript
  // Step Definition example:
  const newPagePromise = this.context.waitForEvent('page'); // start listening
  await this.jobDetailsPage.clickApplyNow();                // trigger the action
  this.applicationTab = await newPagePromise;               // instantly capture the new tab!
  ```

### E. API Testing: RestAssured to Axios
- **Selenium (Java):** Used RestAssured with a fluent builder (`given().headers().when().get().then()`).
- **Playwright:** Node.js doesn't use RestAssured. Instead, we use **Axios**. We built a custom `RestClient.ts` wrapper class to mimic the RestAssured fluent pattern exactly, making it extremely familiar for the QA team.
  ```typescript
  // Playwright approach in ApiSteps.ts
  const client = RestClient.reset().withHeaders(params).withQueryParams(params);
  const response = await client.get(endpoint);
  ```

### F. Configuration Properties
- **Selenium (Java):** Relied on parsing a static `config.properties` file.
- **Playwright:** Uses modern `.env` variables via the `dotenv` package. Update your URLs, browser types, or headless configurations cleanly in the `.env` file at the root directory. `Config.ts` securely extracts these.

---

## 📝 6. Step-by-Step: Writing Your First Playwright Test

Want to automate a new feature? Follow these simple steps. Let's imagine you are automating a "Contact Us" page.

### Step 1: Write the BDD Feature File
Create `src/features/ui/contact.feature`.
```gherkin
@ui
Feature: LabCorp Contact Search
  Scenario: QA searches for contact
    Given I navigate to LabCorp homepage
    When I click on the Contact Us link
    Then I should see the Contact details page
```

### Step 2: Create Locators in the Page Object
Open `src/pages/HomePage.ts` and add your locator and click action.
```typescript
// 1. Define the locator
private readonly contactLink = () => this.page.locator("text=Contact Us");

// 2. Define the action
async clickContactLink(): Promise<void> {
    await this.contactLink().click(); // Playwright auto-waits for it!
}
```

### Step 3: Map the Action in Step Definitions
Open `src/step-definitions/UISteps.ts`.
```typescript
import { When } from '@cucumber/cucumber';

When('I click on the Contact Us link', async function (this: CustomWorld) {
  await this.homePage.clickContactLink();
});
```

### Step 4: Execute the Test!
See your test run locally with a visible browser.
```bash
npm run test:headed
```

---

## 🤝 Need Help?
- **Logging:** If a test fails unexpectedly, check the logs. We use `Winston` (via `LoggerUtils.ts`) which prints out detailed step-by-step logs directly in the terminal, replicating your old `Log4j2` output.
- **Screenshots:** If a UI step fails, a full-page screenshot is automatically captured and embedded into the Cucumber HTML report by the `UIHooks.ts` `After` hook.

Happy Automating! 🎉
