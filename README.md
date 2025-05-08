# Getting started

## Browser app

For developing the browser app, you need

- NodeJS, version 22 (LTS)
- The [pnpm](https://pnpm.io) package manager
  Preferably, [using corepack](https://pnpm.io/installation#using-corepack)

### Init

```sh
cd app
pnpm install
pnpm dev
```

### Building

```sh
pnpm build
```

The output will be located in `app/dist`.

### Formatting and style check

> [!todo]
> What formatting/code quality rules do we want to use?
> Should we enforce with CI?

```sh
pnpm format
```

For eslint and type check, run

```sh
pnpm eslint
```
