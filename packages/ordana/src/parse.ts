import * as util from 'node:util'
import type { ParseArgsConfig } from 'node:util'
import type {
  ArgumentOptionsRecord,
  CustomType,
  NormalParsedResults,
  ParsedResults,
  SubCommandOptions,
  TopLevelOptions
} from './types.ts'

const HELP_FLAG = '--help'

export type ParseOptions = {
  /**
   * Pass a polyfill for `util.parseArgs` to support older Node.js versions
   */
  parseArgsFunc?: typeof util.parseArgs
}

export function parse<T extends TopLevelOptions>(
  input: string[],
  topLevelOpts: T,
  { parseArgsFunc = util.parseArgs }: ParseOptions = {}
): ParsedResults<T> {
  const maybeSubcommand = input[0]
  if (maybeSubcommand === HELP_FLAG) {
    return { type: 'help', targetSubcommand: undefined, topLevelOpts }
  }

  const [subcommandName, subcommand, defaultSubcommandUsed] = selectSubcommand(
    maybeSubcommand,
    topLevelOpts.subcommands,
    topLevelOpts.defaultSubcommand
  )
  if (!subcommand) {
    if (subcommandName) {
      throw new Error(`Invalid default subcommand: "${subcommandName}"`)
    }
    if (!maybeSubcommand) {
      throw new Error('Subcommand is required')
    }
    throw new Error(`Invalid subcommand: "${maybeSubcommand}"`)
  }

  const args = !defaultSubcommandUsed ? input.slice(1) : input
  if (args[0] === HELP_FLAG) {
    return { type: 'help', targetSubcommand: subcommandName, topLevelOpts }
  }

  const mergedArguments = {
    ...topLevelOpts.globalArguments,
    ...subcommand.arguments
  }

  const { allowKebabCaseAsCamelCaseArguments = false } = topLevelOpts
  const { args: convertedArgs, options: convertedOptions } =
    convertArgsForParseArgs(
      args,
      mergedArguments,
      allowKebabCaseAsCamelCaseArguments
    )
  const result = parseArgsFunc({
    args: convertedArgs,
    options: convertedOptions,
    allowPositionals: subcommand.positionals !== undefined
  })
  tweakResultFromParseArgs(
    result,
    mergedArguments,
    allowKebabCaseAsCamelCaseArguments
  )

  return {
    type: 'normal',
    subcommand: subcommandName,
    values: result.values,
    positionals: result.positionals
  } as ParsedResults<T>
}

function selectSubcommand(
  selector: string | undefined,
  subcommands: Record<string, SubCommandOptions>,
  defaultSubcommand: string | undefined
):
  | readonly [name: string, options: SubCommandOptions, usedDefault: boolean]
  | readonly [] {
  const subcommandList = Object.entries(subcommands)
  if (selector) {
    const found = subcommandList.find(
      ([name, opts]) => name === selector || opts.alias?.includes(selector)
    )
    if (found) {
      return [...found, false]
    }
  }

  if (defaultSubcommand) {
    return [defaultSubcommand, subcommands[defaultSubcommand]!, true]
  }
  return []
}

/**
 * convert args to add support for additional features
 *
 * - convert string|boolean and custom args to string args
 * - add an empty string after string|boolean args if the next arg is not an option
 * - handle kebab-case camelCase conversion
 */
function convertArgsForParseArgs(
  args: string[],
  argsOptions: ArgumentOptionsRecord,
  allowKebabCaseAsCamelCaseArguments: boolean
): { args: string[]; options: ParseArgsConfig['options'] } {
  const stringBooleanArgNames = new Set(
    Object.entries(argsOptions)
      .filter(
        ([, option]) =>
          option.type === 'string|boolean' ||
          (typeof option.type === 'object' &&
            option.type.type === 'string|boolean')
      )
      .flatMap(([name, option]) => [
        `--${name}`,
        ...(option.short ? [`-${option.short}`] : [])
      ])
  )

  const convertedArgs: string[] = []
  let hadDashDash = false
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    convertedArgs.push(arg)
    if (arg === '--') {
      hadDashDash = true
    }
    if (!hadDashDash && stringBooleanArgNames.has(arg)) {
      if (args.length === i + 1 || args[i + 1]?.startsWith('-')) {
        convertedArgs.push('')
      }
    }
  }

  const convertedOptions = Object.fromEntries(
    Object.entries(argsOptions).flatMap(([name, option]) => {
      const convertedName = allowKebabCaseAsCamelCaseArguments
        ? camelCaseToKebabCase(name)
        : undefined

      const newOption = {
        ...option,
        type:
          typeof option.type !== 'string' || option.type === 'string|boolean'
            ? 'string'
            : option.type
      }
      const results = [[name, newOption]]
      if (convertedName) {
        results.push([convertedName, newOption])
      }
      return results
    })
  )
  return { args: convertedArgs, options: convertedOptions }
}

/**
 * - set true for string|boolean args if the value is empty
 * - convert string values to custom values
 * - handle kebab-case camelCase conversion
 */
function tweakResultFromParseArgs(
  result_: ReturnType<typeof util.parseArgs>,
  argsOptions: ArgumentOptionsRecord,
  allowKebabCaseAsCamelCaseArguments: boolean
) {
  const kebabArgsToCamelArgs = allowKebabCaseAsCamelCaseArguments
    ? Object.fromEntries(
        Object.keys(argsOptions).map(name => [camelCaseToKebabCase(name), name])
      )
    : {}

  const result = result_ as NormalParsedResults<TopLevelOptions>
  for (const key in result.values) {
    const camelKey = kebabArgsToCamelArgs[key] || key
    const option = argsOptions[camelKey]!

    if (kebabArgsToCamelArgs[key]) {
      const value = result.values[key]
      delete result.values[key]
      if (option.multiple) {
        result.values[camelKey] ??= []
        ;(result.values[camelKey] as Array<string | boolean>).push(
          ...(value as Array<string | boolean>)
        )
      } else {
        result.values[camelKey] ??= value
      }
    }

    if (
      option.type === 'string|boolean' ||
      (typeof option.type === 'object' && option.type.type === 'string|boolean')
    ) {
      if (option.multiple) {
        if (result.values[camelKey]) {
          result.values[camelKey] = (result.values[camelKey] as string[]).map(
            v => (v === '' ? true : v)
          )
        }
      } else {
        if (result.values[camelKey] === '') {
          result.values[camelKey] = true
        }
      }
    }
    if (typeof option.type === 'object') {
      type CustomTypePermissive = CustomType & { type: 'string|boolean' }
      if (option.multiple) {
        if (result.values[camelKey]) {
          result.values[camelKey] = (
            result.values[camelKey] as Array<string | boolean>
          ).map(v => (option.type as CustomTypePermissive).parse(v))
        }
      } else {
        result.values[camelKey] = (option.type as CustomTypePermissive).parse(
          result.values[camelKey] as string | boolean
        )
      }
    }
  }
}

function camelCaseToKebabCase(str: string) {
  if (str.length === 0) {
    return str
  }
  return str.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    (m, p1) => (p1 ? '-' : '') + m.toLowerCase()
  )
}
