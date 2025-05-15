import { describe, it, expect, vi } from 'vitest'

const SolidWeb = await import('solid-js/web')
const renderSpy = vi.spyOn(SolidWeb, 'render')

// Use "describe" to create a test suite
describe('Example tests for index.src expected behaviour', () => {
    // Use "it" to define a test case
    it('Renders <App /> into #root when #root exists', async () => {
        // Create a custom root element
        const root = document.createElement('div')
        root.id = 'root'
        document.body.appendChild(root)

        // Import index.tsxq
        await import('../src/index')

        // Assert render was called with our custom root element
        expect(renderSpy).toHaveBeenCalledWith(expect.any(Function), root)
    })
})