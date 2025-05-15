import { Component, onMount } from 'solid-js';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, MarkType } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import 'prosemirror-view/style/prosemirror.css';
import 'bootstrap/dist/css/bootstrap.min.css';

type Dispatch = (tr: Transaction) => void;

const toggleMarkWithAttrs = (markType: MarkType, attrs: Record<string, any>) => {
  return (state: EditorState, dispatch: Dispatch) => {
    const { from, to } = state.selection;
    let hasMark = false;

    state.doc.nodesBetween(from, to, (node) => {
      if (markType.isInSet(node.marks)) {
        hasMark = true;
      }
    });

    if (hasMark) {
      dispatch(state.tr.removeMark(from, to, markType));
    } else {
      const tr = state.tr;
      state.doc.nodesBetween(from, to, (node: any, pos: number) => {
        const existingMark = markType.isInSet(node.marks);
        const newAttrs = existingMark
          ? { ...existingMark.attrs, ...attrs }
          : attrs;
        tr.addMark(pos, pos + node.nodeSize, markType.create(newAttrs));
      });
      dispatch(tr);
    }

    return true;
  };
};

// Extend the schema to include alignment, color, font size, and image
const extendedSchema = new Schema({
  nodes: basicSchema.spec.nodes
    .update('paragraph', {
      ...basicSchema.spec.nodes.get('paragraph'),
      attrs: {
        align: { default: 'left' },
        size: { default: '13' },
      },
      toDOM(node) {
        const { align, size } = node.attrs;
        return ['p', { style: `text-align: ${align}; font-size: ${size}px;` }, 0];
      },
      parseDOM: [
        {
          tag: 'p',
          getAttrs: (node) => {
            const style = (node as HTMLElement).style.textAlign;
            return { align: style || 'left' };
          },
        },
        {
          tag: 'p',
          getAttrs: (node) => {
            const fontSize = (node as HTMLElement).style.fontSize;
            return { size: fontSize ? fontSize.replace('px', '') : '13' };
          },
        },
      ],
    })
    .addToEnd('image', {
      inline: true,
      attrs: {
        src: {},
        alt: { default: null },
        title: { default: null },
      },
      group: 'inline',
      draggable: true,
      parseDOM: [
        {
          tag: 'img[src]',
          getAttrs(dom) {
            return {
              src: dom.getAttribute('src'),
              alt: dom.getAttribute('alt'),
              title: dom.getAttribute('title'),
            };
          },
        },
      ],
      toDOM(node) {
        return ['img', node.attrs];
      },
    }),
  marks: basicSchema.spec.marks
    .update('em', {
      ...basicSchema.spec.marks.get('em'),
      attrs: {
        color: { default: 'black' },
      },
      toDOM(mark) {
        const { color } = mark.attrs;
        return ['em', { style: `color: ${color};` }, 0];
      },
      parseDOM: [
        {
          style: 'color',
          getAttrs: (value) => ({ color: value }),
        },
      ],
    })
    .addToEnd('underline', {
      parseDOM: [{ tag: 'u' }],
      toDOM() {
        return ['u', 0];
      },
    }),
});

const App: Component = () => {
  let editorContainer: HTMLDivElement;
  let toolbarContainer: HTMLDivElement;

  onMount(() => {
    // Create the editor state
    const state = EditorState.create({
      schema: extendedSchema,
      plugins: [
        history(),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          ...baseKeymap,
        }),
      ],
    });

    // Create the editor view
    const view = new EditorView(editorContainer, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
      },
    });

    // Helper function to set block attributes without resetting others
    const setBlockAttrs = (attrs: Record<string, any>) => {
      return (state: EditorState, dispatch: ((transaction: any) => void) | undefined) => {
        const { $from } = state.selection as any; // ProseMirror types are not always complete
        const node = state.doc.nodeAt($from.before());
        if (dispatch) {
          dispatch(
            state.tr.setNodeMarkup($from.before(), null, {
              ...node?.attrs,
              ...attrs,
            })
          );
        }
        return true;
      };
    };

    // Helper function to toggle marks without resetting attributes
    const toggleMarkWithAttrs = (markType: import('prosemirror-model').MarkType, attrs: Record<string, any>) => {
      return (state: EditorState, dispatch: Dispatch) => {
        const { from, to } = state.selection;
        let hasMark = false;

        state.doc.nodesBetween(from, to, (node) => {
          if (markType.isInSet(node.marks)) {
            hasMark = true;
          }
        });

        if (hasMark) {
          dispatch(state.tr.removeMark(from, to, markType));
        } else {
          const tr = state.tr;
          state.doc.nodesBetween(from, to, (node: any, pos: number) => {
            const existingMark = markType.isInSet(node.marks);
            const newAttrs = existingMark
              ? { ...existingMark.attrs, ...attrs }
              : attrs;
            tr.addMark(pos, pos + node.nodeSize, markType.create(newAttrs));
          });
          dispatch(tr);
        }

        return true;
      };
    };

    // Helper function to create toolbar buttons
    const createButton = (label: string, command: any) => {
      const button = document.createElement('button');
      button.textContent = label;
      button.className = 'btn btn-outline-primary btn-sm mx-1';
      button.onclick = () => {
        command(view.state, view.dispatch, view);
      };
      toolbarContainer.appendChild(button);
    };

    // Helper function to create dropdowns
    const createDropdown = (options: { label: string; command: any }[]) => {
      const select = document.createElement('select');
      select.className = 'form-select form-select-sm mx-1';
      select.style.width = '100px';

      options.forEach(({ label, command }) => {
        const option = document.createElement('option');
        option.textContent = label;
        option.value = label;
        select.appendChild(option);
      });

      select.onchange = () => {
        const selectedOption = options.find((opt) => opt.label === select.value);
        if (selectedOption) {
          selectedOption.command(view.state, view.dispatch, view);
        }
      };

      toolbarContainer.appendChild(select);
    };

    // Helper function to create a color picker modal
    const createColorPickerModal = () => {
      const modal = document.createElement('div');
      modal.className = 'color-picker-modal position-absolute bg-white border p-2';
      modal.style.display = 'none';
      modal.style.zIndex = '1000';
      modal.style.width = '200px';

      // Create the color table
      const colorTable = document.createElement('div');
      colorTable.className = 'color-table d-flex flex-wrap mb-2';
      const colors = [
        '#000000', '#FF0000', '#00FF00', '#0000FF',
        '#FFFF00', '#FF00FF', '#00FFFF', '#808080',
        '#FFFFFF', '#800000', '#808000', '#008080',
      ];
      colors.forEach((color) => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = color;
        colorBox.style.width = '20px';
        colorBox.style.height = '20px';
        colorBox.style.margin = '2px';
        colorBox.style.cursor = 'pointer';
        colorBox.onclick = () => {
          toggleMarkWithAttrs(extendedSchema.marks.color, { color })(view.state, view.dispatch);
          modal.style.display = 'none'; // Close the modal after selection
        };
        colorTable.appendChild(colorBox);
      });

      // Create the custom color picker
      const colorPicker = document.createElement('input');
      colorPicker.type = 'color';
      colorPicker.className = 'form-control form-control-sm';
      colorPicker.onchange = (e) => {
        const color = (e.target as HTMLInputElement).value;
        toggleMarkWithAttrs(extendedSchema.marks.color, { color })(view.state, view.dispatch);
        modal.style.display = 'none'; // Close the modal after selection
      };

      // Append elements to the modal
      modal.appendChild(colorTable);
      modal.appendChild(colorPicker);

      // Append the modal to the toolbar container
      toolbarContainer.appendChild(modal);

      // Create the button to toggle the modal
      const button = document.createElement('button');
      button.textContent = 'Text Color';
      button.className = 'btn btn-outline-primary btn-sm mx-1';
      button.onclick = () => {
        modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
      };

      toolbarContainer.appendChild(button);
    };

    // Add toolbar buttons
    createButton('Undo', undo);
    createButton('Redo', redo);
    createButton('Bold', toggleMark(extendedSchema.marks.strong));
    createButton('Italic', toggleMarkWithAttrs(extendedSchema.marks.em, {}));
    createButton('Underline', toggleMark(extendedSchema.marks.underline));

    // Add dropdown for headers
    createDropdown([
      { label: 'Normal', command: setBlockAttrs({ size: '13', align: 'left' }) },
      { label: 'Header 1', command: setBlockAttrs({ size: '24', align: 'left' }) },
      { label: 'Header 2', command: setBlockAttrs({ size: '18', align: 'left' }) },
    ]);

    // Add dropdown for text alignment
    createDropdown([
      { label: 'Left Align', command: setBlockAttrs({ align: 'left' }) },
      { label: 'Center Align', command: setBlockAttrs({ align: 'center' }) },
      { label: 'Right Align', command: setBlockAttrs({ align: 'right' }) },
    ]);

    // Add dropdown for font size
    createDropdown(
      ['8', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'].map((size) => ({
        label: size,
        command: setBlockAttrs({ size }),
      }))
    );

    // Add color picker modal
    createColorPickerModal();
  });

  return (
    <div>
      {/* Toolbar */}
      <div
        class="d-flex align-items-center p-2 bg-light border-bottom flex-wrap"
      >
        {/* Right Section: Functional Buttons */}
        <div ref={(el) => (toolbarContainer = el as HTMLDivElement)} class="d-flex"></div>
      </div>

      {/* Editor Container */}
      <div
        ref={(el) => (editorContainer = el as HTMLDivElement)}
        class="p-3 mt-2 bg-white border rounded"
      ></div>
    </div>
  );
};

export default App;