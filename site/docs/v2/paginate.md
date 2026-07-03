# paginate()

```js
const result = pagiHelp.paginate(paginationObject, options);
```

Builds offset/page-based pagination SQL. Returns `{ query, countQuery,
totalCountQuery, replacements }` — see [Return Shape](/v2/return-shape).

## `paginationObject`

```js
{
  search: "Active",                                   // optional free-text search
  filters: [["status", "IN", ["Active", "Paused"]]],  // optional conditions
  sort: {                                             // optional ordering
    attributes: ["created_at"],
    sorts: ["desc"],
  },
  pageNo: 1,          // page-based window ...
  itemsPerPage: 10,
  // ... or offset-based window:
  // offset: 10,
  // limit: 20,
}
```

| Field | Description |
| --- | --- |
| `search` | Free-text value matched with `LIKE` against `searchColumnList`. See [Search](/v2/search). |
| `filters` | `[field, operator, value]` tuples, nestable into AND/OR groups. See [Filters & Operators](/v2/filters-and-operators). |
| `sort` | `{ attributes, sorts }` parallel arrays. See [Sorting](/v2/sorting). |
| `pageNo` + `itemsPerPage` | Page-based window. Both required together. |
| `offset` + `limit` | Offset-based window. Both required together. |

::: tip Page window rules
Provide **either** `pageNo`/`itemsPerPage` **or** `offset`/`limit`. Each pair
must be supplied together. If both pairs are given, page-based values win.
Note: `offset: 0` emits **no** pagination clause — use `pageNo: 1` +
`itemsPerPage` for the first page.
:::

## `options`

An array of one or more table blocks. Multiple blocks are combined with
`UNION ALL` — see [Multi-Table Union](/examples/multi-table-union).

```js
[
  {
    tableName: "events",
    columnList: [
      { name: "id", alias: "id" },
      { name: "status", alias: "status" },
      { name: "created_at", alias: "created_at" },
    ],
    searchColumnList: [{ name: "status" }],
    joinQuery: "",                       // optional raw JOIN SQL
    additionalWhereConditions: [],       // optional raw conditions (AND-ed in)
  },
]
```

| Field | Description |
| --- | --- |
| `tableName` | Table name. Postgres supports `schema.table`. |
| `columnList` | Column descriptors to select. Should include alias `id`. |
| `searchColumnList` | Columns matched by `search` (no `alias` allowed on v2). |
| `joinQuery` | Raw JOIN SQL appended after `FROM`. Trusted input. |
| `additionalWhereConditions` | Raw conditions AND-ed into every query. Trusted input. |

::: warning Trusted-input fields
`joinQuery`, `statement`, and `additionalWhereConditions` are concatenated as raw
SQL (operators are not validated for these). Never build them from untrusted user
input. Regular `filters` and `search` values **are** parameterized.
:::

## Full example

```js
const PagiHelpV2 = require("pagi-help/v2");
const pagiHelp = new PagiHelpV2({ dialect: "mysql" });

const result = pagiHelp.paginate(
  {
    search: "Active",
    filters: [["status", "IN", ["Active", "Paused"]]],
    sort: { attributes: ["created_at"], sorts: ["desc"] },
    pageNo: 1,
    itemsPerPage: 10,
  },
  [
    {
      tableName: "events",
      columnList: [
        { name: "id", alias: "id" },
        { name: "status", alias: "status" },
        { name: "created_at", alias: "created_at" },
      ],
      searchColumnList: [{ name: "status" }],
    },
  ]
);
```

## paginateSafe()

`paginateSafe(paginationObject, options, safeOptions)` validates the input first
(via `validatePaginationInput`) and throws an `Error` listing all problems before
building SQL. With v2 defaults (`validate: true`), `paginate()` already runs in a
hardened mode; `paginateSafe()` makes the validate-then-build step explicit.

```js
const report = pagiHelp.validatePaginationInput(paginationObject, options);
if (!report.valid) throw new Error(report.errors.join("\n"));

const result = pagiHelp.paginateSafe(paginationObject, options);
```

## Related

- [Return Shape](/v2/return-shape)
- [Cursor Pagination](/v2/cursor-pagination) for keyset-based paging
- [Examples](/examples/single-table)
