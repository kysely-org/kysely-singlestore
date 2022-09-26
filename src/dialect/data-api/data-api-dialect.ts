import {MysqlIntrospector, MysqlQueryCompiler, type Dialect, type Kysely} from 'kysely'

import {SinglestoreDataApiAdapter} from './data-api-adapter.js'
import {SinglestoreDataApiDriver} from './data-api-driver.js'
import type {SinglestoreDataApiDialectConfig} from './types.js'

export class SinglestoreDataApiDialect implements Dialect {
  #config: SinglestoreDataApiDialectConfig

  constructor(config: SinglestoreDataApiDialectConfig) {
    this.#config = config
  }

  createAdapter(): SinglestoreDataApiAdapter {
    return new SinglestoreDataApiAdapter()
  }

  createDriver(): SinglestoreDataApiDriver {
    return new SinglestoreDataApiDriver(this.#config)
  }

  createIntrospector(db: Kysely<any>): MysqlIntrospector {
    return new MysqlIntrospector(db)
  }

  createQueryCompiler(): MysqlQueryCompiler {
    return new MysqlQueryCompiler()
  }
}
