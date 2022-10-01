import {expect} from 'chai'
import {CompiledQuery, DummyDriver, Kysely, MysqlIntrospector, MysqlQueryCompiler} from 'kysely'
import {fetch, MockAgent, setGlobalDispatcher, type MockClient} from 'undici'

import {
  SingleStoreDataApiAdapter,
  SingleStoreDataApiConnection,
  SingleStoreDataApiDatabaseError,
  SingleStoreDataType,
} from '../../src'
import {
  SingleStoreDataApiExecRequestBody,
  SingleStoreDataApiQueryTuplesResponseBody,
} from '../../src/dialect/data-api/types'

describe('SingleStoreDataApiConnection', () => {
  let connection: SingleStoreDataApiConnection
  let mockAgent: MockAgent
  let interceptor: MockClient

  before(() => {
    connection = new SingleStoreDataApiConnection({
      database: '<database>',
      fetch,
      hostname: 'example.com',
      password: '<password>',
      username: '<username>',
    })
  })

  beforeEach(() => {
    mockAgent = new MockAgent({connections: 1})
    setGlobalDispatcher(mockAgent)
    mockAgent.disableNetConnect()
    interceptor = mockAgent.get('https://example.com')
  })

  afterEach(async () => {
    await mockAgent.close()
  })

  describe('select queries', () => {
    it('should execute select queries.', async () => {
      type Database = {
        person: {
          id: number
          first_name: string | null
          last_name: string | null
        }
      }
      const query = getDummyKysely<Database>().selectFrom('person').selectAll().compile()
      const response: SingleStoreDataApiQueryTuplesResponseBody<Database['person']> = {
        results: [
          {
            columns: [
              {dataType: SingleStoreDataType.BigInt, name: 'id', nullable: false},
              {dataType: SingleStoreDataType.Varchar, name: 'first_name', nullable: true},
              {dataType: SingleStoreDataType.Varchar, name: 'last_name', nullable: true},
            ],
            rows: [
              {id: 1, first_name: 'Jennifer', last_name: 'Aniston'},
              {id: 3, first_name: 'Michael', last_name: 'Jordan'},
            ],
          },
        ],
      }

      interceptQuerySuccess(interceptor, response)

      const result = await connection.executeQuery(query)

      expect(result).to.be.an('object')
      expect(result.rows).to.deep.equal(response.results[0].rows)
    })

    it('should execute raw select queries.', async () => {
      const query = CompiledQuery.raw('select * from `person`')
      const response: SingleStoreDataApiQueryTuplesResponseBody<{
        id: number
        first_name: string | null
        last_name: string | null
      }> = {
        results: [
          {
            columns: [
              {dataType: SingleStoreDataType.BigInt, name: 'id', nullable: false},
              {dataType: SingleStoreDataType.Varchar, name: 'first_name', nullable: true},
              {dataType: SingleStoreDataType.Varchar, name: 'last_name', nullable: true},
            ],
            rows: [
              {id: 1, first_name: 'Jennifer', last_name: 'Aniston'},
              {id: 3, first_name: 'Michael', last_name: 'Jordan'},
            ],
          },
        ],
      }

      interceptQuerySuccess(interceptor, response)

      const result = await connection.executeQuery(query)

      expect(result).to.be.an('object')
      expect(result.rows).to.deep.equal(response.results[0].rows)
    })

    it('should execute raw with...select queries.', async () => {
      const query = CompiledQuery.raw('with zzz as (select 1) select * from zzz')
      const response: SingleStoreDataApiQueryTuplesResponseBody<{1: number}> = {
        results: [
          {
            columns: [
              {
                dataType: SingleStoreDataType.Int,
                name: '1',
                nullable: false,
              },
            ],
            rows: [{1: 1}],
          },
        ],
      }

      interceptQuerySuccess(interceptor, response)

      const result = await connection.executeQuery(query)

      expect(result).to.be.an('object')
      expect(result.rows).to.deep.equal(response.results[0].rows)
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

function getDummyKysely<Database>(): Kysely<Database> {
  return new Kysely({
    dialect: {
      createAdapter: () => new SingleStoreDataApiAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db) => new MysqlIntrospector(db),
      createQueryCompiler: () => new MysqlQueryCompiler(),
    },
  })
}

function interceptQuerySuccess(
  interceptor: MockClient,
  response: SingleStoreDataApiQueryTuplesResponseBody<any>,
): void {
  interceptor
    .intercept({
      method: 'POST',
      path: '/api/v2/query/tuples',
    })
    .reply(200, JSON.stringify(response))

  interceptor
    .intercept({
      method: 'POST',
      path: '/api/v2/exec',
    })
    .replyWithError(
      new SingleStoreDataApiDatabaseError('<message>', 400, {
        code: 400,
        message: '<message>',
      }),
    )
}

function interceptExecSuccess(interceptor: MockClient, response: SingleStoreDataApiExecRequestBody): void {
  interceptor
    .intercept({
      method: 'POST',
      path: '/api/v2/exec',
    })
    .reply(200, JSON.stringify(response))

  interceptor
    .intercept({
      method: 'POST',
      path: '/api/v2/query/tuples',
    })
    .replyWithError(
      new SingleStoreDataApiDatabaseError('<message>', 400, {
        code: 400,
        message: '<message>',
      }),
    )
}
