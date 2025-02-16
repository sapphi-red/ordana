import { describe, test, expectTypeOf } from 'vitest'
import type { CustomType, ParsedResults, TopLevelOptions } from './types.ts'

describe('CustomType', () => {
  test('string|boolean', () => {
    ;({
      type: 'string|boolean',
      parse: v => {
        expectTypeOf(v).toEqualTypeOf<string | boolean>()
        return +v
      },
      docsType: 'number | boolean'
    }) satisfies CustomType
  })

  test('string', () => {
    ;({
      type: 'string',
      parse: v => {
        expectTypeOf(v).toEqualTypeOf<string>()
        return +v
      },
      docsType: 'number'
    }) satisfies CustomType
  })
})

describe('ParsedResults', () => {
  test('positionals', () => {
    let result!: ParsedResults<{
      subcommands: {
        empty: {}
        undefinedPositionals: { positionals: undefined }
        withPositionals: {
          positionals: {}
        }
      }
    }>

    if (result.type === 'normal') {
      expectTypeOf(result.type).toEqualTypeOf<'normal'>()
      if (result.subcommand === 'empty') {
        expectTypeOf(result.positionals).toEqualTypeOf<[]>()
      } else if (result.subcommand === 'undefinedPositionals') {
        expectTypeOf(result.positionals).toEqualTypeOf<[]>()
      } else if (result.subcommand === 'withPositionals') {
        expectTypeOf(result.positionals).toEqualTypeOf<string[]>()
      } else {
        expectTypeOf(result).toBeNever()
      }
    } else {
      expectTypeOf(result.type).toEqualTypeOf<'help'>()
    }
  })

  test('values', () => {
    let result!: ParsedResults<{
      subcommands: {
        empty: {}
        values: {
          arguments: {
            string: { type: 'string' }
            boolean: { type: 'boolean' }
            stringBoolean: { type: 'string|boolean' }
            stringArray: { type: 'string'; multiple: true }
            booleanArray: { type: 'boolean'; multiple: true }
            stringBooleanArray: { type: 'string|boolean'; multiple: true }
            custom: {
              type: {
                type: 'string'
                parse: (_: unknown) => number
                docsType: 'number'
              }
            }
            customArray: {
              type: {
                type: 'string'
                parse: (_: unknown) => number
                docsType: 'number'
              }
              multiple: true
            }
            customBoolean: {
              type: {
                type: 'string|boolean'
                parse: (_: unknown) => number
                docsType: 'number | boolean'
              }
            }
            customBooleanArray: {
              type: {
                type: 'string|boolean'
                parse: (_: unknown) => number
                docsType: 'number | boolean'
              }
              multiple: true
            }
          }
        }
      }
    }>

    if (result.type === 'normal') {
      expectTypeOf(result.type).toEqualTypeOf<'normal'>()
      if (result.subcommand === 'empty') {
        expectTypeOf(result.values).toEqualTypeOf<{}>()
      } else if (result.subcommand === 'values') {
        expectTypeOf(result.values).toEqualTypeOf<{
          string?: string | undefined
          boolean?: boolean | undefined
          stringBoolean?: string | boolean | undefined
          stringArray?: string[] | undefined
          booleanArray?: boolean[] | undefined
          stringBooleanArray?: Array<string | boolean> | undefined
          custom?: number | undefined
          customArray?: number[] | undefined
          customBoolean?: number | boolean | undefined
          customBooleanArray?: Array<number | boolean> | undefined
        }>()
      } else {
        expectTypeOf(result).toBeNever()
      }
    } else {
      expectTypeOf(result.type).toEqualTypeOf<'help'>()
    }
  })

  test('without concrete type', () => {
    let result!: ParsedResults<TopLevelOptions>
    if (result.type === 'normal') {
      expectTypeOf(result.type).toEqualTypeOf<'normal'>()
      expectTypeOf(result.subcommand).toEqualTypeOf<string>()
      expectTypeOf(result.positionals).toEqualTypeOf<string[]>()
      expectTypeOf(result.values).toEqualTypeOf<Record<string, unknown>>()
    } else {
      expectTypeOf(result.type).toEqualTypeOf<'help'>()
    }
  })
})
