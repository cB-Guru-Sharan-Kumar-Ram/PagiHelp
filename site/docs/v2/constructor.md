# Constructor

```js
const PagiHelpV2 = require("pagi-help/v2");

const pagiHelp = new PagiHelpV2({
  dialect: "mysql", // default
  columnNameConverter: (name) =>
    name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
  safeOptions: {
    validate: true,
  },
});
```

## Options

### `dialect`

- May be `"mysql"` or `"postgres"`.
- Omitted `dialect` defaults to `"mysql"`.
- Controls identifier quoting, the operator set, and the pagination clause. See
  [MySQL](/dialects/mysql) and [PostgreSQL](/dialects/postgres).

### `columnNameConverter`

A function applied to column `name` values (and `ORDER BY` identifiers) before
they are rendered. Use it to map your code-side naming (e.g. camelCase) to your
database column naming (e.g. snake_case):

```js
columnNameConverter: (name) =>
  name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
// createdAt -> created_at
```

If omitted, names are passed through unchanged (identity function). It does
**not** apply to `statement` expressions — those are raw SQL.

### `safeOptions`

```js
safeOptions: {
  validate: true, // the only supported safeOptions key
}
```

- `safeOptions.validate` is the **only** supported `safeOptions` key.
- It defaults to `true`, so `paginate()` and the cursor builders validate input
  and throw on errors.
- Any other `safeOptions` key is rejected.

## Rules summary

- `dialect` may be `"mysql"` or `"postgres"`; omitted defaults to `"mysql"`.
- `safeOptions.validate` is the only supported `safeOptions` key; any other key
  is rejected.
