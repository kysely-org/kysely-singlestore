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
 * Things gets complicated when the consumer uses raw sql. In such cases, the compiled query's root
 * node is a `RawNode`, so we have no indication if its a select query.
 * If the first keyword is `select` or `explain`, easy. Else, if the first
 * keyword is `with`, we need to ensure it is not `with...delete`, `with...insert`, `with...replace` or `with...update`.
 */
export function isSelectQuery(compiledQuery: CompiledQuery): boolean {
  return SelectQueryNode.is(compiledQuery.query) || isRawSelectQuery(compiledQuery)
}

function isRawSelectQuery(compiledQuery: CompiledQuery): boolean {
  if (!RawNode.is(compiledQuery.query)) {
    return false
  }

  return compiledQuery.sql.match(/^\s*(\(?select|explain)/i) != null || isRawWithSelectQuery(compiledQuery)
}

function isRawWithSelectQuery(compiledQuery: CompiledQuery): boolean {
  const sql = compiledQuery.sql.trim()

  if (!sql.match(/^with/i)) {
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
