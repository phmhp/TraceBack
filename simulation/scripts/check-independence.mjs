import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const projectRoot = path.resolve(process.cwd())
const sourceRoot = path.join(projectRoot, 'src')
const errors = []

async function walk(directory) {
  const entries = await readdir(directory)
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry)
    const info = await stat(absolute)
    if (info.isDirectory()) files.push(...await walk(absolute))
    else files.push(absolute)
  }
  return files
}

for (const file of await walk(sourceRoot)) {
  if (!/\.(?:ts|tsx|js|jsx|css)$/.test(file)) continue
  const content = await readFile(file, 'utf8')
  const importPattern = /(?:from\s+|import\s*\()['"]([^'"]+)['"]/g
  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1]
    if (!specifier.startsWith('.')) continue
    const resolved = path.resolve(path.dirname(file), specifier)
    if (resolved !== projectRoot && !resolved.startsWith(`${projectRoot}${path.sep}`)) {
      errors.push(`${path.relative(projectRoot, file)} escapes project root: ${specifier}`)
    }
  }

  const forbiddenReferences = [
    /TraceBack[\\/]src/i,
    /TraceBack[\\/]public/i,
    /D:[\\/]/i,
  ]
  for (const pattern of forbiddenReferences) {
    if (pattern.test(content)) errors.push(`${path.relative(projectRoot, file)} contains forbidden parent/local reference: ${pattern}`)
  }
}

if (errors.length > 0) {
  process.stderr.write('TRACKBACK V2 independence check failed:\n')
  for (const error of errors) process.stderr.write(`- ${error}\n`)
  process.exit(1)
}

process.stdout.write('TRACKBACK V2 independence check passed: no source import escapes the project root.\n')
