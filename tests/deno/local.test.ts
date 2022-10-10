import {SingleStoreDataApiDialect} from '../../dist/esm/index.js'
import {performTest, singleStoreConfig} from './shared.ts'

await performTest(new SingleStoreDataApiDialect(singleStoreConfig), 'local')
