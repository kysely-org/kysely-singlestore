import type {CompiledQuery, DatabaseConnection, QueryResult} from 'kysely'

import {isCompiledSelectQuery, SinglestoreDataApiColumnMetadataStore, type CompiledSelectQuery} from '../../util'
import {SinglestoreDataApiDatabaseError, SinglestoreDataApiStreamingNotSupportedError} from './data-api-errors'
import type {
  FetchResponse,
  SinglestoreDataApiDialectConfig,
  SinglestoreDataApiExecRequestBody,
  SinglestoreDataApiExecResponseBody,
  SinglestoreDataApiQueryTuplesRequestBody,
  SinglestoreDataApiQueryTuplesResponseBody,
  SinglestoreDataApiRequestBody,
  SinglestoreDataApiRequestHeaders,
} from './types'

const API_VERSION = 'v2'

export class SinglestoreDataApiConnection implements DatabaseConnection {
  readonly #config: SinglestoreDataApiDialectConfig

  constructor(config: SinglestoreDataApiDialectConfig) {
    this.#config = {...config}
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    if (isCompiledSelectQuery(compiledQuery)) {
      return await this.#executeSelectQuery(compiledQuery)
    }

    return await this.#executeMutationQuery(compiledQuery)
  }

  streamQuery(): never {
    throw new SinglestoreDataApiStreamingNotSupportedError()
  }

  async #executeSelectQuery<R>(compiledQuery: CompiledSelectQuery): Promise<QueryResult<R>> {
    const url = this.#resolveRequestUrl('query/tuples')

    const requestBody: SinglestoreDataApiQueryTuplesRequestBody = this.#createRequestBody(compiledQuery)

    const {error, results} = await this.#postJSON<SinglestoreDataApiQueryTuplesResponseBody<R>>(url, requestBody)

    if (error) {
      throw new SinglestoreDataApiDatabaseError(error.message, 400, error)
    }

    const [result] = results

    if (SinglestoreDataApiColumnMetadataStore.enabled) {
      SinglestoreDataApiColumnMetadataStore.getInstance().write(compiledQuery.sql, result.columns)
    }

    return {
      rows: result.rows,
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
    return new URL(`/api/${API_VERSION}/${resource}`, `https://${this.#config.hostname}`)
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
