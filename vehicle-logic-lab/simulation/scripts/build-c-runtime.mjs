import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import console from 'node:console'
const root = path.resolve(import.meta.dirname, '..')
const compiler = process.env.TRACKBACK_ZIG ?? path.join(root, '.tools', 'zig-x86_64-windows-0.14.1', 'zig.exe')
if (!existsSync(compiler)) throw new Error('Install Zig 0.14.1 locally or set TRACKBACK_ZIG to its executable. See docs/C_REFERENCE_RUNTIME_PLAN.md.')
const version = spawnSync(compiler,['version'],{encoding:'utf8'}).stdout?.trim()
if (version !== '0.14.1') throw new Error(`Expected Zig 0.14.1, got ${version}`)
const sources = ['gear.c','propulsion.c','vmc.c','edrive.c','core.c','wasm_bridge.c'].map(f => `c/vehicle_sw/${f}`)
const exports = ['tb_abi','tb_input_count','tb_output_count','tb_calibration_count','tb_input','tb_output','tb_calibration','tb_init','tb_reset','tb_step','tb_test_vmc','tb_test_edrive','tb_case_variant']
mkdirSync(path.join(root,'src/runtime/c/generated'), { recursive: true })
const args = ['cc','-target','wasm32-freestanding','-std=c11','-O2','-Wall','-Wextra','-Werror','-nostdlib','-fno-builtin',
  '-Wl,--no-entry','-Wl,--export-memory',...exports.map(n=>`-Wl,--export=${n}`),...sources,'-o','src/runtime/c/generated/vehicle-sw.wasm']
const result = spawnSync(compiler,args,{cwd:root,stdio:'inherit',env:{...process.env,ZIG_GLOBAL_CACHE_DIR:path.join(root,'.tools/zig-cache')}})
if (result.status !== 0) process.exit(result.status ?? 1)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const sourceHash = hash([...sources,'c/vehicle_sw/trackback.h'].map(f=>readFileSync(path.join(root,f),'utf8').replaceAll('\r\n','\n')).join(''))
const binaryHash = hash(readFileSync(path.join(root,'src/runtime/c/generated/vehicle-sw.wasm')))
writeFileSync(path.join(root,'src/runtime/c/generated/build.json'),JSON.stringify({ compiler:'Zig 0.14.1 / Clang', abi:1,sourceHash,binaryHash,args },null,2)+'\n')
console.log(`Built Vehicle SW ABI 1: ${binaryHash}`)
