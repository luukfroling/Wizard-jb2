import { defineConfig } from 'vitest/config'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  plugins: [
    solidPlugin()
  ],
  test: {
    environment: 'jsdom',
    server: {deps: {
      inline: [
        'solid-js',
        '@solidjs/testing-library'
      ]
    }},
    testTransformMode: {
      web: ['**/*.{js,ts,jsx,tsx}']
    }
  },
})
