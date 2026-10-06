import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const componentRoot = resolve(projectRoot, 'src', 'components')

type SourceSpec = {
  schemaVersion: number
  name: string
  description: string
  naming: { cssClassPrefix: string; baseClass: string }
  semantics?: Record<string, unknown>
  props?: Array<{ name: string; type?: string; required?: boolean; default?: unknown; description?: string }>
}

const examples: Record<string, string> = {
  Button: '<button type="button" class="cd-button cd-button--{variant} cd-button--{size}"><span class="cd-button__label">Button</span></button>',
  Card: '<div class="cd-card cd-card--{cardStyle}">...</div>',
  Container: '<div class="cd-container cd-container--{direction}">...</div>',
  Icon: '<img class="cd-icon" src="/icons/Search.svg" width="24" height="24" alt="" aria-hidden="true" />',
  Input: '<input type="text" class="cd-input" placeholder="Placeholder" />',
  Label: '<span class="cd-label cd-label--{variant}"><span class="cd-label__text">Label</span></span>',
  Layout: '<div class="cd-layout">...</div>',
  Price: '<span class="cd-price"><span class="cd-price__prefix">od</span><span class="cd-price__amount">2 400</span><span class="cd-price__suffix">,00 zł</span></span>',
  Rating: '<span class="cd-rating cd-rating--{size}">...</span>',
  Text: '<span class="cd-text cd-text--{size} cd-text--{weight}">Text</span>',
  UiElement: '<img class="cd-ui-element cd-ui-element--logo" src="/ui elements/logo.svg" alt="" aria-hidden="true" />',
}

function stringUnion(source: string): string[] {
  return Array.from(source.matchAll(/'([^']+)'/g), (match) => match[1])
}

function classPattern(source: string, propName: string): string | undefined {
  const escapedName = propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = source.match(new RegExp('`(cd-[^`]*\\$\\{' + escapedName + '\\}[^`]*)`'))
  return match?.[1].replace('${' + propName + '}', '{value}')
}

function extractVariants(source: string, spec: SourceSpec) {
  const aliases = new Map<string, string[]>()
  for (const match of source.matchAll(/export\s+type\s+(\w+)\s*=\s*([^\n;]+)/g)) {
    const values = stringUnion(match[2])
    if (values.length) aliases.set(match[1], values)
  }

  const interfaceBlock = source.match(/export\s+interface\s+\w+Props[^\{]*\{([\s\S]*?)\n\}/)?.[1] ?? ''
  const variants: Record<string, { values: string[]; classPattern: string; default?: unknown }> = {}
  for (const match of interfaceBlock.matchAll(/^\s*(\w+)\??:\s*(\w+)\s*[,;]?\s*$/gm)) {
    const [, propName, typeName] = match
    const values = aliases.get(typeName)
    const pattern = classPattern(source, propName)
    if (values && pattern) {
      const specProp = spec.props?.find((prop) => prop.name === propName)
      variants[propName] = {
        values,
        classPattern: pattern,
        ...(specProp?.default !== undefined ? { default: specProp.default } : {}),
      }
    }
  }
  return variants
}

function deriveClasses(source: string, baseClass: string, variants: ReturnType<typeof extractVariants>) {
  const classes = new Set<string>([baseClass])
  for (const match of source.matchAll(/(cd-[a-z0-9_-]+)/g)) {
    if (!match[1].endsWith('--')) classes.add(match[1])
  }
  for (const variant of Object.values(variants)) {
    for (const value of variant.values) classes.add(variant.classPattern.replace('{value}', value))
  }
  return [...classes]
}

function compactManifest(spec: SourceSpec, source: string, stylePath: string) {
  const variants = extractVariants(source, spec)
  const example = (examples[spec.name] ?? `<${String(spec.semantics?.element ?? 'div')} class="${spec.naming.baseClass}">...</${String(spec.semantics?.element ?? 'div')}>`)
    .replace(/\{(\w+)\}/g, (_, propName: string) => String(variants[propName]?.default ?? ''))
  const attributes = (spec.props ?? [])
    .filter((prop) => !variants[prop.name] && !['children', 'content', 'iconStart', 'iconEnd'].includes(prop.name))
    .map(({ name, type, required, default: defaultValue }) => {
      const typeOptions = type?.split('|').map((value) => value.trim())
      const isPrimitiveUnion = typeOptions?.every((value) => ['string', 'number', 'boolean'].includes(value))
      return {
        name,
        ...(type ? (typeOptions && typeOptions.length > 1 && !isPrimitiveUnion
          ? { values: typeOptions }
          : { type }) : {}),
        ...(required ? { required: true } : {}),
        ...(defaultValue !== undefined ? { default: defaultValue } : {}),
      }
    })
  return {
    schemaVersion: 1,
    name: spec.name,
    description: spec.description,
    example,
    stylePath,
    classes: deriveClasses(source, spec.naming.baseClass, variants),
    variants,
    ...(attributes.length ? { attributes } : {}),
  }
}

for (const entry of await readdir(componentRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const directory = resolve(componentRoot, entry.name)
  const sourcePath = resolve(directory, 'component.definition.json')
  const componentPath = resolve(directory, `${entry.name}.tsx`)
  const [specText, componentSource] = await Promise.all([
    readFile(sourcePath, 'utf8'),
    readFile(componentPath, 'utf8'),
  ])
  const spec = JSON.parse(specText) as SourceSpec
  const manifest = compactManifest(spec, componentSource, `components/${entry.name}/${entry.name}.css`)
  await writeFile(resolve(directory, 'component.json'), `${JSON.stringify(manifest, null, 2)}\n`)
}
