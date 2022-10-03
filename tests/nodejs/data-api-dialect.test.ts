import {expect} from 'chai'
import {Kysely, sql} from 'kysely'
import nodeFetch from 'node-fetch'
import {fetch as undiciFetch} from 'undici'

import {SingleStoreDataApiDialect} from '../../src/dialect/data-api/data-api-dialect'

interface Database {
  person: Person
}

interface Person {
  id: number
  first_name: string | null
  last_name: string | null
}

describe('SingleStoreDataApiDialect', () => {
  let db: Kysely<Database>

  before(() => {
    db = new Kysely({
      dialect: new SingleStoreDataApiDialect({
        database: 'test',
        fetch: getFetch(),
        hostname: 'localhost:9000',
        password: 'test',
        username: 'root',
      }),
    })
  })

  describe('select queries', () => {
    it('should execute select queries.', async () => {
      const people = await db.selectFrom('person').selectAll().execute()

      expect(people).to.be.an('array').with.length.greaterThan(0)
    })

    it('should execute raw select queries.', async () => {
      const {rows: people} = await sql<Person>`select * from ${sql.table('person')}`.execute(db)

      expect(people).to.be.an('array').with.length.greaterThan(0)
    })

    it('should execute raw with...select queries.', async () => {
      const {rows: jennifers} = await sql<Person>`with jennifers as (select * from ${sql.table(
        'person',
      )} where ${sql.ref('first_name')} = ${sql.literal('Jennifer')}) select * from jennifers`.execute(db)

      expect(jennifers).to.be.an('array').with.length.greaterThan(0)
    })
  })

  describe.skip('insert queries', () => {
    // TODO: ...
  })

  describe.skip('update queries', () => {
    // TODO: ...
  })

  describe.skip('delete queries', () => {
    // TODO: ...
  })

  describe.skip('ddl queries', () => {
    // TODO: ...
  })
})

export function getFetch() {
  const {version} = process

  console.log('version', version)

  if (version.startsWith('v18')) {
    return fetch
  }

  if (version.startsWith('v16')) {
    return undiciFetch
  }

  return nodeFetch
}
