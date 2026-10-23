import { useEffect, useState, type CSSProperties } from 'react'

type RepairBeat='REPAIRING'|'REPAIRED'|'READY'

export function RepairReturnOverlay(){
  const [beat,setBeat]=useState<RepairBeat>('REPAIRING')
  useEffect(()=>{
    const repaired=window.setTimeout(()=>setBeat('REPAIRED'),1500)
    const ready=window.setTimeout(()=>setBeat('READY'),2500)
    return()=>{window.clearTimeout(repaired);window.clearTimeout(ready)}
  },[])
  if(beat==='READY')return null
  return <div className={`repair-return-overlay beat-${beat.toLowerCase()}`} role="status" aria-live="assertive">
    <div className="repair-stage" aria-hidden="true">
      <div className="repair-car"><span className="repair-wheel left"/><span className="repair-wheel right"/></div>
      <div className="repair-cats">
        {[0,1,2].map(index=><span key={index} style={{'--repair-index':index} as CSSProperties}><img src="../legacy-assets/investigation/cat-face.png" alt=""/><i>{index===0?'🔧':index===1?'⚙':'✓'}</i></span>)}
      </div>
      <div className="repair-sparks"><i>✦</i><i>✧</i><i>✦</i></div>
    </div>
    <div className="repair-return-copy">
      <small>{beat==='REPAIRING'?'ENGINEER CATS AT WORK':'REGRESSION PASSED'}</small>
      <h2>{beat==='REPAIRING'?'원인에 맞춰 수리 중…':'수리 완료!'}</h2>
      <p>{beat==='REPAIRING'?'확인된 eDrive 계산 관계만 정상 기준으로 되돌립니다.':'같은 조건의 회귀시험을 통과했습니다. 고양이 운전자가 다시 출발합니다.'}</p>
      <div className="repair-progress"><i/></div>
    </div>
  </div>
}
