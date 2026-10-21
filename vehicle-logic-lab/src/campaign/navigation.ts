import {SCENES} from '../game/story.ts'
import type {Scene} from '../game/story.ts'
export const NAVIGATION_KEY='vehicle-logic-lab.navigation.v1'
export function hasCampaignSave(storage:{getItem:(key:string)=>string|null}){try{return!!storage.getItem('vehicle-logic-lab.momo-cup.v1')}catch{return false}}
export function readNavigation(storage:{getItem:(key:string)=>string|null}):Scene{try{const saved=JSON.parse(storage.getItem(NAVIGATION_KEY)??'null');return saved?.version===1&&SCENES.includes(saved.scene)?saved.scene:'title'}catch{return'title'}}
export function rememberNavigation(storage:{setItem:(key:string,value:string)=>void},scene:Scene){try{storage.setItem(NAVIGATION_KEY,JSON.stringify({version:1,scene}))}catch{/* Progress saves report their own storage warnings. */}}
