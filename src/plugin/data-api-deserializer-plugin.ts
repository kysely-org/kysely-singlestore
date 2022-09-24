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

import type {SinglestoreDataApiColumnMetadata} from '../dialect'
import {SinglestoreDataType} from '../util'
import {SinglestoreDataApiColumnMetadataStore} from '../util/data-api-column-metadata-store'

export interface SinglestoreDataApiDeserializerPluginConfig {
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

export class SinglestoreDataApiDeserializerPlugin implements KyselyPlugin {
  readonly #config: SinglestoreDataApiDeserializerPluginConfig
  readonly #rootOperationNodeDictionary: WeakMap<object, RootOperationNode>

  constructor(config: SinglestoreDataApiDeserializerPluginConfig) {
    this.#config = {...config}
    this.#rootOperationNodeDictionary = new WeakMap()
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    const {node} = args

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

    const columnMetadata = SinglestoreDataApiColumnMetadataStore.getInstance().read(sql)

    if (!columnMetadata) {
      throw new Error('Missing column metadata!')
    }

    return {
      rows: result.rows.map((row) => this.#deserializeRow(row, columnMetadata)),
    }
  }

  #deserializeRow(row: UnknownRow, columnMetadata: ReadonlyArray<SinglestoreDataApiColumnMetadata>): UnknownRow {
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
      case SinglestoreDataType.Bool:
      case SinglestoreDataType.Boolean:
        return Boolean(value)
      case SinglestoreDataType.Date:
        return new Date(`${value}T00:00:00.000Z`)
      case SinglestoreDataType.Datetime:
      case SinglestoreDataType.Timestamp:
        return this.#deserializeDatetimeColumn(value, dataType)
      case SinglestoreDataType.Decimal:
        return this.#config.unwrapDecimals ? Number(value) : value
      case SinglestoreDataType.TinyInt:
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
      case SinglestoreDataType.Datetime:
      case SinglestoreDataType.Timestamp:
        return new Date(`${value}.000000Z`)
      case `${SinglestoreDataType.Datetime}(6)`:
      case `${SinglestoreDataType.Timestamp}(6)`:
        return new Date(`${value}Z`)
      default:
        return value
    }
  }
}
