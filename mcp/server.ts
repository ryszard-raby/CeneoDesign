import { readdir, readFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = resolve(projectRoot, 'src')
const componentRoot = resolve(sourceRoot, 'components')
const readmeFile = resolve(projectRoot, 'README.md')
const allComponentStylesFile = resolve(sourceRoot, 'theme', 'components.css')
const tokenFiles = [
  resolve(sourceRoot, 'theme', 'figma-variables.css'),
]
const styleExtensions = new Set(['.css', '.scss'])
const manifestExtensions = new Set(['.json'])
const componentSpecSchema = z.object({
  schemaVersion: z.number(),
  name: z.string(),
  description: z.string(),
  example: z.string(),
  stylePath: z.string(),
  classes: z.array(z.string()),
  variants: z.record(z.string(), z.object({
    values: z.array(z.string()),
    classPattern: z.string(),
    default: z.unknown().optional(),
  })),
  requiredAttributes: z.array(z.string()).optional(),
  attributes: z.array(z.record(z.string(), z.unknown())).optional(),
})

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
    notes: [
      'The token --cd-background-backgorund contains the spelling used by the source design system.',
      'Use default for the standard light theme, dark for data-cd-color-mode="dark", and mobile for data-cd-theme="mobile".',
    ],
  }
}

const server = new McpServer({
  name: 'ceneo-design-components',
  version: '1.7.0',
})

server.registerTool(
  'get_started',
  {
    description:
      'REQUIRED FIRST STEP. Read the Ceneo Design usage guide and download the complete CSS variables file before looking up component usage.',
    inputSchema: {},
  },
  async () => {
    const [readme, tokenDocument] = await Promise.all([
      readFile(readmeFile, 'utf8'),
      readDesignTokenDocument(),
    ])

    const response = {
      instruction: 'Read the guide and copy the complete CSS file before requesting component usage.',
      guide: {
        path: 'README.md',
        content: readme,
      },
      designTokens: tokenResponse(tokenDocument),
      nextSteps: [
        'Apply the complete cssFile.content in the target application.',
        'Call components_list.',
        'Call component_spec with the selected component name to get its example, classes and variants.',
      ],
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
    }
  },
)

server.registerTool(
  'components_list',
  {
    description:
      'After get_started, list the available components and their default usage examples.',
    inputSchema: {},
  },
  async () => {
    const specs = await findComponentSpecs()
    const components = specs.map(({ spec }) => ({
      name: spec.name,
      description: spec.description,
      example: spec.example,
    }))

    return {
      content: [{ type: 'text', text: JSON.stringify(components, null, 2) }],
    }
  },
)

server.registerTool(
  'component_spec',
  {
    description:
      'Call get_started first. Component names are matched without case sensitivity. Return the component usage example, available CSS classes, and class-backed variants. The component styles should already be present in the client project; use this as a usage reference, not an implementation contract.',
    inputSchema: {
      name: z.string().trim().min(1).describe('Component name; matching ignores letter case.'),
    },
  },
  async ({ name }) => {
    const specs = await findComponentSpecs()
    const normalizedName = name.trim().toLowerCase()
    const match = specs.find(({ spec }) => spec.name.toLowerCase() === normalizedName)

    if (!match) {
      throw new Error(`Component not found: ${name}.`)
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(match.spec, null, 2) }],
    }
  },
)

server.registerTool(
  'component_styles',
  {
    description:
      'Call get_started first. With no arguments, return the single bundled CSS file for every component. Pass a component name to return only its compiled CSS. Theme variables are provided only by get_started.',
    inputSchema: {
      component: z.string().trim().min(1).optional().describe('Optional component name; matching ignores letter case. Omit to return styles for all components.'),
    },
  },
  async ({ component }) => {
    if (!component) {
      const source = await readFile(allComponentStylesFile, 'utf8')
      return {
        content: [{ type: 'text', text: `/* src/${fromSourceRoot(allComponentStylesFile)} */\n${source}` }],
      }
    }

    const specs = await findComponentSpecs()
    const normalizedName = component.trim().toLowerCase()
    const selected = specs.filter(({ spec }) => spec.name.toLowerCase() === normalizedName)

    if (selected.length === 0) {
      throw new Error(`Component not found: ${component}. Available components: ${specs.map(({ spec }) => spec.name).join(', ')}.`)
    }

    const styles = await Promise.all(selected.map(async ({ spec }) => {
      const filePath = resolveSourceFile(spec.stylePath, styleExtensions)
      const source = await readFile(filePath, 'utf8')
      return { type: 'text' as const, text: `/* src/${fromSourceRoot(filePath)} */\n${source}` }
    }))

    return { content: styles }
  },
)

const transport = new StdioServerTransport()

await server.connect(transport)
