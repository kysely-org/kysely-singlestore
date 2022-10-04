export interface SingleStoreDataApiDialectConfig {
  /**
   * SingleStore database name.
   */
  database: string

  /**
   * Control casting of values returned from SingleStore Data API.
   *
   * By default, data is returned as-is.
   */
  deserialization?: SingleStoreDataApiDeserializationConfig

  /**
   * Fetch function used to communicate with the API.
   *
   * For browsers and `node 18.x` and above, pass built-in `fetch`.
   *
   * For `node 16.x` and above, pass `undici` or `node-fetch`.
   *
   * For `node 14.x` and below, pass `node-fetch`.
   */
  fetch: (input: string, init?: FetchRequest) => Promise<FetchResponse>

  /**
   * SingleStore cluster hostname.
   */
  hostname: string

  /**
   * SingleStore database password.
   */
  password: string

  /**
   * SingleStore database username.
   */
  username: string
}

export interface SingleStoreDataApiDeserializationConfig {
  /**
   * Should cast `DATE`, `DATETIME` and `TIMESTAMP` as native Date.
   *
   * Default is `false`.
   */
  castDatesAsNativeDates?: boolean

  /**
   * Should cast `TINYINT` as `boolean`? otherwise keep as `number`.
   *
   * Default is `false`.
   */
  castTinyIntAsBoolean?: boolean

  /**
   * Custom column deserializer function.
   *
   * In order to fallback to default plugin behavior, return `undefined`.
   */
  deserialize?: (value: unknown, dataType: string, columnName: string) => unknown

  /**
   * Should cast `DECIMAL` as `number`? otherwise keep as `string`.
   *
   * Default is `false`.
   */
  unwrapDecimals?: boolean
}

export interface FetchRequest {
  method: 'POST'
  headers: Record<string, string>
  body: string
}

export interface FetchResponse {
  ok: boolean
  status: number
  statusText: string
  json: () => Promise<any>
  text: () => Promise<string>
}

export interface SingleStoreDataApiRequestBody {
  sql: string
  args: readonly unknown[]
  database: string
}

export interface SingleStoreDataApiRequestHeaders {
  Authorization: `Basic ${string}`
  'Content-Type': 'application/json'
  [x: string]: string
}

export type SingleStoreDataApiExecRequestBody = SingleStoreDataApiRequestBody

export interface SingleStoreDataApiExecResponseBody {
  lastInsertId: number
  rowsAffected: number
}

export type SingleStoreDataApiQueryTuplesRequestBody = SingleStoreDataApiRequestBody

export interface SingleStoreDataApiQueryTuplesResponseBody {
  results: SingleStoreDataApiQueryTuplesResponseBodyResult[]
  error?: SingleStoreDataApiResponseBodyError
}

export interface SingleStoreDataApiQueryTuplesResponseBodyResult {
  columns: ReadonlyArray<SingleStoreDataApiColumnMetadata>
  rows: ReadonlyArray<ReadonlyArray<unknown>>
}

export interface SingleStoreDataApiColumnMetadata {
  name: string
  dataType: string
  nullable: boolean
}

export interface SingleStoreDataApiResponseBodyError {
  code: number
  message: string
}
