# API Reference

This page summarizes the public surface of the **v2** API. Full TypeScript types
ship with the package (`v2.d.ts` and `index.d.ts`).

```js
const PagiHelpV2 = require("pagi-help/v2");
const pagiHelp = new PagiHelpV2({ dialect: "mysql" });
```

## Constructor

```ts
new PagiHelpV2(options?: {
  dialect?: "mysql" | "postgres";      // default "mysql"
  columnNameConverter?: (name: string) => string;
  safeOptions?: { validate?: boolean }; // only `validate` is supported
})
```

See [Constructor](/v2/constructor).

## Methods

### `paginate(paginationObject, options)`

Build offset/page-based pagination SQL.

```ts
paginate(
  paginationObject: PaginationInput,
  options: PaginationOption[],
  safeOptions?: { validate?: boolean }
): PaginationResult
```

→ [paginate()](/v2/paginate)

### `paginateSafe(paginationObject, options, safeOptions?)`

Validate the input and throw an `Error` on problems, then build SQL. Same return
shape as `paginate()`.

### `paginateCursor(paginationObject, options)`

Build keyset/cursor pagination SQL (single table, `after` only).

```ts
paginateCursor(
  paginationObject: CursorPaginationInput, // requires `sort` and `limit`
  options: PaginationOption[],
  safeOptions?: { validate?: boolean }
): CursorPaginationResult // PaginationResult + cursorPlan
```

→ [Cursor Pagination](/v2/cursor-pagination)

### `resolveCursorPage(rows, cursorPlan)`

Trim the extra fetched row and derive cursor metadata.

```ts
resolveCursorPage<Row>(rows: Row[], cursorPlan: CursorPlan): {
  rows: Row[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    nextCursor: string | null;
  };
}
```

### `encodeCursorFromRow(row, cursorPlan)`

```ts
encodeCursorFromRow(row: Record<string, unknown>, cursorPlan: CursorPlan): string
```

Build an opaque `after` token from one query row.

### `decodeCursor(token)`

```ts
decodeCursor(cursorToken: string): {
  v: 1;
  d: "mysql" | "postgres";
  fp: string;
  s: [attribute: string, direction: "ASC" | "DESC"][];
  values: unknown[];
  dir: "after";
}
```

Decode and validate the cursor token envelope.

### Validation helpers

```ts
validatePaginationInput(paginationObject, options): ValidationResult
validatePaginationObject(paginationObject): ValidationResult
validateOptions(options): ValidationResult
validateCursorPaginationInput(paginationObject, options): ValidationResult
```

Each returns:

```ts
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

## Key types

### `PaginationInput`

```ts
interface PaginationInput {
  search?: string;
  filters?: ConditionInput;      // [field, operator, value] tuples / nested groups
  sort?: { attributes: string[]; sorts: ("ASC" | "DESC" | "asc" | "desc")[] };
  pageNo?: number;
  itemsPerPage?: number;
  offset?: number;
  limit?: number;
}
```

### `CursorPaginationInput`

```ts
interface CursorPaginationInput {
  search?: string;
  filters?: ConditionInput;
  sort: { attributes: string[]; sorts: ("ASC" | "DESC" | "asc" | "desc")[] }; // required
  limit: number;                                             // required
  after?: string;
  // before, pageNo, itemsPerPage, offset are rejected
}
```

### `PaginationOption`

```ts
interface PaginationOption {
  tableName: string;
  columnList: ColumnDescriptor[];
  searchColumnList?: SearchColumnDescriptor[]; // no `alias` on v2
  joinQuery?: string;
  additionalWhereConditions?: ConditionInput;
}
```

### `ColumnDescriptor`

```ts
interface ColumnDescriptor {
  name?: string;       // exactly one of name | statement
  statement?: string;  // raw SQL expression (trusted)
  prefix?: string;     // table alias, e.g. "l" -> l.column
  alias?: string;      // output alias
}
```

### `PaginationResult`

```ts
interface PaginationResult {
  query: string;
  countQuery: string;
  totalCountQuery: string;
  replacements: unknown[];
}
```

### `CursorPlan` (excerpt)

```ts
interface CursorPlan {
  version: 1;
  dialect: "mysql" | "postgres";
  direction: "forward";
  requestedLimit: number;
  fetchLimit: number;          // requestedLimit + 1
  normalizedSort: { attribute: string; direction: "ASC" | "DESC" }[];
  cursorAliases: string[];
  queryFingerprint: string;
  after: string | null;
}
```

::: tip
For the authoritative, always-current types, read `v2.d.ts` in the
[repository](https://github.com/Codebucket-Solutions/PagiHelp).
:::
