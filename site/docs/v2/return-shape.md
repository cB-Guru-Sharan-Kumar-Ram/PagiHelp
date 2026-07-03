# Return Shape

Both `paginate()` and `paginateSafe()` return the same object:

```js
{
  query,            // the row SELECT with WHERE, ORDER BY, and LIMIT
  countQuery,       // aggregate COUNT(*) returning countValue
  totalCountQuery,  // identical to countQuery on v2
  replacements,     // positional values for query / count queries
}
```

On v2, `countQuery` and `totalCountQuery` are the **same aggregate query** — both
fields exist because they differed in [v1](/guide/migration) (row-select vs
aggregate). Run either one, once.

[`paginateCursor()`](/v2/cursor-pagination) returns the same fields **plus** a
`cursorPlan`.

## Using the result

::: code-group

```js [mysql2]
const [rows] = await connection.query(result.query, result.replacements);
const [[{ countValue }]] = await connection.query(
  result.totalCountQuery,
  result.replacements
);
```

```js [Sequelize]
const { QueryTypes } = require("sequelize");

const rows = await sequelize.query(result.query, {
  replacements: result.replacements,
  type: QueryTypes.SELECT,
});
const [{ countValue }] = await sequelize.query(result.totalCountQuery, {
  replacements: result.replacements,
  type: QueryTypes.SELECT,
});
```

:::

The aggregate count queries return a single column named `countValue`. mysql2
resolves to a `[rows, fields]` pair (hence the double destructure); Sequelize
with `type: QueryTypes.SELECT` returns the rows directly.

## Pagination clause by dialect

When a page window is given, the `query` ends with a dialect-specific pagination
clause:

- **MySQL**: `LIMIT ?,?` with replacements `[offset, limit]`
- **PostgreSQL**: `LIMIT ? OFFSET ?` with replacements `[limit, offset]`

See [MySQL](/dialects/mysql) and [PostgreSQL](/dialects/postgres) for details.
