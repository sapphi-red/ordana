import { describe, expect, test } from 'vitest'
import {
  getAliasList,
  getCommand,
  stringifyArgument,
  stringifyArgumentType,
  stringifyPositionals
} from './utils.ts'
import type { CustomType } from './types.ts'

describe('stringifyPositionals', () => {
  const cases = [
    { name: 'no positionals', input: undefined, expected: '' },
    { name: 'simple positionals', input: {}, expected: '' },
    {
      name: 'at least one positional',
      input: { minimum: 1 },
      expected: '<arg0>'
    },
    {
      name: 'at least two positionals',
      input: { minimum: 2 },
      expected: '<arg0> <arg1>'
    },
    {
      name: 'max one positional',
      input: { maximum: 1 },
      expected: '[arg0]'
    },
    {
      name: '1 to 3 positionals',
      input: { minimum: 1, maximum: 3 },
      expected: '<arg0> [arg1] [arg2]'
    },
    {
      name: 'only placeholders',
      input: { placeholders: ['foo'] },
      expected: '[foo]'
    },
    {
      name: 'at least one positional with placeholders',
      input: { minimum: 1, placeholders: ['foo'] },
      expected: '<foo>'
    },
    {
      name: 'at least one positional with longer placeholders',
      input: { minimum: 1, placeholders: ['foo', 'bar'] },
      expected: '<foo> [bar]'
    },
    {
      name: '1 to 3 positionals with placeholders',
      input: { minimum: 1, maximum: 3, placeholders: ['foo', 'bar'] },
      expected: '<foo> [bar] [arg2]'
    }
  ]

  for (const { name, input, expected } of cases) {
    test(name, () => {
      expect(stringifyPositionals(input)).toBe(expected)
    })
  }
})

describe('stringifyArgumentType', () => {
  const cases = [
    { name: 'string', input: { type: 'string' as const }, expected: 'string' },
    {
      name: 'boolean',
      input: { type: 'boolean' as const },
      expected: 'boolean'
    },
    {
      name: 'string|boolean',
      input: { type: 'string|boolean' as const },
      expected: 'string | boolean'
    },
    {
      name: 'custom',
      input: {
        type: {
          type: 'string',
          parse: v => +v,
          docsType: 'number'
        } satisfies CustomType
      },
      expected: 'number'
    },
    {
      name: 'custom with boolean',
      input: {
        type: {
          type: 'string|boolean',
          parse: v => +v,
          docsType: 'number | boolean'
        } satisfies CustomType
      },
      expected: 'number | boolean'
    }
  ]

  for (const { name, input, expected } of cases) {
    test(name, () => {
      expect(stringifyArgumentType(input)).toBe(expected)
    })
  }
})

describe('stringifyArgument', () => {
  const cases = [
    {
      name: 'simple boolean',
      input: { name: 'foo', option: { type: 'boolean' as const } },
      expected: '--foo'
    },
    {
      name: 'simple string',
      input: { name: 'foo', option: { type: 'string' as const } },
      expected: '--foo <foo>'
    },
    {
      name: 'simple string|boolean',
      input: { name: 'foo', option: { type: 'string|boolean' as const } },
      expected: '--foo [foo]'
    },
    {
      name: 'with short',
      input: { name: 'foo', option: { type: 'boolean' as const, short: 'f' } },
      expected: '-f, --foo'
    },
    {
      name: 'string with placeholder',
      input: {
        name: 'foo',
        option: { type: 'string' as const, placeholder: 'bar' }
      },
      expected: '--foo <bar>'
    },
    {
      name: 'string|boolean with placeholder',
      input: {
        name: 'foo',
        option: { type: 'string|boolean' as const, placeholder: 'bar' }
      },
      expected: '--foo [bar]'
    }
  ]

  for (const { name, input, expected } of cases) {
    test(name, () => {
      expect(stringifyArgument(input.name, input.option)).toBe(expected)
    })
  }
})

describe('getAliasList', () => {
  const cases = [
    {
      name: 'no alias',
      input: { option: {}, isDefaultSubcommand: false },
      expected: []
    },
    {
      name: 'single alias',
      input: { option: { alias: ['foo'] }, isDefaultSubcommand: false },
      expected: ['foo']
    },
    {
      name: 'multiple aliases',
      input: { option: { alias: ['foo', 'bar'] }, isDefaultSubcommand: false },
      expected: ['foo', 'bar']
    },
    {
      name: 'default subcommand',
      input: { option: {}, isDefaultSubcommand: true },
      expected: [undefined]
    },
    {
      name: 'alias and default subcommand',
      input: { option: { alias: ['foo'] }, isDefaultSubcommand: true },
      expected: [undefined, 'foo']
    }
  ]

  for (const { name, input, expected } of cases) {
    test(name, () => {
      expect(
        getAliasList(input.option, input.isDefaultSubcommand)
      ).toStrictEqual(expected)
    })
  }
})

describe('getCommand', () => {
  const cases = [
    {
      name: 'no subcommand',
      input: {
        option: { name: 'foo', subcommands: { bar: {} } },
        subcommand: undefined
      },
      expected: 'foo'
    },
    {
      name: 'subcommand',
      input: {
        option: { name: 'foo', subcommands: { bar: {} } },
        subcommand: 'bar'
      },
      expected: 'foo bar'
    }
  ]

  for (const { name, input, expected } of cases) {
    test(name, () => {
      expect(getCommand(input.option, input.subcommand)).toBe(expected)
    })
  }
})
