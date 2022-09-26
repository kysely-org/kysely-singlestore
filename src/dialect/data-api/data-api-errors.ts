import type {SinglestoreDataApiResponseBodyError} from './types.js'

export class SinglestoreDataApiDatabaseError extends Error {
  body: SinglestoreDataApiResponseBodyError
  status: number

  constructor(message: string, status: number, body: SinglestoreDataApiResponseBodyError) {
    super(message)

    this.body = body
    this.name = 'SinglestoreDataApiDatabaseError'
    this.status = status
  }
}

export class SinglestoreDataApiLocksNotSupportedError extends Error {
  constructor() {
    super('Singlestore Data API does not support locks!')

    this.name = 'SinglestoreDataApiLocksNotSupportedError'
  }
}

export class SinglestoreDataApiStreamingNotSupportedError extends Error {
  constructor() {
    super('Singlestore Data API does not support streaming!')

    this.name = 'SinglestoreDataApiStreamingNotSupportedError'
  }
}

export class SinglestoreDataApiTransactionsNotSupportedError extends Error {
  constructor() {
    super('Singlestore Data API does not support transactions!')

    this.name = 'SinglestoreDataApiTransactionsNotSupportedError'
  }
}
