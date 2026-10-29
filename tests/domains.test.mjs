import test from 'node:test'
import assert from 'node:assert/strict'
import {ASSEMBLY_KITS,kitComplete,kitForPart} from '../src/campaign/domains.ts'
import {BUILD_PARTS,mountAndConnect,buildReady} from '../src/campaign/build.ts'
import {newCampaign,buyStarter,breakDown} from '../src/campaign/model.ts'
test('six functional kits cover the same fifteen actual devices without duplicates, and wheel montage installs four real records',()=>{
 const ids=ASSEMBLY_KITS.flatMap(k=>k.parts)
 assert.equal(new Set(ids).size,15);assert.deepEqual([...ids].sort(),BUILD_PARTS.map(p=>p.id).sort())
 let c=breakDown(buyStarter({...newCampaign(),stage:'purchase'}))
 for(const kit of ASSEMBLY_KITS){assert.equal(kitComplete(kit,c.record.assembly),false);for(const id of kit.parts)c=mountAndConnect(c,id);assert.equal(kitComplete(kit,c.record.assembly),true)}
 assert.equal(buildReady(c),true);assert.equal(c.record.cables.length,6)
 assert.equal(kitForPart('vcu').id,'control');assert.equal(kitForPart('frontRight').id,'wheels')
 assert.equal(ASSEMBLY_KITS.find(k=>k.id==='wheels').parts.length,4)
})
