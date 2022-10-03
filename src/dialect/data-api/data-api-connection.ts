import type {CompiledQuery, DatabaseConnection, QueryResult} from 'kysely'

import {SingleStoreDataApiColumnMetadataStore} from '../../util/data-api-column-metadata-store.js'
import {isSelectQuery} from '../../util/is-select-query.js'
import {SingleStoreDataApiDatabaseError, SingleStoreDataApiStreamingNotSupportedError} from './data-api-errors.js'
import type {
  FetchResponse,
  SingleStoreDataApiDialectConfig,
  SingleStoreDataApiExecRequestBody,
  SingleStoreDataApiExecResponseBody,
  SingleStoreDataApiQueryTuplesRequestBody,
  SingleStoreDataApiQueryTuplesResponseBody,
  SingleStoreDataApiRequestBody,
  SingleStoreDataApiRequestHeaders,
} from './types.js'

const API_VERSION = 'v2'

export class SingleStoreDataApiConnection implements DatabaseConnection {
  readonly #config: SingleStoreDataApiDialectConfig
  readonly #basePath: string

  constructor(config: SingleStoreDataApiDialectConfig) {
    this.#config = {...config}

    const {hostname} = this.#config
    const protocol = hostname.startsWith('localhost') ? 'http' : 'https'

    this.#basePath = `${protocol}://${hostname}`
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    if (isSelectQuery(compiledQuery)) {
      return await this.#executeSelectQuery(compiledQuery)
    }

    return await this.#executeMutationQuery(compiledQuery)
  }

  streamQuery(): never {
    throw new SingleStoreDataApiStreamingNotSupportedError()
  }

  async #executeSelectQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const url = this.#resolveRequestUrl('query/tuples')

    const requestBody: SingleStoreDataApiQueryTuplesRequestBody = this.#createRequestBody(compiledQuery)

    const {error, results} = await this.#postJSON<SingleStoreDataApiQueryTuplesResponseBody<R>>(url, requestBody)

    if (error) {
      throw new SingleStoreDataApiDatabaseError(error.message, 400, error)
    }

    const [result] = results

    if (SingleStoreDataApiColumnMetadataStore.enabled) {
      SingleStoreDataApiColumnMetadataStore.getInstance().write(compiledQuery.sql, result.columns)
    }

    return {
      rows: result.rows,
    }
  }

  async #executeMutationQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const url = this.#resolveRequestUrl('exec')

    const requestBody: SingleStoreDataApiExecRequestBody = this.#createRequestBody(compiledQuery)

    const result = await this.#postJSON<SingleStoreDataApiExecResponseBody>(url, requestBody)

    return {
      insertId: BigInt(result.lastInsertId),
      numUpdatedOrDeletedRows: BigInt(result.rowsAffected),
      rows: [],
    }
  }

  #resolveRequestUrl(resource: string): URL {
    return new URL(`/api/${API_VERSION}/${resource}`, this.#basePath)
  }

  #createRequestBody(compiledQuery: CompiledQuery): SingleStoreDataApiRequestBody {
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
      await this.#throwApiError(response)
    }

    return await response.json()
  }

  #createRequestHeaders(): SingleStoreDataApiRequestHeaders & Record<string, string> {
    const decodedAuth = `${this.#config.username}:${this.#config.password}`

    const auth = typeof process === 'undefined' ? btoa(decodedAuth) : Buffer.from(decodedAuth).toString('base64')

    return {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    }
  }

  async #throwApiError(response: FetchResponse): Promise<never> {
    let error = null

    try {
      const {error: responseError} = await response.json()

      error = new SingleStoreDataApiDatabaseError(response.statusText, response.status, responseError)
    } catch {
      error = new SingleStoreDataApiDatabaseError(response.statusText, response.status, {
        code: response.status,
        message: response.statusText,
      })
    }

    throw error
  }
}
