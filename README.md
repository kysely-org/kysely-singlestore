![Logo](./assets/kysely-singlestore.png)

# kysely-singlestore

[![tests](https://github.com/igalklebanov/kysely-singlestore/actions/workflows/tests.yml/badge.svg)](https://github.com/igalklebanov/kysely-singlestore/actions/workflows/tests.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/0f759c07e4dd4f9889a21ea2a49d5a2e)](https://www.codacy.com/gh/igalklebanov/kysely-singlestore/dashboard?utm_source=github.com&utm_medium=referral&utm_content=igalklebanov/kysely-singlestore&utm_campaign=Badge_Grade)
![Powered by TypeScript](https://img.shields.io/badge/powered%20by-typescript-blue.svg)

[Kysely](https://github.com/koskimas/kysely) dialects, plugins and other goodies for [SingleStore](https://www.singlestore.com/) (formerly MemSQL).

## Installation

### Node.js

#### NPM 7+

```bash
npm i kysely-singlestore
```

#### NPM <7

```bash
npm i kysely-singlestore kysely
```

#### Yarn

```bash
yarn add kysely-singlestore kysely
```

#### PNPM

```bash
pnpm add kysely-singlestore kysely
```

### Deno

This package uses/extends some [Kysely](https://github.com/koskimas/kysely) types and classes, which are imported using it's NPM package name -- not a relative file path or CDN url.

To fix that, add an [`import_map.json`](https://deno.land/manual@v1.26.1/linking_to_external_code/import_maps) file.

```json
{
  "imports": {
    "kysely": "https://cdn.jsdelivr.net/npm/kysely@0.22.0/dist/esm/index.js"
  }
}
```

## Usage

### Data API Dialect

[SingleStore Data API](https://docs.singlestore.com/managed-service/en/reference/data-api.html) allows executing SQL queries in the browser and is a great fit for serverless functions and other auto-scaling compute services. It does not support transactions at this point in time.

#### Node.js 16.8+

Older node versions are supported as well, just swap [`undici`](https://github.com/nodejs/undici) with [`node-fetch`](https://github.com/node-fetch/node-fetch).

```ts
import {Kysely} from 'kysely'
import {SingleStoreDataApiDialect, SingleStoreDataType} from 'kysely-singlestore'
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
  dialect: new SingleStoreDataApiDialect({
    database: '<database>',
    deserialization: {
      castDatesAsNativeDates: true,
      castTinyIntAsBoolean: true,
      deserialize: (value, dataType, columnName) =>
        dataType === SingleStoreDataType.Json && columnName === 'pet' ? new Pet(value) : undefined,
      unwrapDecimals: true,
    },
    fetch,
    hostname: '<hostname>',
    password: '<password>',
    username: '<username>',
  }),
})
```

#### Browser

```ts
import {Kysely} from 'kysely'
import {SingleStoreDataApiDialect, SingleStoreDataType} from 'kysely-singlestore'

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
  dialect: new SingleStoreDataApiDialect({
    database: '<database>',
    deserialization: {
      castDatesAsNativeDates: true,
      castTinyIntAsBoolean: true,
      deserialize: (value, dataType, columnName) =>
        dataType === SingleStoreDataType.Json && columnName === 'pet' ? new Pet(value) : undefined,
      unwrapDecimals: true,
    },
    fetch: window.fetch.bind(window),
    hostname: '<hostname>',
    password: '<password>',
    username: '<username>',
  }),
})
```

#### Deno

```ts
import {Kysely} from 'https://cdn.jsdelivr.net/npm/kysely@0.22.0/dist/esm/index.js'
import {
  SingleStoreDataApiDialect,
  SingleStoreDataType,
} from 'https://cdn.jsdelivr.net/npm/kysely-singlestore@latest/dist/esm/index.js'

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
  dialect: new SingleStoreDataApiDialect({
    database: '<database>',
    deserialization: {
      castDatesAsNativeDates: true,
      castTinyIntAsBoolean: true,
      deserialize: (value, dataType, columnName) =>
        dataType === SingleStoreDataType.Json && columnName === 'pet' ? new Pet(value) : undefined,
      unwrapDecimals: true,
    },
    fetch: fetch,
    hostname: '<hostname>',
    password: '<password>',
    username: '<username>',
  }),
})
```

### "Classic" Dialect - Soon<sup>TM</sup>

SingleStore is wire-compatible with MySQL so you can connect to it using `mysql2` in node environments, and take advantage of connection pools and transactions.

## License

MIT License, see `LICENSE`
