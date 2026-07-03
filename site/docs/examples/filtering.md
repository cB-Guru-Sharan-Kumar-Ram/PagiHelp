# Filtering Examples

Filters are `[field, operator, value]` tuples. Top-level tuples are joined with
**AND**; a nested array of tuples becomes an **OR** group. Values are always
parameterized into `replacements` (never concatenated). This page covers **every
operator** the library supports, for both dialects.

All examples build against this neutral `orders` table:

```js
const PagiHelpV2 = require("pagi-help/v2");
const pagiHelp = new PagiHelpV2({ dialect: "mysql" }); // or "postgres"

const options = [
  {
    tableName: "orders",
    columnList: [
      { name: "order_id", alias: "id" },
      { name: "reference", alias: "reference" },
      { name: "status", alias: "status" },
      { name: "total", alias: "total" },
      { name: "created_at", alias: "createdAt" },
      // extra columns used by the JSON / array / regex examples below:
      { name: "meta_info", alias: "meta" },
      { name: "tags", alias: "tags" },
      { name: "note", alias: "note" },
    ],
    searchColumnList: [{ name: "reference" }, { name: "status" }],
  },
];
```

::: tip Try it live
Every scenario here is reproducible in the [interactive Playground](/playground).
:::

## Combining conditions

Top-level tuples → **AND**:

```js
filters: [
  ["status", "=", "Paid"],
  ["total", ">=", 10000],
];
// WHERE (status = ? AND total >= ?)      replacements: ["Paid", 10000]
```

A nested array of tuples → **OR** group:

```js
filters: [[["status", "=", "Paid"], ["status", "=", "Pending"]]];
// WHERE (( status = ? OR status = ?))    replacements: ["Paid", "Pending"]
```

Mix them — AND of an OR group:

```js
filters: [
  ["total", ">=", 10000],
  [["status", "=", "Paid"], ["status", "=", "Pending"]],
];
// WHERE (total >= ? AND ( status = ? OR status = ?))
```

::: tip Single-condition shorthand
A bare tuple like `filters: ["status", "IN", ["Paid"]]` is normalized to
`[["status", "IN", ["Paid"]]]` automatically.
:::

## A complete query, both dialects

The same request renders per dialect — note the identifier quoting and the
pagination clause (and the reversed replacement order):

::: code-group

```sql [MySQL]
SELECT order_id AS id,reference AS reference,status AS status,total AS total,created_at AS createdAt,meta_info AS meta,tags AS tags,note AS note
FROM `orders`
WHERE (status = ? AND total >= ?) AND ( reference LIKE ? OR status LIKE ? )
ORDER BY `total`DESC,`id`DESC
LIMIT ?,?
-- replacements: ["Paid", 10000, "%ORD%", "%ORD%", 0, 10]
```

```sql [PostgreSQL]
SELECT order_id AS "id",reference AS "reference",status AS "status",total AS "total",created_at AS "createdAt",meta_info AS "meta",tags AS "tags",note AS "note"
FROM "orders"
WHERE (status = ? AND total >= ?) AND ( reference LIKE ? OR status LIKE ? )
ORDER BY "total"DESC,"id"DESC
LIMIT ? OFFSET ?
-- replacements: ["Paid", 10000, "%ORD%", "%ORD%", 10, 0]
```

:::

```js
// request that produced the SQL above
{
  search: "ORD",
  filters: [["status", "=", "Paid"], ["total", ">=", 10000]],
  sort: { attributes: ["total"], sorts: ["desc"] },
  pageNo: 1,
  itemsPerPage: 10,
}
```

## Shared operators (both dialects)

These render the same `WHERE` fragment on MySQL and PostgreSQL:

| Filter | Generated `WHERE` | Replacements |
| --- | --- | --- |
| `["status", "=", "Paid"]` | `(status = ?)` | `["Paid"]` |
| `["status", "!=", "Paid"]` | `(status != ?)` | `["Paid"]` |
| `["total", ">=", 10000]` | `(total >= ?)` | `[10000]` |
| `["status", "IN", ["Paid", "Pending"]]` | `(status IN (?,?))` | `["Paid", "Pending"]` |
| `["status", "NOT IN", ["Refunded"]]` | `(status NOT IN (?))` | `["Refunded"]` |
| `["reference", "LIKE", "ORD-10%"]` | `(reference LIKE ?)` | `["ORD-10%"]` |

Also available: `>`, `<`, `<=`, `<>`.

### `IS NULL` differs by dialect

::: code-group

```sql [MySQL]
-- filters: [["note", "IS", null]]
WHERE (note IS ?)            -- replacements: [null]
-- filters: [["note", "IS NOT", null]]
WHERE (note IS NOT ?)        -- replacements: [null]
```

```sql [PostgreSQL]
-- filters: [["note", "IS", null]]
WHERE (note IS NULL)         -- replacements: []
-- filters: [["note", "IS NOT", null]]
WHERE (note IS NOT NULL)     -- replacements: []
```

:::

::: warning Empty `IN` is rejected
An empty `IN` / `NOT IN` array throws on v2 — it would otherwise produce invalid
SQL.
:::

## MySQL-only operators

Use these only with `dialect: "mysql"`:

| Filter | Generated `WHERE` | Replacements |
| --- | --- | --- |
| `["reference", "RLIKE", "^ORD-10"]` | `(reference RLIKE ?)` | `["^ORD-10"]` |
| `["meta", "JSON_CONTAINS", { featured: true }]` | `(JSON_CONTAINS(meta_info, ?))` | `['{"featured":true}']` |
| `["tags", "JSON_OVERLAPS", ["featured", "gold"]]` | `(JSON_OVERLAPS(tags, ?))` | `['["featured","gold"]']` |
| `["tags", "FIND_IN_SET", "featured"]` | `(FIND_IN_SET(?, tags))` | `["featured"]` |
| `["tags", "MEMBER OF", "featured"]` | `(tags MEMBER OF ?)` | `["featured"]` |

Object values are JSON-stringified automatically for `JSON_CONTAINS` /
`JSON_OVERLAPS`.

## PostgreSQL native operators

Use these only with `dialect: "postgres"`:

| Filter | Generated `WHERE` | Replacements |
| --- | --- | --- |
| `["reference", "ILIKE", "ord-10%"]` | `(reference ILIKE ?)` | `["ord-10%"]` |
| `["reference", "~", "^ORD"]` | `(reference ~ ?)` | `["^ORD"]` |
| `["note", "~*", "urgent"]` | `(note ~* ?)` | `["urgent"]` |
| `["reference", "!~", "^TMP"]` | `(reference !~ ?)` | `["^TMP"]` |
| `["meta", "@>", { priority: "high" }]` | `((meta_info)::jsonb @> (?::jsonb))` | `['{"priority":"high"}']` |
| `["meta", "<@", { a: 1, b: 2 }]` | `((meta_info)::jsonb <@ (?::jsonb))` | `['{"a":1,"b":2}']` |
| `["tags", "?|", ["featured", "gold"]]` | `((tags)::jsonb ?\| ARRAY[?,?])` | `["featured", "gold"]` |
| `["tags", "?&", ["featured", "gold"]]` | `((tags)::jsonb ?& ARRAY[?,?])` | `["featured", "gold"]` |
| `["tags", "&&", ["featured", "gold"]]` | `(tags && ARRAY[?,?])` | `["featured", "gold"]` |

Also available: `!~*`, and `?` (single key exists).

## PostgreSQL compatibility aliases

So shared MySQL-style code keeps working under `dialect: "postgres"`, these
MySQL-style operators are translated to native PostgreSQL SQL:

| MySQL-style filter | Rendered on PostgreSQL |
| --- | --- |
| `["meta", "JSON_CONTAINS", { featured: true }]` | `((meta_info)::jsonb @> (?::jsonb))` |
| `["tags", "FIND_IN_SET", "featured"]` | `(array_position(string_to_array(COALESCE(tags::text, ''), ','), ?::text) IS NOT NULL)` |
| `["reference", "RLIKE", "^ORD"]` | `(reference ~ ?)` |
| `["status", "! IN", ["Refunded"]]` | `(status NOT IN (?))` |

::: warning `! IN` is Postgres-only
On PostgreSQL `! IN` is translated to `NOT IN`. On **MySQL** it renders literally
as `! IN`, which is **not valid MySQL** — use `NOT IN` for MySQL.
:::

## Raw conditions: `additionalWhereConditions`

Per option block, these are AND-ed into every query as **raw** SQL (trusted
input, not validated):

```js
const options = [
  {
    tableName: "orders",
    columnList: [/* ... */],
    searchColumnList: [/* ... */],
    additionalWhereConditions: [["orders.org_id", "=", 42]],
  },
];

// with paginationObject.filters: [["status", "=", "Paid"]]
// WHERE (orders.org_id = ?) AND (status = ?)   replacements: [42, "Paid"]
```

::: warning Trusted input only
Never build `additionalWhereConditions`, `statement`, or `joinQuery` from
untrusted user input. Use regular `filters` for anything user-controlled — those
are parameterized and operator-validated.
:::

See [Filters & Operators](/v2/filters-and-operators) for the reference, and the
[PostgreSQL dialect](/dialects/postgres) page for native-operator details.
