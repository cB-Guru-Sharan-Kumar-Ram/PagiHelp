# Filters & Operators

Filters are how you express `WHERE` conditions. Each condition is a tuple:

```js
[field, operator, value]
```

- `field` resolves against your `columnList` — by `alias`, by camelCase form of
  the alias, or by `prefix.column`.
- `operator` must be one of the supported operators (validated).
- `value` is parameterized into `replacements` (never concatenated).

`filters` is optional — omit it, or pass an empty `filters: []` (allowed since
2.5.1), and no conditions are added.

## Combining conditions: AND / OR

Top-level filters are joined with **AND**. Nesting an array of tuples creates an
**OR** group.

```js
// status = 'Active' AND created_at >= '2026-01-01'
filters: [
  ["status", "=", "Active"],
  ["created_at", ">=", "2026-01-01"],
];
```

```js
// status = 'Active' AND ( type = 'A' OR type = 'B' )
filters: [
  ["status", "=", "Active"],
  [
    ["type", "=", "A"],
    ["type", "=", "B"],
  ],
];
```

::: tip Single condition shorthand
A bare tuple like `filters: ["status", "IN", ["Active"]]` is normalized to
`[["status", "IN", ["Active"]]]` automatically.
:::

## Values and `IN`

- Array values render an `IN (?, ?, ...)` list with one replacement per element.
- On v2, an **empty** `IN [ ]` array is rejected (it would otherwise produce
  invalid SQL).

```js
filters: [["status", "IN", ["Active", "Paused"]]];
// status IN (?,?)   replacements: ["Active", "Paused"]
```

## Shared operators (both dialects)

```
>   >=   <   <=   =   !=   <>
IN   NOT IN   ! IN
IS   IS NOT
LIKE   RLIKE
MEMBER OF
JSON_CONTAINS   JSON_OVERLAPS   FIND_IN_SET
```

- `! IN` is rewritten to `NOT IN` on **PostgreSQL only**. On MySQL it is emitted
  verbatim (`field ! IN (...)`), which is not valid SQL — use `NOT IN` for MySQL.
- `JSON_CONTAINS(field, ?)` and `JSON_OVERLAPS(field, ?)` JSON-stringify object
  values automatically.
- `FIND_IN_SET` renders as `FIND_IN_SET(?, field)`.
- Renderings shown are the **MySQL** forms; on Postgres these compat aliases
  compile to jsonb/array expressions — see
  [operator compatibility](/dialects/postgres#operator-compatibility).

## PostgreSQL native operators

When the dialect is `postgres`, these additional native operators are available:

| Operator | Meaning |
| --- | --- |
| `ILIKE` | case-insensitive `LIKE` |
| `~` `~*` `!~` `!~*` | regex match / case-insensitive / negated |
| `@>` `<@` | contains / contained-by (jsonb, arrays) |
| `?` `?|` `?&` | key exists / any key / all keys (jsonb) |
| `&&` | array overlap |

```js
filters: [
  ["metaInfo", "@>", { priority: "high" }],
  ["tags", "?|", ["featured", "priority"]],
  ["reference", "~*", "^ord-2026-"],
];
```

Postgres also keeps compatibility aliases so shared MySQL-style code keeps
working — see [PostgreSQL dialect](/dialects/postgres#operator-compatibility).

## Raw conditions: `additionalWhereConditions`

`additionalWhereConditions` (per option block) are **raw** conditions AND-ed into
every generated query. They are trusted input — operators are not validated and
the SQL is concatenated as written:

```js
additionalWhereConditions: [["audit.licenses.organization_id", "=", 42]];
```

::: warning
Never build `additionalWhereConditions`, `statement`, or `joinQuery` from
untrusted user input. Use regular `filters` for anything user-controlled — those
are parameterized and operator-validated.
:::
