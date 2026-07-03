# PostgreSQL Dialect

Opt into PostgreSQL on the constructor:

```js
const PagiHelpV2 = require("pagi-help/v2");
const pagiHelp = new PagiHelpV2({ dialect: "postgres" });
```

## Identifier quoting

PostgreSQL quotes generated table names and `ORDER BY` identifiers with
**double quotes**:

```sql
FROM "audit"."licenses"
ORDER BY "created_at"DESC
```

## Schema-qualified names

Schema-qualified table names are supported on v2:

- `tableName: "audit.licenses"` renders `FROM "audit"."licenses"`.
- If you want a table alias, keep it in `joinQuery`, **not** inside `tableName`.
- Raw `additionalWhereConditions` can use fully-qualified fields like
  `"audit.licenses.organization_id"`.
- Regular `filters` still resolve by `alias` or `prefix.column`, **not** by
  `schema.table.column`.

## Pagination clause

PostgreSQL uses separate `LIMIT` and `OFFSET`:

```sql
LIMIT ? OFFSET ?
```

Replacements are `[limit, offset]`.

For [cursor pagination](/v2/cursor-pagination), PostgreSQL uses
`LIMIT ? OFFSET ?` with replacements `[limit + 1, 0]`.

## Native operators

PostgreSQL has its own native operator set on v2:

| Operator | Meaning |
| --- | --- |
| `ILIKE` | case-insensitive `LIKE` |
| `~` `~*` `!~` `!~*` | regex (match / case-insensitive / negated) |
| `@>` `<@` | contains / contained-by |
| `?` `?|` `?&` | jsonb key exists / any / all |
| `&&` | array overlap |

```js
filters: [
  ["metaInfo", "@>", { priority: "high" }],
  ["tags", "?|", ["featured", "priority"]],
  ["reference", "~*", "^lic-2026-"],
];
```

## Operator compatibility

To ease migration of shared MySQL-style code, PostgreSQL keeps compatibility
aliases that translate to native SQL:

| MySQL-style | PostgreSQL rendering |
| --- | --- |
| `JSON_CONTAINS` | `@>` |
| `JSON_OVERLAPS` | emulated `jsonb` overlap SQL |
| `FIND_IN_SET` | `array_position(string_to_array(...), ?::text) IS NOT NULL` |
| `RLIKE` | `~` |
| `MEMBER OF` | `?::jsonb @> to_jsonb(field)` |
| `! IN` | `NOT IN` |

## Example

```js
const PagiHelpV2 = require("pagi-help/v2");
const pagiHelp = new PagiHelpV2({ dialect: "postgres" });

const result = pagiHelp.paginate(
  {
    search: "LIC",
    filters: [
      ["metaInfo", "@>", { priority: "high" }],
      ["tags", "?|", ["featured", "priority"]],
      ["reference", "~*", "^lic-2026-"],
    ],
    sort: { attributes: ["createdAt"], sorts: ["desc"] },
    pageNo: 2,
    itemsPerPage: 10,
  },
  [
    {
      tableName: "audit.licenses",
      columnList: [
        { name: "license_id", alias: "id" },
        { name: "created_at", alias: "createdAt" },
        { name: "meta_info", alias: "metaInfo" },
        { name: "tags", alias: "tags" },
        { name: "reference", alias: "reference" },
        {
          statement:
            "(CASE WHEN audit.licenses.tier = '1' THEN 'Premium' ELSE 'Standard' END)",
          alias: "tierLabel",
        },
      ],
      searchColumnList: [{ name: "reference" }],
      additionalWhereConditions: [["audit.licenses.organization_id", "=", 42]],
    },
  ]
);
```

::: warning
Use PostgreSQL SQL inside `statement`, `joinQuery`, and raw
`additionalWhereConditions`. Do not reuse MySQL-only functions like `IF()` there.
:::
