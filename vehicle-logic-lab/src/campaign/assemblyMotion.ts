import {partById,allAssemblyParts} from '../workshop/assembly.ts'
import type {Vec3,AssemblyPartId} from '../workshop/assembly.ts'
/** Cat centre stays outside the 1.75m car envelope plus its 0.45m body radius. */
export const MECHANIC_HOME:Vec3=[-2.3,0,4.6]
export const MECHANIC_AISLE=-2.3
export const campaignTray=(id:AssemblyPartId):Vec3=>{const i=allAssemblyParts.findIndex(p=>p.id===id);return[-3.4,partById(id).tray[1],-2.1+(i%4)*1.4]}
export function mechanicRoute(tray:Vec3,mount:Vec3,carry:boolean):Vec3[]{
 return carry?[[MECHANIC_AISLE,0,tray[2]],[MECHANIC_AISLE,0,tray[2]],[MECHANIC_AISLE,0,tray[2]],[MECHANIC_AISLE,0,mount[2]]]:[[MECHANIC_AISLE,0,mount[2]]]
}

// Expanded by the cat body radius. Route the floor centre, not only a point-size sprite.
export const FLOOR_OBSTACLES=[{x0:-2.08,x1:2.08,z0:-2.58,z1:2.58},{x0:-6.9,x1:-2.66,z0:-4,z1:4},{x0:1.98,x1:4.42,z0:1.05,z1:2.95}]
export function floorSegmentClear(a:Vec3,b:Vec3){
 return FLOOR_OBSTACLES.every(r=>{let lo=0,hi=1;for(const [origin,delta,min,max] of [[a[0],b[0]-a[0],r.x0,r.x1],[a[2],b[2]-a[2],r.z0,r.z1]]){if(Math.abs(delta)<1e-9){if(origin<=min||origin>=max)return true;continue}const t0=(min-origin)/delta,t1=(max-origin)/delta;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));if(lo>=hi)return true}return hi<=0||lo>=1})
}
export function floorPath(start:Vec3,end:Vec3):Vec3[]{
 const vertices=[start,end,...FLOOR_OBSTACLES.flatMap(r=>[[r.x0-.04,0,r.z0-.04],[r.x1+.04,0,r.z0-.04],[r.x0-.04,0,r.z1+.04],[r.x1+.04,0,r.z1+.04]] as Vec3[])],distance=vertices.map(()=>Infinity),prior=vertices.map(()=>-1),done=new Set<number>();distance[0]=0
 while(done.size<vertices.length){let best=-1;for(let i=0;i<vertices.length;i++)if(!done.has(i)&&(best<0||distance[i]<distance[best]))best=i;if(best<0||!Number.isFinite(distance[best]))break;if(best===1)break;done.add(best);for(let i=0;i<vertices.length;i++)if(!done.has(i)&&floorSegmentClear(vertices[best],vertices[i])){const cost=distance[best]+Math.hypot(vertices[best][0]-vertices[i][0],vertices[best][2]-vertices[i][2]);if(cost<distance[i]){distance[i]=cost;prior[i]=best}}}
 if(!Number.isFinite(distance[1]))throw Error('No safe floor route')
 const path:Vec3[]=[];for(let i=1;i!==0;i=prior[i])path.unshift(vertices[i]);return path
}
export function taskRoute(start:Vec3,tray:Vec3,mount:Vec3,carry:boolean){
 const pickup:Vec3=[MECHANIC_AISLE,0,tray[2]],right=mount[0]>.9,finish:Vec3=right?[2.3,0,mount[2]]:[MECHANIC_AISLE,0,mount[2]],first=carry?floorPath(start,pickup):[],tail=floorPath(carry?pickup:start,finish)
 return {points:[...first,...tail],pickupIndex:carry?first.length-1:-1}
}
