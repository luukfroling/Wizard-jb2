![coverage](https://gitlab.ewi.tudelft.nl/cse2000-software-project/2024-2025/cluster-j/10c/10c/badges/main/coverage.svg)
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

# The Sphinx extension

1. Enable the single file plugin in the `vite.config.ts` of the Vite app

2. Build the Vite app by redirecting to /app and building
```shell
cd app
pnpm build
``` 

3. Copy the resulting `dist` folder into the `_static` folder of the extension so we get `_static/dist`
```shell
cd ..
xcopy /E /I /Y app\dist sphinx_extension\extension_name\_static\dist
```

3. Pip install the extension by running the following in the root folder: 
```shell
pip install -e ./sphinx_extension
```

4. Add `extension_name` to the `_config.yml` of a TeachBooks repo under `extra_extensions`

5. In said TeachBooks repo run
```shell
jupyter-book build book
```

6. You might need to clean before building: 
```shell
jupyter-book clean book
```


# Vitest
For a general overview of Vitest, please view the [Vitest guide](https://vitest.dev/guide/).

## Writing tests
Tests must contain .test. or .spec. in their file name.
See [index.test.tsx](app/tests/index.test.tsx) for an example of how to write tests with vitest.

## Running tests
Run `pnpm test` in /app. If you do not quit out it will automatically re-run any tests that are changed.

###  Unauthorized Access error
If you get an unauthorizedAccess error when running tests, run this in the terminal and run tests again:
`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`
