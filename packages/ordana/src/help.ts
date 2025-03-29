import type { SubCommandOptions, TopLevelOptions } from './types.ts'
import {
  getAliasList,
  getCommand,
  stringifyArgument,
  stringifyArgumentType,
  stringifyPositionals
} from './utils.ts'
import c from 'picocolors'

/**
 * Generate help message
 *
 * @param targetSubcommand The subcommand to generate help message for. If `undefined`, generate help message for the top level command.
 */
export function generateHelpMessage(
  topLevelOpts: TopLevelOptions,
  targetSubcommand: string | undefined
): string {
  const subcommand = targetSubcommand
    ? topLevelOpts.subcommands[targetSubcommand]
    : undefined

  const sections: string[] = []
  if (subcommand) {
    sections.push(
      `${getCommand(topLevelOpts, targetSubcommand)} - ${
        subcommand.description
      }`
    )
  }
  sections.push(generateUsageSection(topLevelOpts, targetSubcommand))
  if (targetSubcommand === undefined) {
    sections.push(generateCommandsSection(topLevelOpts))
    sections.push(
      `For more info, run any command with the ${c.blue('--help')} flag:\n` +
        Object.keys(topLevelOpts.subcommands)
          .map(
            name => `  ${c.blue('$')} ${getCommand(topLevelOpts, name)} --help`
          )
          .join('\n')
    )
  } else {
    sections.push(generateOptionsSection(topLevelOpts, subcommand!))
    const aliasList = getAliasList(
      subcommand!,
      topLevelOpts.defaultSubcommand === targetSubcommand
    )
    if (aliasList.length > 0) {
      sections.push(generateAliasesSection(topLevelOpts, aliasList))
    }
  }
  return sections.join('\n\n')
}

function generateUsageSection(
  topLevelOpts: TopLevelOptions,
  targetSubcommand: string | undefined
): string {
  const subcommand = targetSubcommand
    ? topLevelOpts.subcommands[targetSubcommand]
    : undefined

  let message = `${c.blue('$')} ${getCommand(topLevelOpts, targetSubcommand)}`
  if (subcommand) {
    const positionals = stringifyPositionals(subcommand.positionals)
    if (positionals) {
      message += ` ${positionals}`
    }
  } else if (topLevelOpts.defaultSubcommand) {
    message += ' [subcommand]'
  } else {
    message += ' <subcommand>'
  }

  return generateSection('Usage', message)
}

function generateCommandsSection(topLevelOpts: TopLevelOptions): string {
  const subcommandDescriptions = Object.entries(topLevelOpts.subcommands).map(
    ([name, subcommand]) => {
      let namePart = name
      const positionals = stringifyPositionals(subcommand.positionals)
      if (positionals) {
        namePart += ` ${positionals}`
      }
      let description = subcommand.description ?? ''
      if (name === topLevelOpts.defaultSubcommand) {
        description = c.yellow('(default)') + ' ' + description
      }
      return [namePart, description]
    }
  )
  const content =
    subcommandDescriptions.length > 0
      ? generateTable(subcommandDescriptions)
      : 'No commands'
  return generateSection('Commands', content)
}

function generateOptionsSection(
  topLevelOpts: TopLevelOptions,
  subcommand: SubCommandOptions
): string {
  const optionsDescriptions = Object.entries({
    ...topLevelOpts.globalArguments,
    ...subcommand.arguments
  }).map(([name, option]) => {
    const namePart = stringifyArgument(name, option)
    const type = stringifyArgumentType(option)
    return [namePart, c.cyan(`[${type}]`), option.description ?? '']
  })
  const content =
    optionsDescriptions.length > 0
      ? generateTable(optionsDescriptions)
      : 'No options'
  return generateSection('Options', content)
}

function generateAliasesSection(
  topLevelOpts: TopLevelOptions,
  aliasList: Array<string | undefined>
): string {
  return generateSection(
    'Aliases',
    aliasList.map(alias => getCommand(topLevelOpts, alias)).join(', ')
  )
}

function generateSection(title: string, content: string): string {
  let message = `${c.underline(c.bold(c.green(title)))}\n`
  message += content
    .split('\n')
    .map(l => `  ${l}`)
    .join('\n')
  return message
}

function generateTable(rows: string[][]): string {
  const maxLengths: number[] = []
  const colLength = rows[0]!.length
  for (let i = 0; i < colLength; i++) {
    if (i === colLength - 1) {
      maxLengths.push(0)
    } else {
      const lengths = rows.map(row => row[i]!.length)
      maxLengths.push(Math.max(...lengths))
    }
  }
  return rows
    .map(row =>
      row.map((cell, colIdx) => cell.padEnd(maxLengths[colIdx]!)).join('  ')
    )
    .join('\n')
}
