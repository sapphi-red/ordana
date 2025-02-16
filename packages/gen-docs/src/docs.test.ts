import { describe, expect, test } from 'vitest'
import { generateDocs } from './index.ts'
import type { TopLevelOptions } from 'ordana'
import type { DocsTopLevelOptions } from './types.ts'

describe('generateDocs', () => {
  const opts = {
    name: 'foo',
    subcommands: {
      bar: {
        description: 'the subcommand bar',
        arguments: {
          arg1: {
            type: 'boolean',
            description: 'the argument arg1'
          },
          arg2: {
            type: { type: 'string', parse: v => +v, docsType: 'number' },
            description: 'the argument arg2'
          }
        },
        positionals: {
          minimum: 1,
          placeholders: ['path']
        }
      },
      baz: {
        description: 'the subcommand baz',
        alias: ['qux']
      }
    },
    globalArguments: {
      globalArg1: {
        type: 'boolean',
        description: 'the global argument globalArg1'
      }
    }
  } as const satisfies TopLevelOptions

  const opts2 = {
    ...opts,
    name: 'foo2',
    defaultSubcommand: 'baz'
  } as const satisfies TopLevelOptions

  const docsOpts = {
    subcommands: {
      bar: {
        description: 'the subcommand bar from docs options',
        arguments: {
          arg1: {
            description: 'the argument arg1 from docs options'
          }
        }
      }
    },
    globalArguments: {
      globalArg1: {
        description: 'the global argument globalArg1 from docs options'
      }
    }
  } as const satisfies DocsTopLevelOptions

  test('command without docs options', async () => {
    const actual = generateDocs(opts)
    await expect(actual).toMatchFileSnapshot('./snapshot/foo.docs.md')
  })

  test('command with default subcommand without docs options', async () => {
    const actual = generateDocs(opts2)
    await expect(actual).toMatchFileSnapshot('./snapshot/foo2.docs.md')
  })

  test('command with docs options', async () => {
    const actual = generateDocs(opts, docsOpts)
    await expect(actual).toMatchFileSnapshot(
      './snapshot/foo-with-docs-option.docs.md'
    )
  })
})
