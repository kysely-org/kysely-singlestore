import type {QueryResult} from 'kysely'

import {SingleStoreDataType} from '../../util/singlestore-data-type.js'
import type {
  SingleStoreDataApiColumnMetadata,
  SingleStoreDataApiDeserializationConfig,
  SingleStoreDataApiQueryTuplesResponseBodyResult,
} from './types.js'

/**
 * @internal
 */
export class SingleStoreDataApiResultDeserializer {
  readonly #config: SingleStoreDataApiDeserializationConfig

  constructor(config?: SingleStoreDataApiDeserializationConfig) {
    this.#config = {...config}
  }

  deserializeResult<O>(result: SingleStoreDataApiQueryTuplesResponseBodyResult): QueryResult<O> {
    const {columns} = result

    return {
      rows: result.rows.map((row) => this.#deserializeRow<O>(row, columns)),
    }
  }

  #deserializeRow<O>(row: ReadonlyArray<unknown>, columnMetadata: ReadonlyArray<SingleStoreDataApiColumnMetadata>): O {
    return columnMetadata.reduce((deserialized, columnMetadatum, columnIndex) => {
      const {name} = columnMetadatum

      return {
        ...deserialized,
        [name]: this.#deserializeColumn(row[columnIndex], columnMetadatum.dataType, name),
      }
    }, {} as O)
  }

  #deserializeColumn(value: unknown, dataType: string, columnName: string): unknown {
    const customDeserializedValue = this.#config.deserialize?.(value, dataType, columnName)

    if (customDeserializedValue !== undefined) {
      return customDeserializedValue
    }

    if (value === null) {
      return value
    }

    const impreciseDataType = this.#getImpreciseDataType(dataType)

    switch (impreciseDataType) {
      case SingleStoreDataType.Bool:
      case SingleStoreDataType.Boolean:
        return Boolean(value)
      case SingleStoreDataType.Date:
        return this.#config.castDatesAsNativeDates ? new Date(`${value}T00:00:00.000Z`) : value
      case SingleStoreDataType.Datetime:
      case SingleStoreDataType.Timestamp:
        return this.#deserializeDatetimeColumn(value, dataType)
      case SingleStoreDataType.Dec:
      case SingleStoreDataType.Decimal:
      case SingleStoreDataType.Fixed:
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
    if (!this.#config.castDatesAsNativeDates) {
      return value
    }

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
