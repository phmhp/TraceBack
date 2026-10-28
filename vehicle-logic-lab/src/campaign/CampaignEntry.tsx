import {lazy,Suspense,useState} from 'react'
import {CAMPAIGN_KEY} from './model'
const Current=lazy(()=>import('./DomainCampaign'))
const Legacy=lazy(()=>import('./MomoCampaign'))
export default function CampaignEntry(p:React.ComponentProps<typeof Current>){const [modern]=useState(()=>{try{return JSON.parse(localStorage.getItem(CAMPAIGN_KEY)??'null')?.edition===16}catch{return false}});return <Suspense fallback={<p>흰둥의 정비소를 준비하고 있어요…</p>}>{modern?<Current {...p}/>:<Legacy {...p}/>}</Suspense>}
