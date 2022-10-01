import {DialectAdapterBase, type Kysely} from 'kysely'

import {SingleStoreDataApiLocksNotSupportedError} from './data-api-errors.js'

export class SingleStoreDataApiAdapter extends DialectAdapterBase {
  get supportsReturning(): boolean {
    return false
  }

  get supportsTransactionalDdl(): boolean {
    return false
  }

  async acquireMigrationLock(db: Kysely<any>): Promise<void> {
    this.#throwLockError()
  }

  async releaseMigrationLock(db: Kysely<any>): Promise<void> {
    this.#throwLockError()
  }

  #throwLockError(): never {
    throw new SingleStoreDataApiLocksNotSupportedError()
  }
}
