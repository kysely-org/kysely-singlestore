import {
  DeleteQueryNode,
  ExplainNode,
  InsertQueryNode,
  RawNode,
  SelectQueryNode,
  UpdateQueryNode,
  type CompiledQuery,
} from 'kysely'

/**
 * Determines whether a compiled query is a result set returning query.
 *
 * This is crucial for usage of SingleStore's data API, since queries that return
 * result sets, and queries that mutate schema or data, are sent to different
 * endpoints.
 *
 * In most cases, this'll be quite easy and performant. The compiled query's
 * root node is a `SelectQueryNode` when the consumer uses `db.selectFrom(table)`
 * or `db.with(...).selectFrom(table)`.
 *
 * Things gets complicated when the consumer uses raw sql. In such cases, the compiled query's root
 * node is a `RawNode`, so we have no indication if its a select query.
 * If the first keyword is `select` or `explain`, easy. Else, if the first
 * keyword is `with`, we need to ensure it is not `with...delete`, `with...insert`, `with...replace` or `with...update`.
 */
export function isResultSetQuery(compiledQuery: CompiledQuery): boolean {
  return isSelectQuery(compiledQuery) || isEchoQuery(compiledQuery) || isExplainQuery(compiledQuery)
}

function isEchoQuery(compiledQuery: CompiledQuery): boolean {
  const {sql} = compiledQuery

  return RawNode.is(compiledQuery.query) && sql.match(/^\s*\(?echo/i) != null
}

function isSelectQuery(compiledQuery: CompiledQuery): boolean {
  return SelectQueryNode.is(compiledQuery.query) || isRawSelectQuery(compiledQuery)
}

function isExplainQuery(compiledQuery: CompiledQuery): boolean {
  const {query} = compiledQuery

  if (RawNode.is(query)) {
    return compiledQuery.sql.match(/^\s*explain/i) != null
  }

  if (!InsertQueryNode.is(query) && !UpdateQueryNode.is(query) && !DeleteQueryNode.is(query)) {
    return false
  }

  const {explain} = query

  return explain !== undefined && ExplainNode.is(explain)
}

function isRawSelectQuery(compiledQuery: CompiledQuery): boolean {
  const {sql} = compiledQuery

  return RawNode.is(compiledQuery.query) && (sql.match(/^\s*\(?select/i) != null || isWithSelectSqlString(sql))
}

function isWithSelectSqlString(sql: string): boolean {
  if (!sql.match(/^\s*with/i)) {
    return false
  }

  const OR = '|'
  const SENTENCE = '+[\\w\\W]+'
  const SPACE = '+\\s+'
  const SPECIAL = `(;|'|"|\`|\\'|\\"|\\\\|\\-\\-|\\/\\*|[\\(\\)])`
  const wrapKeyword = (keyword: string): string => '(' + SPECIAL + keyword + OR + SPECIAL + SPACE + keyword + ')'

  const notSelectRegExp = new RegExp(
    [
      wrapKeyword('delete') + SPACE + 'from',
      wrapKeyword('insert') + SPACE + 'into',
      wrapKeyword('replace') + SPACE + 'into',
      wrapKeyword('update') + SENTENCE + 'set',
    ].join(OR),
    'i',
  )

  return !sql.match(notSelectRegExp)
}
