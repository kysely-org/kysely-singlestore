import {DialectAdapterBase} from 'kysely'

import {SinglestoreDataApiLocksNotSupportedError} from './data-api-errors.js'

export class SinglestoreDataApiAdapter extends DialectAdapterBase {
  get supportsReturning(): boolean {
    return false
  }

  get supportsTransactionalDdl(): boolean {
    return false
  }

  async acquireMigrationLock(): Promise<void> {
    this.#throwLockError()
  }

  async releaseMigrationLock(): Promise<void> {
    this.#throwLockError()
  }

  #throwLockError(): never {
    throw new SinglestoreDataApiLocksNotSupportedError()
  }
}
