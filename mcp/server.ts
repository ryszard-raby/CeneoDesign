import { readdir, readFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = resolve(projectRoot, 'src')
const componentRoot = resolve(sourceRoot, 'components')
const componentExtensions = new Set(['.jsx', '.tsx'])
const sourceExtensions = new Set(['.css', '.js', '.jsx', '.scss', '.ts', '.tsx'])
const styleExtensions = new Set(['.css', '.scss'])

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

function findExportedComponents(source: string): string[] {
  const declarations = source.matchAll(
    /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Z][A-Za-z0-9_]*)/g,
  )

  return Array.from(declarations, (match) => match[1])
}

const server = new McpServer({
  name: 'ceneo-design-components',
  version: '1.0.0',
})

server.registerTool(
  'list_components',
  {
    description:
      'List reusable JSX and TSX components, including their exported component names.',
    inputSchema: {},
  },
  async () => {
    const files = await findFiles(componentRoot, componentExtensions)
    const components = await Promise.all(
      files.map(async (filePath) => ({
        path: fromSourceRoot(filePath),
        exports: findExportedComponents(await readFile(filePath, 'utf8')),
      })),
    )

    return {
      content: [{ type: 'text', text: JSON.stringify(components, null, 2) }],
    }
  },
)

server.registerTool(
  'get_component_bundle',
  {
    description:
      'Get all source and style files needed to copy a named Ceneo Design component into another app.',
    inputSchema: {
      name: z.string().regex(/^[A-Z][A-Za-z0-9_]*$/).describe('Exported component name'),
    },
  },
  async ({ name }) => {
    const componentFiles = await findFiles(componentRoot, componentExtensions)
    const matchingFile = await componentFiles.reduce<Promise<string | undefined>>(
      async (result, filePath) => {
        const match = await result

        if (match) {
          return match
        }

        const source = await readFile(filePath, 'utf8')
        return findExportedComponents(source).includes(name) ? filePath : undefined
      },
      Promise.resolve(undefined),
    )

    if (!matchingFile) {
      throw new Error(`Component not found: ${name}.`)
    }

    const files = await findFiles(dirname(matchingFile), sourceExtensions)
    const bundle = {
      name,
      framework: 'preact',
      dependencies: {
        preact: '^10.0.0',
        sass: '^1.0.0',
      },
      files: await Promise.all(
        files.map(async (filePath) => ({
          path: fromSourceRoot(filePath),
          content: await readFile(filePath, 'utf8'),
        })),
      ),
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(bundle, null, 2) }],
    }
  },
)

server.registerTool(
  'read_component',
  {
    description:
      'Read a component or supporting source file. The path is relative to the src directory.',
    inputSchema: {
      path: z.string().describe('Source-relative path, for example components/Button.tsx'),
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