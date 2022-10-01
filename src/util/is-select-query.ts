import {parse} from '@florajs/sql-parser/build/pegjs-parser.js'
import {RawNode, SelectQueryNode, type CompiledQuery} from 'kysely'

/**
 * Determines whether a compiled query is a select query.
 *
 * This is crucial for usage of SingleStore's data API, since queries that return
 * result sets, and queries that mutate schema or data, are sent to different
 * endpoints.
 *
 * In most cases, this'll be quite easy and performant. The compiled query's
 * root node is a `SelectQueryNode` when the consumer uses `db.selectFrom(table)`
 * or `db.with(...).selectFrom(table)`.
 *
 * It gets complicated when the consumer uses raw sql. The compiled query's root
 * node is a `RawNode`, so we have no indication if its a select query.
 * If the first keyword is `select` or `explain`, easy. Else, if the first
 * keyword is `with` we need to parse the raw sql to ensure it is not
 * `with...update` or `with...delete`. Parsing sql is not that simple, so
 * we've sourced it to an external package for now (we might end up extending
 * it to provide SingleStore specific syntax support).
 */
export function isSelectQuery(compiledQuery: CompiledQuery): boolean {
  const {query, sql} = compiledQuery

  if (SelectQueryNode.is(query)) {
    return true
  }

  if (!RawNode.is(query)) {
    return false
  }

  const trimmedSql = sql.trim()

  if (trimmedSql.match(/^\(*(select|explain)/i)) {
    return true
  }

  if (!trimmedSql.match(/^with/i)) {
    return false
  }

  try {
    // @florajs/sql-parser's pegjs parser only supports select parsing.
    parse(trimmedSql)

    return true
  } catch (error) {
    return false
  }
}
