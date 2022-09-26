![Logo](./assets/kysely-singlestore.png)

# kysely-singlestore

[![npm version](https://badge.fury.io/js/kysely-singlestore.svg)](https://badge.fury.io/js/kysely-singlestore)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/0f759c07e4dd4f9889a21ea2a49d5a2e)](https://www.codacy.com/gh/igalklebanov/kysely-singlestore/dashboard?utm_source=github.com&utm_medium=referral&utm_content=igalklebanov/kysely-singlestore&utm_campaign=Badge_Grade)
![Powered by TypeScript](https://img.shields.io/badge/powered%20by-typescript-blue.svg)

[Kysely](https://github.com/koskimas/kysely) dialects, plugins and other goodies for [Singlestore](https://www.singlestore.com/) (formerly MemSQL).

## Installation

You should install [Kysely](https://github.com/koskimas/kysely) with `kysely-singlestore` as it is a required peer dependency.

```bash
npm i kysely-singlestore kysely
```

## Usage

```ts
import {Kysely} from 'kysely'
import {SinglestoreDataApiDeserializerPlugin, SinglestoreDataApiDialect, SinglestoreDataType} from 'kysely-singlestore'
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

const db = new Kysely<Database>({
  dialect: new SinglestoreDataApiDialect({
    database: '<database>',
    fetch,
    hostname: '<hostname>',
    password: '<password>',
    username: '<username>',
  }),
  plugins: [
    // optional deserializer (transform result values) plugin
    new SinglestoreDataApiDeserializerPlugin({
      castTinyIntAsBoolean: true,
      deserializer: (value, dataType, columnName) =>
        dataType === SinglestoreDataType.Json && columnName === 'pet' ? new Pet(value) : undefined,
      unwrapDecimals: true,
    }),
  ],
})
```

## License

MIT License, see `LICENSE`
