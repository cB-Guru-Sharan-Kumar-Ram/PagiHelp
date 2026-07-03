# Getting Started

PagiHelp (`pagi-help`) is a small helper that turns a pagination request into
safe, parameterized SQL. You describe **what** you want — filters, search,
sorting, page size — and PagiHelp builds the `SELECT`, `WHERE`, `ORDER BY`, and
`LIMIT` clauses plus a `replacements` array you hand to your database driver.

It does **not** connect to a database. It only generates SQL strings and
replacements, so it works with any MySQL or PostgreSQL client (`mysql2`, `pg`,
Sequelize raw queries, etc.).

## Install

```bash
npm install pagi-help
```

The only runtime dependency is [`sqlstring`](https://www.npmjs.com/package/sqlstring).

## Import

Import the API (MySQL + PostgreSQL):

```js
const PagiHelpV2 = require("pagi-help/v2");
```

::: tip Existing v1 code?
A legacy **v1** API still ships from the package root (`require("pagi-help")`) for
existing MySQL codebases. New code should use the above — see
[Migrating to v2](/guide/migration).
:::

## Your first query

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

console.log(result);
// { query, countQuery, totalCountQuery, replacements }
```

## Running the generated SQL

PagiHelp gives you parameterized SQL. Pass `query` and `replacements` to your
driver:

::: code-group

```js [mysql2]
const [rows] = await connection.query(result.query, result.replacements);
const [[{ countValue }]] = await connection.query(
  result.totalCountQuery,
  result.replacements
);
```

```js [Sequelize]
const { QueryTypes } = require("sequelize");

const rows = await sequelize.query(result.query, {
  replacements: result.replacements,
  type: QueryTypes.SELECT,
});
const [{ countValue }] = await sequelize.query(result.totalCountQuery, {
  replacements: result.replacements,
  type: QueryTypes.SELECT,
});
```

:::

Note the destructuring difference: mysql2 resolves to a `[rows, fields]` pair,
while Sequelize with `type: QueryTypes.SELECT` returns the rows directly — using
the mysql2 double-destructure there throws `object is not iterable`.

::: tip
The `replacements` array is positional and already in the right order for the
generated SQL. Always pass it alongside the query — never interpolate values
into the SQL string yourself.
:::

## How it fits together

| You provide | PagiHelp builds |
| ----------- | --------------- |
| `paginationObject` (search, filters, sort, page/limit) | the dynamic `WHERE`, `ORDER BY`, and `LIMIT` |
| `options[]` (tableName, columnList, searchColumnList, joins) | the `SELECT ... FROM` and column list |
