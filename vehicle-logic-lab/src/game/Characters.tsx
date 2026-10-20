export function CatFace({ happy=false, thinking=false }: {happy?:boolean;thinking?:boolean}) {
  return <img src="./assets/investigation/cat-face.png" className={`original-cat-face ${happy?'happy':''} ${thinking?'thinking':''}`} alt="원래 고양이 운전자"/>
}
export function ArchivedCatFace({ happy=false, thinking=false }: {happy?:boolean;thinking?:boolean}) {
  return <svg viewBox="0 0 110 110" aria-hidden="true"><path d="M15 48 17 12Q28 9 40 29Q56 22 72 29Q88 9 96 14L97 55Q108 99 57 101Q5 103 15 48Z" fill="#fff9e8" stroke="#846e56" strokeWidth="3"/><path d="M23 22 25 44 38 31M77 32 91 23 91 46" fill="#efc4b4"/><ellipse cx="35" cy="66" rx="11" ry="6" fill="#f1c1ac"/><ellipse cx="80" cy="66" rx="11" ry="6" fill="#f1c1ac"/>{happy?<path d="m30 56 8-5 8 5m24 0 8-5 8 5" fill="none" stroke="#594f45" strokeWidth="4" strokeLinecap="round"/>:<><ellipse cx="37" cy={thinking?57:55} rx="3.5" ry="6" fill="#594f45"/><ellipse cx="78" cy="55" rx="3.5" ry="6" fill="#594f45"/></>}<path d="m54 63 4 3 4-3m-4 4q-7 10-12 1m12-1q7 10 12 1" fill="none" stroke="#846e56" strokeWidth="2.4" strokeLinecap="round"/><path d="m34 89 23-8 24 8-5 13H39Z" fill="#a9cdb8"/></svg>
}
export function Dialogue({ name='모모 · 정비 도우미', text, happy=false, children }: {name?:string;text:string;happy?:boolean;children?:React.ReactNode}) {
  return <section className="dialogue"><div className="portrait"><CatFace happy={happy}/></div><div className="dialogue-copy"><span>{name}</span><p>{text}</p></div>{children&&<div className="dialogue-actions">{children}</div>}</section>
}
