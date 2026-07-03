# Pagination Examples

PagiHelp supports two windowing styles — **page-based**
(`pageNo` + `itemsPerPage`) and **offset-based** (`offset` + `limit`) — and emits
a dialect-specific `LIMIT` clause. For unbounded forward paging, see
[Cursor Pagination](/examples/cursor).

All examples use this demo table:

```js
const PagiHelpV2 = require("pagi-help/v2");

const options = [
  {
    tableName: "orders",
    columnList: [
      { name: "order_id", alias: "id" },
      { name: "reference", alias: "reference" },
      { name: "status", alias: "status" },
      { name: "total", alias: "total" },
      { name: "created_at", alias: "createdAt" },
    ],
    searchColumnList: [{ name: "reference" }, { name: "status" }],
  },
];
```

::: tip Try it live
Toggle page-based vs offset-based and watch the clause change in the
[interactive Playground](/playground).
:::

## Page-based (MySQL)

```js
const pagiHelp = new PagiHelpV2({ dialect: "mysql" });
const result = pagiHelp.paginate({ pageNo: 2, itemsPerPage: 25 }, options);
```

```sql
... LIMIT ?,?                    -- [25, 25]
```

The offset is computed as `(pageNo - 1) * itemsPerPage` → `25`, with `25` rows.

## Offset-based (MySQL)

```js
const result = pagiHelp.paginate({ offset: 40, limit: 20 }, options);
```

```sql
... LIMIT ?,?                    -- [40, 20]
```

MySQL replacements are `[offset, limit]`.

## Page-based (PostgreSQL)

```js
const pagiHelp = new PagiHelpV2({ dialect: "postgres" });
const result = pagiHelp.paginate({ pageNo: 2, itemsPerPage: 25 }, options);
```

```sql
... LIMIT ? OFFSET ?             -- [25, 25]
```

## Offset-based (PostgreSQL)

```js
const result = pagiHelp.paginate({ offset: 40, limit: 20 }, options);
```

```sql
... LIMIT ? OFFSET ?             -- [20, 40]
```

PostgreSQL replacements are `[limit, offset]` — the reverse order of MySQL.

## Clause & order cheat-sheet

| Dialect | Clause | Replacements |
| --- | --- | --- |
| MySQL | `LIMIT ?,?` | `[offset, limit]` |
| PostgreSQL | `LIMIT ? OFFSET ?` | `[limit, offset]` |

## Rules

- Provide **either** `pageNo` + `itemsPerPage` **or** `offset` + `limit`.
- Each pair must be supplied together; supplying only one half is rejected.
- If both pairs are given, page-based values win.

## Counting total rows

Use the aggregate `totalCountQuery` (returns a `countValue` column) to compute the
total number of pages:

::: code-group

```js [mysql2]
const [[{ countValue }]] = await connection.query(
  result.totalCountQuery,
  result.replacements
);
const totalPages = Math.ceil(countValue / itemsPerPage);
```

```js [Sequelize]
const [{ countValue }] = await sequelize.query(result.totalCountQuery, {
  replacements: result.replacements,
  type: QueryTypes.SELECT,
});
const totalPages = Math.ceil(countValue / itemsPerPage);
```

:::

On v2, `countQuery` and `totalCountQuery` are the same aggregate query — run
either one, once. See [Return Shape](/v2/return-shape).
