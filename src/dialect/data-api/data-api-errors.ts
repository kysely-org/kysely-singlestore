import type {SinglestoreDataApiResponseBodyError} from './types'

export class SinglestoreDataApiDatabaseError extends Error {
  body: SinglestoreDataApiResponseBodyError
  status: number

  constructor(message: string, status: number, body: SinglestoreDataApiResponseBodyError) {
    super(message)

    this.status = status
    this.name = 'SinglestoreDataApiDatabaseError'
    this.body = body
  }
}

export class SinglestoreDataApiStreamingNotSupportedError extends Error {
  constructor() {
    super('Singlestore Data API does not supported streaming!')

    this.name = 'SinglestoreDataApiStreamingNotSupportedError'
  }
}

export class SinglestoreDataApiTransactionsNotSupportedError extends Error {
  constructor() {
    super('Singlestore Data API does not support transactions!')

    this.name = 'SinglestoreDataApiTransactionsNotSupportedError'
  }
}
