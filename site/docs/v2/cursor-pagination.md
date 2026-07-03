# Cursor Pagination

`paginateCursor()` generates keyset (cursor) pagination SQL. It is available on
**v2 only** and uses opaque, self-describing cursor tokens.

```js
const cursorQueries = pagiHelp.paginateCursor(paginationObject, options);
// { query, countQuery, totalCountQuery, replacements, cursorPlan }
```

## Phase-1 rules

The current implementation is phase 1 and enforces:

- **single-table only** (exactly one option block)
- **`after` only** (forward paging)
- `sort` is **required**
- `limit` is **required**
- `pageNo`, `itemsPerPage`, `offset`, and `before` are **rejected**
- the selected columns must include alias `id`

## Building the first page

```js
const PagiHelpV2 = require("pagi-help/v2");
const pagiHelp = new PagiHelpV2({ dialect: "postgres" });

const cursorQueries = pagiHelp.paginateCursor(
  {
    search: "mail",
    filters: [["stage", "=", "OPEN"]],
    sort: { attributes: ["createdAt"], sorts: ["desc"] },
    limit: 20,
    // after: existingCursorToken  // omit for the first page
  },
  [
    {
      tableName: "audit.licenses",
      columnList: [
        { name: "license_id", alias: "id" },
        { name: "created_at", alias: "createdAt" },
        { name: "stage", alias: "stage" },
      ],
      searchColumnList: [{ name: "stage" }],
    },
  ]
);
```

## Return shape

```js
{
  countQuery,
  totalCountQuery,
  query,
  replacements,
  cursorPlan,   // metadata consumed by the helpers below
}
```

- `query` fetches `limit + 1` rows (the extra row detects `hasNextPage`).
- `cursorPlan` carries the normalized sort, dialect, fetch size, and a query
  fingerprint that ties a cursor to the query that produced it.

## Resolving a page

After running `query`, hand the rows and the `cursorPlan` to
`resolveCursorPage()`. It trims the extra row and returns `pageInfo`:

::: code-group

```js [mysql2]
const [rows] = await connection.query(
  cursorQueries.query,
  cursorQueries.replacements
);
```

```js [Sequelize]
const rows = await sequelize.query(cursorQueries.query, {
  replacements: cursorQueries.replacements,
  type: QueryTypes.SELECT,
});
```

:::

```js
const page = pagiHelp.resolveCursorPage(rows, cursorQueries.cursorPlan);
// {
//   rows: [...],            // trimmed to `limit`
//   pageInfo: {
//     hasNextPage,
//     hasPreviousPage,
//     startCursor,
//     endCursor,
//     nextCursor,
//   }
// }
```

## Fetching the next page

Feed `page.pageInfo.endCursor` (or `nextCursor`) back in as `after`. The cursor
token is bound to the query that produced it — dialect, `search`, `filters`, and
`sort` are baked into its fingerprint — so the next call **must repeat the same
`search`, `filters`, and `sort`**; only `after` changes. A mismatch is rejected
at runtime with `Cursor token does not match the current query`.

```js
const next = pagiHelp.paginateCursor(
  {
    search: "mail",
    filters: [["stage", "=", "OPEN"]],
    sort: { attributes: ["createdAt"], sorts: ["desc"] },
    limit: 20,
    after: page.pageInfo.endCursor,
  },
  [
    {
      tableName: "audit.licenses",
      columnList: [
        { name: "license_id", alias: "id" },
        { name: "created_at", alias: "createdAt" },
        { name: "stage", alias: "stage" },
      ],
      searchColumnList: [{ name: "stage" }],
    },
  ]
);
```

## Cursor token helpers

| Helper | Purpose |
| --- | --- |
| `encodeCursorFromRow(row, cursorPlan)` | Build an opaque `after` token from one row |
| `decodeCursor(token)` | Decode and validate the token envelope |
| `resolveCursorPage(rows, cursorPlan)` | Trim the extra row and derive `pageInfo` |

The decoded token envelope looks like:

```js
{
  v: 1,            // version
  d: "postgres",   // dialect
  fp: "...",       // query fingerprint
  s: [["createdAt", "DESC"], ["id", "DESC"]],  // sort + appended id tie-breaker (directions upper-cased)
  values: [...],   // the keyset values
  dir: "after",
}
```

## Count semantics

- `countQuery` and `totalCountQuery` remain **aggregate** on v2.
- When `after` is present, **both** count queries include the cursor predicate.

## Pagination clause

- **MySQL** cursor pagination uses `LIMIT ?,?` with replacements `[0, limit + 1]`.
- **PostgreSQL** cursor pagination uses `LIMIT ? OFFSET ?` with replacements
  `[limit + 1, 0]`.

::: tip Roadmap
Phase 1 covers single-table forward (`after`) paging. Backward (`before`) paging
and multi-table cursors are reserved for future phases — `before` is currently
rejected at runtime.
:::

See the full runnable script in [Examples → Cursor Pagination](/examples/cursor).
