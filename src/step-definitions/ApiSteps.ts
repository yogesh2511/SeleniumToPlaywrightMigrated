import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world/CustomWorld';
import { RestClient, resolveJsonPath, ApiResponse } from '../api/RestClient';
import { LoggerUtils } from '../utils/LoggerUtils';
import { Order, EchoResponseBody } from '../api/models';
import * as fs from 'fs';
import * as path from 'path';
import { strict as assert } from 'assert';

/**
 * ApiSteps – replaces Java ApiSteps.java.
 *
 * Key migrations:
 *  - RestAssured given/when/then DSL → Axios-based RestClient
 *  - ScenarioContextManager → world.apiContext (per-scenario state on World)
 *  - response.jsonPath().getString("path") → resolveJsonPath(body, "path")
 *  - Assert.assertEquals / assertTrue → Node.js assert.strictEqual / assert.ok
 *  - DataTable.asMaps() → dataTable.hashes()
 *  - mapper.readTree() / treeToValue() → JSON.parse() + type assertion
 *  - classLoader.getResource("testdata/...") → fs.readFileSync from known path
 */

// ─── Shared per-scenario state keys (replaces ScenarioContextManager fields) ──
const RESPONSE_KEY = 'response';
const RESPONSE_BODY_MAP_KEY = 'responseBodyMap';

function getResponse(world: CustomWorld): ApiResponse {
  const res = world.apiContext[RESPONSE_KEY] as ApiResponse | undefined;
  if (!res) throw new Error('No response stored. Send a request first.');
  return res;
}

function storeResponse(world: CustomWorld, response: ApiResponse): void {
  world.apiContext[RESPONSE_KEY] = response;
  world.apiContext[RESPONSE_BODY_MAP_KEY] = response.body;
}

// ─── Request Sending Steps ───────────────────────────────────────────────────

/**
 * Replaces: ApiSteps.sendGetRequest(String endpoint)
 */
When('I send a GET request to {string}', async function (this: CustomWorld, endpoint: string) {
  const client = RestClient.reset();
  const response = await client.get(endpoint);
  storeResponse(this, response);
});

/**
 * Replaces: ApiSteps.sendPutRequest(String endpoint)
 */
When('I send a PUT request to {string}', async function (this: CustomWorld, endpoint: string) {
  const client = RestClient.reset();
  const body = RestClient.getRequestBody();
  const response = await client.put(endpoint, body ? JSON.parse(body) : undefined);
  storeResponse(this, response);
});

/**
 * Replaces: ApiSteps.sendPatchRequest(String endpoint)
 */
When('I send a PATCH request to {string}', async function (this: CustomWorld, endpoint: string) {
  const client = RestClient.reset();
  const body = RestClient.getRequestBody();
  const response = await client.patch(endpoint, body ? JSON.parse(body) : undefined);
  storeResponse(this, response);
});

/**
 * Replaces: ApiSteps.sendDeleteRequest(String endpoint)
 */
When('I send a DELETE request to {string}', async function (this: CustomWorld, endpoint: string) {
  const client = RestClient.reset();
  const response = await client.delete(endpoint);
  storeResponse(this, response);
});

/**
 * Replaces: ApiSteps.sendPostRequest(String endpoint)
 */
When('I send a POST request to {string}', async function (this: CustomWorld, endpoint: string) {
  const client = RestClient.reset();
  const bodyStr = RestClient.getRequestBody();
  const body = bodyStr ? JSON.parse(bodyStr) : undefined;
  const response = await client.post(endpoint, body);
  storeResponse(this, response);
});

/**
 * Replaces: ApiSteps.sendRequestWithParams(String method, String endpoint, Map<String,String> params)
 *
 * DataTable with two columns (no header) → key-value pairs as headers AND query params.
 */
When(
  'I send a {string} request to {string} with:',
  async function (this: CustomWorld, method: string, endpoint: string, dataTable: DataTable) {
    const params = dataTable.rowsHash() as Record<string, string>;
    const client = RestClient.reset().withHeaders(params).withQueryParams(params);
    const bodyStr = RestClient.getRequestBody();
    const body = bodyStr ? JSON.parse(bodyStr) : undefined;

    let response: ApiResponse;
    switch (method.toUpperCase()) {
      case 'GET':    response = await client.get(endpoint); break;
      case 'POST':   response = await client.post(endpoint, body); break;
      case 'PUT':    response = await client.put(endpoint, body); break;
      case 'PATCH':  response = await client.patch(endpoint, body); break;
      case 'DELETE': response = await client.delete(endpoint); break;
      default: throw new Error(`Unsupported HTTP method: ${method}`);
    }

    storeResponse(this, response);
  }
);

/**
 * Replaces: ApiSteps.loadOrderPayload(String fileName)
 *
 * Java: classLoader.getResource("testdata/" + fileName) → Files.readAllBytes(path)
 * TypeScript: fs.readFileSync from a known relative path.
 */
Given(
  'I have the order payload from file {string}',
  function (this: CustomWorld, fileName: string) {
    // Mirrors Java's "testdata/" resource lookup
    const filePath = path.resolve(__dirname, '../../src/fixtures/testdata', fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test data file not found: ${filePath}`);
    }
    const payload = fs.readFileSync(filePath, 'utf-8');
    RestClient.setRequestBody(payload);
    LoggerUtils.info(`Loaded order payload from: ${fileName}`);
  }
);

// ─── Response Validation Steps ───────────────────────────────────────────────

/**
 * Replaces: ApiSteps.validateStatusCode(int expectedStatusCode)
 */
Then(
  'the response status code should be {int}',
  function (this: CustomWorld, expectedStatusCode: number) {
    const response = getResponse(this);
    assert.strictEqual(response.statusCode, expectedStatusCode, 'Unexpected status code');
    LoggerUtils.info(`Status code verified: ${response.statusCode}`);
  }
);

/**
 * Replaces: ApiSteps.validateHeader(String headerName)
 */
Then(
  'the response should contain header {string}',
  function (this: CustomWorld, headerName: string) {
    const response = getResponse(this);
    const hasHeader = headerName.toLowerCase() in response.headers;
    assert.ok(hasHeader, `Header not found: ${headerName}`);
  }
);

/**
 * Replaces: ApiSteps.validateResponseBody(String expectedContent)
 */
Then(
  'the response body should contain {string}',
  function (this: CustomWorld, expectedContent: string) {
    const response = getResponse(this);
    assert.ok(
      response.bodyAsString.includes(expectedContent),
      `Response body does not contain: ${expectedContent}`
    );
  }
);

/**
 * Replaces: ApiSteps.validatePathInResponse()
 * JSON path: response.body.path
 */
Then('the response should have valid path', function (this: CustomWorld) {
  const response = getResponse(this);
  const pathValue = response.jsonPath<string>('path');
  assert.ok(pathValue !== null && pathValue !== undefined, 'Path should not be null');
  assert.ok(pathValue.length > 0, 'Path should not be empty');
  LoggerUtils.info(`Path validated: "${pathValue}"`);
});

/**
 * Replaces: ApiSteps.validateIpInResponse()
 * JSON path: response.body.ip
 */
Then('the response should have valid ip', function (this: CustomWorld) {
  const response = getResponse(this);
  const ip = response.jsonPath<string>('ip');
  assert.ok(ip !== null && ip !== undefined, 'IP should not be null');
  assert.ok(ip.length > 0, 'IP should not be empty');
  LoggerUtils.info(`IP validated: "${ip}"`);
});

/**
 * Replaces: ApiSteps.validateHeaders(DataTable dataTable)
 *
 * Validates headers present in the response body's "headers" object
 * OR as actual HTTP response headers for "Content-Type".
 */
Then(
  'the response should contain headers:',
  function (this: CustomWorld, dataTable: DataTable) {
    const response = getResponse(this);
    const body = response.body as EchoResponseBody;
    const rows = dataTable.hashes() as Array<{ 'Header Name': string; 'Expected Value': string }>;

    for (const row of rows) {
      const headerName = row['Header Name'];
      const expectedValue = row['Expected Value'];
      let actualValue: string | undefined;

      if (headerName.toLowerCase() === 'content-type') {
        actualValue = response.headers['content-type'];
      } else {
        actualValue = body.headers?.[headerName];
      }

      assert.strictEqual(actualValue, expectedValue, `Header mismatch for: ${headerName}`);
      LoggerUtils.info(`Header verified - ${headerName}: ${actualValue}`);
    }
  }
);

/**
 * Replaces: ApiSteps.validateCustomerInformation() (simple version)
 */
Then(
  'the response should contain accurate customer information',
  function (this: CustomWorld) {
    const response = getResponse(this);
    const customerName = response.jsonPath<string>('customer.name');
    assert.strictEqual(customerName, 'Jane Smith', 'Customer name does not match');
  }
);

/**
 * Replaces: ApiSteps.validatePaymentDetails() (simple version)
 */
Then(
  'the response should contain accurate payment details',
  function (this: CustomWorld) {
    const response = getResponse(this);
    const paymentMethod = response.jsonPath<string>('payment.method');
    assert.strictEqual(paymentMethod, 'Credit Card', 'Payment method does not match');
  }
);

/**
 * Replaces: ApiSteps.validateProductInformation() (simple version)
 */
Then(
  'the response should contain accurate product information',
  function (this: CustomWorld) {
    const response = getResponse(this);
    const productName = response.jsonPath<string>('products[0].name');
    assert.strictEqual(productName, 'Premium Product', 'Product name does not match');
  }
);

/**
 * Replaces: ApiSteps.theResponseShouldContainCustomerName(String expectedName)
 *
 * Java: mapper.readTree(responseString).path("parsedBody") → mapper.treeToValue(...)
 * TypeScript: JSON.parse(bodyAsString).parsedBody → typed as Order
 */
Then(
  'the response should contain {string} customer name',
  function (this: CustomWorld, expectedName: string) {
    const response = getResponse(this);
    const parsed: EchoResponseBody = JSON.parse(response.bodyAsString);
    const order: Order | undefined = parsed.parsedBody;
    assert.ok(order, 'parsedBody not found in response');
    assert.strictEqual(order!.customer.name, expectedName, 'Customer name does not match');
    LoggerUtils.info(`Customer name verified: "${order!.customer.name}"`);
  }
);

// ─── Generic DataTable Validation Steps ──────────────────────────────────────

/**
 * Shared helper – replaces Java ApiSteps.validateFieldsAgainstParsedBody(DataTable)
 *
 * Resolves dot-notation + array-index paths from parsedBody using resolveJsonPath.
 */
function validateFieldsAgainstParsedBody(response: ApiResponse, dataTable: DataTable): void {
  const parsed: EchoResponseBody = JSON.parse(response.bodyAsString);
  const parsedBody = parsed.parsedBody as unknown;

  const rows = dataTable.hashes() as Array<{ 'Field Path': string; 'Expected Value': string }>;
  for (const row of rows) {
    const fieldPath = row['Field Path'];
    const expectedValue = row['Expected Value'].trim();
    const actual = resolveJsonPath<unknown>(parsedBody as Record<string, unknown>, fieldPath);
    assert.strictEqual(
      String(actual),
      expectedValue,
      `Mismatch at: ${fieldPath}`
    );
    LoggerUtils.info(`Field verified - ${fieldPath}: "${actual}"`);
  }
}

/** Replaces: ApiSteps.theResponseShouldContainBodyFields */
Then(
  'the response should contain body fields:',
  function (this: CustomWorld, dataTable: DataTable) {
    validateFieldsAgainstParsedBody(getResponse(this), dataTable);
  }
);

/** Replaces: ApiSteps.validateCustomerInformation(DataTable) */
Then(
  'the response should contain customer information:',
  function (this: CustomWorld, dataTable: DataTable) {
    validateFieldsAgainstParsedBody(getResponse(this), dataTable);
  }
);

/** Replaces: ApiSteps.validatePaymentDetails(DataTable) */
Then(
  'the response should contain payment detail:',
  function (this: CustomWorld, dataTable: DataTable) {
    validateFieldsAgainstParsedBody(getResponse(this), dataTable);
  }
);

/** Replaces: ApiSteps.validateProductInformation(DataTable) */
Then(
  'the response should contain product information:',
  function (this: CustomWorld, dataTable: DataTable) {
    validateFieldsAgainstParsedBody(getResponse(this), dataTable);
  }
);

/** Replaces: ApiSteps.theResponseShouldContainFirstDetails */
Then(
  'the response should contain first details:',
  function (this: CustomWorld, dataTable: DataTable) {
    validateFieldsAgainstParsedBody(getResponse(this), dataTable);
  }
);

/** Replaces: ApiSteps.theResponseShouldContainSecondDetails */
Then(
  'the response should contain second details:',
  function (this: CustomWorld, dataTable: DataTable) {
    validateFieldsAgainstParsedBody(getResponse(this), dataTable);
  }
);
