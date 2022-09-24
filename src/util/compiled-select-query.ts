import {SelectQueryNode, type CompiledQuery} from 'kysely'

export type CompiledSelectQuery = Omit<CompiledQuery, 'query'> & {
  readonly query: SelectQueryNode
}

export function isCompiledSelectQuery(compiledQuery: CompiledQuery): compiledQuery is CompiledSelectQuery {
  return SelectQueryNode.is(compiledQuery.query)
}
