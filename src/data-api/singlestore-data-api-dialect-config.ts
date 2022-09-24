export interface SinglestoreDataApiDialectConfig {
  database: string
  fetch: (input: string, init?: FetchRequest) => Promise<FetchResponse>
  hostname: string
  password: string
  port: number
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

export interface SinglestoreDataApiRequestBody {
  sql: string
  args: readonly unknown[]
  database: string
}

export interface SinglestoreDataApiRequestHeaders {
  Authorization: `Basic ${string}`
  'Content-Type': 'application/json'
}

export type SinglestoreDataApiExecRequestBody = SinglestoreDataApiRequestBody

export interface SinglestoreDataApiExecResponseBody {
  lastInsertId: number
  rowsAffected: number
}

export type SinglestoreDataApiQueryTuplesRequestBody = SinglestoreDataApiRequestBody

export interface SinglestoreDataApiQueryTuplesResponseBody<O> {
  results: SinglestoreDataApiQueryTuplesResponseBodyResult<O>[]
  error?: SinglestoreDataApiResponseBodyError
}

export interface SinglestoreDataApiQueryTuplesResponseBodyResult<O> {
  columns: SinglestoreDataApiColumnMetadata[]
  rows: O[]
}

export interface SinglestoreDataApiColumnMetadata {
  name: string
  dataType: string
  nullable: boolean
}

export interface SinglestoreDataApiResponseBodyError {
  code: number
  message: string
}
