import type {SinglestoreDataApiColumnMetadata} from '../dialect/index.js'

/**
 * Stores column metadata per query.
 *
 * Current Kysely version does not provide QueryId to drivers on query execution.
 * This is not ideal - drivers cannot communicate with plugins, cannot share
 * additional information returned from database.
 *
 * As a result, this hacky version was implemented. We use compiled raw sql
 * as dictionary keys. This can introduce a memory leak - entries are not
 * garbage collected and we cannot programatically delete entries safely
 * without failing concurrent executions of same raw sql.
 *
 * If you've got a lot of unique queries, you're advised to take a closer
 * look at your heapdumps after running all queries, and probably avoid using
 * `SinglestoreDataApiDeserializerPlugin` for now.
 */
export class SinglestoreDataApiColumnMetadataStore {
  static #instance: SinglestoreDataApiColumnMetadataStore
  // #columnMetadataDictionary: WeakMap<object, SinglestoreDataApiColumnMetadata[]>
  #columnMetadataDictionary: Record<string, ReadonlyArray<SinglestoreDataApiColumnMetadata>> | undefined

  private constructor() {
    // this.#columnMetadataDictionary = new WeakMap()
    this.#columnMetadataDictionary = {}
  }

  static get enabled(): boolean {
    return this.#instance != null
  }

  static getInstance(): SinglestoreDataApiColumnMetadataStore {
    return (SinglestoreDataApiColumnMetadataStore.#instance ??= new SinglestoreDataApiColumnMetadataStore())
  }

  // delete(queryId: object): void {
  //   this.#columnMetadataDictionary.delete(queryId)
  // }

  destroy(): void {
    this.#columnMetadataDictionary = undefined
  }

  // read(queryId: object): SinglestoreDataApiColumnMetadata[] | undefined {
  //   return this.#columnMetadataDictionary.get(queryId)
  // }
  read(sql: string): ReadonlyArray<SinglestoreDataApiColumnMetadata> | undefined {
    return this.#columnMetadataDictionary?.[sql]
  }

  // write(queryId: object, columnMetadata: SinglestoreDataApiColumnMetadata[]): void {
  //   this.#columnMetadataDictionary.set(queryId, columnMetadata)
  // }
  write(sql: string, columnMetadata: SinglestoreDataApiColumnMetadata[]): void {
    if (this.#columnMetadataDictionary) {
      this.#columnMetadataDictionary[sql] = columnMetadata
    }
  }
}
