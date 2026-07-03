---
title: Playground
outline: false
---

# Interactive Playground

Build a pagination request and watch PagiHelp generate the SQL **live** — this
runs the real `pagi-help/v2` engine in your browser. Switch dialects, add
filters, sorts, search, and a page window, then copy the output.

<Playground />

## Demo schema

The playground queries this table:

```js
const options = [
  {
    tableName: "orders",
    columnList: [
      { name: "order_id", alias: "id" },
      { name: "reference", alias: "reference" },
      { name: "status", alias: "status" },
      { name: "total", alias: "total" },
      { name: "created_at", alias: "createdAt" },
    ],
    searchColumnList: [{ name: "reference" }, { name: "status" }],
  },
];
```

Want more recipes? See the worked [examples](/examples/filtering) for filtering,
searching, sorting, and pagination.
