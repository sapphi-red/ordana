import type { SubCommandOptions, TopLevelOptions } from 'ordana'
import type { DocsTopLevelOptions, DocsSubCommandOptions } from './types.ts'
import {
  getAliasList,
  getCommand,
  stringifyArgument,
  stringifyArgumentType,
  stringifyPositionals
} from '../../ordana/src/utils.ts'

/**
 * Generate documentation in Markdown format
 */
export const generateDocs = (
  topLevelOpts: TopLevelOptions,
  docsOpts: DocsTopLevelOptions = {}
): string => {
  return (
    Object.keys(topLevelOpts.subcommands)
      .map(name => generateDocsForSubcommand(topLevelOpts, name, docsOpts))
      .join('\n\n') + '\n'
  )
}

export function generateDocsForSubcommand(
  topLevelOpts: TopLevelOptions,
  subcommandName: string,
  docsTopLevelOpts?: DocsTopLevelOptions | undefined
): string {
  const subcommand = topLevelOpts.subcommands[subcommandName]!
  const docsSubcommand = docsTopLevelOpts?.subcommands?.[subcommandName]
  return generateDocsForSubcommandInternal(
    topLevelOpts,
    subcommandName,
    subcommand,
    docsTopLevelOpts,
    docsSubcommand
  )
}

function generateDocsForSubcommandInternal(
  topLevelOpts: TopLevelOptions,
  subcommandName: string,
  subcommand: SubCommandOptions,
  docsTopLevelOpts: DocsTopLevelOptions | undefined,
  docsSubcommand: DocsSubCommandOptions | undefined
): string {
  let message = `### \`${getCommand(topLevelOpts, subcommandName)}\`\n\n`
  const description = docsSubcommand?.description ?? subcommand.description
  if (description) {
    message += `${description}\n`
  }

  const sections: string[] = []

  let usageSection = '#### Usage\n\n'
  usageSection += '```bash\n'
  usageSection += getCommand(topLevelOpts, subcommandName)
  const positionals = stringifyPositionals(subcommand.positionals)
  if (positionals) {
    usageSection += ` ${positionals}`
  }
  usageSection += '\n'
  usageSection += '```'
  sections.push(usageSection)

  let optionsSection = '#### Options\n\n'
  const docsArgumentsOpts = {
    ...docsTopLevelOpts?.globalArguments,
    ...docsSubcommand?.arguments
  }
  const optionDescriptions = Object.entries({
    ...topLevelOpts.globalArguments,
    ...subcommand.arguments
  }).map(([name, option]) => {
    const namePart = stringifyArgument(name, option)
    const type = stringifyArgumentType(option)
    const description =
      docsArgumentsOpts?.[name]?.description ?? option.description ?? ''
    return [`\`${namePart}\``, `\`${type}\``, description]
  })
  optionsSection +=
    optionDescriptions.length > 0
      ? generateTable(['Options', 'Type', 'Description'], optionDescriptions)
      : 'No options'
  sections.push(optionsSection)

  if (topLevelOpts.defaultSubcommand === subcommandName || subcommand.alias) {
    let aliasesSection = '#### Aliases\n\n'
    aliasesSection += getAliasList(
      subcommand,
      topLevelOpts.defaultSubcommand === subcommandName
    )
      .map(alias => `\`${getCommand(topLevelOpts, alias)}\``)
      .join(', ')
    sections.push(aliasesSection)
  }

  return message + '\n' + sections.join('\n\n')
}

function generateTable(titleRow: string[], inputRows: string[][]): string {
  const rows = inputRows.map(row =>
    row.map(cell => cell.replaceAll('|', '\\|'))
  )

  const maxLengths: number[] = []
  for (let i = 0; i < rows[0]!.length; i++) {
    const lengths = rows.map(row => row[i]!.length)
    maxLengths.push(Math.max(titleRow[i]!.length, ...lengths))
  }

  const outputRows: string[] = []
  outputRows.push(formatRow(titleRow, maxLengths))
  outputRows.push(
    formatRow(
      Array.from({ length: maxLengths.length }, () => ''),
      maxLengths,
      '-'
    )
  )
  outputRows.push(...rows.map(row => formatRow(row, maxLengths)))
  return outputRows.join('\n')
}

function formatRow(row: string[], lengths: number[], fillString = ' '): string {
  return `|${row
    .map((cell, colIdx) => ` ${cell.padEnd(lengths[colIdx]!, fillString)} `)
    .join('|')}|`
}
