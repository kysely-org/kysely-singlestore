import {expect, use} from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {Kysely, sql, type ColumnType, type GeneratedAlways} from 'kysely'
import nodeFetch from 'node-fetch'
import {fetch as undiciFetch} from 'undici'

import {SingleStoreDataApiDialect, SingleStoreDataApiMultipleStatementsNotSupportedError} from '../../src'

use(chaiAsPromised)

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

  it('should throw an exception when asked to execute a multi-statement query.', async () => {
    await expect(sql`select 1; select 2`.execute(db)).to.be.rejectedWith(
      SingleStoreDataApiMultipleStatementsNotSupportedError,
    )
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

  describe('update queries', () => {
    it('should execute update queries.', async () => {
      const doggo = await db.selectFrom('pet').where('name', '=', 'Doggo').select('id').executeTakeFirst()

      expect(doggo).to.not.be.undefined

      const result = await db
        .updateTable('toy')
        .set({
          price: sql`${sql.ref('price')} + 1`,
        })
        .where('pet_id', '=', doggo!.id)
        .executeTakeFirst()

      expect(result.numUpdatedRows).to.equal(1n)
    })

    it.skip('should execute raw update queries.', async () => {
      // TODO: ...
    })

    it.skip('should execute raw with...update queries.', async () => {
      // TODO: ...
    })
  })

  describe('delete queries', () => {
    it('should execute delete queries.', async () => {
      const doggo = await db.selectFrom('pet').where('name', '=', 'Doggo').select('id').executeTakeFirst()

      expect(doggo).to.not.be.undefined

      const result = await db.deleteFrom('toy').where('pet_id', '=', doggo!.id).executeTakeFirst()

      expect(result.numDeletedRows).to.equal(1n)
    })

    it.skip('should execute raw delete queries.', async () => {
      // TODO: ...
    })

    it.skip('should execute raw with...delete queries.', async () => {
      // TODO: ...
    })
  })

  describe.skip('ddl queries', () => {
    // TODO: ...
  })
})

export function getFetch() {
  const {version} = process

  if (version.startsWith('v18')) {
    return fetch
  }

  if (version.startsWith('v16')) {
    return undiciFetch
  }

  return nodeFetch
}
