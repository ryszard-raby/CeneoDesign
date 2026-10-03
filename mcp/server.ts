import { readdir, readFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = resolve(projectRoot, 'src')
const componentRoot = resolve(sourceRoot, 'components')
const tokenFiles = [
  resolve(sourceRoot, 'theme', 'figma-variables.css'),
  resolve(sourceRoot, 'style', 'figma-variables.css'),
]
const sourceExtensions = new Set(['.css', '.js', '.jsx', '.scss', '.ts', '.tsx'])
const styleExtensions = new Set(['.css', '.scss'])
const manifestExtensions = new Set(['.json'])
const componentSpecSchema = z
  .object({
    schemaVersion: z.number(),
    name: z.string(),
    description: z.string(),
    naming: z.object({
      cssClassPrefix: z.literal('cd-'),
      baseClass: z.string().regex(/^cd-[a-z0-9]+(?:-[a-z0-9]+)*$/),
    }),
  })
  .passthrough()

async function findFiles(directory: string, extensions: Set<string>): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .map(async (entry) => {
        const entryPath = resolve(directory, entry.name)

        if (entry.isDirectory()) {
          return findFiles(entryPath, extensions)
        }

        return extensions.has(extname(entry.name)) ? [entryPath] : []
      }),
  )

  return files.flat().sort()
}

function fromSourceRoot(filePath: string): string {
  return relative(sourceRoot, filePath).split(sep).join('/')
}

function resolveSourceFile(requestedPath: string, extensions: Set<string>): string {
  const filePath = resolve(sourceRoot, requestedPath)
  const relativePath = relative(sourceRoot, filePath)

  if (!requestedPath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error('Path must point to a file inside src.')
  }

  if (!extensions.has(extname(filePath))) {
    throw new Error(`Unsupported file type: ${extname(filePath) || '(none)'}.`)
  }

  return filePath
}

async function findComponentSpecs() {
  const files = await findFiles(componentRoot, manifestExtensions)

  return Promise.all(
    files
      .filter((filePath) => basename(filePath) === 'component.json')
      .map(async (filePath) => ({
        path: fromSourceRoot(filePath),
        spec: componentSpecSchema.parse(JSON.parse(await readFile(filePath, 'utf8'))),
      })),
  )
}

type TokenValues = Record<string, string>

interface DesignTokens {
  default: TokenValues
  mobile: TokenValues
  dark: TokenValues
  mobileDark: TokenValues
}

interface DesignTokenDocument extends DesignTokens {
  filePath: string
  source: string
}

function parseTokenDeclarations(block: string): TokenValues {
  return Object.fromEntries(
    Array.from(block.matchAll(/(--cd-[\w-]+)\s*:\s*([^;]+);/g), (match) => [
      match[1],
      match[2].trim(),
    ]),
  )
}

async function readDesignTokenDocument(): Promise<DesignTokenDocument> {
  let source: string | undefined
  let filePath: string | undefined

  for (const candidate of tokenFiles) {
    try {
      source = await readFile(candidate, 'utf8')
      filePath = candidate
      break
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  if (!source || !filePath) {
    throw new Error(`Design token file not found. Checked: ${tokenFiles.join(', ')}`)
  }

  const blocks = Array.from(source.matchAll(/([^{}]+)\{([^{}]*)\}/g), (match) => ({
    selector: match[1].replace(/\/\*[\s\S]*?\*\//g, '').trim(),
    values: parseTokenDeclarations(match[2]),
  }))
  const base = blocks.find(({ selector }) => selector === ':root')?.values ?? {}
  const mobile = blocks.find(({ selector }) => selector.includes('data-cd-theme="mobile"'))?.values ?? {}
  const dark = blocks.find(({ selector }) => selector.includes('data-cd-color-mode="dark"'))?.values ?? {}

  return {
    filePath: fromSourceRoot(filePath),
    source,
    default: base,
    mobile: { ...base, ...mobile },
    dark: { ...base, ...dark },
    mobileDark: { ...base, ...mobile, ...dark },
  }
}

function tokenResponse(document: DesignTokenDocument) {
  return {
    source: document.filePath,
    cssFile: {
      path: document.filePath,
      content: document.source,
      instruction: 'Copy this complete CSS file to the client so all design tokens and theme selectors are preserved.',
    },
    values: {
      default: document.default,
      mobile: document.mobile,
      dark: document.dark,
      mobileDark: document.mobileDark,
    },
    notes: [
      'Values are resolved from the source token file; do not infer colors from token names.',
      'The token --cd-background-backgorund contains the spelling used by the source design system.',
      'Use default for the standard light theme, dark for data-cd-color-mode="dark", and mobile for data-cd-theme="mobile".',
    ],
  }
}

function resolveTokenValue(value: unknown, tokens: TokenValues): unknown {
  if (typeof value !== 'string') {
    return value
  }

  if (tokens[value]) {
    return tokens[value]
  }

  return value.replace(/var\((--cd-[\w-]+)\)/g, (reference, tokenName: string) => {
    return tokens[tokenName] ?? reference
  })
}

function resolveVisualStyles(visual: unknown, tokens: TokenValues): unknown {
  if (Array.isArray(visual)) {
    return visual.map((value) => resolveVisualStyles(value, tokens))
  }

  if (visual && typeof visual === 'object') {
    return Object.fromEntries(
      Object.entries(visual).map(([key, value]) => {
        const resolvedKey = key.endsWith('Token') ? key.slice(0, -5) : key
        return [resolvedKey, resolveVisualStyles(value, tokens)]
      }),
    )
  }

  return resolveTokenValue(visual, tokens)
}

function resolvedStyles(spec: Record<string, unknown>, tokens: DesignTokens) {
  return {
    instruction:
      'Use these resolved values directly. Do not ask the user to provide colors or infer them from token names.',
    source: 'src/theme/figma-variables.css',
    themes: Object.fromEntries(
      Object.entries(tokens).map(([theme, values]) => [
        theme,
        resolveVisualStyles(spec.visual, values),
      ]),
    ),
  }
}

const server = new McpServer({
  name: 'ceneo-design-components',
  version: '1.5.0',
})

server.registerTool(
  'list_components',
  {
    description:
      'List reusable components that have technology-neutral implementation specifications.',
    inputSchema: {},
  },
  async () => {
    const specs = await findComponentSpecs()
    const components = specs.map(({ path, spec }) => ({
      name: spec.name,
      description: spec.description,
      specPath: path,
      cssClassPrefix: spec.naming.cssClassPrefix,
      baseClass: spec.naming.baseClass,
    }))

    return {
      content: [{ type: 'text', text: JSON.stringify(components, null, 2) }],
    }
  },
)

server.registerTool(
  'get_component_spec',
  {
    description:
      'Get a component contract that MUST be implemented as a reusable native component of the required client framework or application stack, using the required cd- CSS class prefix, with exact resolved styles, colors, and the complete design token CSS file. The client stack is required. Do not return a plain HTML snippet, standalone script, or source from another framework.',
    inputSchema: {
      name: z.string().regex(/^[A-Z][A-Za-z0-9_]*$/).describe('Component name'),
      targetStack: z
        .string()
        .min(1)
        .describe('Required client framework and styling stack, for example React with CSS Modules or ASP.NET Core Razor with scoped CSS'),
    },
  },
  async ({ name, targetStack }) => {
    const specs = await findComponentSpecs()
    const match = specs.find(({ spec }) => spec.name === name)

    if (!match) {
      throw new Error(`Component not found: ${name}.`)
    }

    const tokenDocument = await readDesignTokenDocument()
    const response = {
      component: match.spec,
      resolvedStyles: resolvedStyles(match.spec, tokenDocument),
      designTokens: tokenResponse(tokenDocument),
      implementationInstructions: {
        targetStack,
        frameworkComponent: {
          required: true,
          deliverable: `Create a reusable component implemented natively in ${targetStack}.`,
          preserve: [
            'Use the client framework component model, lifecycle and prop/input conventions.',
            'Use the client framework rendering and event-binding APIs.',
            'Integrate with the client application styling system.',
            'Export or register the component according to the client application conventions.',
          ],
          forbidden: [
            'Do not return a plain HTML snippet as the component implementation.',
            'Do not create a standalone JavaScript widget outside the client framework.',
            'Do not copy the Preact implementation when the client uses another framework.',
            'Do not install another framework or dependencies solely to host this component.',
          ],
        },
        naming: {
          required: true,
          cssClassPrefix: match.spec.naming.cssClassPrefix,
          baseClass: match.spec.naming.baseClass,
          rules: [
            'Use the baseClass on the component root element or host element.',
            'Prefix every component-owned CSS class and selector with cssClassPrefix.',
            'Keep modifier and state classes prefixed, for example cd-button--small or cd-button:focus-visible.',
            'Do not use an unprefixed component class such as button, card, container, icon or layout.',
          ],
        },
        dependencyPolicy: 'Do not add dependencies for this component.',
        approach: [
          'Inspect the target application conventions before writing code.',
          'Implement and expose the component using the required client framework, language and styling system.',
          'Reuse existing primitives and tokens where possible.',
          'Use resolvedStyles from this response directly; do not ask the user for colors or guess them from token names.',
          'Adapt prop names to local conventions while preserving behavior and accessibility.',
          'Validate with the target application build and relevant tests.',
        ],
      },
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    }
  },
)

server.registerTool(
  'get_design_tokens',
  {
    description:
      'Get the complete Ceneo figma-variables.css file plus parsed values for light, dark and mobile themes. Copy the full CSS file to the client.',
    inputSchema: {},
  },
  async () => {
    const tokenDocument = await readDesignTokenDocument()

    return {
      content: [{ type: 'text', text: JSON.stringify(tokenResponse(tokenDocument), null, 2) }],
    }
  },
)

server.registerTool(
  'read_component',
  {
    description:
      'Read framework-specific reference source only when implementation detail is needed. Prefer get_component_spec for use in another app.',
    inputSchema: {
      path: z.string().describe('Source-relative path, for example components/Button/button.tsx'),
    },
  },
  async ({ path }) => {
    const filePath = resolveSourceFile(path, sourceExtensions)
    const source = await readFile(filePath, 'utf8')

    return {
      content: [{ type: 'text', text: `// src/${fromSourceRoot(filePath)}\n${source}` }],
    }
  },
)

server.registerTool(
  'read_styles',
  {
    description:
      'Read a CSS or SCSS file with the design tokens and styles used by the components.',
    inputSchema: {
      path: z.string().default('styles.scss').describe('Style path relative to src'),
    },
  },
  async ({ path }) => {
    const filePath = resolveSourceFile(path, styleExtensions)
    const source = await readFile(filePath, 'utf8')

    return {
      content: [{ type: 'text', text: `/* src/${fromSourceRoot(filePath)} */\n${source}` }],
    }
  },
)

const transport = new StdioServerTransport()

await server.connect(transport)