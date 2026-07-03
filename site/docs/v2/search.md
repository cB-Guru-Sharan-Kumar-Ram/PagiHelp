# Search

Free-text search matches a single `search` string against the columns listed in
each option block's `searchColumnList`, using `LIKE` with `%value%` wrapping —
on **both** dialects. (For case-insensitive search on PostgreSQL, use the native
`ILIKE` operator via [filters](/v2/filters-and-operators#postgresql-native-operators).)

```js
const result = pagiHelp.paginate(
  {
    search: "campaign",
    // ...
  },
  [
    {
      tableName: "campaigns",
      columnList: [
        { name: "campaign_id", alias: "id" },
        { name: "campaign_name", alias: "name" },
      ],
      searchColumnList: [{ name: "campaign_name" }, { name: "status" }],
    },
  ]
);
// ... WHERE ( campaign_name LIKE ? OR status LIKE ? )
// replacements include "%campaign%" once per search column
```

## How it works

- Each column in `searchColumnList` produces `column LIKE ?`, joined with `OR`.
- The value `%${search}%` is pushed into `replacements` once per search column.
- The whole search group is AND-ed with your filters and additional conditions.

## Rules

- `searchColumnList` descriptors use the same shape as `columnList` **without**
  `alias`. On v2, an `alias` in `searchColumnList` is **rejected**.
- A missing or empty `search` produces **no** search predicate.
- A missing `searchColumnList` is treated as `[]` (no search).

::: tip
Provide `searchColumnList: []` for tables that should not participate in search —
useful in [multi-table unions](/examples/multi-table-union) where only some
tables are searchable.
:::

## Dialect note

`LIKE` is shared across dialects. For case-insensitive search on PostgreSQL you
can express conditions with the native `ILIKE` operator via
[filters](/v2/filters-and-operators#postgresql-native-operators).
