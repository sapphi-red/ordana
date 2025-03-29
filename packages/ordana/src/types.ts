// The types are based on `@types/node` types
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/36f851c86a080a406b8d5dc8e95880363d16083b/types/node/util.d.ts

export type CustomType<Type = unknown> = (
  | {
      type: 'string|boolean'
      parse: (value: string | boolean) => Type
    }
  | {
      type: 'string'
      parse: (value: string) => Type
    }
) & {
  docsType: string
}

export type ArgumentOptions<Type = unknown> = {
  description?: string
  /**
   * Placeholder for the value
   *
   * @default the name of the argument
   */
  placeholder?: string
  /**
   * Type of argument.
   */
  type: 'string' | 'boolean' | 'string|boolean' | CustomType<Type>
  /**
   * Whether this option can be provided multiple times.
   * If `true`, all values will be collected in an array.
   * If `false`, values for the option are last-wins.
   * @default false
   */
  multiple?: boolean | undefined
  /**
   * A single character alias for the option.
   */
  short?: string | undefined
}

export type ArgumentOptionsRecord = Record<string, ArgumentOptions>

export type PositionalOptions = {
  /** @default 0 */
  minimum?: number
  /** @default Infinity */
  maximum?: number
  placeholders?: string[]
}

export type SubCommandOptions = {
  description?: string
  /**
   * Aliases for this subcommand
   */
  alias?: string[]
  arguments?: ArgumentOptionsRecord
  /**
   * Whether this subcommand takes positional arguments
   *
   * If an object is passed, positional arguments are allowed.
   * If `undefined` is passed, positional arguments are not allowed.
   */
  positionals?: PositionalOptions
}

export type TopLevelOptions = {
  /**
   * The name of the command
   *
   * Normally in lowercase.
   */
  name?: string
  subcommands: Record<string, SubCommandOptions>
  /**
   * The default subcommand when no subcommand was specified
   */
  defaultSubcommand?: string
  /**
   * Arguments that are available for all subcommands
   *
   * If a subcommand has the same argument name, the options in the subcommand argument are used.
   */
  globalArguments?: ArgumentOptionsRecord
  /**
   * Whether to allow kebab-case arguments to be mapped to camelCase arguments
   *
   * For example, `--foo-bar` will be allowed to be mapped to `--fooBar` when enabled.
   */
  allowKebabCaseAsCamelCaseArguments?: boolean
}

// we put the `extends false` condition first here because `undefined` compares like `any` when `strictNullChecks: false`
type IfDefaultsFalse<T, IfTrue, IfFalse> = T extends false
  ? IfFalse
  : T extends true
    ? IfTrue
    : IfFalse

type ExtractOptionValue<O extends ArgumentOptions> =
  O['type'] extends 'string|boolean'
    ? string | boolean
    : O['type'] extends 'string'
      ? string
      : O['type'] extends 'boolean'
        ? boolean
        : O['type'] extends CustomType<infer Type>
          ? O['type']['type'] extends 'string|boolean'
            ? Type | boolean
            : Type
          : unknown

type ApplyOptionalModifiers<
  O extends ArgumentOptionsRecord,
  V extends Record<keyof O, unknown>
> = { -readonly [LongOption in keyof O]?: V[LongOption] }

type ParsedValues<T extends ArgumentOptionsRecord> = ApplyOptionalModifiers<
  T,
  {
    [LongOption in keyof T]: IfDefaultsFalse<
      T[LongOption]['multiple'],
      Array<ExtractOptionValue<T[LongOption]>>,
      ExtractOptionValue<T[LongOption]>
    >
  }
>

type MergedArgumentOptionsRecord<
  T extends ArgumentOptionsRecord | undefined,
  S extends ArgumentOptionsRecord | undefined
> = Omit<S, keyof T> & T

type ParsedPositionals<T extends SubCommandOptions> =
  keyof T extends 'positionals'
    ? undefined extends T['positionals']
      ? []
      : string[]
    : string[]

export type NormalParsedResults<T extends TopLevelOptions> =
  TopLevelOptions extends T
    ? {
        type: 'normal'
        subcommand: string
        values: Record<string, unknown | undefined | unknown[]>
        positionals: string[]
      }
    : {
        [K in keyof T['subcommands']]: {
          type: 'normal'
          subcommand: K
          values: ParsedValues<
            MergedArgumentOptionsRecord<
              T['subcommands'][K]['arguments'],
              T['globalArguments']
            >
          >
          positionals: ParsedPositionals<T['subcommands'][K]>
        }
      }[keyof T['subcommands']]

type SpecialParsedResults = {
  type: 'help'
  targetSubcommand: string | undefined
  topLevelOpts: TopLevelOptions
}

export type ParsedResults<T extends TopLevelOptions> =
  | NormalParsedResults<T>
  | SpecialParsedResults
