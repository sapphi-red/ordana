import { defineConfig } from 'rolldown'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig({
  input: './src/index.ts',
  output: {
    dir: './dist'
  },
  external: Object.keys(packageJson.dependencies),
  platform: 'node'
})
