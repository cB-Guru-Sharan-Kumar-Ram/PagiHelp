# Migrating to v2

v2 (`require("pagi-help/v2")`) is the current, actively developed API. The default
export `require("pagi-help")` is the legacy **v1** class — MySQL-only, its
`paginate()` behavior preserved unchanged for existing consumers. Both take the same
`paginationObject` and `options` shape, so migration is mostly an import swap plus a
few behavior changes.

## What's new in v2

- **PostgreSQL** dialect alongside MySQL (native `@>`, `ILIKE`, `~*`, …) — v1 is MySQL-only
- **Cursor pagination** — [`paginateCursor()`](/v2/cursor-pagination) with opaque, fingerprinted tokens
- **Aggregate `countQuery`** returning `countValue` (v1's was a row-select)
- **Validation on by default** — `paginate()` rejects malformed input; helpers return `{ valid, errors, warnings }` reports
- **Cleaner behavior** — empty `search` handled safely (v1 turned it into `%undefined%`), no dangling `WHERE`, no caller `sort` mutation, no `console.log`, and `Error` objects instead of string throws

## How to migrate

### 1. Bump the version, then change the import

If your `package.json` pins `"pagi-help": "^1.x"`, npm will **never** install 2.x
automatically — a caret stays within the same major. Move the range up first:

```bash
npm install pagi-help@^2
```

This is safe: `require("pagi-help")` still returns the legacy class with unchanged
`paginate()` behavior, so existing code keeps working. You opt into v2 per file by
importing the v2 entry:

```js
// Before
const PagiHelp = require("pagi-help");
const pagiHelp = new PagiHelp();

// After
const PagiHelpV2 = require("pagi-help/v2");
const pagiHelp = new PagiHelpV2({ dialect: "mysql" });
```

The constructor now accepts a [`dialect`](/v2/constructor) (`"mysql"` default or
`"postgres"`).

### 2. Account for behavior changes

Everything in [What's new in v2](#what-s-new-in-v2) applies automatically. The one
change that usually needs code is `countQuery` — it is now an aggregate returning
`countValue`, identical to `totalCountQuery` (run either one), so read that instead
of counting result rows:

::: code-group

```js [mysql2]
const [[{ countValue }]] = await connection.query(
  result.countQuery,
  result.replacements
);
```

```js [Sequelize]
const [{ countValue }] = await sequelize.query(result.countQuery, {
  replacements: result.replacements,
  type: QueryTypes.SELECT,
});
```

:::

Everything else — clean `search`, no `WHERE` dangling, no mutation or logging,
stricter validation, `Error` objects — needs no action and is strictly safer.

### 3. (Optional) adopt new features

Once on v2 you can use:

- [PostgreSQL dialect](/dialects/postgres)
- [Cursor pagination](/v2/cursor-pagination)
- Built-in [validation helpers](/v2/overview#validation)
