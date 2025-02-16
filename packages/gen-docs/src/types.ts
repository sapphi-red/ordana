export type DocsArgumentOptions = {
  /**
   * Description of the argument for docs
   *
   * It will be used instead of the description in the `ArgumentOptions` if it is set.
   */
  description?: string
}

type DocsArgumentOptionsRecord = Record<string, DocsArgumentOptions>

export type DocsSubCommandOptions = {
  /**
   * Description of the subcommand for docs
   *
   * It will be used instead of the description in the `SubCommandOptions` if it is set.
   */
  description?: string
  arguments?: DocsArgumentOptionsRecord
}

export type DocsTopLevelOptions = {
  subcommands?: Record<string, DocsSubCommandOptions>
  globalArguments?: DocsArgumentOptionsRecord
}
