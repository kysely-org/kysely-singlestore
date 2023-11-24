import {expect, use} from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {isMatch} from 'date-fns'
import {Kysely, sql, type ColumnType, type GeneratedAlways, type Selectable} from 'kysely'
import {createPool} from 'mysql2/promise'
import nodeFetch from 'node-fetch'
import {fetch as undiciFetch} from 'undici'

import {
  SingleStoreDataApiDatabaseError,
  SingleStoreDataApiDialect,
  SingleStoreDataApiMultipleStatementsNotSupportedError,
  SingleStoreDataApiTransactionsNotSupportedError,
  type SingleStoreDataApiDialectConfig,
} from '../../src'

use(chaiAsPromised)

interface Database {
  person: Person
  pet: Pet
  toy: Toy
  data_type_test: DataTypeTest
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
  id: ColumnType<number, number | undefined, never>
  name: string
  price: ColumnType<string, number, number>
  pet_id: number
}

interface DataTypeTest {
  bigint_col: unknown
  binary_col: unknown
  bit_col: unknown
  blob_col: unknown
  bool_col: unknown
  boolean_col: unknown
  char_col: unknown
  date_col: unknown
  datetime_col: unknown
  datetime6_col: unknown
  dec_col: unknown
  decimal_col: unknown
  double_col: unknown
  enum_col: unknown
  fixed_col: unknown
  float_col: unknown
  geography_col: unknown
  geographypoint_col: unknown
  int_col: unknown
  integer_col: unknown
  json_col: unknown
  longblob_col: unknown
  longtext_col: unknown
  mediumblob_col: unknown
  mediumint_col: unknown
  mediumtext_col: unknown
  numeric_col: unknown
  real_col: unknown
  set_col: unknown
  smallint_col: unknown
  text_col: unknown
  time_col: unknown
  time6_col: unknown
  timestamp_col: unknown
  timestamp6_col: unknown
  tinyblob_col: unknown
  tinyint_col: unknown
  tinytext_col: unknown
  varbinary_col: unknown
  varchar_col: unknown
  year_col: unknown
  null_col: unknown
}

const pool = createPool({
  database: 'test',
  password: 'test',
  user: 'root',
})

describe('SingleStoreDataApiDialect', () => {
  let db: Kysely<Database>
  let doggo: Selectable<Pet>
  let catto: Selectable<Pet>
  let hammo: Selectable<Pet>

  before(async () => {
    db = getDB()
    doggo = await db.selectFrom('pet').where('name', '=', 'Doggo').selectAll().executeTakeFirstOrThrow()
    catto = await db.selectFrom('pet').where('name', '=', 'Catto').selectAll().executeTakeFirstOrThrow()
    hammo = await db.selectFrom('pet').where('name', '=', 'Hammo').selectAll().executeTakeFirstOrThrow()
  })

  after(async () => {
    await pool.end()
  })

  it('should reject executing transactions.', async () => {
    await expect(
      getDB()
        .transaction()
        .execute(async (trx) => {
          await trx.selectFrom('person').selectAll().execute()
        }),
    ).to.be.rejectedWith(SingleStoreDataApiTransactionsNotSupportedError)
  })

  it('should reject executing multi-statement queries.', async () => {
    await expect(sql`select 1; select 2`.execute(db)).to.be.rejectedWith(
      SingleStoreDataApiMultipleStatementsNotSupportedError,
    )
  })

  describe('select queries', () => {
    it('should execute select queries.', async () => {
      const people = await db.selectFrom('person').selectAll().execute()

      expectPeople(people)
    })

    it('should execute with...select queries.', async () => {
      const jennifers = await db
        .with('jennifers', (qc) => qc.selectFrom('person').where('first_name', '=', 'Jennifer').selectAll())
        .selectFrom('jennifers')
        .selectAll()
        .execute()

      expectPeople(jennifers)
    })

    it('should execute select...union queries.', async () => {
      const people = await db
        .selectFrom('person')
        .where('first_name', '=', 'Jennifer')
        .selectAll()
        .union(db.selectFrom('person').where('first_name', '=', 'Arnold').selectAll())
        .execute()

      expectPeople(people)
    })

    it('should execute raw select queries.', async () => {
      const {rows: people} = await sql<Person>`select * from ${sql.table('person')}`.execute(db)

      expectPeople(people)
    })

    it('should execute raw with...select queries.', async () => {
      const {rows: jennifers} = await sql<Person>`
        with jennifers as (
          select *
          from ${sql.table('person')}
          where ${sql.ref('first_name')} = ${sql.literal('Jennifer')}
        )
        select * from jennifers`.execute(db)

      expectPeople(jennifers)
    })

    it('should execute raw select...union queries.', async () => {
      const {rows: people} = await sql<Person>`
        (select * from ${sql.table('person')} where ${sql.ref('first_name')} = ${'Jennifer'})
        union all
        (select * from ${sql.table('person')} where ${sql.ref('first_name')} = ${'Arnold'})
      `.execute(db)

      expectPeople(people)
    })
  })

  describe('insert queries', () => {
    after(async () => {
      await clearToys()
    })

    it('should execute insert queries.', async () => {
      const result = await db
        .insertInto('toy')
        .values({
          name: 'Tennis Ball',
          pet_id: doggo.id,
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
      expect(tennisBall!.name).to.equal('Tennis Ball')
      expect(tennisBall!.pet_id).to.equal(doggo.id)
      expect(tennisBall!.price).to.equal('1.9900')
    })

    // currently not built-in in kysely@0.22
    // it.skip('should execute insert...set queries.', async () => {})

    // currently not built-in in kysely@0.22
    // it.skip('should execute insert...select queries.', async () => {})

    // currently not built-in in kysely@0.22
    // it.skip('should execute with...insert...select queries.', async () => {})

    it('should execute raw insert queries.', async () => {
      const result = await sql`insert into ${sql.table('toy')} (${sql.join([
        sql.ref('name'),
        sql.ref('pet_id'),
        sql.ref('price'),
      ])}) values (${sql.join(['Fluffy Fish', catto.id, 3.49])})`.execute(db)

      expect(result.insertId).to.not.be.undefined

      const fluffyFish = await db
        .selectFrom('toy')
        .where('id', '=', Number(result.insertId))
        .selectAll()
        .executeTakeFirst()

      expect(fluffyFish).to.not.be.undefined
      expect(fluffyFish!.name).to.equal('Fluffy Fish')
      expect(fluffyFish!.pet_id).to.equal(catto!.id)
      expect(fluffyFish!.price).to.equal('3.4900')
    })

    it('should execute raw insert...select queries.', async () => {
      await sql`insert into ${sql.table('toy')}
        (${sql.ref('name')}, ${sql.ref('pet_id')}, ${sql.ref('price')})
        select ${sql.join([
          sql.ref('name'),
          sql`${sql.ref('id')} as ${sql.ref('pet_id')}`,
          sql`${sql.literal(34.99)} as ${sql.ref('price')}`,
        ])} from ${sql.table('pet')} where ${sql.ref('id')} = ${sql.literal(doggo.id)}`.execute(db)
    })

    it('should execute raw with...insert...select queries.', async () => {
      const result = await sql`with hammo as (
        select ${sql.ref('id')} 
        from ${sql.table('pet')} 
        where ${sql.ref('name')} = ${'Hammo'}
      ) 
      insert into ${sql.table('toy')} (${sql.join([
        sql.ref('name'),
        sql.ref('pet_id'),
        sql.ref('price'),
      ])}) select ${sql.join([sql.literal('Wheel').as('name'), sql.ref('id'), sql`9.99`.as('price')])} from ${sql.table(
        'hammo',
      )}`.execute(db)

      expect(result.insertId).to.not.be.undefined

      const wheel = await db.selectFrom('toy').where('id', '=', Number(result.insertId)).selectAll().executeTakeFirst()

      expect(wheel).to.not.be.undefined
      expect(wheel!.name).to.equal('Wheel')
      expect(wheel!.pet_id).to.be.a('number')
      expect(wheel!.price).to.equal('9.9900')
    })
  })

  describe('replace queries', () => {
    before(async () => {
      await insertToys()
    })

    after(async () => {
      await clearToys()
    })

    it('should execute replace queries.', async () => {
      const {
        rows: [someToy],
      } = await sql<{id: number; pet_id: number}>`select id, pet_id from toy limit 1`.execute(db)

      const result = await db
        .replaceInto('toy')
        .values({
          id: someToy.id,
          name: 'Frisbee',
          pet_id: someToy.pet_id,
          price: 19.99,
        })
        .executeTakeFirst()

      expect(result.insertId).to.equal(BigInt(someToy.id))
    })

    // currently not built-in in kysely@0.22
    // it.skip('should execute replace...set queries.', async () => {})

    // currently not built-in in kysely@0.22
    // it.skip('should execute replace...select queries.', async () => {})

    // currently not built-in in kysely@0.22
    // it.skip('should execute with...replace...select queries.', async () => {})

    it('should execute raw replace queries.', async () => {
      const result = await sql`replace into ${sql.table('toy')} (${sql.join([
        sql.ref('name'),
        sql.ref('pet_id'),
        sql.ref('price'),
      ])}) values (${sql.join(['Fluffy Fish', catto.id, 3.49])})`.execute(db)

      expect(result.insertId).to.not.be.undefined

      const fluffyFish = await db
        .selectFrom('toy')
        .where('id', '=', Number(result.insertId))
        .selectAll()
        .executeTakeFirst()

      expect(fluffyFish).to.not.be.undefined
      expect(fluffyFish!.name).to.equal('Fluffy Fish')
      expect(fluffyFish!.pet_id).to.equal(catto!.id)
      expect(fluffyFish!.price).to.equal('3.4900')
    })

    it('should execute raw replace...select queries.', async () => {
      await sql`replace into ${sql.table('toy')}
        (${sql.ref('name')}, ${sql.ref('pet_id')}, ${sql.ref('price')})
        select ${sql.join([
          sql.ref('name'),
          sql`${sql.ref('id')} as ${sql.ref('pet_id')}`,
          sql`${sql.literal(34.99)} as ${sql.ref('price')}`,
        ])} from ${sql.table('pet')} where ${sql.ref('id')} = ${sql.literal(doggo.id)}`.execute(db)
    })

    it('should execute raw with...replace...select queries.', async () => {
      const result = await sql`with hammo as (
        select ${sql.ref('id')} 
        from ${sql.table('pet')} 
        where ${sql.ref('name')} = ${'Hammo'}
      ) 
      replace into ${sql.table('toy')} (${sql.join([
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
      expect(wheel!.name).to.equal('Wheel')
      expect(wheel!.pet_id).to.be.a('number')
      expect(wheel!.price).to.equal('9.9900')
    })
  })

  describe('update queries', () => {
    before(async () => {
      await insertToys()
    })

    after(async () => {
      await clearToys()
    })

    it('should execute update queries.', async () => {
      const result = await db
        .updateTable('toy')
        .set({
          price: sql`${sql.ref('price')} + 1`,
        })
        .where('pet_id', '=', doggo.id)
        .executeTakeFirst()

      expect(result.numUpdatedRows).to.equal(1n)
    })

    it('should execute raw update queries.', async () => {
      const result = await sql`update ${sql.table('toy')} set ${sql.ref('price')} = ${sql.ref(
        'price',
      )} + 1 where ${sql.ref('pet_id')} = ${catto.id}`.execute(db)

      expect(result.numUpdatedOrDeletedRows).to.equal(1n)
    })

    it('should execute raw with...update queries.', async () => {
      const result = await sql`with hammo as (
        select ${sql.ref('id')}
        from ${sql.table('pet')}
        where ${sql.ref('name')} = ${'Hammo'}
      ) 
      update ${sql.table('toy')} 
      set ${sql.ref('price')} = ${sql.ref('price')} + 1 
      where ${sql.ref('pet_id')} in (
        select ${sql.ref('id')}
        from hammo
      )`.execute(db)

      expect(result.numUpdatedOrDeletedRows).to.equal(1n)
    })
  })

  describe('delete queries', () => {
    before(async () => {
      await insertToys()
    })

    after(async () => {
      await clearToys()
    })

    it('should execute delete queries.', async () => {
      const result = await db.deleteFrom('toy').where('pet_id', '=', doggo.id).executeTakeFirst()

      expect(result.numDeletedRows).to.equal(1n)
    })

    it('should execute raw delete queries.', async () => {
      const result = await sql`delete from ${sql.table('toy')} where ${sql.ref('pet_id')} = ${catto.id}`.execute(db)

      expect(result.numUpdatedOrDeletedRows).to.equal(1n)
    })

    it('should execute raw with...delete queries.', async () => {
      const result = await sql`with hammo as (
        select ${sql.ref('id')}
        from ${sql.table('pet')}
        where ${sql.ref('name')} = ${'Hammo'}
      )
      delete from ${sql.table('toy')}
      where ${sql.ref('pet_id')} in (
        select ${sql.ref('id')}
        from hammo
      )`.execute(db)

      expect(result.numUpdatedOrDeletedRows).to.equal(1n)
    })
  })

  describe('explain queries', () => {
    before(async () => {
      await insertToys()
    })

    after(async () => {
      await clearToys()
    })

    it('should execute explain...select queries.', async () => {
      const result = await db.selectFrom('person').selectAll().explain()

      expect(result).to.be.an('array').with.length.greaterThan(0)
    })

    it('should reject executing explain...insert queries.', async () => {
      await expect(
        db
          .insertInto('toy')
          .values({
            name: 'Glass Bottle',
            pet_id: hammo.id,
            price: 1.99,
          })
          .explain(),
      ).to.eventually.be.rejectedWith(SingleStoreDataApiDatabaseError)
    })

    // currently not built-in in kysely@0.22
    // it.skip('should execute explain...insert...select queries.', async () => {})

    it('should reject executing explain...replace queries.', async () => {
      await expect(
        db
          .replaceInto('toy')
          .values({
            name: 'Glass Bottle',
            pet_id: hammo.id,
            price: 1.99,
          })
          .explain(),
      ).to.eventually.be.rejectedWith(SingleStoreDataApiDatabaseError)
    })

    // currently not built-in in kysely@0.22
    // it.skip('should execute explain...replace...select queries.', async () => {})

    it('should execute explain...update queries.', async () => {
      const result = await db
        .updateTable('toy')
        .set({
          price: sql`${sql.ref('price')} + 1`,
        })
        .where('pet_id', '=', doggo.id)
        .explain()

      expect(result).to.be.an('array').with.length.greaterThan(0)
    })

    it('should execute explain...delete queries.', async () => {
      const result = await db.deleteFrom('toy').where('pet_id', '=', doggo.id).explain()

      expect(result).to.be.an('array').with.length.greaterThan(0)
    })
  })

  describe.skip('ddl queries', () => {
    // TODO: ...
  })

  describe('deserialization', () => {
    it('should return values as-is when no deserialization options are passed.', async () => {
      const result = await getDB({deserialization: undefined})
        .selectFrom('data_type_test')
        .selectAll()
        .executeTakeFirstOrThrow()

      expect(result.bigint_col).to.be.a('number').that.satisfies(Number.isInteger)
      expect(result.binary_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.bit_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.blob_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.bool_col).to.be.a('number').that.satisfies(Number.isInteger)
      expect(result.boolean_col).to.be.a('number').that.satisfies(Number.isInteger)
      expect(result.char_col).to.be.a('string')
      expect(result.date_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd'))
      expect(result.datetime6_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss.SSSSSS'))
      expect(result.datetime_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss'))
      expect(result.dec_col)
        .to.be.a('string')
        .that.matches(/^\-?\d+\.\d*$/)
      expect(result.decimal_col)
        .to.be.a('string')
        .that.matches(/^\-?\d+\.\d*$/)
      expect(result.double_col).to.be.a('number')
      // expect(result.enum_col).to.be.a('string')
      // expect(result.fixed_col)
      //   .to.be.a('string')
      //   .that.matches(/^\-?\d+\.\d*$/)
      // expect(result.float_col).to.be.a('number')
      // expect(result.geography_col).to.be.a('string')
      // expect(result.geographypoint_col).to.be.a('string')
      // expect(result.int_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.integer_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.json_col)
      //   .to.be.an('object')
      //   .that.satisfies((value: Record<string, unknown>) => !Array.isArray(value))
      // expect(result.longblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.longtext_col).to.be.a('string')
      // expect(result.mediumblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.mediumint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.mediumtext_col).to.be.a('string')
      // expect(result.numeric_col)
      //   .to.be.a('string')
      //   .that.matches(/^\-?\d+\.\d*$/)
      // expect(result.real_col).to.be.a('number')
      // expect(result.set_col)
      //   .to.be.a('string')
      //   .that.matches(/^\w+(,\w+)*$/)
      // expect(result.smallint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.text_col).to.be.a('string')
      // expect(result.time6_col).to.be.a('string').that.satisfies(isOfDateFormat('HHH:mm:ss.SSSSSS'))
      // expect(result.time6_col)
      //   .to.be.a('string')
      //   .that.matches(/^\d{1,3}:\d{2}:\d{2}\.\d{6}$/)
      // expect(result.time_col).to.be.a('string').that.satisfies(isOfDateFormat('HHH:mm:ss'))
      // expect(result.time_col)
      //   .to.be.a('string')
      //   .that.matches(/^\d{1,3}:\d{2}:\d{2}$/)
      // expect(result.timestamp6_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss.SSSSSS'))
      // expect(result.timestamp_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss'))
      // expect(result.tinyblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.tinyint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.tinytext_col).to.be.a('string')
      // expect(result.varbinary_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.varchar_col).to.be.a('string')
      // expect(result.year_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy'))
      // expect(result.null_col).to.be.null
    })

    it('should cast date-like values as native dates when "deserialization.castDatesAsNativeDates" is true.', async () => {
      const result = await getDB({
        deserialization: {
          castDatesAsNativeDates: true,
        },
      })
        .selectFrom('data_type_test')
        .selectAll()
        .executeTakeFirstOrThrow()

      expect(result.bigint_col).to.be.a('number').that.satisfies(Number.isInteger)
      expect(result.binary_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.bit_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.blob_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.bool_col).to.be.a('number').that.satisfies(Number.isInteger)
      expect(result.boolean_col).to.be.a('number').that.satisfies(Number.isInteger)
      expect(result.char_col).to.be.a('string')
      expect(result.date_col)
        .to.be.an.instanceOf(Date)
        .that.satisfies(isEqualToISODateString('9999-12-31T00:00:00.000Z'))
      expect(result.datetime6_col)
        .to.be.an.instanceOf(Date)
        .that.satisfies(isEqualToISODateString('9999-12-31T23:59:59.999Z'))
      expect(result.datetime_col)
        .to.be.an.instanceOf(Date)
        .that.satisfies(isEqualToISODateString('9999-12-31T23:59:59.000Z'))
      expect(result.dec_col)
        .to.be.a('string')
        .that.matches(/^\-?\d+\.\d*$/)
      expect(result.decimal_col)
        .to.be.a('string')
        .that.matches(/^\-?\d+\.\d*$/)
      expect(result.double_col).to.be.a('number')
      // expect(result.enum_col).to.be.a('string')
      // expect(result.fixed_col)
      //   .to.be.a('string')
      //   .that.matches(/^\-?\d+\.\d*$/)
      // expect(result.float_col).to.be.a('number')
      // expect(result.geography_col).to.be.a('string')
      // expect(result.geographypoint_col).to.be.a('string')
      // expect(result.int_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.integer_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.json_col)
      //   .to.be.an('object')
      //   .that.satisfies((value: Record<string, unknown>) => !Array.isArray(value))
      // expect(result.longblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.longtext_col).to.be.a('string')
      // expect(result.mediumblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.mediumint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.mediumtext_col).to.be.a('string')
      // expect(result.numeric_col)
      //   .to.be.a('string')
      //   .that.matches(/^\-?\d+\.\d*$/)
      // expect(result.real_col).to.be.a('number')
      // expect(result.set_col)
      //   .to.be.a('string')
      //   .that.matches(/^\w+(,\w+)*$/)
      // expect(result.smallint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.text_col).to.be.a('string')
      // expect(result.time6_col).to.be.a('string').that.satisfies(isOfDateFormat('HHH:mm:ss.SSSSSS'))
      // expect(result.time6_col)
      //   .to.be.a('string')
      //   .that.matches(/^\d{1,3}:\d{2}:\d{2}\.\d{6}$/)
      // expect(result.time_col).to.be.a('string').that.satisfies(isOfDateFormat('HHH:mm:ss'))
      // expect(result.time_col)
      //   .to.be.a('string')
      //   .that.matches(/^\d{1,3}:\d{2}:\d{2}$/)
      // expect(result.timestamp6_col)
      //   .to.be.an.instanceOf(Date)
      //   .that.satisfies(isEqualToISODateString('2038-01-19T03:14:07.999Z'))
      // expect(result.timestamp_col)
      //   .to.be.an.instanceOf(Date)
      //   .that.satisfies(isEqualToISODateString('2038-01-19T03:14:07.000Z'))
      // expect(result.tinyblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.tinyint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.tinytext_col).to.be.a('string')
      // expect(result.varbinary_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.varchar_col).to.be.a('string')
      // expect(result.year_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy'))
      // expect(result.null_col).to.be.null
    })

    it('should cast tinyint (and synonyms) values to boolean when "deserialization.castTinyIntAsBoolean" is true.', async () => {
      const result = await getDB({
        deserialization: {
          castTinyIntAsBoolean: true,
        },
      })
        .selectFrom('data_type_test')
        .selectAll()
        .executeTakeFirstOrThrow()

      expect(result.bigint_col).to.be.a('number').that.satisfies(Number.isInteger)
      expect(result.binary_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.bit_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.blob_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.bool_col).to.be.false
      expect(result.boolean_col).to.be.true
      expect(result.char_col).to.be.a('string')
      expect(result.date_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd'))
      expect(result.datetime6_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss.SSSSSS'))
      expect(result.datetime_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss'))
      expect(result.dec_col)
        .to.be.a('string')
        .that.matches(/^\-?\d+\.\d*$/)
      expect(result.decimal_col)
        .to.be.a('string')
        .that.matches(/^\-?\d+\.\d*$/)
      expect(result.double_col).to.be.a('number')
      // expect(result.enum_col).to.be.a('string')
      // expect(result.fixed_col)
      //   .to.be.a('string')
      //   .that.matches(/^\-?\d+\.\d*$/)
      // expect(result.float_col).to.be.a('number')
      // expect(result.geography_col).to.be.a('string')
      // expect(result.geographypoint_col).to.be.a('string')
      // expect(result.int_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.integer_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.json_col)
      //   .to.be.an('object')
      //   .that.satisfies((value: Record<string, unknown>) => !Array.isArray(value))
      // expect(result.longblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.longtext_col).to.be.a('string')
      // expect(result.mediumblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.mediumint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.mediumtext_col).to.be.a('string')
      // expect(result.numeric_col)
      //   .to.be.a('string')
      //   .that.matches(/^\-?\d+\.\d*$/)
      // expect(result.real_col).to.be.a('number')
      // expect(result.set_col)
      //   .to.be.a('string')
      //   .that.matches(/^\w+(,\w+)*$/)
      // expect(result.smallint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.text_col).to.be.a('string')
      // expect(result.time6_col).to.be.a('string').that.satisfies(isOfDateFormat('HHH:mm:ss.SSSSSS'))
      // expect(result.time6_col)
      //   .to.be.a('string')
      //   .that.matches(/^\d{1,3}:\d{2}:\d{2}\.\d{6}$/)
      // expect(result.time_col).to.be.a('string').that.satisfies(isOfDateFormat('HHH:mm:ss'))
      // expect(result.time_col)
      //   .to.be.a('string')
      //   .that.matches(/^\d{1,3}:\d{2}:\d{2}$/)
      // expect(result.timestamp6_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss.SSSSSS'))
      // expect(result.timestamp_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss'))
      // expect(result.tinyblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.tinyint_col).to.be.true
      // expect(result.tinytext_col).to.be.a('string')
      // expect(result.varbinary_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.varchar_col).to.be.a('string')
      // expect(result.year_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy'))
      // expect(result.null_col).to.be.null
    })

    it('should cast decimal (and synonyms) values to number when "deserialization.unwrapDecimals" is true.', async () => {
      const result = await getDB({
        deserialization: {
          unwrapDecimals: true,
        },
      })
        .selectFrom('data_type_test')
        .selectAll()
        .executeTakeFirstOrThrow()

      expect(result.bigint_col).to.be.a('number').that.satisfies(Number.isInteger)
      expect(result.binary_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.bit_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.blob_col).to.be.a('string').that.satisfies(isBase64)
      expect(result.bool_col).to.be.a('number').that.satisfies(Number.isInteger)
      expect(result.boolean_col).to.be.a('number').that.satisfies(Number.isInteger)
      expect(result.char_col).to.be.a('string')
      expect(result.date_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd'))
      expect(result.datetime6_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss.SSSSSS'))
      expect(result.datetime_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss'))
      expect(result.dec_col).to.be.a('number').that.equals(99999999999999.9999)
      expect(result.decimal_col).to.be.a('number').that.equals(-99999999999999.9999)
      expect(result.double_col).to.be.a('number')
      // expect(result.enum_col).to.be.a('string')
      // expect(result.fixed_col).to.be.a('number').that.equals(0)
      // expect(result.float_col).to.be.a('number')
      // expect(result.geography_col).to.be.a('string')
      // expect(result.geographypoint_col).to.be.a('string')
      // expect(result.int_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.integer_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.json_col)
      //   .to.be.an('object')
      //   .that.satisfies((value: Record<string, unknown>) => !Array.isArray(value))
      // expect(result.longblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.longtext_col).to.be.a('string')
      // expect(result.mediumblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.mediumint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.mediumtext_col).to.be.a('string')
      // expect(result.numeric_col).to.be.a('number').that.equals(99999999999999.9999)
      // expect(result.real_col).to.be.a('number')
      // expect(result.set_col)
      //   .to.be.a('string')
      //   .that.matches(/^\w+(,\w+)*$/)
      // expect(result.smallint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.text_col).to.be.a('string')
      // expect(result.time6_col).to.be.a('string').that.satisfies(isOfDateFormat('HHH:mm:ss.SSSSSS'))
      // expect(result.time6_col)
      //   .to.be.a('string')
      //   .that.matches(/^\d{1,3}:\d{2}:\d{2}\.\d{6}$/)
      // expect(result.time_col).to.be.a('string').that.satisfies(isOfDateFormat('HHH:mm:ss'))
      // expect(result.time_col)
      //   .to.be.a('string')
      //   .that.matches(/^\d{1,3}:\d{2}:\d{2}$/)
      // expect(result.timestamp6_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss.SSSSSS'))
      // expect(result.timestamp_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy-MM-dd HH:mm:ss'))
      // expect(result.tinyblob_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.tinyint_col).to.be.a('number').that.satisfies(Number.isInteger)
      // expect(result.tinytext_col).to.be.a('string')
      // expect(result.varbinary_col).to.be.a('string').that.satisfies(isBase64)
      // expect(result.varchar_col).to.be.a('string')
      // expect(result.year_col).to.be.a('string').that.satisfies(isOfDateFormat('yyyy'))
      // expect(result.null_col).to.be.null
    })

    it.skip('should use "deserialization.deserializer" when provided.', async () => {
      // TODO: ...
    })
  })
})

function getDB(config?: Partial<SingleStoreDataApiDialectConfig>): Kysely<Database> {
  return new Kysely({
    dialect: new SingleStoreDataApiDialect({
      database: 'test',
      fetch: getFetch(),
      hostname: 'localhost:9000',
      password: 'test',
      username: 'root',
      ...config,
    }),
  })
}

function getFetch() {
  const {version} = process

  if (version.startsWith('v18')) {
    return fetch
  }

  if (version.startsWith('v16')) {
    return undiciFetch
  }

  return nodeFetch
}

function expectPeople(people: any[]): void {
  expect(people).to.be.an('array').with.length.greaterThan(0)
  people.forEach((person) => {
    expect(person).to.be.an('object')
    expect(person.age).to.be.a('number')
    expect(person.first_name).to.satisfy((value: unknown) => typeof value === 'string' || value === null)
    expect(person.gender).to.be.a('string')
    expect(person.id).to.be.a('number')
    expect(person.last_name).to.satisfy((value: unknown) => typeof value === 'string' || value === null)
    expect(person.middle_name).to.satisfy((value: unknown) => typeof value === 'string' || value === null)
  })
}

async function clearToys(): Promise<void> {
  await pool.execute('truncate table `toy`')
}

async function insertToys(): Promise<void> {
  const query = getDB()
    .insertInto('toy')
    .values([
      {name: 'Tennis Ball', pet_id: 2, price: 1.99},
      {name: 'Fluffy Fish', pet_id: 1, price: 3.49},
      {name: 'Wheel', pet_id: 3, price: 9.99},
    ])
    .compile()

  await pool.execute(query.sql, query.parameters)
}

function isBase64(str: string): boolean {
  return Buffer.from(str, 'base64').toString('base64') === str
}

function isOfDateFormat(format: string) {
  return (str: string): boolean => isMatch(str, format)
}

function isEqualToISODateString(timestamp: string) {
  return (date: Date): boolean => date.toISOString() === timestamp
}
