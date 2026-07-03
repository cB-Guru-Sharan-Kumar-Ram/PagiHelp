# Joined Table

Use `joinQuery` to add a JOIN, `prefix` to qualify columns, and `statement` for
computed columns. This example joins `orders` to `shipments` and uses a
`columnNameConverter` to map camelCase to snake_case.

```js
const PagiHelpV2 = require("pagi-help/v2");

const pagiHelp = new PagiHelpV2({
  dialect: "mysql",
  columnNameConverter: (name) =>
    name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
});

const paginationObject = {
  search: "NEW",
  filters: [
    ["expedited", "=", "Yes"],
    ["o.status", "IN", ["NEW", "PACKING"]],
  ],
  sort: {
    attributes: ["createdDate"],
    sorts: ["desc"],
  },
  pageNo: 1,
  itemsPerPage: 20,
};

const options = [
  {
    tableName: "orders",
    columnList: [
      { name: "order_id", prefix: "o", alias: "id" },
      { name: "created_date", prefix: "o", alias: "createdDate" },
      { name: "status", prefix: "o", alias: "status" },
      {
        statement: '(SELECT IF(o.priority="1","Yes","No"))',
        alias: "expedited",
      },
      { name: "carrier", prefix: "s", alias: "carrier" },
    ],
    searchColumnList: [
      { name: "carrier", prefix: "s" },
      { name: "status", prefix: "o" },
    ],
    joinQuery: " o left join shipments s on o.order_id = s.order_id ",
    additionalWhereConditions: [["o.archived", "=", 0]],
  },
];

const result = pagiHelp.paginate(paginationObject, options);
```

Generated MySQL query:

```sql
SELECT o.order_id AS id,o.created_date AS createdDate,o.status AS status,
       (SELECT IF(o.priority="1","Yes","No")) AS expedited,s.carrier AS carrier
FROM `orders` o left join shipments s on o.order_id = s.order_id
WHERE (o.archived = ?)
  AND ((SELECT IF(o.priority="1","Yes","No")) = ? AND o.status IN (?,?))
  AND ( s.carrier LIKE ? OR o.status LIKE ? )
ORDER BY `created_date`DESC,`id`DESC
LIMIT ?,?
-- replacements: [0, "Yes", "NEW", "PACKING", "%NEW%", "%NEW%", 0, 20]
```

## Notes

- **`prefix`** renders `o.created_date`, `s.carrier`, etc.
- **`statement`** is raw SQL for computed/derived columns (trusted input). The
  MySQL `IF()` above is fine in a MySQL context; use Postgres SQL for the
  Postgres dialect.
- **Filters can reference** an `alias` (`expedited` → matches the `expedited`
  computed column), or a `prefix.column` (`o.status`).
- **`joinQuery`** is concatenated verbatim after `FROM \`orders\``; include the
  leading space and table alias yourself.
- **`additionalWhereConditions`** are raw conditions AND-ed into every query.

::: warning
`joinQuery`, `statement`, and `additionalWhereConditions` are trusted-input SQL.
Never build them from untrusted user input.
:::
