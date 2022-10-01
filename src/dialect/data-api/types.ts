export interface SingleStoreDataApiDialectConfig {
  database: string
  fetch: (input: string, init?: FetchRequest) => Promise<FetchResponse>
  hostname: string
  password: string
  username: string
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

export interface SingleStoreDataApiQueryTuplesResponseBody<O> {
  results: SingleStoreDataApiQueryTuplesResponseBodyResult<O>[]
  error?: SingleStoreDataApiResponseBodyError
}

export interface SingleStoreDataApiQueryTuplesResponseBodyResult<O> {
  columns: SingleStoreDataApiColumnMetadata[]
  rows: O[]
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
