# Overview

PagiHelp turns a pagination request into safe, parameterized SQL. Import it
directly:

```js
const PagiHelpV2 = require("pagi-help/v2");
```

It supports both MySQL and PostgreSQL, generates aggregate count queries, never
mutates your input, and is where features like cursor pagination live.

## The shape of a request

Every paginate call takes two arguments:

1. A **`paginationObject`** — the dynamic request: `search`, `filters`, `sort`,
   and the page window (`pageNo`/`itemsPerPage` or `offset`/`limit`).
2. An **`options`** array — one block per table describing `tableName`,
   `columnList`, `searchColumnList`, optional `joinQuery`, and optional
   `additionalWhereConditions`.

```js
const pagiHelp = new PagiHelpV2({ dialect: "mysql" });

const result = pagiHelp.paginate(paginationObject, options);
// { query, countQuery, totalCountQuery, replacements }
```

## Methods

| Method | Purpose |
| --- | --- |
| [`paginate(paginationObject, options)`](/v2/paginate) | Build offset/page-based SQL |
| [`paginateCursor(paginationObject, options)`](/v2/cursor-pagination) | Build keyset/cursor SQL (single table) |
| `paginateSafe(paginationObject, options, safeOptions)` | Validate then build, throwing on invalid input |
| [`resolveCursorPage(rows, cursorPlan)`](/v2/cursor-pagination#resolving-a-page) | Trim the extra row and derive `pageInfo` |
| [`encodeCursorFromRow(row, cursorPlan)`](/v2/cursor-pagination) | Build an opaque `after` token |
| [`decodeCursor(token)`](/v2/cursor-pagination) | Decode and validate a cursor token |
| `validatePaginationInput(paginationObject, options)` | Return a `{ valid, errors, warnings }` report |
| `validateCursorPaginationInput(...)` | Validation report for cursor input |

## Column descriptors

Columns in `columnList` are described by objects. A descriptor must define
**exactly one** of `name` or `statement`:

```js
{ name: "created_at", alias: "createdAt" }              // plain column
{ name: "id", prefix: "l", alias: "id" }               // prefixed: l.id
{ statement: "(CASE WHEN ... END)", alias: "flag" }    // raw SQL expression
```

- `name` — the column name (passed through `columnNameConverter`)
- `prefix` — optional table alias/prefix, e.g. `l` → `l.column`
- `statement` — raw SQL expression (trusted input), mutually exclusive with `name`
- `alias` — the output alias; recommended for filters, sorts, and unions

`searchColumnList` uses the same descriptor shape **without** `alias` (v2 rejects
aliases there).

## Validation

v2 ships validation helpers that return a structured report instead of throwing:

```js
const report = pagiHelp.validatePaginationInput(paginationObject, options);
// { valid: boolean, errors: string[], warnings: string[] }

if (!report.valid) {
  throw new Error(report.errors.join("\n"));
}
```

`paginateSafe()` runs this validation for you and throws an `Error` if the input
is invalid (controlled by `safeOptions.validate`, which defaults to `true`).
