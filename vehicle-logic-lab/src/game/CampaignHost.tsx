import { useEffect, useRef, useState } from 'react'
export function CampaignHost({onExit}:{onExit:()=>void}) {
  const frame=useRef<HTMLIFrameElement>(null)
  const [confirm,setConfirm]=useState(false)
  useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.source===frame.current?.contentWindow&&event.data?.type==='TRACKBACK_RETURN_TO_GARAGE')onExit()};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[onExit])
  return <div className="campaign-host"><iframe ref={frame} src="./simulation/index.html" title="TRACKBACK 본편 · 실제 주행과 차량 검증" allow="gamepad; fullscreen"/><button className="campaign-host-exit" onClick={()=>setConfirm(true)}>정비소 메인으로</button>{confirm&&<div className="campaign-exit-confirm" role="dialog" aria-modal="true" aria-label="본편 종료 확인"><section><h2>정비소 메인으로 돌아갈까요?</h2><p>본편의 현재 주행·사건 조사는 종료돼요.<br/>입문 퍼즐 저장과 기존 최고 기록은 유지돼요.<br/>조사 결과는 본편 보고서에서 먼저 내보낼 수 있어요.</p><button onClick={()=>setConfirm(false)}>현재 사건 계속하기</button><button onClick={onExit}>본편 종료하고 메인으로</button></section></div>}</div>
}
