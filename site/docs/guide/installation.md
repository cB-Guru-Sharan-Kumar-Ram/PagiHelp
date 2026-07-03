# Installation

## Requirements

- Node.js (CommonJS `require` is used throughout the examples)
- A MySQL or PostgreSQL database and a client driver of your choice
- One runtime dependency, [`sqlstring`](https://www.npmjs.com/package/sqlstring), is installed automatically

## Install the package

::: code-group

```bash [npm]
npm install pagi-help
```

```bash [yarn]
yarn add pagi-help
```

```bash [pnpm]
pnpm add pagi-help
```

:::

## Import

The API (MySQL + PostgreSQL):

```js
const PagiHelpV2 = require("pagi-help/v2");
```

Named exports are also available from the package root:

```js
const {
  PagiHelpV2, // the current API
  PagiHelpV210, // compatibility alias for PagiHelpV2
  PagiHelpLegacy, // the legacy v1 API — see Migrating to v2
} = require("pagi-help");
```

`PagiHelpV210` is a compatibility alias for `PagiHelpV2`. The legacy v1 export
(`require("pagi-help")`) is covered in [Migrating to v2](/guide/migration).

## TypeScript

Type definitions ship with the package (`index.d.ts` and `v2.d.ts`), so no
`@types/*` install is needed. See the [API Reference](/api/reference) for the
exported types.
