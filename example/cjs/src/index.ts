import {Kysely} from 'kysely'
import {SinglestoreDataApiDeserializerPlugin, SinglestoreDataApiDialect} from 'kysely-singlestore'
import {fetch} from 'undici'

interface Database {
  person: {
    id: string
    first_name: string | null
    last_name: string | null
  }
  pet: {
    id: string
    name: string
    owner_id: string
  }
}

async function main(): Promise<void> {
  const db = new Kysely<Database>({
    dialect: new SinglestoreDataApiDialect({
      database: '<database>',
      fetch,
      hostname: '<hostname>',
      password: '<password>',
      username: '<username>',
    }),
    plugins: [
      new SinglestoreDataApiDeserializerPlugin({
        castTinyIntAsBoolean: true,
        unwrapDecimals: true,
      }),
    ],
  })

  const compiledQuery = db.selectFrom('person').selectAll().where('id', '=', '<person_id>').compile()

  console.log(compiledQuery.sql)
}

main()
