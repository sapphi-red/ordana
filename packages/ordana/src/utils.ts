import type {
  ArgumentOptions,
  PositionalOptions,
  SubCommandOptions,
  TopLevelOptions
} from './types.ts'
import path from 'node:path'

export function stringifyPositionals(
  positionals: PositionalOptions | undefined
): string {
  if (!positionals) {
    return ''
  }

  const minimum = positionals.minimum ?? 0
  let maximum = positionals.maximum ?? Infinity
  if (!isFinite(maximum)) {
    maximum = positionals.placeholders?.length ?? minimum
  }

  const placeholders: string[] = []
  for (let i = 0; i < maximum; i++) {
    const placeholder = positionals.placeholders?.[i] ?? `arg${i}`
    const isOptional = i >= minimum
    placeholders.push(isOptional ? `[${placeholder}]` : `<${placeholder}>`)
  }
  return placeholders.join(' ')
}

export function stringifyArgumentType(option: ArgumentOptions): string {
  const type =
    typeof option.type === 'object' ? option.type.docsType : option.type
  if (type === 'string|boolean') {
    return 'string | boolean'
  }
  return type
}

export function stringifyArgument(
  name: string,
  option: ArgumentOptions
): string {
  let namePart = ''
  if (option.short) {
    namePart += `-${option.short}, `
  }
  namePart += `--${name}`
  if (option.type === 'string') {
    namePart += ` <${option.placeholder ?? name}>`
  } else if (option.type === 'string|boolean') {
    namePart += ` [${option.placeholder ?? name}]`
  }
  return namePart
}

export function getAliasList(
  subcommand: SubCommandOptions,
  isDefaultSubcommand: boolean
): Array<string | undefined> {
  const aliases: Array<string | undefined> = [...(subcommand.alias ?? [])]
  if (isDefaultSubcommand) {
    aliases.unshift(undefined)
  }
  return aliases
}

export function getCommand(
  topLevelOpts: TopLevelOptions,
  subcommand?: string
): string {
  const command =
    topLevelOpts.name ?? path.basename(process.argv[1] ?? 'command')
  return subcommand ? `${command} ${subcommand}` : command
}
