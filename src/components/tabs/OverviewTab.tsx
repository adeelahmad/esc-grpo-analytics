import type { Rollout } from '../../types';
import { CB } from '../../constants/colors';
import { fmtIter } from '../../utils/format';
import { isForced, forcedStats } from '../../utils/data';
import Chip from '../ui/Chip';
import Panel from '../ui/Panel';
import Dashboard from './Dashboard';

export default function OverviewTab({ row, rows }: { row: Rollout; rows: Rollout[] }) {
  const meta = (row.metadata || {}) as Record<string, any>;
  const step = (row.step || meta.step || {}) as Record<string, any>;
  const tc = (row.token_counts || {}) as Record<string, number>;
  const rw = row.reward ?? 0;
  const adv = row.advantage ?? 0;
  const ok = row.correct;
  const forced = isForced(row);
  const fs = forcedStats(row.segments);

  return <div style={{paddingBottom:40}}>
    {forced&&<div style={{background:"linear-gradient(135deg,#fff7ed,#fef3c7)",border:"1.5px solid #f97316",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:20}}>💉</span>
      <div>
        <div style={{fontSize:12,fontWeight:800,color:"#c2410c"}}>FORCED ANSWER — answer tokens were injected</div>
        <div style={{fontSize:11,color:"#9a3412",marginTop:2}}>
          {fs?<>{fs.toks} tokens across {fs.count} segment{fs.count>1?"s":""} · {fs.masked?"⊘ All masked (no gradient)":fs.partial?"⚠️ Partially masked":"✓ Trainable (gradient applied)"}{fs.injected?" · source: injected":""}</>:"Forced flag set but no forced_answer segments found"}
        </div>
      </div>
    </div>}
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
      <Chip label="Correct" value={ok?"✓ YES":"✗ NO"} bg={ok?"#dcfce7":"#fee2e2"} color={ok?CB.green:CB.red}/>
      <Chip label="Reward" value={rw.toFixed(3)} bg={rw>0?"#dcfce7":"#fee2e2"} color={rw>0?CB.green:CB.red}/>
      <Chip label="Advantage" value={adv.toFixed(3)} bg={adv>0?"#dcfce7":"#fee2e2"} color={adv>0?CB.green:CB.red}/>
      <Chip label="Iteration" value={fmtIter(row.iteration)} bg="#f0f9ff" color={CB.blue}/>
      <Chip label="Shaped" value={(meta._esc_shaped_reward??0).toFixed(2)} bg="#eff6ff" color={CB.blue}/>
      <Chip label="View" value={meta._view_name||"?"} bg="#faf5ff" color={CB.purple}/>
      <Chip label="Member" value={`G${meta._esc_member_idx??"?"}`} bg="#ecfdf5" color={CB.teal}/>
      <Chip label="n_eff" value={`${meta._esc_n_eff??0}/${meta._esc_n_eff_max??0}`} bg="#fff7ed" color={CB.orange}/>
      {forced&&<Chip label="Answer" value="💉 FORCED" bg="#fff7ed" color="#c2410c"/>}
      {forced&&fs&&<Chip label="Forced Toks" value={`${fs.toks} ${fs.masked?"⊘":"✓"}`} bg={fs.masked?"#fee2e2":"#dcfce7"} color={fs.masked?CB.red:CB.green}/>}
      {!forced&&<Chip label="Answer" value="🧠 ORGANIC" bg="#dcfce7" color={CB.green}/>}
      {(step as any).weight_angle_avg!=null&&<Chip label="Wt Angle" value={(step as any).weight_angle_avg.toFixed(4)+"°"} bg="#fdf4ff" color={CB.magenta}/>}
      {(step as any).learning_rate!=null&&<Chip label="LR" value={(step as any).learning_rate.toExponential(2)} bg="#fefce8" color={CB.yellow}/>}
      {meta.reward_multiplier!=null&&<Chip label="Rwd Mult" value={meta.reward_multiplier.toExponential(2)} bg="#fefce8" color={CB.orange}/>}
    </div>
    {/* config metadata IIFE */}
    {(()=>{const keys=["steps_trained","epochs","batch_size","config_name","learning_rate"].filter(k=>meta[k]!==undefined||step[k]!==undefined);if(!keys.length)return null;return <Panel title="Configuration & Metadata" bc={CB.cyan}><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{keys.map(k=>{const v=meta[k]??step[k];return <div key={k} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:6,padding:"8px 14px",minWidth:100}}><div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",marginBottom:4,fontWeight:600}}>{k.replace(/_/g," ")}</div><div style={{fontSize:14,fontWeight:700,color:"#0f172a",fontFamily:"var(--font-mono)"}}>{typeof v==="number"?v.toPrecision(4):v}</div></div>;})}</div></Panel>;})()}
    <Panel title="Prompt" bc={CB.slate}><div style={{background:"#f8fafc",padding:12,borderRadius:6,fontSize:12,whiteSpace:"pre-wrap",maxHeight:140,overflow:"auto",lineHeight:1.6,fontFamily:"var(--font-mono)",border:"1px solid #e2e8f0",color:"#334155"}}>{(row as any).prompt||(row as any).prompt_text||"(none)"}</div></Panel>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      <Panel title="Target answer" mb={0} bc={CB.green}><div style={{background:"#f0fdf4",padding:12,borderRadius:6,fontSize:14,fontFamily:"var(--font-mono)",fontWeight:600,color:CB.green,border:"1px solid #bbf7d0"}}>{(row as any).target_answer||"(none)"}</div></Panel>
      <Panel title={`${forced?"💉 Forced":"🧠 Generated"} answer ${ok?"✓":"✗"}`} mb={0} bc={forced?"#f97316":ok?CB.green:CB.red}>
        <div style={{background:forced?"#fff7ed":ok?"#f0fdf4":"#fef2f2",padding:12,borderRadius:6,fontSize:14,fontFamily:"var(--font-mono)",fontWeight:600,color:forced?"#c2410c":ok?CB.green:CB.red,border:`1px solid ${forced?"#fed7aa":ok?"#bbf7d0":"#fecaca"}`}}>
          {(row as any).generated_answer||"(none)"}
          {forced&&<div style={{fontSize:10,fontWeight:500,color:"#9a3412",marginTop:4,fontStyle:"italic"}}>{fs?.masked?"⊘ Answer tokens masked — not used in loss":"✓ Answer tokens trainable — gradient applied"}</div>}
        </div>
      </Panel>
    </div>
    <Panel title="Generated completion" bc={CB.teal}><div style={{background:"#1e293b",border:"1px solid #0f172a",padding:12,borderRadius:6,fontSize:12,fontFamily:"var(--font-mono)",whiteSpace:"pre-wrap",maxHeight:250,overflow:"auto",lineHeight:1.6,color:"#e2e8f0"}}>{(row as any).generated_completion||"(none)"}</div></Panel>
    {Object.keys(tc).length>0&&<Panel title="Token counts" bc={CB.orange}><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{Object.entries(tc).map(([k,v])=><div key={k} style={{background:"#fff7ed",padding:"6px 12px",borderRadius:6,fontSize:12,border:"1px solid #fed7aa"}}><span style={{color:"#9a3412",fontWeight:500}}>{k}: </span><span style={{fontWeight:700,color:"#7c2d12"}}>{typeof v==="number"?v.toFixed(1):v}</span></div>)}</div></Panel>}
    {Object.keys(step).length>0&&<Panel title="Step-level training metrics" bc={CB.purple}><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{Object.entries(step).map(([k,v])=><div key={k} style={{background:"#faf5ff",padding:"6px 12px",borderRadius:6,fontSize:12,border:"1px solid #e9d5ff"}}><span style={{color:CB.purple,fontWeight:600}}>{k}: </span><span style={{fontWeight:700,color:"#4c1d95"}}>{typeof v==="number"?(v as number).toFixed(6):String(v)}</span></div>)}</div></Panel>}
    {rows.length>1&&<div style={{marginTop:16,paddingTop:16,borderTop:"2px solid var(--color-border-tertiary)"}}><Dashboard rows={rows} row={row}/></div>}
  </div>;
}
