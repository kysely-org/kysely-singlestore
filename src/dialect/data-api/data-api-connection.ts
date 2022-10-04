import type {CompiledQuery, DatabaseConnection, QueryResult} from 'kysely'

import {isSelectQuery} from '../../util/is-select-query.js'
import {SingleStoreDataApiDatabaseError, SingleStoreDataApiStreamingNotSupportedError} from './data-api-errors.js'
import {SingleStoreDataApiResultDeserializer} from './data-api-result-deserializer.js'
import type {
  FetchResponse,
  SingleStoreDataApiDialectConfig,
  SingleStoreDataApiExecResponseBody,
  SingleStoreDataApiQueryTuplesResponseBody,
  SingleStoreDataApiRequestBody,
  SingleStoreDataApiRequestHeaders,
} from './types.js'

/**
 * @internal
 */
export class SingleStoreDataApiConnection implements DatabaseConnection {
  readonly #basePath: string
  readonly #config: SingleStoreDataApiDialectConfig
  readonly #requestHeaders: SingleStoreDataApiRequestHeaders
  readonly #resultDeserializer: SingleStoreDataApiResultDeserializer

  constructor(
    config: SingleStoreDataApiDialectConfig,
    headers: SingleStoreDataApiRequestHeaders,
    resultDeserializer: SingleStoreDataApiResultDeserializer,
  ) {
    this.#config = {...config}
    this.#basePath = this.#resolveBasePath()
    this.#requestHeaders = headers
    this.#resultDeserializer = resultDeserializer
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

  #resolveBasePath(): string {
    const {hostname} = this.#config
    const protocol = hostname.startsWith('localhost') ? 'http' : 'https'

    return `${protocol}://${hostname}`
  }

  async #executeSelectQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const {error, results} = await this.#sendPostRequest<SingleStoreDataApiQueryTuplesResponseBody>(
      'query/tuples',
      compiledQuery,
    )

    if (error) {
      throw new SingleStoreDataApiDatabaseError(error.message, 400, error)
    }

    const [result] = results

    return this.#resultDeserializer.deserializeResult<O>(result)
  }

  async #executeMutationQuery(compiledQuery: CompiledQuery): Promise<QueryResult<never>> {
    const result = await this.#sendPostRequest<SingleStoreDataApiExecResponseBody>('exec', compiledQuery)

    return {
      insertId: BigInt(result.lastInsertId),
      numUpdatedOrDeletedRows: BigInt(result.rowsAffected),
      rows: [],
    }
  }

  #resolveRequestUrl(resource: string): URL {
    return new URL(`/api/v2/${resource}`, this.#basePath)
  }

  #createRequestBody(compiledQuery: CompiledQuery): SingleStoreDataApiRequestBody {
    return {
      args: compiledQuery.parameters,
      database: this.#config.database,
      sql: compiledQuery.sql,
    }
  }

  async #sendPostRequest<R>(resource: string, compiledQuery: CompiledQuery): Promise<R> {
    const requestBody = this.#createRequestBody(compiledQuery)

    const url = this.#resolveRequestUrl(resource).toString()

    const response = await this.#config.fetch(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: this.#requestHeaders,
    })

    if (!response.ok) {
      await this.#throwApiError(response)
    }

    return await response.json()
  }

  async #throwApiError(response: FetchResponse): Promise<never> {
    let body = {
      code: response.status,
      message: response.statusText,
    }

    try {
      ;({error: body} = await response.json())
    } catch {}

    throw new SingleStoreDataApiDatabaseError(response.statusText, response.status, body)
  }
}
