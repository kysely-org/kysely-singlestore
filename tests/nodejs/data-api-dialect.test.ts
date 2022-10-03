import {expect} from 'chai'
import {Kysely} from 'kysely'
import nodeFetch from 'node-fetch'
import {fetch as undiciFetch} from 'undici'

import {SingleStoreDataApiDialect} from '../..'

type Database = {
  person: {
    id: number
    first_name: string | null
    last_name: string | null
  }
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

// it('should execute raw select queries.', async () => {
//   const query = CompiledQuery.raw('select * from `person`')
//   const response: SingleStoreDataApiQueryTuplesResponseBody<{
//     id: number
//     first_name: string | null
//     last_name: string | null
//   }> = {
//     results: [
//       {
//         columns: [
//           {dataType: SingleStoreDataType.BigInt, name: 'id', nullable: false},
//           {dataType: SingleStoreDataType.Varchar, name: 'first_name', nullable: true},
//           {dataType: SingleStoreDataType.Varchar, name: 'last_name', nullable: true},
//         ],
//         rows: [
//           {id: 1, first_name: 'Jennifer', last_name: 'Aniston'},
//           {id: 3, first_name: 'Michael', last_name: 'Jordan'},
//         ],
//       },
//     ],
//   }

//   interceptQuerySuccess(interceptor, response)

//   const result = await connection.executeQuery(query)

//   expect(result).to.be.an('object')
//   expect(result.rows).to.deep.equal(response.results[0].rows)
// })

// it('should execute raw with...select queries.', async () => {
//   const query = CompiledQuery.raw('with zzz as (select 1) select * from zzz')
//   const response: SingleStoreDataApiQueryTuplesResponseBody<{1: number}> = {
//     results: [
//       {
//         columns: [
//           {
//             dataType: SingleStoreDataType.Int,
//             name: '1',
//             nullable: false,
//           },
//         ],
//         rows: [{1: 1}],
//       },
//     ],
//   }

//   interceptQuerySuccess(interceptor, response)

//   const result = await connection.executeQuery(query)

//   expect(result).to.be.an('object')
//   expect(result.rows).to.deep.equal(response.results[0].rows)
// })

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
