from __future__ import annotations
from pathlib import Path
from sphinx.application import Sphinx


def extension_name_static_path(app):
    """ Gets the static folder and adds it to the Sphinx Extension

    In this _static folder we define the javascript loader and actual editor.

    :param app: The Sphinx Extension
    :return:    Nothing
    """
    # Get project root directory
    init_py_dir = Path(__file__).parent.resolve()

    # Get _static dir as root/_static
    _static_path = init_py_dir / "_static"

    # Add _static to the extension
    app.config.html_static_path.append(str(_static_path))


def setup(app: Sphinx):
    """ Set up the Sphinx Extension

    :param app: The Sphinx Extension to be set up
    :return:    Metadata for the Sphinx Extension
    """
    # Register the _static folder
    app.connect("builder-inited", extension_name_static_path)

    # Add the javascript files for the navbar button and editor loading
    app.add_js_file('add_edit_button.js', 1)
    app.add_js_file('add_editor.js', 1)
    app.add_js_file('main.js', 1)

    # Basic information of the sphinx extension
    # Match version with myproject.toml and main.js
    return {
        'version': '0.1.3',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
