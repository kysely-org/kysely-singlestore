import {SingleStoreDataApiDialect} from 'https://cdn.jsdelivr.net/npm/kysely-singlestore@latest/dist/esm/index.js'
import {performTest, singleStoreConfig} from './shared.ts'

await performTest(new SingleStoreDataApiDialect(singleStoreConfig), 'cdn')
