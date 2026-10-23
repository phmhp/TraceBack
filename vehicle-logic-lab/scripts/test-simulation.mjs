import {spawnSync} from 'node:child_process'
import {dirname,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
const cwd=resolve(dirname(fileURLToPath(import.meta.url)),'../simulation')
const result=spawnSync(process.execPath,['--test','tests/*.test.mjs'],{cwd,stdio:'inherit'})
process.exitCode=result.status??1
