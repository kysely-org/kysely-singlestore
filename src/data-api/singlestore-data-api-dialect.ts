import {MysqlQueryCompiler, type DatabaseIntrospector, type Dialect, type Kysely} from 'kysely'

import {SinglestoreDataApiAdapter} from './singlestore-data-api-adapter'
import {SinglestoreDataApiDialectConfig} from './singlestore-data-api-dialect-config'
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

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return {
      getMetadata: async () => {
        throw new Error('unimplemented!')
      },
      getSchemas: async () => {
        throw new Error('Unimplemented!')
      },
      getTables: async () => {
        throw new Error('Unimplemented!')
      },
    }
  }

  createQueryCompiler(): MysqlQueryCompiler {
    return new MysqlQueryCompiler()
  }
}
