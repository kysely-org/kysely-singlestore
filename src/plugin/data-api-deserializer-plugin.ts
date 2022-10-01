import {
  MysqlQueryCompiler,
  SelectQueryNode,
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  type QueryResult,
  type RootOperationNode,
  type UnknownRow,
} from 'kysely'

import type {SingleStoreDataApiColumnMetadata} from '../dialect/data-api/types.js'
import {SingleStoreDataApiColumnMetadataStore} from '../util/data-api-column-metadata-store.js'
import {SingleStoreDataType} from '../util/singlestore-data-type.js'

export interface SingleStoreDataApiDeserializerPluginConfig {
  /**
   * Should cast `TINYINT` as `boolean`? otherwise keep as `number`.
   *
   * Default is `false`.
   */
  castTinyIntAsBoolean?: boolean
  /**
   * Custom column deserializer function.
   *
   * In order to fallback to default plugin behavior, return `undefined`.
   */
  deserializer?: (value: unknown, dataType: string, columnName: string) => unknown
  /**
   * Should cast `DECIMAL` as `number`? otherwise keep as `string`.
   *
   * Default is `false`.
   */
  unwrapDecimals?: boolean
}

export class SingleStoreDataApiDeserializerPlugin implements KyselyPlugin {
  #columnMetadataStore: SingleStoreDataApiColumnMetadataStore | undefined
  readonly #config: SingleStoreDataApiDeserializerPluginConfig
  readonly #rootOperationNodeDictionary: WeakMap<object, RootOperationNode>

  constructor(config?: SingleStoreDataApiDeserializerPluginConfig) {
    this.#config = {...config}
    this.#rootOperationNodeDictionary = new WeakMap()
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    const {node} = args

    // lazy instantiation -- telling connection to start storing column metadata.
    this.#columnMetadataStore = SingleStoreDataApiColumnMetadataStore.getInstance()

    this.#rootOperationNodeDictionary.set(args.queryId, node)

    return node
  }

  async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    const {queryId, result} = args
    const {rows} = result

    if (!rows.length) {
      return result
    }

    const rootOperationNode = this.#rootOperationNodeDictionary.get(queryId)

    this.#rootOperationNodeDictionary.delete(queryId)

    if (!rootOperationNode || !SelectQueryNode.is(rootOperationNode)) {
      return result
    }

    const {sql} = new MysqlQueryCompiler().compileQuery(rootOperationNode)

    const columnMetadata = this.#columnMetadataStore!.read(sql)

    if (!columnMetadata?.length) {
      throw new Error('Missing column metadata!')
    }

    return {
      rows: result.rows.map((row) => this.#deserializeRow(row, columnMetadata)),
    }
  }

  #deserializeRow(row: UnknownRow, columnMetadata: ReadonlyArray<SingleStoreDataApiColumnMetadata>): UnknownRow {
    return columnMetadata.reduce((deserialized, columnMetadatum) => {
      const {name} = columnMetadatum

      return {
        ...deserialized,
        [name]: this.#deserializeColumn(row[name], columnMetadatum.dataType, name),
      }
    }, {})
  }

  #deserializeColumn(value: unknown, dataType: string, columnName: string): unknown {
    const customDeserializedValue = this.#config.deserializer?.(value, dataType, columnName)

    if (customDeserializedValue !== undefined) {
      return customDeserializedValue
    }

    const impreciseDataType = this.#getImpreciseDataType(dataType)

    switch (impreciseDataType) {
      case SingleStoreDataType.Bool:
      case SingleStoreDataType.Boolean:
        return Boolean(value)
      case SingleStoreDataType.Date:
        return new Date(`${value}T00:00:00.000Z`)
      case SingleStoreDataType.Datetime:
      case SingleStoreDataType.Timestamp:
        return this.#deserializeDatetimeColumn(value, dataType)
      case SingleStoreDataType.Decimal:
        return this.#config.unwrapDecimals ? Number(value) : value
      case SingleStoreDataType.TinyInt:
        return this.#config.castTinyIntAsBoolean ? Boolean(value) : value
      default:
        return value
    }
  }

  #getImpreciseDataType(dataType: string): string {
    return dataType.replace(/^(\w+)(\(\d+(,\d+)?\))?$/, '$1')
  }

  #deserializeDatetimeColumn(value: unknown, dataType: string): unknown {
    switch (dataType) {
      case SingleStoreDataType.Datetime:
      case SingleStoreDataType.Timestamp:
        return new Date(`${value}.000000Z`)
      case `${SingleStoreDataType.Datetime}(6)`:
      case `${SingleStoreDataType.Timestamp}(6)`:
        return new Date(`${value}Z`)
      default:
        return value
    }
  }
}
