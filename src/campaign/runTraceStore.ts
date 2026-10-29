import type {VehicleRunSample} from '../workshop/WorkshopController'

const DB='vehicle-logic-lab-run-trace',STORE='runs',KEY='last-finish'
type SavedRun={raceKey:string;samples:VehicleRunSample[]}
const open=()=>new Promise<IDBDatabase>((resolve,reject)=>{
 if(typeof indexedDB==='undefined'){reject(Error('IndexedDB unavailable'));return}
 const request=indexedDB.open(DB,1)
 request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)}
 request.onsuccess=()=>resolve(request.result)
 request.onerror=()=>reject(request.error)
})

export async function saveRunTrace(raceKey:string,samples:VehicleRunSample[]){
 const db=await open()
 try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({raceKey,samples} satisfies SavedRun,KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}
}

export async function loadRunTrace(raceKey:string):Promise<VehicleRunSample[]>{
 const db=await open()
 try{return await new Promise<VehicleRunSample[]>((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).get(KEY);request.onsuccess=()=>{const saved=request.result as SavedRun|undefined;resolve(saved?.raceKey===raceKey&&Array.isArray(saved.samples)?saved.samples:[])};request.onerror=()=>reject(request.error)})}finally{db.close()}
}
