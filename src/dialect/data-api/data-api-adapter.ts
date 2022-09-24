import {DialectAdapterBase} from 'kysely'

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

export class SinglestoreDataApiLocksNotSupportedError extends Error {
  constructor() {
    super('Singlestore Data API does not support locks!')

    this.name = 'SinglestoreDataApiLocksNotSupportedError'
  }
}
