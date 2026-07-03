# Searching Examples

Free-text search matches one `search` string against every column in
`searchColumnList` using `LIKE` with `%value%` wrapping — on **both** dialects.
The columns are OR-ed together and the whole group is AND-ed with your filters.
See [Search](/v2/search) for the rules.

All examples use this neutral `orders` table:

```js
const PagiHelpV2 = require("pagi-help/v2");
const pagiHelp = new PagiHelpV2({ dialect: "mysql" });

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
Tweak the `search` box in the [interactive Playground](/playground).
:::

## Search across multiple columns

```js
const result = pagiHelp.paginate(
  { search: "ORD", pageNo: 1, itemsPerPage: 10 },
  options
);
```

```sql
WHERE ( reference LIKE ? OR status LIKE ? )   -- ["%ORD%", "%ORD%"]
```

One replacement is pushed per search column.

## Search a single column

With `searchColumnList: [{ name: "reference" }]`:

```sql
WHERE ( reference LIKE ? )   -- ["%ORD%"]
```

## Empty / missing search

An empty string (or omitted `search`) produces **no** search predicate:

```js
const result = pagiHelp.paginate(
  { search: "", pageNo: 1, itemsPerPage: 10 },
  options
);
```

```sql
-- no WHERE from search
SELECT ... FROM `orders` LIMIT ?,?      -- [0, 10]
```

## Search combined with filters

The search group is AND-ed after your filters:

```js
const result = pagiHelp.paginate(
  {
    search: "ORD",
    filters: [["status", "=", "Paid"]],
    pageNo: 1,
    itemsPerPage: 10,
  },
  options
);
```

```sql
WHERE (status = ?) AND ( reference LIKE ? OR status LIKE ? )
-- ["Paid", "%ORD%", "%ORD%"]
```

## Excluding a table from search

Give a table `searchColumnList: []` so it contributes no search predicate —
useful in [multi-table unions](/examples/multi-table-union).

## Case-insensitive search on PostgreSQL

`LIKE` is case-sensitive on PostgreSQL. For case-insensitive matching, express it
as a filter with the native `ILIKE` operator instead of relying on `search`:

```js
const pg = new PagiHelpV2({ dialect: "postgres" });

const result = pg.paginate(
  { filters: [["reference", "ILIKE", "ord-%"]], pageNo: 1, itemsPerPage: 10 },
  options
);
```

```sql
WHERE (reference ILIKE ?)    -- ["ord-%"]
```
