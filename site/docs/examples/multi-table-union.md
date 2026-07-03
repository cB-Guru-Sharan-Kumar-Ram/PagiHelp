# Multi-Table Union

Pass more than one block in `options` to combine several tables with `UNION ALL`
into one paginated result set. PagiHelp aligns the column lists by `alias`,
filling gaps with `NULL` so every block selects the same columns.

```js
const PagiHelpV2 = require("pagi-help/v2");

const pagiHelp = new PagiHelpV2({ dialect: "mysql" });

const paginationObject = {
  search: "",
  sort: {
    attributes: ["id"],
    sorts: ["asc"],
  },
  offset: 10,
  limit: 20,
};

const options = [
  {
    tableName: "campaigns",
    columnList: [
      { name: "campaign_id", alias: "id" },
      { name: "campaign_name", alias: "name" },
    ],
    searchColumnList: [{ name: "campaign_name" }],
    additionalWhereConditions: [["status", "=", "Active"]],
  },
  {
    tableName: "licenses",
    columnList: [{ name: "license_id", alias: "id" }],
    searchColumnList: [],
    additionalWhereConditions: [["status", "=", "Active"]],
  },
];

const result = pagiHelp.paginate(paginationObject, options);

console.log(JSON.stringify(result, null, 2));
```

## How the union is built

- Each option block becomes one `SELECT ... FROM ...`, joined with `UNION ALL`.
- Column lists are aligned by `alias`. Missing columns are filled with
  `(NULL) AS alias` so each `SELECT` is union-compatible.
- `totalCountQuery` sums the per-table aggregate counts:
  `SELECT SUM(countValue) AS countValue FROM ( ... UNION ALL ... ) AS totalCounts`.
- The shared `sort` and pagination window apply to the combined set.

::: tip
Give tables that should not participate in search a `searchColumnList: []`, as the
`licenses` block does above.
:::
