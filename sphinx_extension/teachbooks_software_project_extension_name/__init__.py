from __future__ import annotations

from pathlib import Path

from sphinx.application import Sphinx


def extension_name_static_path(app):
    # Get current dir
    init_py_dir = Path(__file__).parent.resolve()

    # Get _static dir
    _static_path = init_py_dir / "_static"

    # Add _static to the extension
    app.config.html_static_path.append(str(_static_path))


def setup(app: Sphinx):
    # Register the _static folder
    app.connect("builder-inited", extension_name_static_path)

    # Add the javascript for the navbar button
    app.add_js_file('add_edit_button.js', 1)
    app.add_js_file('add_editor.js', 1)
    app.add_js_file('main.js', 1)

    # Basic information of the sphinx extension
    # Match with myproject.toml
    return {
        'version': '0.1.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
