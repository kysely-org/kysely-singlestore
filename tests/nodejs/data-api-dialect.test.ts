import {expect} from 'chai'
import {Kysely, sql, type ColumnType, type GeneratedAlways} from 'kysely'
import nodeFetch from 'node-fetch'
import {fetch as undiciFetch} from 'undici'

import {SingleStoreDataApiDialect} from '../../src/dialect/data-api/data-api-dialect'

interface Database {
  person: Person
  pet: Pet
  toy: Toy
}

interface Person {
  id: GeneratedAlways<number>
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  age: number
  gender: 'male' | 'female' | 'other'
}

interface Pet {
  id: GeneratedAlways<number>
  name: string
  owner_id: number
  species: 'cat' | 'dog' | 'hamster'
}

interface Toy {
  id: GeneratedAlways<number>
  name: string
  price: ColumnType<string, number, number>
  pet_id: number
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
      people.forEach((person) => {
        expect(person).to.be.an('object')
      })
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

  describe('insert queries', () => {
    it('should execute insert queries.', async () => {
      const doggo = await db.selectFrom('pet').where('name', '=', 'Doggo').select('id').executeTakeFirst()

      expect(doggo).to.not.be.undefined

      const result = await db
        .insertInto('toy')
        .values({
          name: 'Tennis Ball',
          pet_id: doggo!.id,
          price: 1.99,
        })
        .executeTakeFirst()

      expect(result.insertId).to.not.be.undefined

      const tennisBall = await db
        .selectFrom('toy')
        .where('id', '=', Number(result.insertId))
        .selectAll()
        .executeTakeFirst()

      expect(tennisBall).to.not.be.undefined
    })

    it('should execute raw insert queries.', async () => {
      const catto = await db.selectFrom('pet').where('name', '=', 'Catto').select('id').executeTakeFirst()

      expect(catto).to.not.be.undefined

      const result = await sql`insert into ${sql.table('toy')} (${sql.join([
        sql.ref('name'),
        sql.ref('pet_id'),
        sql.ref('price'),
      ])}) values (${sql.join(['Fluffy Fish', catto!.id, 3.49])})`.execute(db)

      expect(result.insertId).to.not.be.undefined

      const fluffyFish = await db
        .selectFrom('toy')
        .where('id', '=', Number(result.insertId))
        .selectAll()
        .executeTakeFirst()

      expect(fluffyFish).to.not.be.undefined
    })

    it('should execute raw with...insert queries.', async () => {
      const result = await sql`with hammo as (select ${sql.ref('id')} from ${sql.table('pet')} where ${sql.ref(
        'name',
      )} = ${'Hammo'}) insert into ${sql.table('toy')} (${sql.join([
        sql.ref('name'),
        sql.ref('pet_id'),
        sql.ref('price'),
      ])}) select ${sql.join([
        sql.literal('Wheel').as('name'),
        sql.ref('id'),
        sql.literal(9.99).as('price'),
      ])} from ${sql.table('hammo')}`.execute(db)

      expect(result.insertId).to.not.be.undefined

      const wheel = await db.selectFrom('toy').where('id', '=', Number(result.insertId)).selectAll().executeTakeFirst()

      expect(wheel).to.not.be.undefined
    })
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
