import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { Config } from '../utils/Config';
import { LoggerUtils } from '../utils/LoggerUtils';

/**
 * ApiResponse – thin wrapper around AxiosResponse.
 * Mirrors Java's RestAssured Response interface used in ApiSteps.
 */
export interface ApiResponse {
  statusCode: number;
  statusLine: string;
  body: unknown;
  bodyAsString: string;
  headers: Record<string, string>;
  jsonPath: <T>(path: string) => T | undefined;
}

/**
 * RestClient – replaces Java RestClient.java (RestAssured-based).
 *
 * Uses Axios as the HTTP client (the Node.js equivalent of Apache HttpClient
 * underneath RestAssured).
 *
 * Design mirrors the Java fluent builder:
 *   RestClient.reset().withHeaders({...}).withQueryParams({...}).get(endpoint)
 */
export class RestClient {
  private readonly client: AxiosInstance;
  private headers: Record<string, string> = { 'Content-Type': 'application/json' };
  private queryParams: Record<string, string> = {};
  private static requestBody: string | null = null;
  private static lastResponse: ApiResponse | null = null;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL ?? Config.getApiBaseUrl(),
      timeout: Config.getDefaultTimeout(),
    });

    if (Config.isDebugMode()) {
      this.client.interceptors.request.use((req) => {
        LoggerUtils.debug(`[REQUEST] ${req.method?.toUpperCase()} ${req.baseURL}${req.url}`);
        LoggerUtils.debug(`[REQUEST HEADERS] ${JSON.stringify(req.headers)}`);
        if (req.data) LoggerUtils.debug(`[REQUEST BODY] ${JSON.stringify(req.data)}`);
        return req;
      });
      this.client.interceptors.response.use((res) => {
        LoggerUtils.debug(`[RESPONSE STATUS] ${res.status} ${res.statusText}`);
        LoggerUtils.debug(`[RESPONSE HEADERS] ${JSON.stringify(res.headers)}`);
        LoggerUtils.debug(`[RESPONSE BODY] ${JSON.stringify(res.data)}`);
        return res;
      });
    }
  }

  // ─── Builder Methods (fluent, replaces RestClient.reset().withHeaders().withQueryParams()) ──

  withHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  withQueryParams(params: Record<string, string>): this {
    this.queryParams = { ...this.queryParams, ...params };
    return this;
  }

  // ─── Static Factory Reset (replaces RestClient.reset()) ──────────────────

  static reset(baseURL?: string): RestClient {
    return new RestClient(baseURL);
  }

  // ─── Request Body (replaces RestClient.setRequestBody / getRequestBody) ──

  static setRequestBody(body: string): void {
    RestClient.requestBody = body;
  }

  static getRequestBody(): string | null {
    return RestClient.requestBody;
  }

  // ─── HTTP Methods ─────────────────────────────────────────────────────────

  async get(endpoint: string): Promise<ApiResponse> {
    const res = await this.client.get(endpoint, this.buildConfig());
    return (RestClient.lastResponse = this.wrap(res));
  }

  async post(endpoint: string, body?: unknown): Promise<ApiResponse> {
    const res = await this.client.post(endpoint, body ?? null, this.buildConfig());
    return (RestClient.lastResponse = this.wrap(res));
  }

  async put(endpoint: string, body?: unknown): Promise<ApiResponse> {
    const res = await this.client.put(endpoint, body ?? null, this.buildConfig());
    return (RestClient.lastResponse = this.wrap(res));
  }

  async patch(endpoint: string, body?: unknown): Promise<ApiResponse> {
    const res = await this.client.patch(endpoint, body ?? null, this.buildConfig());
    return (RestClient.lastResponse = this.wrap(res));
  }

  async delete(endpoint: string): Promise<ApiResponse> {
    const res = await this.client.delete(endpoint, this.buildConfig());
    return (RestClient.lastResponse = this.wrap(res));
  }

  // ─── Static Utility Accessors (replaces static RestClient helpers) ────────

  static getStatusCode(): number {
    if (!RestClient.lastResponse) throw new Error('No response stored. Send a request first.');
    return RestClient.lastResponse.statusCode;
  }

  static getResponseBodyAsString(): string {
    if (!RestClient.lastResponse) throw new Error('No response stored. Send a request first.');
    return RestClient.lastResponse.bodyAsString;
  }

  static getHeader(name: string): string | undefined {
    if (!RestClient.lastResponse) throw new Error('No response stored. Send a request first.');
    return RestClient.lastResponse.headers[name.toLowerCase()];
  }

  static hasHeader(name: string): boolean {
    if (!RestClient.lastResponse) throw new Error('No response stored. Send a request first.');
    return name.toLowerCase() in RestClient.lastResponse.headers;
  }

  static getLastResponse(): ApiResponse | null {
    return RestClient.lastResponse;
  }

  // ─── Internal Helpers ────────────────────────────────────────────────────

  private buildConfig(): AxiosRequestConfig {
    return {
      headers: this.headers,
      params: this.queryParams,
      // Don't throw on non-2xx status codes (replaces RestAssured permissive behavior)
      validateStatus: () => true,
    };
  }

  private wrap(res: AxiosResponse): ApiResponse {
    let parsedData = res.data;
    if (typeof parsedData === 'string') {
      try {
        parsedData = JSON.parse(parsedData);
      } catch (e) {
        // Leave as string if not parseable
      }
    }
    const bodyAsString = typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData);
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(res.headers)) {
      headers[k.toLowerCase()] = String(v);
    }

    return {
      statusCode: res.status,
      statusLine: `HTTP/1.1 ${res.status} ${res.statusText}`,
      body: parsedData,
      bodyAsString,
      headers,
      /**
       * jsonPath – replaces RestAssured's .jsonPath().getString("some.path")
       * Supports dot-notation and array notation: "items[0].name"
       */
      jsonPath: <T>(path: string): T | undefined => {
        return resolveJsonPath<T>(parsedData as Record<string, unknown>, path);
      },
    };
  }
}

/**
 * Resolve a dot-notation path (with array index support) from a JSON object.
 * Replaces RestAssured's .jsonPath().getString("customer.address.city")
 *
 * Examples:
 *   "customer.name"         → obj.customer.name
 *   "items[0].name"         → obj.items[0].name
 *   "parsedBody.items[1]"   → obj.parsedBody.items[1]
 */
export function resolveJsonPath<T>(obj: unknown, path: string): T | undefined {
  const segments = path.split('.');
  let current: unknown = obj;

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;

    const arrayMatch = segment.match(/^(.+?)\[(\d+)\]$/);
    if (arrayMatch) {
      const fieldName = arrayMatch[1];
      const index = parseInt(arrayMatch[2], 10);
      current = (current as Record<string, unknown[]>)[fieldName]?.[index];
    } else {
      current = (current as Record<string, unknown>)[segment];
    }
  }

  return current as T;
}
