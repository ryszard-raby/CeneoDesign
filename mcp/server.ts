import { readdir, readFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = resolve(projectRoot, 'src')
const componentRoot = resolve(sourceRoot, 'components')
const tokenFile = resolve(sourceRoot, 'style', 'figma-variables.css')
const sourceExtensions = new Set(['.css', '.js', '.jsx', '.scss', '.ts', '.tsx'])
const styleExtensions = new Set(['.css', '.scss'])
const manifestExtensions = new Set(['.json'])
const componentSpecSchema = z
  .object({
    schemaVersion: z.number(),
    name: z.string(),
    description: z.string(),
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

function parseTokenDeclarations(block: string): TokenValues {
  return Object.fromEntries(
    Array.from(block.matchAll(/(--cd-[\w-]+)\s*:\s*([^;]+);/g), (match) => [
      match[1],
      match[2].trim(),
    ]),
  )
}

async function readDesignTokens(): Promise<DesignTokens> {
  const source = await readFile(tokenFile, 'utf8')
  const blocks = Array.from(source.matchAll(/([^{}]+)\{([^{}]*)\}/g), (match) => ({
    selector: match[1].replace(/\/\*[\s\S]*?\*\//g, '').trim(),
    values: parseTokenDeclarations(match[2]),
  }))
  const base = blocks.find(({ selector }) => selector === ':root')?.values ?? {}
  const mobile = blocks.find(({ selector }) => selector.includes('data-cd-theme="mobile"'))?.values ?? {}
  const dark = blocks.find(({ selector }) => selector.includes('data-cd-color-mode="dark"'))?.values ?? {}

  return {
    default: base,
    mobile: { ...base, ...mobile },
    dark: { ...base, ...dark },
    mobileDark: { ...base, ...mobile, ...dark },
  }
}

function tokenResponse(tokens: DesignTokens) {
  return {
    source: 'src/style/figma-variables.css',
    values: tokens,
    notes: [
      'Values are resolved from the source token file; do not infer colors from token names.',
      'The token --cd-background-backgorund contains the spelling used by the source design system.',
      'Use default for the standard light theme, dark for data-cd-color-mode="dark", and mobile for data-cd-theme="mobile".',
    ],
  }
}

const server = new McpServer({
  name: 'ceneo-design-components',
  version: '1.0.0',
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
      'Get a technology-neutral component contract to implement with the target app existing stack and no new dependencies.',
    inputSchema: {
      name: z.string().regex(/^[A-Z][A-Za-z0-9_]*$/).describe('Component name'),
      targetStack: z
        .string()
        .optional()
        .describe('Optional target stack summary, for example React with CSS Modules'),
    },
  },
  async ({ name, targetStack }) => {
    const specs = await findComponentSpecs()
    const match = specs.find(({ spec }) => spec.name === name)

    if (!match) {
      throw new Error(`Component not found: ${name}.`)
    }

    const response = {
      component: match.spec,
      designTokens: tokenResponse(await readDesignTokens()),
      implementationInstructions: {
        targetStack: targetStack ?? 'Detect from the target application.',
        dependencyPolicy: 'Do not add dependencies for this component.',
        approach: [
          'Inspect the target application conventions before writing code.',
          'Implement the contract with its existing framework, language and styling system.',
          'Reuse existing primitives and tokens where possible.',
          'Use the resolved design token values from this response; do not guess colors from token names.',
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
      'Get exact Ceneo design token values, including color values and light, dark and mobile theme overrides.',
    inputSchema: {},
  },
  async () => ({
    content: [{ type: 'text', text: JSON.stringify(tokenResponse(await readDesignTokens()), null, 2) }],
  }),
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