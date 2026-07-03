# Single Table

The simplest case: paginate one table with search, filters, and sorting.

```js
const PagiHelpV2 = require("pagi-help/v2");

const pagiHelp = new PagiHelpV2({ dialect: "mysql" });

const paginationObject = {
  search: "campaign",
  filters: [
    ["status", "=", "Active"],
    ["created_date", ">=", "2026-01-01"],
  ],
  sort: {
    attributes: ["created_date"],
    sorts: ["desc"],
  },
  pageNo: 1,
  itemsPerPage: 10,
};

const options = [
  {
    tableName: "campaigns",
    columnList: [
      { name: "campaign_id", alias: "id" },
      { name: "campaign_name", alias: "campaign_name" },
      { name: "created_date", alias: "created_date" },
      { name: "status", alias: "status" },
    ],
    searchColumnList: [{ name: "campaign_name" }, { name: "status" }],
  },
];

const result = pagiHelp.paginate(paginationObject, options);

console.log(JSON.stringify(result, null, 2));
```

## What you get back

```js
{
  query,            // SELECT ... FROM `campaigns` WHERE ... ORDER BY ... LIMIT ?,?
  countQuery,       // aggregate COUNT(*) returning countValue
  totalCountQuery,  // identical to countQuery on v2
  replacements,     // positional values
}
```

- Top-level filters are AND-ed: `status = ? AND created_date >= ?`.
- `search` adds `( campaign_name LIKE ? OR status LIKE ? )`.
- A trailing `id DESC` tie-breaker is appended to the sort.

See [Filters & Operators](/v2/filters-and-operators) and
[Return Shape](/v2/return-shape) for the details.
