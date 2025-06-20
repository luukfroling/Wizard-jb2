![coverage](https://gitlab.ewi.tudelft.nl/cse2000-software-project/2024-2025/cluster-j/10c/10c/badges/main/coverage.svg)
# Editor for TeachBooks

A complete browser-based, what-you-see-is-what-you-get editor to streamline the process of editing TeachBooks hosted on GitHub pages.

![image](https://github.com/user-attachments/assets/506238db-2ec7-4241-86d7-3ab20f14e799)

# Install the editor

The editor is made for everyone, not just programmers. So we made the installation process as easy as possible:

1. Go to your TeachBooks repo root
2. In `requirements.txt` add the following two lines at the bottom of the file:
    ```txt
    --extra-index-url https://test.pypi.org/simple/
    teachbooks_software_project_extension_name==0.1.3
    ```
3. After saving `requirements.txt` open the `book` folder and edit the `_config.yml` file
4. Find the `extra_extensions:` area and add the following to the bottom of the list:
    ```yml
    - teachbooks_software_project_extension_name
    ```
5. Save the config file and the GitHub actions will automatically build your book with the editor installed

# Build the editor from source

For building the editor from source you have to build the two different components and combine them into the full editor.

## The Vite app (Actual editor)

The first component is the Vite app. For developing the app, you need

- NodeJS, version 22 (LTS)
- The [pnpm](https://pnpm.io) package manager
  - Preferably, [using corepack](https://pnpm.io/installation#using-corepack)

### Installing
1. In the `app` folder, if not enabled, enable the single file plugin in `vite.config.ts` by uncommenting `viteSingleFile()` under `plugins`.
2. In the project root run:
    ```sh
    cd app
    pnpm install
    ```

### Building
1. We need to build the app, so we can use it later on. So still in the app folder run:
    ```sh
    pnpm build
    ```
2. The output will be located in `app/dist`.

## The Sphinx extension

For loading the editor into the book we use a custom Sphinx Extension. You need `Python 3.12` with `pip` installed

1. Copy the `dist` folder from building the Vite app to the `_static` folder of the extension by running the following in the project root:
   - MacOS or Linux: 
   ```sh
   cp -r app/dist sphinx_extension/teachbooks_software_project_extension_name/_static
   ```
   - Windows:
   ```shell
    robocopy app/dist sphinx_extension/teachbooks_software_project_extension_name/_static /E
    ```
2. Pip install the extension by running the following in the project root: 
    ```shell
    pip install -e ./sphinx_extension
    ```
3. Or build for distribution by running the following from the project root:
    ```shell
   cd sphinx_extension && python -m build
    ```
   This will create a `dist` folder in the `sphinx_extension` folder.

### Running the editor in an actual book
We assume you already have a working TeachBooks installed locally. If not you can get the template [here](https://github.com/TeachBooks/template).
1. Open the `_config` file in the `book` folder of your TeachBooks project.
2. Find the `extra_extensions:` area and add the following to the bottom of the list:
    ```yml
    - teachbooks_software_project_extension_name
    ```
3. Because this only works locally you have to build the book yourself. You can make a clean build by running:
    ```sh
   jupyter-book clean book && jupyter-book build book
   ```
4. This creates a `build` folder with the actual `html` folder.
5. For the editor to work you cannot just open the `index.html` in a browser. You have to start an actual live server. 
   - In VS Code you can right-click `index.html` and select `Open with Live Server`
   - In JetBrains editors you can right-click `index.html` and select `Open In` and then `Browser`


# Maintaining
If you want to contribute or maintain this open source project there are a few guidelines written down below.

## Code quality
To keep the code readable and maintainable we use different tools:
1. Prettier for code formatting
    ```shell
    pnpm prettier
    ```
2. Linting for code style
    ```shell
   pnpm lint
   ```
3. If you want to let `prettier` and `linting` solve the fixable issues in your code you can run
    ```shell
   pnpm format
   ```
4. We try to make sure every function is well documented with either `Python Docstrings` or `JSDocs`.

## Testing
To make sure the editor actually works we have made a comprehensive test suite, but more tests are always welcome.

1. Tests are defined in `app/tests/` as `TypeScript` files with `test` or `spec` in the file name.
2. For an example test you can check out the [index.test.tsx](app/tests/App.test.tsx) file.
3. Run the tests by running the following in the `app` folder
    ```shell
   pnpm test
   ```
   - If you do not quit, any tests that are changed will automatically re-run.
4. For a general overview of Vitest, please view the [Vitest guide](https://vitest.dev/guide/).

###  Unauthorized Access error
If you get an `unauthorizedAccess` error when running tests, run this in the terminal and try again:
```shell
`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`
```

