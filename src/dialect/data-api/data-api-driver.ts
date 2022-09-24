import type {DatabaseConnection, Driver} from 'kysely'

import {SinglestoreDataApiColumnMetadataStore} from '../../util'
import {SinglestoreDataApiConnection} from './data-api-connection'
import {SinglestoreDataApiTransactionsNotSupportedError} from './data-api-errors'
import type {SinglestoreDataApiDialectConfig} from './types'

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
