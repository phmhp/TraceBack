import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = path => readFile(new URL(path, import.meta.url), 'utf8')

test('new game is the primary entry, not a redirect into the legacy campaign', async () => {
  const game = await source('../src/game/Game.tsx')
  assert.match(game, /className="big-button" onClick=\{start\}>새 모험 시작/)
  assert.match(game, /const start=\(\)=>\{[\s\S]*?setScene\('intro'\)/)
  assert.doesNotMatch(game, /CampaignHost|setCampaign|<iframe|선택 학습|본편 시작/)
  for (const scene of ['intro', 'arrival', 'garage', 'observe', 'inside', 'build', 'test', 'reward']) {
    assert.ok(game.includes(`scene==='${scene}'`), scene)
  }
})

test('original cat asset stays in the new game without replacing the polished garage', async () => {
  const characters = await source('../src/game/Characters.tsx')
  assert.match(characters, /export function CatFace[\s\S]*?src="\.\/assets\/investigation\/cat-face\.png"/)
  const cat = await readFile(new URL('../public/assets/investigation/cat-face.png', import.meta.url))
  assert.equal(cat.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.match(await source('../src/game/WorldBackdrop.tsx'), /momo-garage-v5\.png/)
})
