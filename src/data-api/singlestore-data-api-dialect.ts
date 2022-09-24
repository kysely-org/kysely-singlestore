import {MysqlIntrospector, MysqlQueryCompiler, type Dialect, type Kysely} from 'kysely'

import {SinglestoreDataApiAdapter} from './singlestore-data-api-adapter'
import type {SinglestoreDataApiDialectConfig} from './singlestore-data-api-dialect-config'
import {SinglestoreDataApiDriver} from './singlestore-data-api-driver'

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
