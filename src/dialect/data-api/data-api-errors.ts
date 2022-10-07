export class SingleStoreDataApiDatabaseError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)

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

export class SingleStoreDataApiMultipleStatementsNotSupportedError extends Error {
  constructor() {
    super('SingleStore Data API does not support multiple statements!')

    this.name = 'SingleStoreDataApiMultipleStatementsNotSupportedError'
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
