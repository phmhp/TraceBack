import wasmUrl from '../../../simulation/src/runtime/c/generated/vehicle-sw.wasm?url&inline'
let compiled: Promise<WebAssembly.Module> | undefined
export function compileDrivingSw() {
  return compiled ??= WebAssembly.compile(Uint8Array.from(atob(wasmUrl.slice(wasmUrl.indexOf(',') + 1)), c => c.charCodeAt(0)))
}
