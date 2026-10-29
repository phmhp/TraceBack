import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
const version=createRequire(import.meta.url)('../package.json').version
const executable=resolve(dirname(fileURLToPath(import.meta.url)),`../release/Vehicle-Logic-Lab-v${version}.exe`)
if(!existsSync(executable)){console.error('먼저 npm run package:win 으로 Windows 게임을 빌드해 주세요.');process.exit(1)}
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE
const child=spawn(executable,[],{cwd:dirname(executable),env,detached:true,stdio:'ignore'})
child.on('error',error=>{console.error(`게임 실행 실패: ${error.message}`);process.exitCode=1})
child.unref()
