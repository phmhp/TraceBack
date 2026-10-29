import { mkdtempSync, mkdirSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const require=createRequire(import.meta.url)
// Extract outside OneDrive: its file locking can prevent Electron's staging rename.
const staging=mkdtempSync(join(tmpdir(),'vehicle-logic-lab-build-'))
const cli=require.resolve('electron-builder/cli.js')
const run=spawnSync(process.execPath,[cli,'--win','portable','--x64','--publish','never',`--config.directories.output=${staging}`],{cwd:root,stdio:'inherit'})
if(run.status!==0){console.error(`Build staging retained for diagnostics: ${staging}`);process.exit(run.status??1)}
mkdirSync(join(root,'release'),{recursive:true})
const version=require('../package.json').version
const destination=join(root,'release',`Vehicle-Logic-Lab-v${version}.exe`)
copyFileSync(join(staging,'Vehicle-Logic-Lab.exe'),destination)
console.log(`Windows game ready: ${destination}`)
