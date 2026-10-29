import { readdir, readFile, lstat } from 'node:fs/promises'
import { resolve, dirname, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const faults = []
const inRoot = path => { const rel = relative(root, path); return rel !== '..' && !rel.startsWith(`..\\`) && !rel.startsWith('../') && !isAbsolute(rel) }
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'release', '.git'].includes(entry.name)) continue
    const path = resolve(dir, entry.name)
    if ((await lstat(path)).isSymbolicLink()) { faults.push(`Symlink: ${path}`); continue }
    if (entry.isDirectory()) { await walk(path); continue }
    if (!/\.(tsx?|css|html|mjs|cjs)$/.test(path)) continue
    const text = await readFile(path, 'utf8')
    const imports = [...text.matchAll(/(?:from\s*|import\s*\(|import\s*)['"]([^'"]+)['"]/g)].map(m => m[1])
    for (const name of imports) if (name.startsWith('.') && !inRoot(resolve(dirname(path), name))) faults.push(`Outside import: ${relative(root, path)} -> ${name}`)
    if (relative(root, path).startsWith('src') && /(?:https?:\/\/|file:\/\/|[A-Z]:[\\/])/i.test(text)) faults.push(`External runtime location: ${path}`)
  }
}
await walk(root)
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
for (const spec of Object.values({ ...pkg.dependencies, ...pkg.devDependencies })) if (/^(file:|link:|workspace:)/.test(spec)) faults.push(`Local package dependency: ${spec}`)
if (faults.length) { console.error(faults.join('\n')); process.exitCode = 1 }
else console.log('Independent project: imports, assets, scripts and package dependencies stay inside the project boundary.')
