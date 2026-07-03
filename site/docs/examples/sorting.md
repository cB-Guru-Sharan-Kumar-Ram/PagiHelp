# Sorting Examples

Sorting uses two parallel arrays — `attributes` and `sorts` — of equal length.
A deterministic `id DESC` tie-breaker is appended automatically. See
[Sorting](/v2/sorting) for the rules.

All examples use this demo table:

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
Add and reorder sort fields in the [interactive Playground](/playground).
:::

## Single column, descending

```js
sort: { attributes: ["createdAt"], sorts: ["desc"] }
```

```sql
ORDER BY `createdAt`DESC,`id`DESC
```

The trailing `` `id`DESC `` is the automatic tie-breaker.

## Single column, ascending

```js
sort: { attributes: ["total"], sorts: ["asc"] }
```

```sql
ORDER BY `total`ASC,`id`DESC
```

## Multiple columns

Sort by status ascending, then total descending:

```js
sort: { attributes: ["status", "total"], sorts: ["asc", "desc"] }
```

```sql
ORDER BY `status`ASC,`total`DESC,`id`DESC
```

::: warning
`attributes` and `sorts` must be the **same length**, and each `sorts` entry must
be `"asc"` or `"desc"` (case-insensitive). Anything else is rejected.
:::

## PostgreSQL identifier quoting

The same sort under `dialect: "postgres"` uses double quotes:

```js
const pg = new PagiHelpV2({ dialect: "postgres" });
// sort: { attributes: ["createdAt"], sorts: ["desc"] }
```

```sql
ORDER BY "createdAt"DESC,"id"DESC
```

## Your input is never mutated

PagiHelp does not append `id` to the `sort` arrays you pass in — the tie-breaker
is added only to the generated SQL. Your original `paginationObject.sort` stays
untouched, so you can safely reuse it.

```js
const sort = { attributes: ["createdAt"], sorts: ["desc"] };
pagiHelp.paginate({ sort, pageNo: 1, itemsPerPage: 10 }, options);

console.log(sort.attributes); // still ["createdAt"] — not mutated
```
