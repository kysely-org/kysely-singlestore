# kysely-singlestore

![Powered by TypeScript](https://img.shields.io/badge/powered%20by-typescript-blue.svg)

A [Kysely](https://github.com/koskimas/kysely) dialect for [Singlestore](https://www.singlestore.com/) (formerly MemSQL) Data API.

## Installation

You should install both [Kysely](https://github.com/koskimas/kysely) with `kysely-singlestore` as it is a required peer dependency.

```bash
npm i kysely-singlestore kysely
```

## Usage

```ts
import {Kysely} from 'kysely'
import {SinglestoreDataApiDialect} from 'kysely-singlestore'
import {fetch} from 'unidici'

const db = new Kysely<Database>({
  dialect: new SinglestoreDataApiDialect({
    database: '<database>',
    fetch,
    hostname: '<hostname>',
    password: '<password>',
    port: '<port>',
    username: '<username>',
  }),
})
```

## License

MIT License, see `LICENSE`
