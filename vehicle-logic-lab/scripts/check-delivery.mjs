import assert from 'node:assert/strict'
import {readFile,readdir,stat} from 'node:fs/promises'
import {dirname,resolve,relative,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {extractFile} from '@electron/asar'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const archive=process.argv[2]
if(!archive)throw new Error('Usage: node scripts/check-delivery.mjs <built app.asar> [development URL]')
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'))
assert.equal(JSON.parse(extractFile(archive,'package.json').toString()).version,pkg.version)
let files=0
async function walk(folder){for(const name of await readdir(folder)){const path=resolve(folder,name);if((await stat(path)).isDirectory())await walk(path);else{const key=relative(root,path);assert.deepEqual(extractFile(archive,key),await readFile(path),key);files++}}}
await walk(resolve(root,'dist'))
assert.ok(extractFile(archive,join('dist','art','system-atlas-v7.png')).length>100_000)
const exe=resolve(root,'release',`Vehicle-Logic-Lab-v${pkg.version}.exe`)
assert.ok((await stat(exe)).size>100_000_000)
console.log(`PASS: portable v${pkg.version} exists; all ${files} dist files match app.asar byte for byte, including the atlas and lazy engineering module.`)
if(process.argv[3]){
 const origin=new URL(process.argv[3]).origin
 for(let pass=1;pass<=2;pass++){
  const pending=['/src/main.tsx','/src/game/SystemStudio.tsx'],seen=new Set()
  while(pending.length){const path=pending.shift();if(seen.has(path))continue;seen.add(path);if(seen.size>300)throw new Error('Unexpected module graph size')
   const response=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(15000)})
   assert.equal(response.status,200,path)
   const code=await response.text();assert.ok(!/Outdated Optimize Dep|Failed to resolve import|<title>Internal Server Error/.test(code),path)
   for(const m of code.matchAll(/\b(?:from\s*|import\s*\(?\s*)["'](\/[^"']+)["']/g))if(!seen.has(m[1]))pending.push(m[1])
  }
  const art=await fetch(new URL('/art/system-atlas-v7.png',origin));assert.equal(art.status,200);assert.ok((await art.arrayBuffer()).byteLength>100000)
  console.log(`PASS: live module graph ${pass}/2, ${seen.size} modules and atlas responded HTTP 200. Not a browser playthrough.`)
 }
}
