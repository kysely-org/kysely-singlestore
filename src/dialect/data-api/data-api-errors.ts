import type {SingleStoreDataApiResponseBodyError} from './types.js'

export class SingleStoreDataApiDatabaseError extends Error {
  body: SingleStoreDataApiResponseBodyError
  status: number

  constructor(message: string, status: number, body: SingleStoreDataApiResponseBodyError) {
    super(message)

    this.body = body
    this.name = 'SingleStoreDataApiDatabaseError'
    this.status = status
  }
}

export class SingleStoreDataApiLocksNotSupportedError extends Error {
  constructor() {
    super('SingleStore Data API does not support locks!')

    this.name = 'SingleStoreDataApiLocksNotSupportedError'
  }
}

export class SingleStoreDataApiStreamingNotSupportedError extends Error {
  constructor() {
    super('SingleStore Data API does not support streaming!')

    this.name = 'SingleStoreDataApiStreamingNotSupportedError'
  }
}

export class SingleStoreDataApiTransactionsNotSupportedError extends Error {
  constructor() {
    super('SingleStore Data API does not support transactions!')

    this.name = 'SingleStoreDataApiTransactionsNotSupportedError'
  }
}
