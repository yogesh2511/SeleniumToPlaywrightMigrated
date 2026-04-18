# LabCorp Playwright BDD Automation Framework

Welcome to the newly migrated **Playwright + TypeScript + Cucumber BDD** automation framework. This framework was successfully migrated from a legacy Java + Selenium + RestAssured architecture into a modern, lightning-fast Node.js stack. 

This README provides comprehensive, step-by-step documentation designed so Manual QA engineers and Automation Testers can easily understand the project, run tests, and continue writing test scripts.

---

## 🚀 1. Prerequisites

Before running the framework, ensure you have the following installed on your machine:
1. **Node.js** (v18 or above): [Download Node.js](https://nodejs.org/en/)
2. **VS Code** (Recommended IDE): [Download VS Code](https://code.visualstudio.com/)
3. **Git**: [Download Git](https://git-scm.com/downloads)

---

## 📦 2. Setup & Installation Steps

Open your terminal (or command prompt), navigate to the `playwright-framework` directory, and run the following commands:

**Step 1:** Install all project dependencies defined in `package.json`.
```bash
npm install
```

**Step 2:** Install Playwright-specific browsers (Chromium, Firefox, WebKit).
```bash
npm run install:browsers
```

---

## 🏃 3. Running the Tests

The framework comes with several pre-defined scripts to execute tests easily.

| Command | Description |
|---|---|
| `npm run test` | Runs **ALL** Cucumber scenarios (API and UI) in Headless mode. |
| `npm run test:ui` | Runs only UI scenarios tagged with `@ui` in Headless mode. |
| `npm run test:api` | Runs only API scenarios tagged with `@api`. |
| `npm run test:headed` | Runs **ALL** tests with a visible browser window (Headed mode) so you can watch execution. |

### Generating Test Reports
After running the tests, Cucumber automatically generates HTML and JSON test reports. You can find them in the `test-output` directory:
- `test-output/cucumber-report.html` (Open this file in your browser)
- `test-output/cucumber-report.json`

---

## 📂 4. Project Structure (Where to find things)

The framework strictly follows the **Page Object Model (POM)** and **BDD (Behavior-Driven Development)** architectural patterns. 

```text
playwright-framework/
├── src/
│   ├── api/                 # REST API models & RestClient (Axios)
│   ├── features/            # Cucumber .feature files written in Gherkin (Given/When/Then)
│   │   ├── api/             # API test scenarios
│   │   └── ui/              # UI test scenarios
│   ├── fixtures/testdata/   # Static JSON data used for API payloads (e.g., premium_order.json)
│   ├── pages/               # Page Object Model (POM) classes housing locators & interactions
│   ├── step-definitions/    # Cucumber step definitions mapping Gherkin steps to TypeScript code
│   ├── support/             # Hooks (Before/After) & the CustomWorld state manager
│   └── utils/               # Helpers: Config, LoggerUtils, PageUtils (Wait/JS wrappers)
├── .env                     # Environment variables (Base URLs, Browser type, Headless flags)
├── cucumber.yml             # Cucumber configuration and entry points
├── package.json             # Node dependencies and npm scripts
└── tsconfig.json            # TypeScript configuration compiler rules
```

---

## 🔄 5. Migration Guide: How Java mapped to TypeScript

For QA engineers transitioning from the old Java/Selenium framework, here is exactly how legacy concepts map to modern Playwright features:

### A. Dependency Injection → CustomWorld
- **Java:** Used `PicoContainer` to share `Page` objects across step definitions.
- **Playwright:** Uses a `CustomWorld.ts` context. You access `this.page` directly inside step definitions to share browser state, eliminating the need for complex Dependency Injection.

### B. Waits & Synchronization
- **Java Selenium:** Required `WebDriverWait` and explicit wait utilities (`WaitUtils.waitForElementVisible`).
- **Playwright:** Has **Auto-Waiting** built-in. When you call `await locator.click()`, Playwright automatically waits for the element to be attached, visible, stable, and ready to receive events. `WaitUtils` logic is largely obsolete.

### C. Locators (driver.findElement)
- **Java Selenium:** `@FindBy(xpath = "//button")` or `driver.findElement(By.id("foo"))`.
- **Playwright:** Standardizes locator strategies returning robust proxy references:
  ```typescript
  // JobDetailsPage.ts
  private readonly applyButton = () => this.page.locator("xpath=//ppc-content[normalize-space()='Apply Now']").first();
  ```

### D. Window Handling (Child Tabs)
- **Java Selenium:** Extracted `driver.getWindowHandle()`, stored strings in `AliasUtility`, looped through windows, and commanded `driver.switchTo().window(handle)`.
- **Playwright:** Works natively with `BrowserContext`. When you click a button that opens a new tab, you simply wait for the `page` event.
  ```typescript
  // Step Definition example:
  const newPagePromise = this.context.waitForEvent('page');
  await this.jobDetailsPage.clickApplyNow();
  this.applicationTab = await newPagePromise; // new tab is captured instantly!
  ```

### E. RestAssured → Axios (RestClient)
- **Java RestAssured:** Used a fluent builder like `given().headers().when().get().then()`.
- **Playwright:** Created a custom `RestClient.ts` wrapper around Axios that perfectly mimics the fluent chain for QA comfort:
  ```typescript
  const client = RestClient.reset().withHeaders(params).withQueryParams(params);
  const response = await client.get(endpoint);
  ```

### F. configuration.properties → .env
- **Java:** Read strings via a Java `Properties` parser.
- **Playwright:** Uses `dotenv`. All config lives safely in the `.env` file, accessible securely via `process.env.BASE_URL` inside `Config.ts`.

---

## 🛠️ 6. Writing a New Test (Step-by-Step for QA)

If a manual QA wants to automate a new LabCorp scenario, follow these 3 steps:

### Step 1: Write the Feature File
Create a new `.feature` file in `src/features/ui/`.
```gherkin
@ui
Feature: LabCorp Contact Search
  Scenario: QA searches for contact
    Given I navigate to LabCorp homepage
    When I click on the Contact Us link
    Then I should see the Contact details page
```

### Step 2: Create/Update the Page Object
Open a page file in `src/pages/` (e.g., `HomePage.ts`) and define the locators and actions.
```typescript
private readonly contactLink = () => this.page.locator("text=Contact Us");

async clickContactLink(): Promise<void> {
    await this.contactLink().click();
}
```

### Step 3: Map the Step Definition
Open `src/step-definitions/UISteps.ts` and link the plain-english step to the page object action.
```typescript
When('I click on the Contact Us link', async function (this: CustomWorld) {
  await this.homePage.clickContactLink();
});
```

### Step 4: Run your new test!
```bash
npm run test:headed
```

**Happy Testing!** 🎉
# SeleniumToPlaywrightMigrated
