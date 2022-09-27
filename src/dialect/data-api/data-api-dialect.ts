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

import {SinglestoreDataApiAdapter} from './data-api-adapter.js'
import {SinglestoreDataApiDriver} from './data-api-driver.js'
import type {SinglestoreDataApiDialectConfig} from './types.js'

export class SinglestoreDataApiDialect implements Dialect {
  #config: SinglestoreDataApiDialectConfig

  constructor(config: SinglestoreDataApiDialectConfig) {
    this.#config = config
  }

  createAdapter(): DialectAdapter {
    return new SinglestoreDataApiAdapter()
  }

  createDriver(): Driver {
    return new SinglestoreDataApiDriver(this.#config)
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new MysqlIntrospector(db)
  }

  createQueryCompiler(): QueryCompiler {
    return new MysqlQueryCompiler()
  }
}
