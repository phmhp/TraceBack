import test from 'node:test'
import assert from 'node:assert/strict'
import {startNewCampaign,previousStage,revisitStage} from '../src/campaign/menu.ts'
import {CAMPAIGN_KEY,newCampaign,buyStarter,breakDown,STAGES} from '../src/campaign/model.ts'

test('Start creates a new prologue, backs up the previous campaign, and leaves other projects alone',()=>{
 const original=JSON.stringify({...newCampaign(),stage:'repair',wallet:10})
 const values=new Map([[CAMPAIGN_KEY,original],['unrelated-project','untouched']])
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}
 const fresh=startNewCampaign(storage)
 assert.equal(fresh.stage,'dream');assert.equal(fresh.wallet,40)
 assert.equal(values.get(CAMPAIGN_KEY),JSON.stringify(fresh))
 assert.equal(values.get('unrelated-project'),'untouched')
 assert.ok([...values].some(([k,v])=>k.startsWith(CAMPAIGN_KEY+'.backup.')&&v===original))
 startNewCampaign(storage)
 assert.equal([...values.keys()].filter(k=>k.startsWith(CAMPAIGN_KEY+'.backup.')).length,2)
})

test('backup denial aborts a fresh start without replacing existing progress',()=>{
 const original='previous-game',writes=[]
 const storage={getItem:k=>k===CAMPAIGN_KEY?original:null,setItem:(k,v)=>{writes.push([k,v]);throw Error('quota')}}
 assert.throws(()=>startNewCampaign(storage),/quota/)
 assert.equal(writes.length,1);assert.ok(writes[0][0].startsWith(CAMPAIGN_KEY+'.backup.'))
 assert.equal(storage.getItem(CAMPAIGN_KEY),original)
})

test('back routes cover all stages; revisiting does not undo the car or charge/reward twice',()=>{
 const c=newCampaign();assert.equal(previousStage(c),null)
 for(const stage of STAGES.filter(s=>s!=='dream')){const prior=previousStage({...c,stage});assert.ok(STAGES.includes(prior));assert.notEqual(prior,stage)}
 let bought=buyStarter({...c,stage:'purchase'})
 const revisited=buyStarter(revisitStage(bought,'purchase'))
 assert.equal(revisited.stage,'shakedown');assert.equal(revisited.wallet,10)
 assert.deepEqual(revisited.owned,['scrap'])
 const broken=breakDown(bought),repaired={...broken,clue:true,lessons:[broken.record.graph],wallet:170,rewarded:true}
 const replay=breakDown(revisitStage(repaired,'shakedown'))
 assert.equal(replay.stage,'fault');assert.equal(replay.record,repaired.record)
 assert.equal(replay.lessons,repaired.lessons);assert.equal(replay.wallet,170);assert.equal(replay.rewarded,true)
 for(const stage of ['repair','inspect','fault','principle','bench','grid']){const v=revisitStage(repaired,stage);assert.equal(v.record,repaired.record);assert.equal(v.lessons,repaired.lessons);assert.equal(v.wallet,170)}
})
