import {
  Kysely,
  type Dialect,
  type GeneratedAlways,
  type Selectable,
} from 'https://cdn.jsdelivr.net/npm/kysely@0.22.0/dist/esm/index.js'
import {assertEquals} from 'https://deno.land/std@0.159.0/testing/asserts.ts'

interface Person {
  id: GeneratedAlways<number>
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  age: number
  gender: 'male' | 'female' | 'other'
}

interface Database {
  person: Person
}

const expected: Selectable<Person> = {
  id: 1,
  first_name: 'Jennifer',
  middle_name: null,
  last_name: 'Aniston',
  age: 25,
  gender: 'female',
}

export const singleStoreConfig = {
  database: 'test',
  fetch: fetch,
  hostname: 'localhost:9000',
  password: 'test',
  username: 'root',
}

export async function performTest(dialect: Dialect, context: 'cdn' | 'local'): Promise<void> {
  const db = new Kysely<Database>({dialect})

  const actual = await db
    .selectFrom('person')
    .selectAll()
    .where('first_name', '=', 'Jennifer')
    .executeTakeFirstOrThrow()

  assertEquals(actual, expected)

  console.log(`works in deno (${context})`)
}
