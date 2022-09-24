import type {CompiledQuery, DatabaseConnection, Driver, QueryResult} from 'kysely'

import type {
  FetchResponse,
  SinglestoreDataApiDialectConfig,
  SinglestoreDataApiExecRequestBody,
  SinglestoreDataApiExecResponseBody,
  SinglestoreDataApiQueryTuplesRequestBody,
  SinglestoreDataApiQueryTuplesResponseBody,
  SinglestoreDataApiRequestBody,
  SinglestoreDataApiRequestHeaders,
  SinglestoreDataApiResponseBodyError,
} from './singlestore-data-api-dialect-config'

const API_VERSION = 'v2'

export class SinglestoreDataApiDriver implements Driver {
  readonly #config: SinglestoreDataApiDialectConfig

  constructor(config: SinglestoreDataApiDialectConfig) {
    this.#config = {...config}
  }

  async init(): Promise<void> {
    // noop
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new SinglestoreDataApiConnection(this.#config)
  }

  async beginTransaction(): Promise<void> {
    this.#throwTransactionError()
  }

  async commitTransaction(): Promise<void> {
    this.#throwTransactionError()
  }

  async rollbackTransaction(): Promise<void> {
    this.#throwTransactionError()
  }

  async releaseConnection(): Promise<void> {
    // noop
  }

  async destroy(): Promise<void> {
    // noop
  }

  #throwTransactionError(): never {
    throw new SinglestoreDataApiTransactionsNotSupportedError()
  }
}

export class SinglestoreDataApiTransactionsNotSupportedError extends Error {
  constructor() {
    super('Singlestore Data API does not support transactions!')

    this.name = 'SinglestoreDataApiTransactionsNotSupportedError'
  }
}

class SinglestoreDataApiConnection implements DatabaseConnection {
  #config: SinglestoreDataApiDialectConfig

  constructor(config: SinglestoreDataApiDialectConfig) {
    this.#config = {...config}
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    if (compiledQuery.query.kind === 'SelectQueryNode') {
      return await this.#executeSelectQuery(compiledQuery)
    }

    return await this.#executeMutationQuery(compiledQuery)
  }

  streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new SinglestoreDataApiStreamingNotSupportedError()
  }

  async #executeSelectQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const url = this.#resolveRequestUrl('query/tuples')

    const requestBody: SinglestoreDataApiQueryTuplesRequestBody = this.#createRequestBody(compiledQuery)

    const {error, results} = await this.#postJSON<SinglestoreDataApiQueryTuplesResponseBody<R>>(url, requestBody)

    if (error) {
      throw new SinglestoreDataApiDatabaseError(error.message, 400, error)
    }

    return {
      rows: results[0].rows,
    }
  }

  async #executeMutationQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const url = this.#resolveRequestUrl('exec')

    const requestBody: SinglestoreDataApiExecRequestBody = this.#createRequestBody(compiledQuery)

    const result = await this.#postJSON<SinglestoreDataApiExecResponseBody>(url, requestBody)

    return {
      insertId: BigInt(result.lastInsertId),
      numUpdatedOrDeletedRows: BigInt(result.rowsAffected),
      rows: [],
    }
  }

  #resolveRequestUrl(resource: string): URL {
    return new URL(`/api/${API_VERSION}/${resource}`, `https://${this.#config.hostname}:${this.#config.port}`)
  }

  #createRequestBody(compiledQuery: CompiledQuery): SinglestoreDataApiRequestBody {
    return {
      args: compiledQuery.parameters,
      database: this.#config.database,
      sql: compiledQuery.sql,
    }
  }

  async #postJSON<R>(url: URL, body = {}): Promise<R> {
    const response = await this.#config.fetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify(body),
      headers: this.#createRequestHeaders(),
    })

    if (!response.ok) {
      this.#throwApiError(response)
    }

    return await response.json()
  }

  #createRequestHeaders(): SinglestoreDataApiRequestHeaders & Record<string, string> {
    const auth = btoa(`${this.#config.username}:${this.#config.password}`)

    return {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    }
  }

  async #throwApiError(response: FetchResponse): Promise<never> {
    let error = null

    try {
      const {error: responseError} = await response.json()

      error = new SinglestoreDataApiDatabaseError(response.statusText, response.status, responseError)
    } catch {
      error = new SinglestoreDataApiDatabaseError(response.statusText, response.status, {
        code: response.status,
        message: response.statusText,
      })
    }

    throw error
  }
}

export class SinglestoreDataApiStreamingNotSupportedError extends Error {
  constructor() {
    super('Singlestore Data API does not supported streaming!')

    this.name = 'SinglestoreDataApiStreamingNotSupportedError'
  }
}

export class SinglestoreDataApiDatabaseError extends Error {
  body: SinglestoreDataApiResponseBodyError
  status: number

  constructor(message: string, status: number, body: SinglestoreDataApiResponseBodyError) {
    super(message)

    this.status = status
    this.name = 'SinglestoreDataApiDatabaseError'
    this.body = body
  }
}
