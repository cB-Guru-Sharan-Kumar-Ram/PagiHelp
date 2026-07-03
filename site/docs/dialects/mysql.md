# MySQL Dialect

MySQL is the default dialect. You can set it explicitly:

```js
const PagiHelpV2 = require("pagi-help/v2");
const pagiHelp = new PagiHelpV2({ dialect: "mysql" });
```

## Identifier quoting

MySQL quotes generated table names and `ORDER BY` identifiers with **backticks**:

```sql
FROM `events`
ORDER BY `created_at`DESC
```

## Pagination clause

MySQL uses a single `LIMIT` with offset and count:

```sql
LIMIT ?,?
```

Replacements are `[offset, limit]`.

For [cursor pagination](/v2/cursor-pagination), MySQL uses `LIMIT ?,?` with
replacements `[0, limit + 1]`.

## Operators

MySQL keeps its native operator set, including:

- `JSON_CONTAINS`, `JSON_OVERLAPS`
- `FIND_IN_SET`
- `RLIKE`
- `MEMBER OF`

plus the shared comparison/`IN`/`LIKE` operators. See
[Filters & Operators](/v2/filters-and-operators#shared-operators-both-dialects).

## Example

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

::: tip
Use MySQL-only functions (e.g. `IF()`) only inside trusted-input fields like
`statement`, `joinQuery`, and raw `additionalWhereConditions`.
:::
