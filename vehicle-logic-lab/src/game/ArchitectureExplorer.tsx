import {useState} from 'react'
import type {Snapshot} from '../engine/types'
import {ArchitectureTrail} from './ArchitectureTrail'
import {VehiclePlatform} from './LearningVehicle'
export function ArchitectureExplorer({snapshot,brake}:{snapshot:Snapshot;brake:boolean}){
 const [focus,setFocus]=useState(1)
 return <section className="architecture-explorer architecture-live"><VehiclePlatform snapshot={snapshot} brake={brake} focus={focus} onInspect={setFocus}/><ArchitectureTrail snapshot={snapshot} inputs={{brake,power:snapshot.pulse,system:true}} onFocus={setFocus}/><details><summary>AUTOSAR는 어디에 대응할까? · 선택 설명</summary><p>입력 읽기 → 조건/상태 계산 → 출력 포트라는 Application 기능입니다. SWC·Runnable에 대응시켜 볼 수 있지만 RTE/BSW/MCAL/OS 실행이나 ARXML 생성은 구현하지 않았어요.</p></details></section>
}
