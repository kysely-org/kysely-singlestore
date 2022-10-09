import {Kysely, type GeneratedAlways} from 'kysely'

import {SingleStoreDataApiDialect} from '../..'

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
    fetch: window.fetch.bind(window),
    hostname: 'localhost:9000',
    password: 'test',
    username: 'root',
  }),
})

window.addEventListener('load', () => {
  db.selectFrom('person')
    .selectAll()
    .where('first_name', '=', 'Jennifer')
    .executeTakeFirstOrThrow()
    .then((jennifer) => {
      const result = document.createElement('span')
      result.id = 'result'
      result.innerHTML = JSON.stringify(jennifer)

      document.body.appendChild(result)
    })
    .catch(console.error)
})
