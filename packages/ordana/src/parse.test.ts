import { describe, expect, test } from 'vitest'
import { parse } from './parse.ts'
import type { CustomType } from './types.ts'

describe('normal', () => {
  test('subcommand without arguments', () => {
    const actual = parse(['dev'], { subcommands: { dev: { arguments: {} } } })
    expect(actual).toStrictEqual({
      type: 'normal',
      subcommand: 'dev',
      values: nullObject({}),
      positionals: []
    })
  })

  test('default subcommand', () => {
    const actual = parse([], {
      subcommands: { dev: { arguments: {} } },
      defaultSubcommand: 'dev'
    })
    expect(actual).toStrictEqual({
      type: 'normal',
      subcommand: 'dev',
      values: nullObject({}),
      positionals: []
    })
  })

  test('handles empty input', () => {
    expect(() => {
      parse([], { subcommands: {} })
    }).toThrow('Subcommand is required')
  })

  test('invalid subcommand', () => {
    expect(() => {
      parse(['foo'], { subcommands: {} })
    }).toThrow('Invalid subcommand: "foo"')
  })

  test('invalid default subcommand', () => {
    expect(() => {
      parse([], { subcommands: {}, defaultSubcommand: 'foo' })
    }).toThrow('Invalid default subcommand: "foo"')
  })

  test('subcommand with arguments', () => {
    const actual = parse(['dev', '--foo', 'foo', '--bar', 'pos'], {
      subcommands: {
        dev: {
          arguments: {
            foo: { type: 'string' },
            bar: { type: 'boolean' }
          },
          positionals: {}
        }
      }
    })
    expect(actual).toStrictEqual({
      type: 'normal',
      subcommand: 'dev',
      values: nullObject({ foo: 'foo', bar: true }),
      positionals: ['pos']
    })
  })

  test('default subcommand with arguments', () => {
    const actual = parse(['--foo', 'foo', '--bar', 'pos'], {
      subcommands: {
        dev: {
          arguments: {
            foo: { type: 'string' },
            bar: { type: 'boolean' }
          },
          positionals: {}
        }
      },
      defaultSubcommand: 'dev'
    })
    expect(actual).toStrictEqual({
      type: 'normal',
      subcommand: 'dev',
      values: nullObject({ foo: 'foo', bar: true }),
      positionals: ['pos']
    })
  })

  test('disallow positionals', () => {
    expect(() => {
      parse(['dev', 'foo'], {
        subcommands: {
          dev: {}
        }
      })
    }).toThrow('This command does not take positional arguments')
  })
})

describe('subcommand alias', () => {
  test('single alias', () => {
    const actual = parse(['serve'], {
      subcommands: {
        dev: {
          alias: ['serve']
        }
      }
    })
    expect(actual).toStrictEqual({
      type: 'normal',
      subcommand: 'dev',
      values: nullObject({}),
      positionals: []
    })
  })

  test('multiple aliases', () => {
    const actual = parse(['server'], {
      subcommands: {
        dev: {
          alias: ['serve', 'server']
        }
      }
    })
    expect(actual).toStrictEqual({
      type: 'normal',
      subcommand: 'dev',
      values: nullObject({}),
      positionals: []
    })
  })
})

describe('type: string|boolean', () => {
  const cases = [
    { name: 'short string', input: ['dev', '-ffoo'], expected: 'foo' },
    { name: 'short boolean', input: ['dev', '-f'], expected: true },
    { name: 'long string', input: ['dev', '--foo', 'foo'], expected: 'foo' },
    {
      name: 'long string with "="',
      input: ['dev', '--foo=foo'],
      expected: 'foo'
    },
    { name: 'long boolean (last)', input: ['dev', '--foo'], expected: true },
    {
      name: 'long boolean (middle)',
      input: ['dev', '--foo', '--bar'],
      expected: true
    },
    {
      name: 'short after "--"',
      input: ['dev', '--', '-f'],
      withPositionals: true,
      expected: null
    },
    {
      name: 'long after "--"',
      input: ['dev', '--', '--foo'],
      withPositionals: true,
      expected: null
    },
    {
      name: 'multiple short boolean',
      input: ['dev', '-f', '-f'],
      multiple: true,
      expected: [true, true]
    },
    {
      name: 'multiple long boolean',
      input: ['dev', '--foo', '--foo'],
      multiple: true,
      expected: [true, true]
    },
    {
      name: 'multiple short string',
      input: ['dev', '-ffoo', '-fbar'],
      multiple: true,
      expected: ['foo', 'bar']
    },
    {
      name: 'multiple long string',
      input: ['dev', '--foo', 'foo', '--foo', 'bar'],
      multiple: true,
      expected: ['foo', 'bar']
    }
  ]

  for (const { name, input, withPositionals, multiple, expected } of cases) {
    test(name, () => {
      const actual = parse(input, {
        subcommands: {
          dev: {
            arguments: {
              foo: {
                type: 'string|boolean',
                short: 'f',
                multiple: multiple ?? false
              },
              bar: { type: 'boolean' }
            },
            positionals: withPositionals ? {} : undefined
          }
        }
      })
      expect(actual).toStrictEqual({
        type: 'normal',
        subcommand: 'dev',
        values:
          expected === null
            ? nullObject({})
            : expect.objectContaining({ foo: expected }),
        positionals: withPositionals ? expect.any(Array) : []
      })
    })
  }
})

describe('custom type', () => {
  const cases = [
    {
      name: 'number',
      input: ['dev', '--foo', '1'],
      type: {
        type: 'string',
        parse: v => +v,
        docsType: 'number'
      } satisfies CustomType,
      expected: 1
    },
    {
      name: 'number or boolean',
      input: ['dev', '--foo'],
      type: {
        type: 'string|boolean',
        parse: v => (typeof v === 'boolean' ? v : +v),
        docsType: 'number | boolean'
      } satisfies CustomType,
      expected: true
    },
    {
      name: 'multiple number',
      input: ['dev', '--foo', '1', '--foo', '2'],
      type: {
        type: 'string',
        parse: v => +v,
        docsType: 'number'
      } satisfies CustomType,
      multiple: true,
      expected: [1, 2]
    },
    {
      name: 'multiple number or boolean',
      input: ['dev', '--foo', '1', '--foo'],
      type: {
        type: 'string|boolean',
        parse: v => (typeof v === 'boolean' ? v : +v),
        docsType: 'number | boolean'
      } satisfies CustomType,
      multiple: true,
      expected: [1, true]
    }
  ]

  for (const { name, input, type, multiple, expected } of cases) {
    test(name, () => {
      const actual = parse(input, {
        subcommands: {
          dev: {
            arguments: {
              foo: { type, multiple: multiple ?? false }
            }
          }
        }
      })
      expect(actual).toStrictEqual({
        type: 'normal',
        subcommand: 'dev',
        values:
          expected === null
            ? nullObject({})
            : expect.objectContaining({ foo: expected }),
        positionals: []
      })
    })
  }
})

describe('allowKebabCaseAsCamelCaseArguments', () => {
  const cases = [
    {
      name: 'simple',
      input: ['dev', '--foo-bar', '1'],
      allowConversion: true,
      expected: '1'
    },
    {
      name: 'multiple kebab case',
      input: ['dev', '--foo-bar', '1', '--foo-bar', '2'],
      allowConversion: true,
      multiple: true,
      expected: ['1', '2']
    },
    {
      name: 'single kebab case and camel case (1)',
      input: ['dev', '--foo-bar', '1', '--fooBar', '2'],
      allowConversion: true,
      expected: '2' // camel case always wins
    },
    {
      name: 'single kebab case and camel case (2)',
      input: ['dev', '--fooBar', '2', '--foo-bar', '1'],
      allowConversion: true,
      expected: '2' // camel case always wins
    },
    {
      name: 'multiple kebab case and camel case (1)',
      input: ['dev', '--foo-bar', '1', '--fooBar', '2'],
      allowConversion: true,
      multiple: true,
      expected: ['2', '1'] // camel case values are always put first
    },
    {
      name: 'multiple kebab case and camel case (2)',
      input: ['dev', '--fooBar', '2', '--foo-bar', '1'],
      allowConversion: true,
      multiple: true,
      expected: ['2', '1'] // camel case values are always put first
    }
  ]

  for (const { name, input, allowConversion, multiple, expected } of cases) {
    test(name, () => {
      const actual = parse(input, {
        subcommands: {
          dev: {
            arguments: {
              fooBar: { type: 'string', multiple: multiple ?? false }
            }
          }
        },
        allowKebabCaseAsCamelCaseArguments: allowConversion
      })
      expect(actual).toStrictEqual({
        type: 'normal',
        subcommand: 'dev',
        values:
          expected === null
            ? nullObject({})
            : expect.objectContaining({ fooBar: expected }),
        positionals: []
      })
    })
  }
})

describe('global arguments', () => {
  test('merged with subcommand arguments', () => {
    const actual = parse(['dev', '--foo', '--bar'], {
      subcommands: {
        dev: {
          arguments: {
            foo: { type: 'boolean' }
          }
        }
      },
      globalArguments: {
        bar: { type: 'boolean' }
      }
    })
    expect(actual).toStrictEqual({
      type: 'normal',
      subcommand: 'dev',
      values: nullObject({ foo: true, bar: true }),
      positionals: []
    })
  })

  test('overrides subcommand arguments', () => {
    const actual = parse(['dev', '--foo', 'foo'], {
      subcommands: {
        dev: {
          arguments: {
            foo: { type: 'string' }
          }
        }
      },
      globalArguments: {
        foo: { type: 'boolean' }
      }
    })
    expect(actual).toStrictEqual({
      type: 'normal',
      subcommand: 'dev',
      values: nullObject({ foo: 'foo' }),
      positionals: []
    })
  })
})

describe('--help works', () => {
  test('without subcommand', () => {
    const options = { subcommands: {} }
    const actual = parse(['--help'], options)
    expect(actual).toStrictEqual({
      type: 'help',
      targetSubcommand: undefined,
      topLevelOptions: options
    })
  })

  test('with subcommand', () => {
    const options = { subcommands: { dev: {} } }
    const actual = parse(['dev', '--help'], options)
    expect(actual).toStrictEqual({
      type: 'help',
      targetSubcommand: 'dev',
      topLevelOptions: options
    })
  })

  test('with unknown subcommand', () => {
    expect(() => {
      parse(['unknown', '--help'], { subcommands: { dev: {} } })
    }).toThrow('Invalid subcommand: "unknown"')
  })
})

describe('use polyfill', async () => {
  const { parseArgs } = await import('@pkgjs/parseargs')
  test('parseArgs from @pkgjs/parseargs', () => {
    const actual = parse(
      ['dev', '--foo', 'pos'],
      {
        subcommands: {
          dev: {
            arguments: {
              foo: { type: 'boolean' }
            },
            positionals: {}
          }
        }
      },
      {
        parseArgsFunc: parseArgs
      }
    )
    expect(actual).toStrictEqual({
      type: 'normal',
      subcommand: 'dev',
      values: nullObject({ foo: true }),
      positionals: ['pos']
    })
  })
})

function nullObject(obj: unknown) {
  return Object.assign(Object.create(null), obj)
}
