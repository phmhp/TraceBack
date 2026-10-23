import {CAMPAIGN_KEY,newCampaign} from './model.ts'
import type {Campaign,Stage} from './model.ts'

type Storage={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void}

// Back up before replacing anything. A failed backup must never erase the old game.
export function startNewCampaign(storage:Storage):Campaign{
 const prior=storage.getItem(CAMPAIGN_KEY)
 if(prior!==null){
  const base=`${CAMPAIGN_KEY}.backup.${Date.now()}`
  let key=base,index=0
  while(storage.getItem(key)!==null)key=`${base}.${++index}`
  storage.setItem(key,prior)
 }
 const fresh=newCampaign()
 storage.setItem(CAMPAIGN_KEY,JSON.stringify(fresh))
 return fresh
}

// Revisit a screen, not undo the car: hardware, wiring, money and rewards survive.
export function previousStage(c:Campaign):Stage|null{
 const previous:Record<Stage,Stage|null>={dream:null,purchase:'dream',shakedown:'purchase',fault:'shakedown',inspect:'fault',repair:'inspect',principle:'repair',component:'repair',restore:'component',puzzle:'principle',bench:'puzzle',grid:'bench',race:'grid',finish:'grid',garage:c.lastRace?'finish':'grid'}
 return previous[c.stage]
}

export function revisitStage(c:Campaign,stage:Stage):Campaign{
 return {...c,stage,...(stage==='puzzle'&&c.lessons.length===3?{lessons:c.lessons.slice(0,2),bench:'',record:{...c.record,certificate:''}}:{})}
}
