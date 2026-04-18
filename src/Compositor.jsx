
import { useState, useEffect, useCallback } from "react";

// ── Themes ────────────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg: "#f4f3f0", surface: "#ffffff", surfaceAlt: "#f0eff0",
    border: "#d8d6d0", borderHover: "#a8a6a0",
    accent: "#5b4fd4", accentDim: "#c8c4f0",
    accentGrad: "linear-gradient(135deg,#5b4fd4,#8b5cf6)",
    muted: "#8a8880", text: "#1a1a1a", textDim: "#5a5a5a",
    danger: "#dc2626",
    sectionColors: ["#5b4fd4","#0891b2","#d97706","#db2777","#059669","#ea580c"],
    headerBg: "#ffffff", blockBg: "#fafaf8", blockBgAlt: "#f4f3f0",
  },
  dark: {
    bg: "#0f0f11", surface: "#17171b", surfaceAlt: "#1c1c26",
    border: "#2a2a32", borderHover: "#44445a",
    accent: "#7c6af7", accentDim: "#3d3470",
    accentGrad: "linear-gradient(135deg,#7c6af7,#9d4edd)",
    muted: "#5a5a72", text: "#e2e2ec", textDim: "#8888a8",
    danger: "#f87171",
    sectionColors: ["#7c6af7","#06b6d4","#f59e0b","#ec4899","#10b981","#f97316"],
    headerBg: "#17171b", blockBg: "#13131a", blockBgAlt: "#17171b",
  },
};

// ── Data — replace SECTIONS and INIT_RECIPIENTS with live Graph API calls ────
// See src/mock/data.js and ROADMAP.md for the wiring plan.
const SECTIONS = [
  { id:"s1", name:"Blocks - Gabriela - Health - Positive", pages:[
    {id:"p1",  name:"Health update – Summary",   modified:"2026-04-15", snippet:"A brief overview of recent health developments…"},
    {id:"p2",  name:"Health update – Treatment",  modified:"2026-04-16", snippet:"Treatment progressed through several stages…"},
    {id:"p3",  name:"Health update – Recovery",   modified:"2026-04-17", snippet:"Recovery has been steady with encouraging signs…"},
    {id:"p4",  name:"Health update – Prognosis",  modified:"2026-04-17", snippet:"The outlook is cautiously positive at this stage…"},
    {id:"p5",  name:"Health update – Current",    modified:"2026-04-18", snippet:"As of now, things are stabilising and improving…"},
  ]},
  { id:"s2", name:"Blocks - Richard - Health - Positive", pages:[
    {id:"p6",  name:"Hearing",  modified:"2026-04-15", snippet:"Hearing aids have made a significant difference…"},
    {id:"p7",  name:"Eyes",     modified:"2026-04-16", snippet:"Vision corrected after a couple of fittings…"},
    {id:"p8",  name:"General",  modified:"2026-03-20", snippet:null},
  ]},
  { id:"s3", name:"Blocks - Richard - Work", pages:[
    {id:"p9",  name:"End of contracting",   modified:"2026-04-10", snippet:"After many years in IT contracting, winding down…"},
    {id:"p10", name:"Current projects",      modified:"2026-04-12", snippet:"Retirement hasn't meant slowing down at all…"},
    {id:"p11", name:"Working with AI tools", modified:"2026-04-18", snippet:"A significant amount of time now involves AI-assisted work…"},
  ]},
  { id:"s4", name:"Blocks - Shared - Travel", pages:[
    {id:"p12", name:"The camper van",      modified:"2026-03-15", snippet:"The van has opened up a new way of travelling…"},
    {id:"p13", name:"Future travel plans",  modified:"2026-02-20", snippet:"Plans are forming for a longer trip later in the year…"},
  ]},
];

const INIT_RECIPIENTS = {
  RecipientA: { label:"Recipient A",                           emails:["recipient.a@example.com"], untick:[] },
  RecipientB: { label:"Recipient B (close friend)",            emails:["recipient.b@example.com"], untick:["p1","p2"] },
  Custom:     { label:"Custom…",                               emails:[], untick:[] },
};

const PAGE_MAP = {};
SECTIONS.forEach(s=>s.pages.forEach(p=>{ PAGE_MAP[p.id]={...p,sectionId:s.id,sectionName:s.name}; }));

function fmtDate(d){ return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"2-digit"}); }
function sectionColor(T,idx){ return T.sectionColors[idx%T.sectionColors.length]; }

function initState(recipientKey, recipients){
  const untick=recipients[recipientKey]?.untick??[];
  const checked={};
  SECTIONS.forEach(s=>s.pages.forEach(p=>{ checked[p.id]=!untick.includes(p.id); }));
  const blockOrders={};
  SECTIONS.forEach(s=>{ blockOrders[s.id]=s.pages.map(p=>p.id); });
  return { sectionOrder:SECTIONS.map(s=>s.id), blockOrders, checked, collapsed:Object.fromEntries(SECTIONS.map(s=>[s.id,false])) };
}

function DragDots({color}){
  return(<svg width="10" height="16" viewBox="0 0 10 16" style={{flexShrink:0,display:"block"}}>
    {[3,8,13].map(y=>[2,8].map(x=><circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill={color}/>))}
  </svg>);
}

function Arr({dir,disabled,onClick,T}){
  return(<button onClick={e=>{e.stopPropagation();if(!disabled)onClick();}} disabled={disabled}
    style={{background:"none",border:`1px solid ${disabled?T.border:T.borderHover}`,borderRadius:3,
            color:disabled?T.border:T.muted,fontSize:10,width:20,height:19,cursor:disabled?"default":"pointer",
            padding:0,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    {dir}</button>);
}

function BlockCard({page,color,checked,onToggle,onMoveUp,onMoveDown,canUp,canDown,
                    isDragging,isDragOver,onDragStart,onDragOver,onDragEnd,onDrop,T}){
  return(<div draggable
    onDragStart={e=>{e.stopPropagation();onDragStart();}}
    onDragOver={e=>{e.preventDefault();e.stopPropagation();onDragOver();}}
    onDragEnd={e=>{e.stopPropagation();onDragEnd();}}
    onDrop={e=>{e.preventDefault();e.stopPropagation();onDrop();}}
    style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
            background:isDragOver?T.accentDim:T.blockBg,
            border:`1px solid ${isDragOver?T.accent:T.border}`,borderLeft:`3px solid ${color}`,
            borderRadius:5,marginBottom:3,opacity:isDragging?0.3:checked?1:0.35,
            transition:"border-color 0.12s,opacity 0.12s,background 0.12s",userSelect:"none",cursor:"default"}}>
    <span style={{cursor:"grab",display:"flex",alignItems:"center"}}><DragDots color={T.muted}/></span>
    <input type="checkbox" checked={checked} onChange={e=>{e.stopPropagation();onToggle();}}
      style={{accentColor:T.accent,width:14,height:14,cursor:"pointer",flexShrink:0}}/>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
        <span style={{color:T.text,fontSize:12,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{page.name}</span>
        <span style={{color:T.muted,fontSize:10,flexShrink:0}}>{fmtDate(page.modified)}</span>
      </div>
      <div style={{color:T.textDim,fontSize:11,marginTop:1,fontFamily:"Georgia,serif",
                   overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {page.snippet===null?<span style={{color:T.muted,fontStyle:"italic"}}>loading…</span>:page.snippet}
      </div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
      <Arr dir="↑" disabled={!canUp}   onClick={onMoveUp}   T={T}/>
      <Arr dir="↓" disabled={!canDown} onClick={onMoveDown} T={T}/>
    </div>
  </div>);
}

function SectionGroup({section,color,sectionIdx,totalSections,blockOrder,checked,
                       onToggle,onMoveBlock,onMoveSection,collapsed,onToggleCollapse,
                       blockDrag,onBlockDragStart,onBlockDragOver,onBlockDragEnd,onBlockDrop,
                       onSectionDragStart,onSectionDragOver,onSectionDragEnd,onSectionDrop,
                       isSectionDragOver,isSectionDragging,T}){
  const latestDate=section.pages.reduce((a,p)=>p.modified>a?p.modified:a,"");
  const checkedCount=blockOrder.filter(id=>checked[id]).length;
  return(<div draggable
    onDragStart={e=>{e.stopPropagation();onSectionDragStart();}}
    onDragOver={e=>{e.preventDefault();e.stopPropagation();onSectionDragOver();}}
    onDragEnd={e=>{e.stopPropagation();onSectionDragEnd();}}
    onDrop={e=>{e.preventDefault();e.stopPropagation();onSectionDrop();}}
    style={{marginBottom:8,borderRadius:7,border:`2px solid ${isSectionDragOver?T.accent:"transparent"}`,
            opacity:isSectionDragging?0.3:1,transition:"opacity 0.12s,border-color 0.12s"}}>
    <div onClick={e=>{e.stopPropagation();onToggleCollapse();}}
      style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:T.surfaceAlt,
              border:`1px solid ${T.border}`,borderLeft:`3px solid ${color}`,
              borderRadius:collapsed?"6px":"6px 6px 0 0",cursor:"pointer",userSelect:"none"}}>
      <span style={{cursor:"grab",display:"flex",alignItems:"center"}} onClick={e=>e.stopPropagation()}>
        <DragDots color={color}/>
      </span>
      <span style={{color,fontSize:12,flexShrink:0}}>{collapsed?"▶":"▼"}</span>
      <span style={{color:T.text,fontSize:12,fontWeight:700,fontFamily:"'DM Mono',monospace",
                    flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {section.name.replace("Blocks - ","")}
      </span>
      <span style={{color:T.muted,fontSize:10,flexShrink:0}}>{fmtDate(latestDate)}</span>
      <span style={{color:T.muted,fontSize:10,flexShrink:0}}>{checkedCount}/{blockOrder.length}</span>
      <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
        <Arr dir="↑" disabled={sectionIdx===0}              onClick={()=>onMoveSection(sectionIdx,-1)} T={T}/>
        <Arr dir="↓" disabled={sectionIdx===totalSections-1} onClick={()=>onMoveSection(sectionIdx,1)} T={T}/>
      </div>
    </div>
    {!collapsed&&(
      <div style={{padding:"6px 8px 4px",background:T.blockBgAlt,
                   border:`1px solid ${T.border}`,borderTop:"none",borderRadius:"0 0 6px 6px"}}>
        {blockOrder.map((pid,idx)=>{
          const page=section.pages.find(p=>p.id===pid); if(!page) return null;
          return(<BlockCard key={pid} page={page} color={color} T={T}
            checked={!!checked[pid]} onToggle={()=>onToggle(pid)}
            onMoveUp={()=>onMoveBlock(section.id,pid,-1)} onMoveDown={()=>onMoveBlock(section.id,pid,1)}
            canUp={idx>0} canDown={idx<blockOrder.length-1}
            isDragging={blockDrag.draggingId===pid} isDragOver={blockDrag.overId===pid}
            onDragStart={()=>onBlockDragStart(section.id,pid)}
            onDragOver={()=>onBlockDragOver(section.id,pid)}
            onDragEnd={onBlockDragEnd} onDrop={()=>onBlockDrop(section.id,pid)}/>);
        })}
      </div>
    )}
  </div>);
}

function Overlay({T,children}){
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",
                       display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
    <div style={{background:T.surface,border:`1px solid ${T.accent}`,borderRadius:10,
                 padding:24,maxWidth:540,width:"92%",boxShadow:"0 8px 40px rgba(0,0,0,0.25)"}}>
      {children}
    </div>
  </div>);
}

function ConfirmOverlay({items,recipient,recipients,primaryEmail,onYes,onNo,T}){
  const rec=recipients[recipient];
  return(<Overlay T={T}>
    <div style={{color:T.accent,fontWeight:700,fontSize:13,marginBottom:4,fontFamily:"'DM Mono',monospace",letterSpacing:1}}>BUILD DOCUMENT</div>
    <div style={{color:T.textDim,fontSize:12,marginBottom:14}}>
      <span style={{color:T.text}}>{rec?.label}</span>
      {primaryEmail&&<span style={{color:T.muted}}> · {primaryEmail}</span>}
    </div>
    <div style={{maxHeight:280,overflowY:"auto",marginBottom:14,border:`1px solid ${T.border}`,borderRadius:5}}>
      {items.map((item,i)=>(<div key={item.id} style={{display:"flex",gap:10,alignItems:"center",
          padding:"5px 10px",borderBottom:`1px solid ${T.border}`,background:i%2===0?"transparent":T.surfaceAlt}}>
        <span style={{color:T.muted,fontSize:10,width:22,textAlign:"right",flexShrink:0}}>{i+1}.</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:T.text,fontSize:12,fontFamily:"'DM Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
          <div style={{color:T.muted,fontSize:10}}>{item.sectionName.replace("Blocks - ","")}</div>
        </div>
      </div>))}
    </div>
    <div style={{color:T.muted,fontSize:11,marginBottom:16}}>{items.length} block{items.length!==1?"s":""} selected</div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <button onClick={onNo} style={{padding:"9px 20px",borderRadius:6,border:`1px solid ${T.border}`,background:"none",color:T.textDim,cursor:"pointer",fontSize:13,fontFamily:"'DM Mono',monospace"}}>N — Back</button>
      <button onClick={onYes} style={{padding:"9px 26px",borderRadius:6,border:"none",background:T.accentGrad,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace",letterSpacing:1}}>Y — BUILD</button>
    </div>
  </Overlay>);
}

function CancelOverlay({hasChanges,onQuit,onBack,T}){
  return(<Overlay T={T}>
    <div style={{color:T.danger,fontWeight:700,fontSize:13,marginBottom:10,fontFamily:"'DM Mono',monospace",letterSpacing:1}}>CANCEL</div>
    <div style={{color:T.textDim,fontSize:13,marginBottom:20,lineHeight:1.6}}>
      {hasChanges?"You have unsaved changes. Quit anyway?":"Nothing has changed. Quit?"}
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <button onClick={onBack} style={{padding:"9px 20px",borderRadius:6,border:`1px solid ${T.border}`,background:"none",color:T.textDim,cursor:"pointer",fontSize:13,fontFamily:"'DM Mono',monospace"}}>N — Stay</button>
      <button onClick={onQuit} style={{padding:"9px 24px",borderRadius:6,border:"none",background:T.danger,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace",letterSpacing:1}}>Y — Quit</button>
    </div>
  </Overlay>);
}

function SettingsPanel({T,darkMode,onToggleDark,recipients,onUpdateRecipients,onClose}){
  const [localRecs,setLocalRecs]=useState(JSON.parse(JSON.stringify(recipients)));
  const [editKey,setEditKey]=useState(null);
  const [newEmail,setNewEmail]=useState("");
  const addEmail=key=>{if(!newEmail.trim())return;setLocalRecs(r=>({...r,[key]:{...r[key],emails:[...r[key].emails,newEmail.trim()]}}));setNewEmail("");};
  const removeEmail=(key,idx)=>setLocalRecs(r=>({...r,[key]:{...r[key],emails:r[key].emails.filter((_,i)=>i!==idx)}}));
  const inp={background:T.bg,border:`1px solid ${T.border}`,borderRadius:4,color:T.text,padding:"5px 8px",fontSize:12,fontFamily:"'DM Mono',monospace",outline:"none"};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"flex-end",zIndex:300}}>
    <div style={{background:T.surface,borderLeft:`1px solid ${T.border}`,height:"100%",width:340,padding:20,overflowY:"auto",boxShadow:"-4px 0 24px rgba(0,0,0,0.15)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{color:T.text,fontWeight:700,fontSize:14,fontFamily:"'DM Mono',monospace",letterSpacing:1}}>⚙ SETTINGS</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:18,cursor:"pointer",padding:4}}>✕</button>
      </div>
      <div style={{marginBottom:24,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
        <div style={{color:T.muted,fontSize:10,letterSpacing:1,marginBottom:10}}>APPEARANCE</div>
        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <div onClick={onToggleDark} style={{width:44,height:24,borderRadius:12,position:"relative",background:darkMode?T.accent:T.border,transition:"background 0.2s",cursor:"pointer"}}>
            <div style={{position:"absolute",top:3,left:darkMode?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
          </div>
          <span style={{color:T.text,fontSize:13}}>{darkMode?"Dark mode":"Light mode"}</span>
        </label>
      </div>
      <div>
        <div style={{color:T.muted,fontSize:10,letterSpacing:1,marginBottom:12}}>RECIPIENTS</div>
        {Object.entries(localRecs).map(([key,rec])=>(
          <div key={key} style={{marginBottom:16,padding:12,border:`1px solid ${editKey===key?T.accent:T.border}`,borderRadius:6,background:T.bg}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{color:T.text,fontSize:12,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{rec.label}</span>
              <button onClick={()=>setEditKey(editKey===key?null:key)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:4,color:T.muted,fontSize:11,padding:"2px 8px",cursor:"pointer"}}>{editKey===key?"done":"edit"}</button>
            </div>
            {rec.emails.map((email,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <span style={{color:T.textDim,fontSize:11,flex:1,fontFamily:"'DM Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{email}</span>
              {editKey===key&&<button onClick={()=>removeEmail(key,i)} style={{background:"none",border:"none",color:T.danger,cursor:"pointer",fontSize:14,padding:"0 4px",flexShrink:0}}>✕</button>}
            </div>))}
            {editKey===key&&(<div style={{display:"flex",gap:6,marginTop:6}}>
              <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEmail(key)} placeholder="add email…" style={{...inp,flex:1}}/>
              <button onClick={()=>addEmail(key)} style={{background:T.accent,border:"none",borderRadius:4,color:"#fff",padding:"5px 10px",cursor:"pointer",fontSize:12}}>+</button>
            </div>)}
          </div>
        ))}
      </div>
      <div style={{marginTop:8,padding:12,border:`1px dashed ${T.border}`,borderRadius:6}}>
        <div style={{color:T.muted,fontSize:11,fontFamily:"'DM Mono',monospace"}}>📓 OneNote notebook selector</div>
        <div style={{color:T.muted,fontSize:10,marginTop:4}}>Coming once wired to Graph API</div>
      </div>
      <button onClick={()=>{onUpdateRecipients(localRecs);onClose();}} style={{marginTop:20,width:"100%",padding:"10px",borderRadius:6,border:"none",background:T.accentGrad,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Mono',monospace",letterSpacing:1}}>SAVE SETTINGS</button>
    </div>
  </div>);
}

export default function Compositor() {
  const [darkMode,setDarkMode]=useState(false);
  const T=THEMES[darkMode?"dark":"light"];
  const [recipients,setRecipients]=useState(INIT_RECIPIENTS);
  const [recipient,setRecipient]=useState("RecipientA");
  const [primaryEmail,setPrimaryEmail]=useState(Object.fromEntries(Object.entries(INIT_RECIPIENTS).map(([k,v])=>[k,v.emails[0]||""])));
  const [state,setState]=useState(()=>initState("RecipientA",INIT_RECIPIENTS));
  const [initSnapshot]=useState(()=>JSON.stringify(initState("RecipientA",INIT_RECIPIENTS)));
  const hasChanges=JSON.stringify(state)!==initSnapshot;
  const [history,setHistory]=useState([]);
  const [future,setFuture]=useState([]);
  const [blockDrag,setBlockDrag]=useState({draggingId:null,draggingSectionId:null,overId:null,overSectionId:null});
  const [sectionDrag,setSectionDrag]=useState({draggingId:null,overId:null});
  const [showBuild,setShowBuild]=useState(false);
  const [showCancel,setShowCancel]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [built,setBuilt]=useState(false);

  const snapshot=useCallback(prev=>{
    setHistory(h=>[...h.slice(-19),{sectionOrder:[...prev.sectionOrder],blockOrders:Object.fromEntries(Object.entries(prev.blockOrders).map(([k,v])=>[k,[...v]])),checked:{...prev.checked},collapsed:{...prev.collapsed}}]);
    setFuture([]);
  },[]);
  const mutate=useCallback(fn=>{setState(prev=>{snapshot(prev);return fn(prev);});},[snapshot]);
  const undo=useCallback(()=>{setHistory(h=>{if(!h.length)return h;const p=[...h];const snap=p.pop();setFuture(f=>[...f,snap]);setState(snap);return p;});},[]);
  const redo=useCallback(()=>{setFuture(f=>{if(!f.length)return f;const n=[...f];const snap=n.pop();setHistory(h=>[...h,snap]);setState(snap);return n;});},[]);

  useEffect(()=>{
    const h=e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="z"&&!e.shiftKey){e.preventDefault();undo();}
      if((e.ctrlKey||e.metaKey)&&(e.key==="y"||(e.key==="z"&&e.shiftKey))){e.preventDefault();redo();}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[undo,redo]);

  const sectionMap=Object.fromEntries(state.sectionOrder.map((sid,i)=>{const sec=SECTIONS.find(s=>s.id===sid);return[sid,{...sec,color:sectionColor(T,i)}];}));
  const handleRecipientChange=r=>{setRecipient(r);const untick=recipients[r]?.untick??[];mutate(prev=>{const checked={};SECTIONS.forEach(s=>s.pages.forEach(p=>{checked[p.id]=!untick.includes(p.id);}));return{...prev,checked};});};
  const toggleCheck=pid=>mutate(prev=>({...prev,checked:{...prev.checked,[pid]:!prev.checked[pid]}}));
  const moveBlock=(sid,pid,dir)=>mutate(prev=>{const arr=[...prev.blockOrders[sid]];const idx=arr.indexOf(pid);const nxt=idx+dir;if(nxt<0||nxt>=arr.length)return prev;[arr[idx],arr[nxt]]=[arr[nxt],arr[idx]];return{...prev,blockOrders:{...prev.blockOrders,[sid]:arr}};});
  const onBlockDragStart=(sid,pid)=>setBlockDrag({draggingId:pid,draggingSectionId:sid,overId:null,overSectionId:null});
  const onBlockDragOver=(sid,pid)=>setBlockDrag(d=>({...d,overId:pid,overSectionId:sid}));
  const onBlockDragEnd=()=>setBlockDrag({draggingId:null,draggingSectionId:null,overId:null,overSectionId:null});
  const onBlockDrop=(targetSid,targetPid)=>{const{draggingId,draggingSectionId}=blockDrag;if(!draggingId||draggingId===targetPid){onBlockDragEnd();return;}mutate(prev=>{const orders=Object.fromEntries(Object.entries(prev.blockOrders).map(([k,v])=>[k,[...v]]));orders[draggingSectionId]=orders[draggingSectionId].filter(id=>id!==draggingId);const tgt=orders[targetSid].filter(id=>id!==draggingId);tgt.splice(tgt.indexOf(targetPid),0,draggingId);orders[targetSid]=tgt;return{...prev,blockOrders:orders};});onBlockDragEnd();};
  const moveSection=(idx,dir)=>mutate(prev=>{const arr=[...prev.sectionOrder];const nxt=idx+dir;if(nxt<0||nxt>=arr.length)return prev;[arr[idx],arr[nxt]]=[arr[nxt],arr[idx]];return{...prev,sectionOrder:arr};});
  const toggleCollapse=sid=>mutate(prev=>({...prev,collapsed:{...prev.collapsed,[sid]:!prev.collapsed[sid]}}));
  const onSectionDragStart=sid=>setSectionDrag({draggingId:sid,overId:null});
  const onSectionDragOver=sid=>setSectionDrag(d=>({...d,overId:sid}));
  const onSectionDragEnd=()=>setSectionDrag({draggingId:null,overId:null});
  const onSectionDrop=targetId=>{const{draggingId}=sectionDrag;if(!draggingId||draggingId===targetId){onSectionDragEnd();return;}mutate(prev=>{const arr=prev.sectionOrder.filter(id=>id!==draggingId);arr.splice(arr.indexOf(targetId),0,draggingId);return{...prev,sectionOrder:arr};});onSectionDragEnd();};

  const allPageCount=state.sectionOrder.reduce((n,sid)=>n+(state.blockOrders[sid]||[]).length,0);
  const selectedItems=state.sectionOrder.flatMap(sid=>(state.blockOrders[sid]||[]).filter(pid=>state.checked[pid]).map(pid=>({...PAGE_MAP[pid],sectionName:sectionMap[sid]?.name||""})));
  const checkedCount=selectedItems.length;
  const canUndo=history.length>0;
  const canRedo=future.length>0;
  const rec=recipients[recipient];

  if(built) return(<div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>
    <div style={{textAlign:"center",color:T.text}}>
      <div style={{fontSize:52,marginBottom:14,color:T.accent}}>✓</div>
      <div style={{fontSize:17,marginBottom:8,fontFamily:"'DM Mono',monospace",fontWeight:700}}>Building document…</div>
      <div style={{color:T.muted,fontSize:13}}>{checkedCount} blocks · {rec?.label}</div>
      {primaryEmail[recipient]&&<div style={{color:T.textDim,fontSize:12,marginTop:4}}>{primaryEmail[recipient]}</div>}
    </div>
  </div>);

  return(<div style={{background:T.bg,minHeight:"100vh",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:13,transition:"background 0.2s"}}>
    {showBuild&&<ConfirmOverlay items={selectedItems} recipient={recipient} recipients={recipients} primaryEmail={primaryEmail[recipient]} T={T} onYes={()=>{setShowBuild(false);setBuilt(true);}} onNo={()=>setShowBuild(false)}/>}
    {showCancel&&<CancelOverlay hasChanges={hasChanges} T={T} onQuit={()=>setShowCancel(false)} onBack={()=>setShowCancel(false)}/>}
    {showSettings&&<SettingsPanel T={T} darkMode={darkMode} onToggleDark={()=>setDarkMode(d=>!d)} recipients={recipients} onUpdateRecipients={r=>{setRecipients(r);setPrimaryEmail(Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v.emails[0]||""])));}} onClose={()=>setShowSettings(false)}/>}

    <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:T.headerBg,position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
      <span style={{color:T.accent,fontWeight:700,fontSize:13,letterSpacing:2,flexShrink:0}}>COMPOSITOR</span>
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{color:T.muted,fontSize:10}}>FOR</span>
          <select value={recipient} onChange={e=>handleRecipientChange(e.target.value)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:4,color:T.text,padding:"3px 7px",fontSize:12,cursor:"pointer"}}>
            {Object.entries(recipients).map(([k,v])=>(<option key={k} value={k}>{v.label}</option>))}
          </select>
        </div>
        {rec?.emails.map(email=>(<label key={email} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",color:T.muted,fontSize:10,paddingLeft:28}}>
          <input type="radio" name="primaryEmail" checked={primaryEmail[recipient]===email} onChange={()=>setPrimaryEmail(p=>({...p,[recipient]:email}))} style={{accentColor:T.accent,cursor:"pointer"}}/>{email}
        </label>))}
      </div>
      <div style={{flex:1}}/>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{background:"none",border:`1px solid ${canUndo?T.borderHover:T.border}`,borderRadius:5,color:canUndo?T.text:T.border,padding:"6px 12px",fontSize:16,cursor:canUndo?"pointer":"default",minHeight:36}}>⟲</button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" style={{background:"none",border:`1px solid ${canRedo?T.borderHover:T.border}`,borderRadius:5,color:canRedo?T.text:T.border,padding:"6px 12px",fontSize:16,cursor:canRedo?"pointer":"default",minHeight:36}}>⟳</button>
        {canUndo&&<span style={{color:T.muted,fontSize:10,minWidth:30}}>{history.length}</span>}
        <span style={{color:T.border,fontSize:16,margin:"0 2px"}}>|</span>
        <span style={{color:T.muted,fontSize:11}}>{checkedCount}/{allPageCount}</span>
        <button onClick={()=>setShowCancel(true)} style={{background:"none",border:`1px solid ${T.danger}`,borderRadius:5,color:T.danger,padding:"6px 14px",fontSize:13,cursor:"pointer",fontFamily:"'DM Mono',monospace",minHeight:36}}>CANCEL</button>
        <button onClick={()=>setShowBuild(true)} disabled={checkedCount===0} style={{background:checkedCount>0?T.accentGrad:T.accentDim,border:"none",borderRadius:5,color:checkedCount>0?"#fff":T.muted,padding:"6px 20px",fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace",letterSpacing:2,cursor:checkedCount>0?"pointer":"default",minHeight:36,boxShadow:checkedCount>0?"0 2px 12px rgba(91,79,212,0.3)":"none"}}>BUILD</button>
        <button onClick={()=>setShowSettings(true)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:5,color:T.muted,padding:"6px 10px",fontSize:16,cursor:"pointer",minHeight:36}}>⚙</button>
      </div>
    </div>

    <div style={{padding:"8px 18px 0",maxWidth:700,margin:"0 auto"}}>
      <span style={{color:T.muted,fontSize:10,letterSpacing:0.5}}>Drag section header to reorder · Expand to reorder blocks · Ctrl+Z to undo</span>
    </div>

    <div style={{padding:"10px 18px 30px",maxWidth:700,margin:"0 auto"}}>
      {state.sectionOrder.map((sid,sidx)=>{
        const sec=sectionMap[sid]; if(!sec) return null;
        return(<SectionGroup key={sid} section={sec} color={sec.color} T={T}
          sectionIdx={sidx} totalSections={state.sectionOrder.length}
          blockOrder={state.blockOrders[sid]||[]} checked={state.checked}
          onToggle={toggleCheck} onMoveBlock={moveBlock} onMoveSection={moveSection}
          collapsed={!!state.collapsed[sid]} onToggleCollapse={()=>toggleCollapse(sid)}
          blockDrag={blockDrag}
          onBlockDragStart={onBlockDragStart} onBlockDragOver={onBlockDragOver}
          onBlockDragEnd={onBlockDragEnd} onBlockDrop={onBlockDrop}
          onSectionDragStart={()=>onSectionDragStart(sid)} onSectionDragOver={()=>onSectionDragOver(sid)}
          onSectionDragEnd={onSectionDragEnd} onSectionDrop={()=>onSectionDrop(sid)}
          isSectionDragOver={sectionDrag.overId===sid} isSectionDragging={sectionDrag.draggingId===sid}/>);
      })}
    </div>
  </div>);
}
