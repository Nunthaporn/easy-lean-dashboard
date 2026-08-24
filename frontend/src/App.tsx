import { useEffect, useMemo, useState } from 'react'
import KpiCard from './components/KpiCard'
import HorizontalEffChart from './components/HorizontalEffChart'
import LatestLineChart from './components/LatestLineChart'
import RibbonLikeChart from './components/RibbonLikeChart'
import { getDashboard, getFilters, getHealth } from './services/api'
import type { FactoryEff, FilterMeta, LatestLine, PeriodFactory, Summary } from './types/dashboard'


const fmtPct=(v:number|null|undefined,d=2)=>v==null?'-':`${(v*100).toFixed(d)}%`
const fmtNum=(v:number|null|undefined,d=0)=>v==null?'-':new Intl.NumberFormat('en-US',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v)
const fmtM=(v:number|null|undefined)=>v==null?'-':v>=1_000_000?`${(v/1_000_000).toFixed(2)}M`:fmtNum(v)

export default function App(){
 const [meta,setMeta]=useState<FilterMeta|null>(null)
 const [startDate,setStartDate]=useState('')
 const [endDate,setEndDate]=useState('')
 const [factory,setFactory]=useState('ALL')
 const [summary,setSummary]=useState<Summary|null>(null)
 const [monthly,setMonthly]=useState<FactoryEff[]>([])
 const [latest,setLatest]=useState<LatestLine[]>([])
 const [monthlyFactory,setMonthlyFactory]=useState<PeriodFactory[]>([])
 const [last10,setLast10]=useState<PeriodFactory[]>([])
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 const [dbStatus,setDbStatus]=useState('checking')
 

 useEffect(()=>{(async()=>{
   try{
    const [m,h]=await Promise.all([getFilters(),getHealth()]); setMeta(m); setDbStatus(h.database)
    if(m.max_date){
      const end=m.max_date; const d=new Date(`${end}T00:00:00`); d.setDate(1)
      const start=d.toISOString().slice(0,10); setStartDate(start); setEndDate(end)
    }
   }catch{setError('Unable to connect to backend')}
 })()},[])

 useEffect(()=>{if(!startDate||!endDate)return; let active=true;(async()=>{
  setLoading(true);setError('')
  try{const d=await getDashboard(startDate,endDate,factory);if(!active)return;setSummary(d.summary);setMonthly(d.monthly);setLatest(d.latest);setMonthlyFactory(d.monthlyFactory);setLast10(d.last10)}
  catch{if(active)setError('Unable to load dashboard data. Check PostgreSQL connection and column names.')}
  finally{if(active)setLoading(false)}
 })();return()=>{active=false}},[startDate,endDate,factory])

 const year=useMemo(()=>endDate?endDate.slice(0,4):'', [endDate])
 return <main className="page">
   <header className="topbar">
    <h1>EASY LEAN-Line - {year || 'Dashboard'}</h1>
    <div className="date-group"><input type="date" value={startDate} min={meta?.min_date??undefined} max={endDate||undefined} onChange={e=>setStartDate(e.target.value)}/><input type="date" value={endDate} min={(startDate || meta?.min_date) ?? undefined} max={meta?.max_date??undefined} onChange={e=>setEndDate(e.target.value)}/></div>
    <div className="tabs">{['ALL',...(meta?.factories??[])].map(f=><button key={f} className={factory===f?'active':''} onClick={()=>setFactory(f)}>{f}</button>)}</div>
    <div className="refresh"><strong>{summary?new Date(summary.last_refresh).toLocaleString():''}</strong><small>Latest Refresh Date</small><span className={`status ${dbStatus}`}>PostgreSQL {dbStatus}</span></div>
   </header>
   <section className="dashboard">
    {error && <div className="error">{error}</div>}
    <div className={`content ${loading?'loading':''}`}>
      <div className="kpis">
       <KpiCard label="EFF% EZLcard" value={fmtPct(summary?.eff_ezlcard)}/>
       <KpiCard label="Min Produce" value={fmtM(summary?.min_produce)}/>
       <KpiCard label="PPH" value={fmtNum(summary?.pph,2)}/>
       <KpiCard label="SumPcs." value={fmtNum(summary?.sum_pcs)}/>
       <KpiCard label="#Of Operator" value={fmtNum(summary?.operator_count)}/>
       <KpiCard label="CountLine" value={fmtNum(summary?.count_line)}/>
      </div>
      <div className="grid top-charts">
       <section className="panel"><h2>%EFF Monthly by Line</h2>{monthly.length?<HorizontalEffChart data={monthly}/>:<div className="empty">No data</div>}</section>
       <section className="panel"><h2>EFF Last date by Line</h2>{latest.length?<LatestLineChart data={latest}/>:<div className="empty">No data</div>}</section>
      </div>
      <div className="grid bottom-charts">
       <section className="panel"><h2>EFF% by Year, Month and EasyLean Fac</h2>{monthlyFactory.length?<RibbonLikeChart data={monthlyFactory}/>:<div className="empty">No data</div>}</section>
       <section className="panel"><h2>Last 10Days EFF% of EasyLean by Factory</h2>{last10.length?<RibbonLikeChart data={last10}/>:<div className="empty">No data</div>}</section>
      </div>
    </div>
   </section>
 </main>
}

