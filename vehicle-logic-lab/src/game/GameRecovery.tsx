import {Component,Fragment} from 'react'
import type {ErrorInfo,ReactNode} from 'react'

export const LAST_CRASH_KEY='vehicle-logic-lab.last-crash.v1'
/** A render exception must not leave a blank root or delete the user's design. */
export class GameRecovery extends Component<{children:ReactNode},{error:string;generation:number}> {
 state={error:'',generation:0}
 static getDerivedStateFromError(error:unknown){return{error:(error instanceof Error?error.message:String(error))||'화면 처리 오류'}}
 componentDidCatch(error:Error,info:ErrorInfo){
  try{localStorage.setItem(LAST_CRASH_KEY,JSON.stringify({version:1,time:new Date().toISOString(),message:String(error.message).slice(0,1000),componentStack:info.componentStack?.slice(0,4000)}))}catch{/* Diagnostic storage is optional, progress stores are untouched. */}
 }
 render(){
  if(!this.state.error)return <Fragment key={this.state.generation}>{this.props.children}</Fragment>
  return <main className="game-recovery" role="alert"><section><img src="./assets/investigation/cat-face.png" alt="모모"/><small>MOMO'S GARAGE · 화면 복구</small><h1>화면에 문제가 생겼어요.</h1><p>저장 기록은 지우지 않았어요.<br/>하던 게임을 다시 열어 이어갈 수 있어요.</p><button onClick={()=>this.setState(s=>({error:'',generation:s.generation+1}))}>하던 게임 다시 열기</button><details><summary>오류 내용 보기</summary><pre>{this.state.error}</pre><p>이 내용과 직전에 누른 곳을 알려주면 원인을 확인할 수 있어요.</p></details></section></main>
 }
}
