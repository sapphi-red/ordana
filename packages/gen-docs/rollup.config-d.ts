import { defineConfig } from 'rollup'
import packageJson from './package.json' with { type: 'json' }
import dts from 'rollup-plugin-dts'

export default defineConfig({
  input: './src/index.ts',
  output: {
    dir: './dist',
    format: 'es'
  },
  plugins: [dts()],
  external: [...Object.keys(packageJson.peerDependencies), /^node:/]
})
