# Cursor Pagination

A full round-trip: build the first page, resolve it, then fetch the next page
using the returned cursor. See [Cursor Pagination](/v2/cursor-pagination) for the
API details and rules (single-table, `after` only, `sort` + `limit` required).

```js
const PagiHelpV2 = require("pagi-help/v2");

const pagiHelp = new PagiHelpV2({ dialect: "postgres" });

// 1. First page
const initialQueries = pagiHelp.paginateCursor(
  {
    search: "ORD",
    filters: [["status", "=", "Paid"]],
    sort: { attributes: ["createdAt"], sorts: ["desc"] },
    limit: 20,
  },
  [
    {
      tableName: "orders",
      columnList: [
        { name: "order_id", alias: "id" },
        { name: "reference", alias: "reference" },
        { name: "status", alias: "status" },
        { name: "created_at", alias: "createdAt" },
      ],
      searchColumnList: [{ name: "reference" }, { name: "status" }],
    },
  ]
);
```

Generated first-page query:

```sql
SELECT order_id AS "id",reference AS "reference",status AS "status",created_at AS "createdAt"
FROM "orders"
WHERE (status = ?) AND ( reference LIKE ? OR status LIKE ? )
ORDER BY "createdAt"DESC,"id"DESC
LIMIT ? OFFSET ?
-- replacements: ["Paid", "%ORD%", "%ORD%", 21, 0]   (fetches limit + 1 = 21)
```

```js
// 2. Run initialQueries.query against your DB, then resolve the page.
//    (rows below are illustrative)
const fetchedRows = [
  { id: 1006, reference: "ORD-1006", status: "Paid", createdAt: "2026-05-15" },
  { id: 1003, reference: "ORD-1003", status: "Paid", createdAt: "2026-05-06" },
];

const resolvedPage = pagiHelp.resolveCursorPage(
  fetchedRows,
  initialQueries.cursorPlan
);
// resolvedPage.pageInfo => { hasNextPage, hasPreviousPage, startCursor, endCursor, nextCursor }

// 3. Next page — pass the endCursor back in as `after`.
//    Repeat the SAME search/filters/sort that produced the cursor — only
//    `after` changes — or the token is rejected ("Cursor token does not
//    match the current query").
const nextQueries = pagiHelp.paginateCursor(
  {
    search: "ORD",
    filters: [["status", "=", "Paid"]],
    sort: { attributes: ["createdAt"], sorts: ["desc"] },
    limit: 20,
    after: resolvedPage.pageInfo.endCursor,
  },
  [
    {
      tableName: "orders",
      columnList: [
        { name: "order_id", alias: "id" },
        { name: "reference", alias: "reference" },
        { name: "status", alias: "status" },
        { name: "created_at", alias: "createdAt" },
      ],
      searchColumnList: [{ name: "reference" }, { name: "status" }],
    },
  ]
);
```

## Key points

- `query` fetches `limit + 1` rows; `resolveCursorPage()` trims the extra one and
  computes `pageInfo`.
- `pageInfo.endCursor` (or `nextCursor`) becomes the `after` value for the next
  call.
- The cursor token is opaque and self-describing (it encodes the dialect, sort,
  a query fingerprint, and the keyset values).
- `countQuery` / `totalCountQuery` stay aggregate, and include the cursor
  predicate when `after` is present.
