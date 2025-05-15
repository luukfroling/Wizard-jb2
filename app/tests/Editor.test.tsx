import { describe, it, expect } from 'vitest'
import { render } from '@solidjs/testing-library'
import { Schema } from 'prosemirror-model'
import { Editor } from '../src/components/Editor'

const minimalSchema = new Schema({
  nodes: {
    doc:       { content: 'block+' },
    paragraph: { group: 'block', parseDOM: [{ tag: 'p' }], toDOM: () => ['p', 0] },
    text:      { group: 'inline' }
  },
  marks: {}
})


describe('Editor test mounting behaviour', () => {
  it('mounts and unmounts without errors', () => {
    const { container, unmount } = render(() => (
      <Editor schema={minimalSchema} />
    ))

    expect(container.querySelector('div')).toBeTruthy()
    
    expect(() => unmount()).not.toThrow()
  })
})
