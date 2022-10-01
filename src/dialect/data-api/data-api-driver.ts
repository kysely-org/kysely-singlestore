import type {DatabaseConnection, Driver} from 'kysely'
import {SingleStoreDataApiColumnMetadataStore} from '../../util/data-api-column-metadata-store.js'

import {SingleStoreDataApiConnection} from './data-api-connection.js'
import {SingleStoreDataApiTransactionsNotSupportedError} from './data-api-errors.js'
import type {SingleStoreDataApiDialectConfig} from './types.js'

export class SingleStoreDataApiDriver implements Driver {
  readonly #config: SingleStoreDataApiDialectConfig

  constructor(config: SingleStoreDataApiDialectConfig) {
    this.#config = {...config}
  }

  async init(): Promise<void> {
    // noop
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new SingleStoreDataApiConnection(this.#config)
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
    SingleStoreDataApiColumnMetadataStore.destroy()
  }

  #throwTransactionError(): never {
    throw new SingleStoreDataApiTransactionsNotSupportedError()
  }
}
