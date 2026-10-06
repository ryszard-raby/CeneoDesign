import { readdir, writeFile } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'sass'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const componentRoot = resolve(projectRoot, 'src', 'components')
const allStyles: string[] = []

const componentDirectories = (await readdir(componentRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .sort((left, right) => left.name.localeCompare(right.name))

for (const entry of componentDirectories) {
  const directory = resolve(componentRoot, entry.name)
  const entries = await readdir(directory, { withFileTypes: true })
  const source = entries.find((file) => file.isFile() && extname(file.name) === '.scss')
  if (!source) continue

  const sourcePath = resolve(directory, source.name)
  const outputPath = resolve(directory, `${basename(source.name, '.scss')}.css`)
  const result = compile(sourcePath, { style: 'expanded', sourceMap: false })
  await writeFile(outputPath, result.css)
  allStyles.push(`/* ${entry.name} */\n${result.css.trim()}`)
}

await writeFile(resolve(projectRoot, 'src', 'theme', 'components.css'), `${allStyles.join('\n\n')}\n`)
