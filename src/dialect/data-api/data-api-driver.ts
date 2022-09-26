import type {DatabaseConnection, Driver} from 'kysely'

import {SinglestoreDataApiColumnMetadataStore} from '../../util/index.js'
import {SinglestoreDataApiConnection} from './data-api-connection.js'
import {SinglestoreDataApiTransactionsNotSupportedError} from './data-api-errors.js'
import type {SinglestoreDataApiDialectConfig} from './types.js'

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
    SinglestoreDataApiColumnMetadataStore.getInstance().destroy()
  }

  #throwTransactionError(): never {
    throw new SinglestoreDataApiTransactionsNotSupportedError()
  }
}
