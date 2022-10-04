import type {DatabaseConnection, Driver} from 'kysely'

import {encodeToBase64} from '../../util/encode-to-base64.js'
import {SingleStoreDataApiConnection} from './data-api-connection.js'
import {SingleStoreDataApiTransactionsNotSupportedError} from './data-api-errors.js'
import {SingleStoreDataApiResultDeserializer} from './data-api-result-deserializer.js'
import type {SingleStoreDataApiDialectConfig, SingleStoreDataApiRequestHeaders} from './types.js'

export class SingleStoreDataApiDriver implements Driver {
  readonly #config: SingleStoreDataApiDialectConfig
  readonly #requestHeaders: SingleStoreDataApiRequestHeaders
  readonly #resultDeserializer: SingleStoreDataApiResultDeserializer

  constructor(config: SingleStoreDataApiDialectConfig) {
    this.#config = {...config}
    this.#requestHeaders = this.#createRequestHeaders()
    this.#resultDeserializer = new SingleStoreDataApiResultDeserializer(this.#config.deserialization)
  }

  async init(): Promise<void> {
    // noop
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new SingleStoreDataApiConnection(this.#config, this.#requestHeaders, this.#resultDeserializer)
  }

  async beginTransaction(): Promise<never> {
    this.#throwTransactionError()
  }

  async commitTransaction(): Promise<never> {
    this.#throwTransactionError()
  }

  async rollbackTransaction(): Promise<never> {
    this.#throwTransactionError()
  }

  async releaseConnection(): Promise<void> {
    // noop
  }

  async destroy(): Promise<void> {
    // noop
  }

  #createRequestHeaders(): SingleStoreDataApiRequestHeaders & Record<string, string> {
    const decodedAuth = `${this.#config.username}:${this.#config.password}`

    const auth = encodeToBase64(decodedAuth)

    return {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    }
  }

  #throwTransactionError(): never {
    throw new SingleStoreDataApiTransactionsNotSupportedError()
  }
}
