# ordana

[![npm version](https://badge.fury.io/js/ordana.svg)](https://badge.fury.io/js/ordana) ![CI](https://github.com/sapphi-red/ordana/workflows/CI/badge.svg) [![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

A declarative CLI argument parser with automatic help message and document generation.

- Declarative configuration
- Type safe parse results
- Automatic help message generation
- Automatic document generation
- Minimal package size: ~13kB for JS, ~6kB for types(without minify / gzip)
  - Note: to support older Node.js versions, you need `@pkgjs/parseargs@^0.9.1` too, which is ~60kB

## Install

```shell
npm i ordana
# yarn add ordana
# pnpm add ordana
```

## Usage

### parse

```ts
import { parse } from 'ordana'
import type { TopLevelOptions } from 'ordana'

const options = {
  subcommands: {
    dev: {
      description: 'my subcommand',
      arguments: {
        foo: { type: 'string|boolean', description: 'arg' },
        bar: { type: 'string', multiple: true },
        baz: {
          type: {
            type: 'string',
            parse: v => +v,
            docsType: 'number'
          }
        }
      },
      positionals: {}
    }
  }
} satisfies TopLevelOptions

const input = ['dev', '--foo', '--bar', 'a', '--bar', 'b', '--baz', '1', 'pos'] // process.argv.slice(2)
const result = parse(input, options)
console.log(result)
/*
{
  type: 'normal',
  subcommand: 'dev',
  values: {
    foo: true,
    bar: ['a', 'b'],
    baz: 1
  },
  positionals: ['pos']
}
*/
```

### help message

```ts
const input2 = ['dev', '--help']
const result2 = parse(input2, options) // options is the same as above
if (result2.type === 'help') {
  const helpMessage = generateHelpMessage(options, result2.targetSubcommand)
  console.log(helpMessage)
  /*
    foo dev - my subcommand

    Usage
      $ foo dev

    Options
      --foo [foo]  [string | boolean]  arg
      --bar <bar>  [string]
      --baz <baz>  [number]
  */
}
```

### document generation

```ts
import { generateDocs } from '@ordana/gen-docs' // `@ordana/gen-docs` needs to be installed separately
const docs = generateDocs(options)
console.log(docs)
```

<details>
<summary>Output</summary>

### `foo dev`

my subcommand

#### Usage

```bash
foo dev
```

#### Options

| Options       | Type                | Description |
| ------------- | ------------------- | ----------- |
| `--foo [foo]` | `string \| boolean` | arg         |
| `--bar <bar>` | `string`            |             |
| `--baz <baz>` | `number`            |             |

</details>

## Credits

- The help message output is based on [`cac`](https://github.com/cacjs/cac)
- The option interface is based on Node's [`util.parseArgs`](https://nodejs.org/docs/latest-v22.x/api/util.html#utilparseargsconfig) API
