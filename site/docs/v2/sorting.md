# Sorting

Sorting is described by two parallel arrays inside `paginationObject.sort`:

```js
sort: {
  attributes: ["created_at", "name"],
  sorts: ["desc", "asc"],
}
// your sort → ORDER BY `created_at`DESC,`name`ASC
// (plus an automatic `id`DESC tie-breaker — see below)
```

## Rules

- `attributes` and `sorts` must be arrays of the **same length**.
- Each entry in `sorts` must be `"asc"` or `"desc"` (case-insensitive; normalized
  to uppercase). Any other value is rejected.
- Sort identifiers are escaped and passed through your `columnNameConverter`.

## Automatic `id` tie-breaker

PagiHelp appends `id` (descending) as a final tie-breaker so ordering is
deterministic and stable across pages:

```js
sort: { attributes: ["created_at"], sorts: ["desc"] }
// effective: ORDER BY `created_at`DESC,`id`DESC
```

For this to work, your `columnList` should expose a column with `alias: "id"`.

::: tip Your input is not mutated
PagiHelp does not push `id` onto the `sort` arrays you pass in — your original
object is left untouched.
:::

## Dialect quoting

The `ORDER BY` identifiers are quoted per dialect:

- **MySQL** uses backticks: `` ORDER BY `created_at`DESC ``
- **PostgreSQL** uses double quotes: `ORDER BY "created_at"DESC`

## Cursor mode

For [cursor pagination](/v2/cursor-pagination), `sort` is **required** and forms
the keyset ordering. An `id` tie-breaker is appended here too, but it follows the
direction of your **last** sort entry (not always `DESC`) so the keyset stays
consistent.
