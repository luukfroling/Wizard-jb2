# Jupyter Book 2 Wizard

⚠️ Untill this issue ⚠️

# Using the editor 

Once GitHub pages are setup according to the docs, add the following section of code to 

```{code}
- name: Add wizard to book
uses: luukfroling/Wizard-jb2/actions@main 
with:
    script_url: "https://cdn.jsdelivr.net/gh/luukfroling/Wizard-jb2@main/script/start_wizard.js"
    html_dir: "_build/html"
```

The file should look like this: 

```{code}
:linenos:
:emphasize-lines: 4,5,6,7,8
- name: Build HTML Assets
  run: myst build --html

- name: Add wizard to book
  uses: luukfroling/Wizard-jb2/actions@main 
  with:
    script_url: "https://cdn.jsdelivr.net/gh/luukfroling/Wizard-jb2@main/script/start_wizard.js"
    html_dir: "_build/html"

- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: './_build/html'

```

 