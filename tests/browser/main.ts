import {Kysely, type GeneratedAlways} from 'kysely'

import {SingleStoreDataApiDialect} from '../../dist/cjs'

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

const db = new Kysely<Database>({
  dialect: new SingleStoreDataApiDialect({
    database: 'test',
    fetch: fetch,
    hostname: 'localhost:9000',
    password: 'test',
    username: 'root',
  }),
})

window.addEventListener('load', async () => {
  const jennifer = await db
    .selectFrom('person')
    .selectAll()
    .where('first_name', '=', 'Jennifer')
    .executeTakeFirstOrThrow()

  const result = document.createElement('span')
  result.id = 'result'
  result.innerHTML = JSON.stringify(jennifer)

  document.body.appendChild(result)
})
