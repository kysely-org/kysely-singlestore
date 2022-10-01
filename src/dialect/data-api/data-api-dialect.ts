import {
  MysqlIntrospector,
  MysqlQueryCompiler,
  type DatabaseIntrospector,
  type Dialect,
  type DialectAdapter,
  type Driver,
  type Kysely,
  type QueryCompiler,
} from 'kysely'

import {SingleStoreDataApiAdapter} from './data-api-adapter.js'
import {SingleStoreDataApiDriver} from './data-api-driver.js'
import type {SingleStoreDataApiDialectConfig} from './types.js'

export class SingleStoreDataApiDialect implements Dialect {
  #config: SingleStoreDataApiDialectConfig

  constructor(config: SingleStoreDataApiDialectConfig) {
    this.#config = config
  }

  createAdapter(): DialectAdapter {
    return new SingleStoreDataApiAdapter()
  }

  createDriver(): Driver {
    return new SingleStoreDataApiDriver(this.#config)
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new MysqlIntrospector(db)
  }

  createQueryCompiler(): QueryCompiler {
    return new MysqlQueryCompiler()
  }
}
