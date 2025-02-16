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
    return { type: 'help', targetSubcommand: undefined }
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
    return { type: 'help', targetSubcommand: subcommandName }
  }

  const mergedArguments = {
    ...topLevelOpts.globalArguments,
    ...subcommand.arguments
  }

  const { args: convertedArgs, options: convertedOptions } =
    convertArgsForParseArgs(args, mergedArguments)
  const result = parseArgsFunc({
    args: convertedArgs,
    options: convertedOptions,
    allowPositionals: subcommand.positionals !== undefined
  })
  tweakResultFromParseArgs(result, mergedArguments)

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
 * convert args to add support for string|boolean args
 *
 * - convert string|boolean args to string args
 * - add an empty string after string|boolean args if the next arg is not an option
 */
function convertArgsForParseArgs(
  args: string[],
  argsOptions: ArgumentOptionsRecord
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
    Object.entries(argsOptions).map(([name, option]) => [
      name,
      {
        ...option,
        type:
          typeof option.type !== 'string' || option.type === 'string|boolean'
            ? 'string'
            : option.type
      }
    ])
  )
  return { args: convertedArgs, options: convertedOptions }
}

/**
 * set true for string|boolean args if the value is empty
 */
function tweakResultFromParseArgs(
  result_: ReturnType<typeof util.parseArgs>,
  argsOptions: ArgumentOptionsRecord
) {
  const result = result_ as NormalParsedResults<TopLevelOptions>
  for (const key in result.values) {
    const option = argsOptions[key]!
    if (
      option.type === 'string|boolean' ||
      (typeof option.type === 'object' && option.type.type === 'string|boolean')
    ) {
      if (option.multiple) {
        if (result.values[key]) {
          result.values[key] = (result.values[key] as string[]).map(v =>
            v === '' ? true : v
          )
        }
      } else {
        if (result.values[key] === '') {
          result.values[key] = true
        }
      }
    }
    if (typeof option.type === 'object') {
      type CustomTypePermissive = CustomType & { type: 'string|boolean' }
      if (option.multiple) {
        if (result.values[key]) {
          result.values[key] = (
            result.values[key] as Array<string | boolean>
          ).map(v => (option.type as CustomTypePermissive).parse(v))
        }
      } else {
        result.values[key] = (option.type as CustomTypePermissive).parse(
          result.values[key] as string | boolean
        )
      }
    }
  }
}
