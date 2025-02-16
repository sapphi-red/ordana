import { describe, expect, test } from 'vitest'
import { generateHelpMessage } from './help.ts'
import type { TopLevelOptions } from './types.ts'
import { stripVTControlCharacters } from 'node:util'

describe('generateHelpMessage', () => {
  const opts = {
    name: 'foo',
    subcommands: {
      bar: {
        description: 'the subcommand bar',
        arguments: {
          arg1: {
            type: 'string',
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

  test('top-level command', async () => {
    const actual = generateHelpMessage(opts, undefined)
    await expect(stripVTControlCharacters(actual)).toMatchFileSnapshot(
      './snapshot/foo-top-level.help.txt'
    )
  })

  test('top-level command with default subcommand', async () => {
    const actual = generateHelpMessage(opts2, undefined)
    await expect(stripVTControlCharacters(actual)).toMatchFileSnapshot(
      './snapshot/foo2-top-level.help.txt'
    )
  })

  test('subcommand', async () => {
    const actual = generateHelpMessage(opts, 'bar')
    await expect(stripVTControlCharacters(actual)).toMatchFileSnapshot(
      './snapshot/foo-bar.help.txt'
    )
  })

  test('subcommand with alias', async () => {
    const actual = generateHelpMessage(opts2, 'baz')
    await expect(stripVTControlCharacters(actual)).toMatchFileSnapshot(
      './snapshot/foo2-baz.help.txt'
    )
  })
})
