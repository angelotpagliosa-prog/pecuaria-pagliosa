// v2
import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'

const SUPABASE_URL = 'https://ctsjvgkcsyvhgkfqwbjl.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0c2p2Z2tjc3l2aGdrZnF3YmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDQwMjMsImV4cCI6MjA5MjUyMDAyM30.l2n7p10WU-OkRSDYkOmJB1bkfwkCG1JkGVAJECevzno'
const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

const Y='#FFB300',G='#22c55e',R='#ef4444',PU='#a78bfa',BL='#38bdf8'
const BG='#0b0c13',CARD='#11121a',CARD2='#181923',B='#21222f',TX='#eef0f8',D1='#94a3b8',D2='#5a6070',D3='#2a2b38'

function fmtDate(s){if(!s)return '-';return new Date(s+'T12:00').toLocaleDateString('pt-BR');}
function fmtR(n){return 'R$ '+Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2});}
function manejoMedicamentosTotal(meds){return (Array.isArray(meds)?meds:[]).reduce((s,m)=>s+(parseFloat(m.qtd||0)*parseFloat(m.valor||0)),0);}
function manejoDeslocamentoTotal(m){return (parseFloat(m?.kmRodados||0)||0)*(parseFloat(m?.valorKm||0)||0);}
function manejoEquipeTotal(m){return (parseFloat(m?.tempoHoras||0)||0)*(parseInt(m?.pessoas||0)||0)*(parseFloat(m?.valorHoraPessoa||0)||0);}
function manejoCustoTotal(m){return manejoMedicamentosTotal(m?.medicamentos)+manejoDeslocamentoTotal(m)+manejoEquipeTotal(m);}
function todayISO(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);}
function financeiroStatus(f){return f?.statusPagamento||'pago';}
function financeiroPago(f){return financeiroStatus(f)==='pago';}
function financeiroPendente(f){return f?.tipo==='despesa'&&financeiroStatus(f)==='pendente';}
function financeiroCancelado(f){return financeiroStatus(f)==='cancelado';}
function sortVencimento(a,b){return String(a.vencimento||a.data||'9999-12-31').localeCompare(String(b.vencimento||b.data||'9999-12-31'));}
function addMonthsISO(dateStr,months){
  const base=dateStr?new Date(dateStr+'T12:00'):new Date()
  base.setMonth(base.getMonth()+months)
  base.setMinutes(base.getMinutes()-base.getTimezoneOffset())
  return base.toISOString().slice(0,10)
}

// ── UI ATOMS ────────────────────────────────────────────
function Logo({small}){
  if(small) return <div style={{width:34,height:34,borderRadius:8,background:'#11121a',border:'1px solid '+Y,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:16,fontFamily:'Arial Black,sans-serif'}}><span style={{color:G}}>A</span><span style={{color:Y}}>P</span></div>
  return <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,userSelect:'none'}}>
    <div style={{fontSize:26,fontWeight:900,letterSpacing:-1,lineHeight:1,fontFamily:'Arial Black,sans-serif'}}><span style={{color:G}}>A</span><span style={{color:Y}}>NGEL</span><span style={{color:G}}>O</span></div>
    <div style={{background:Y,padding:'2px 10px'}}><span style={{color:'#0a4a1a',fontWeight:900,fontSize:10,letterSpacing:3}}>PAGLIOSA</span></div>
    <div style={{color:G,fontSize:8,fontWeight:700,letterSpacing:2,marginTop:2}}>PecuárIA v2</div>
  </div>
}

function Btn({onClick,children,v,s,disabled,small}){
  const vs={p:{background:Y,color:'#000',border:'none'},g:{background:G+'20',color:G,border:'1px solid '+G+'40'},r:{background:R+'20',color:R,border:'1px solid '+R+'40'},gh:{background:'transparent',color:D1,border:'1px solid '+B}}
  return <button onClick={onClick} disabled={disabled} style={{...{borderRadius:8,fontWeight:700,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.45:1,padding:small?'5px 12px':'8px 18px',fontSize:small?12:13},...(vs[v||'p']),...(s||{})}}>{children}</button>
}

function Inp({label,value,onChange,type,opts,ph}){
  const st={background:CARD2,border:'1px solid '+B,borderRadius:8,padding:'9px 12px',color:TX,fontSize:13,width:'100%',boxSizing:'border-box'}
  return <div style={{display:'flex',flexDirection:'column',gap:5}}>
    {label&&<label style={{color:D1,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6}}>{label}</label>}
    {opts?<select value={value} onChange={e=>onChange(e.target.value)} style={st}>{opts.map(o=><option key={o.v} value={o.v} style={{background:CARD2}}>{o.l}</option>)}</select>
    :<input type={type||'text'} value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} style={st}/>}
  </div>
}

function Badge({label,color,dot}){
  const c=color||Y
  return <span style={{background:c+'20',color:c,border:'1px solid '+c+'35',borderRadius:6,padding:'3px 9px',fontSize:11,fontWeight:700,display:'inline-flex',alignItems:'center',gap:5,whiteSpace:'nowrap'}}>{dot&&<span style={{width:5,height:5,borderRadius:'50%',background:c,flexShrink:0}}/>}{label}</span>
}

function Modal({title,onClose,children,wide}){
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <div style={{background:CARD,borderRadius:16,padding:28,width:'100%',maxWidth:wide?720:520,border:'1px solid '+B,maxHeight:'92vh',overflowY:'auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
        <div style={{color:TX,fontWeight:700,fontSize:16}}>{title}</div>
        <button onClick={onClose} style={{background:CARD2,border:'1px solid '+B,color:D1,width:30,height:30,borderRadius:7,cursor:'pointer',fontSize:16}}>✕</button>
      </div>
      {children}
    </div>
  </div>
}

const Th=({children})=><th style={{padding:'11px 16px',textAlign:'left',color:D2,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6,whiteSpace:'nowrap',background:CARD2}}>{children}</th>
const Td=({children,s})=><td style={{padding:'12px 16px',color:TX,fontSize:13,...(s||{})}}>{children}</td>
const TR=({children})=><tr style={{borderTop:'1px solid '+B+'30'}}>{children}</tr>
const Empty=({msg})=><div style={{padding:'50px 20px',textAlign:'center',color:D2}}><div style={{fontSize:36,marginBottom:10}}>📋</div><div style={{fontSize:13}}>{msg||'Nenhum registro encontrado.'}</div></div>
const SH=({title,action})=><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}><div style={{color:TX,fontWeight:700,fontSize:20}}>{title}</div>{action}</div>
const StatCard=({icon,label,value,color,sub})=>{const c=color||Y;return <div style={{background:CARD,border:'1px solid '+B,borderRadius:12,padding:'18px 20px',display:'flex',alignItems:'center',gap:16}}><div style={{width:46,height:46,borderRadius:10,background:c+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{icon}</div><div><div style={{color:D1,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6}}>{label}</div><div style={{color:c,fontWeight:800,fontSize:22,lineHeight:1.2,marginTop:2}}>{value}</div>{sub&&<div style={{color:D2,fontSize:11,marginTop:2}}>{sub}</div>}</div></div>}
const MFooter=({onCancel,onSave,label,disabled})=><div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:14,marginTop:6,borderTop:'1px solid '+B}}><Btn v='gh' onClick={onCancel}>Cancelar</Btn><Btn onClick={onSave} disabled={disabled}>{label||'Salvar'}</Btn></div>
const DelConfirm=({msg,onCancel,onConfirm})=><div><div style={{background:R+'15',border:'1px solid '+R+'30',borderRadius:10,padding:16,marginBottom:18}}><div style={{color:R,fontWeight:700,marginBottom:6}}>Confirmar exclusao</div><div style={{color:D1,fontSize:13}}>{msg}</div></div><div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><Btn v='gh' onClick={onCancel}>Cancelar</Btn><Btn v='r' onClick={onConfirm}>Excluir</Btn></div></div>
const ActBtns=({onEdit,onDel})=><div style={{display:'flex',gap:6}}><button onClick={e=>{e.stopPropagation();onEdit();}} style={{background:CARD2,border:'1px solid '+B,borderRadius:7,padding:'5px 10px',cursor:'pointer',color:D1,fontSize:13}}>✏️</button><button onClick={e=>{e.stopPropagation();onDel();}} style={{background:R+'15',border:'1px solid '+R+'30',borderRadius:7,padding:'5px 10px',cursor:'pointer',color:R,fontSize:13}}>🗑️</button></div>
const Loading=()=><div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:D1,fontSize:14,gap:10}}><div style={{width:20,height:20,border:'2px solid '+B,borderTop:'2px solid '+Y,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Carregando...</div>

// ── HOOKS SUPABASE ───────────────────────────────────────
function useTable(table,enabled=true){
  const [rows,setRows]=useState([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    let alive=true
    if(!enabled){setRows([]);setLoading(false);return}
    setLoading(true)
    sb.from(table).select('*').then(({data})=>{if(alive){setRows(data||[]);setLoading(false);}})
    return ()=>{alive=false}
  },[table,enabled])
  async function add(obj){const {data,error}=await sb.from(table).insert([obj]).select();if(error)throw error;if(data)setRows(p=>[...p,data[0]]);}
  async function update(id,obj){const {data,error}=await sb.from(table).update(obj).eq('id',id).select();if(error)throw error;if(data)setRows(p=>p.map(r=>r.id===id?data[0]:r));}
  async function remove(id){const {error}=await sb.from(table).delete().eq('id',id);if(error)throw error;setRows(p=>p.filter(r=>r.id!==id));}
  return {rows,loading,add,update,remove,setRows}
}

function genId(){return Date.now()+Math.random().toString(36).slice(2);}

// ── AI PANEL ─────────────────────────────────────────────
function AIPanel({animais,manejos,estoque,reproducao,financeiro}){
  const [msgs,setMsgs]=useState([{r:'ai',t:'Ola, Angelo! Sou a IA da PecuarIA. O que deseja saber sobre sua fazenda?'}])
  const [inp,setInp]=useState('')
  const [load,setLoad]=useState(false)
  const quick=['Relatorio geral','Analise reprodutiva','Sugestoes de manejo','Estoque critico']
  function send(txt){
    const q=txt||inp.trim();if(!q||load)return;
    setInp('');setMsgs(p=>[...p,{r:'user',t:q}]);setLoad(true);
    const custoM=manejos.reduce((s,m)=>s+manejoCustoTotal(m),0)
    const sys=`Voce e assistente veterinario especialista em pecuaria de corte do sistema PecuarIA da Cabanha Pagliosa, Palmas-PR. Animais:${JSON.stringify(animais.slice(0,20))} Manejos:${JSON.stringify(manejos.slice(0,10))} CustoManejos:R$${custoM.toFixed(2)} Estoque:${JSON.stringify(estoque)}. Responda em portugues, pratico e objetivo.`
    fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:sys,messages:[{role:'user',content:q}]})})
      .then(r=>r.json()).then(d=>{setMsgs(p=>[...p,{r:'ai',t:d.content?.map(c=>c.text||'').join('')||'Erro.'}]);setLoad(false);})
      .catch(()=>{setMsgs(p=>[...p,{r:'ai',t:'Erro de conexao.'}]);setLoad(false);})
  }
  return <div style={{display:'flex',flexDirection:'column',height:'100%',gap:14}}>
    <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{quick.map(q=><button key={q} onClick={()=>send(q)} style={{background:CARD2,border:'1px solid '+B,borderRadius:20,padding:'5px 13px',fontSize:12,cursor:'pointer',color:D1,fontWeight:600}}>{q}</button>)}</div>
    <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:12,minHeight:260}}>
      {msgs.map((m,i)=><div key={i} style={{display:'flex',justifyContent:m.r==='user'?'flex-end':'flex-start'}}><div style={{maxWidth:'83%',background:m.r==='user'?Y:CARD2,color:m.r==='user'?'#000':TX,borderRadius:11,padding:'10px 15px',fontSize:13,lineHeight:1.65,whiteSpace:'pre-wrap'}}>{m.t}</div></div>)}
      {load&&<div style={{display:'flex',gap:5,padding:'10px 15px'}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:G,opacity:0.5}}/>)}</div>}
    </div>
    <div style={{display:'flex',gap:9}}>
      <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder='Pergunte sobre a fazenda...' style={{flex:1,background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'10px 14px',color:TX,fontSize:13,outline:'none'}}/>
      <Btn onClick={()=>send()} disabled={load||!inp.trim()}>Enviar</Btn>
    </div>
  </div>
}

// ── DASHBOARD ─────────────────────────────────────────────
function Dashboard({animais,financeiro,estoque,manejos,agenda,sedes}){
  const statusAtivo=['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural']
  const ativos=animais.filter(a=>statusAtivo.includes(a.status)).length
  const rec=financeiro.filter(f=>f.tipo==='venda'&&!financeiroCancelado(f)).reduce((s,f)=>s+Number(f.valor),0)
  const dep=financeiro.filter(f=>f.tipo==='despesa'&&financeiroPago(f)).reduce((s,f)=>s+Number(f.valor),0)
  const hoje=todayISO()
  const contasPagar=financeiro.filter(financeiroPendente).sort(sortVencimento)
  const contasAtrasadas=contasPagar.filter(f=>f.vencimento&&f.vencimento<hoje)
  const contasHoje=contasPagar.filter(f=>f.vencimento===hoje)
  const totalPagar=contasPagar.reduce((s,f)=>s+Number(f.valor),0)
  const crit=estoque.filter(e=>e.quantidade<=e.minimo).length
  const custoM=manejos.reduce((s,m)=>s+manejoCustoTotal(m),0)
  const pend=agenda.filter(a=>a.status==='pendente')
  return <div>
    <div style={{marginBottom:22}}><div style={{color:TX,fontWeight:800,fontSize:22}}>Visao Geral</div><div style={{color:D2,fontSize:13,marginTop:3}}>Cabanha Pagliosa</div></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))',gap:12,marginBottom:22}}>
      <StatCard icon='🐂' label='Animais Ativos' value={ativos} color={Y}/>
      <StatCard icon='💰' label='Receita' value={fmtR(rec)} color={G}/>
      <StatCard icon='📉' label='Despesas' value={fmtR(dep)} color={R}/>
      <StatCard icon='💵' label='Saldo' value={fmtR(rec-dep)} color={rec-dep>=0?Y:R}/>
      <StatCard icon='🧾' label='Contas a Pagar' value={fmtR(totalPagar)} color={contasAtrasadas.length?R:Y} sub={contasAtrasadas.length?contasAtrasadas.length+' vencida(s)':contasHoje.length+' vence(m) hoje'}/>
      <StatCard icon='💊' label='Custo Manejos' value={fmtR(custoM)} color={PU}/>
      <StatCard icon='⚠️' label='Estoque Critico' value={crit} color={crit>0?R:G} sub={crit>0?'Requer atencao':'Tudo OK'}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
      <div style={{background:CARD,border:'1px solid '+B,borderRadius:12,padding:20}}>
        <div style={{fontWeight:700,color:TX,marginBottom:16,fontSize:14}}>🧾 Contas a Pagar</div>
        {contasPagar.slice(0,5).map(f=>{const atrasada=f.vencimento&&f.vencimento<hoje,venceHoje=f.vencimento===hoje;return <div key={f.id} style={{display:'flex',gap:10,alignItems:'center',marginBottom:13}}>
          <div style={{width:3,height:40,background:atrasada?R:venceHoje?Y:BL,borderRadius:2,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}><div style={{color:TX,fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.descricao}</div><div style={{color:D2,fontSize:11,marginTop:2}}>Vencimento {fmtDate(f.vencimento)} - {fmtR(f.valor)}</div></div>
          <Badge label={atrasada?'Vencida':venceHoje?'Hoje':'Pendente'} color={atrasada?R:venceHoje?Y:BL}/>
        </div>})}
        {contasPagar.length===0&&<div style={{color:D2,fontSize:12}}>Nenhuma conta pendente.</div>}
      </div>
      <div style={{background:CARD,border:'1px solid '+B,borderRadius:12,padding:20}}>
        <div style={{fontWeight:700,color:TX,marginBottom:16,fontSize:14}}>📅 Agenda da Semana</div>
        {pend.slice(0,5).map(a=><div key={a.id} style={{display:'flex',gap:10,marginBottom:13}}><div style={{width:3,height:36,background:Y,borderRadius:2,marginTop:2,flexShrink:0}}/><div><div style={{color:TX,fontSize:13,fontWeight:600}}>{a.titulo}</div><div style={{color:D2,fontSize:11,marginTop:2}}>{fmtDate(a.data)} - {a.tipo}</div></div></div>)}
        {pend.length===0&&<div style={{color:D2,fontSize:12}}>Nenhuma tarefa pendente.</div>}
      </div>
      <div style={{background:CARD,border:'1px solid '+B,borderRadius:12,padding:20}}>
        <div style={{fontWeight:700,color:TX,marginBottom:16,fontSize:14}}>🏡 Distribuicao por Sede</div>
        {sedes.map(s=>{const n=animais.filter(a=>a.sedeId===s.id).length;const pct=ativos>0?(n/ativos)*100:0;return <div key={s.id} style={{marginBottom:14}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:TX,fontSize:13}}>{s.nome}</span><span style={{color:Y,fontWeight:700,fontSize:13}}>{n} 🐂</span></div><div style={{background:B,borderRadius:4,height:5}}><div style={{background:'linear-gradient(90deg,'+Y+','+G+')',width:pct+'%',height:'100%',borderRadius:4}}/></div></div>})}
      </div>
    </div>
  </div>
}

// ── REBANHO ───────────────────────────────────────────────
function Rebanho({sedes,user}){
  const {rows,loading,add,update,remove,setRows}=useTable('animais')
  const {rows:piquetes}=useTable('piquetes')
  const [modal,setModal]=useState(null)
  const [sel,setSel]=useState(null)
  const [filt,setFilt]=useState(''),[fSede,setFSede]=useState(''),[fStatus,setFStatus]=useState('')
  const [fPiquete,setFPiquete]=useState('')
  const [fEspecie,setFEspecie]=useState('')
  const [selected,setSelected]=useState([])
  const [bulk,setBulk]=useState({especie:'',status:'',categoria:'',sedeId:'',piqueteId:''})
  const [brinco,setBrinco]=useState(''),[nome,setNome]=useState(''),[raca,setRaca]=useState('Charolês')
  const [especie,setEspecie]=useState('Bovino')
  const [sexo,setSexo]=useState('M'),[nasc,setNasc]=useState(''),[peso,setPeso]=useState('')
  const [status,setStatus]=useState('Ativo'),[categoria,setCategoria]=useState('Touro')
  const [sedeId,setSedeId]=useState(sedes[0]?.id||''),[pai,setPai]=useState(''),[mae,setMae]=useState('')
  const [piqueteId,setPiqueteId]=useState('')

  const especieOpts=['Bovino','Caprino','Ovino'].map(e=>({v:e,l:e}))
  const racasPorEspecie={Bovino:['Charolês','Caracu','Tabapuã','Nelore','Braford','Brangus','Angus','Hereford','Simmental','Outro'],Caprino:['Boer','Outro'],Ovino:['Texel','Suffolk','Outro']}
  const categoriasPorEspecie={Bovino:['Terneiro','Sobreano','Matriz','Novilha','Touro','Descarte'],Caprino:['Fêmea','Reprodutor','Borrego','Descarte'],Ovino:['Fêmea','Carneiro Reprodutor','Borrego','Descarte']}
  const racaOpts=(racasPorEspecie[especie]||racasPorEspecie.Bovino).map(r=>({v:r,l:r}))
  const categoriaOpts=(categoriasPorEspecie[especie]||categoriasPorEspecie.Bovino).map(c=>({v:c,l:c}))
  function changeEspecie(v){
    setEspecie(v)
    const racas=racasPorEspecie[v]||racasPorEspecie.Bovino
    const cats=categoriasPorEspecie[v]||categoriasPorEspecie.Bovino
    setRaca(racas.includes(raca)?raca:racas[0])
    setCategoria(cats.includes(categoria)?categoria:cats[0])
  }
  function changeSede(v){setSedeId(v);if(!piquetes.some(p=>p.id===piqueteId&&p.sedeId===v))setPiqueteId('');}
  function reset(){setBrinco('');setNome('');setEspecie('Bovino');setRaca('Charolês');setSexo('M');setNasc('');setPeso('');setStatus('Ativo');setCategoria('Touro');setSedeId(sedes[0]?.id||'');setPiqueteId('');setPai('');setMae('');}
  function loadF(a){const esp=a.especie||'Bovino';setBrinco(a.brinco);setNome(a.nome||'');setEspecie(esp);setRaca(a.raca||((racasPorEspecie[esp]||racasPorEspecie.Bovino)[0]));setSexo(a.sexo);setNasc(a.nascimento||'');setPeso(String(a.peso||''));setStatus(a.status);setCategoria(a.categoria||((categoriasPorEspecie[esp]||categoriasPorEspecie.Bovino)[0]));setSedeId(a.sedeId||'');setPiqueteId(a.piqueteId||'');setPai(a.pai||'');setMae(a.mae||'');}
  function buildObj(){return {brinco,nome,especie,raca,sexo,nascimento:nasc,peso:Number(peso),status,categoria,sedeId,piqueteId:piqueteId||null,pai,mae};}

  const statusAtivos=['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural']
  const statusCores={Ativo:G,Prenha:'#34d399','Não Pronta':R,TEF:PU,Inseminada:BL,'Monta Natural':Y,Vendido:'#fb923c',Morto:D2}
  const catColors={Terneiro:BL,Sobreano:'#34d399',Matriz:'#f472b6',Novilha:PU,Touro:Y,Descarte:R,Fêmea:'#f472b6',Reprodutor:Y,'Carneiro Reprodutor':Y,Borrego:BL}
  const lista=rows.filter(a=>(filt===''||a.brinco?.includes(filt)||a.nome?.toLowerCase().includes(filt.toLowerCase()))&&(fSede===''||a.sedeId===fSede)&&(fPiquete===''||a.piqueteId===fPiquete)&&(fStatus===''||fStatus==='ativo_todos'||a.status===fStatus)&&(fEspecie===''||(a.especie||'Bovino')===fEspecie))
  const listaFiltrada=fStatus==='ativo_todos'?lista.filter(a=>statusAtivos.includes(a.status)):lista
  const visibleIds=listaFiltrada.map(a=>a.id)
  const selectedVisible=visibleIds.filter(id=>selected.includes(id)).length
  const allVisibleSelected=visibleIds.length>0&&selectedVisible===visibleIds.length
  const canEdit=user.perfil!=='funcionario'

  const [modalLimpar,setModalLimpar]=useState(false)
  const [confirmText,setConfirmText]=useState('')
  async function limparTodos(){
    await sb.from('animais').delete().neq('id','__nenhum__')
    setModalLimpar(false)
    setConfirmText('')
  }
  async function salvarNovo(){await add({id:genId(),...buildObj()});setModal(null);reset();}
  async function salvarEdit(){await update(sel.id,buildObj());setModal(null);}
  async function confirmarDel(){await remove(sel.id);setSelected(p=>p.filter(id=>id!==sel.id));setModal(null);}
  async function aplicarLote(){
    const obj={}
    if(bulk.especie)obj.especie=bulk.especie
    if(bulk.status)obj.status=bulk.status
    if(bulk.categoria)obj.categoria=bulk.categoria
    if(bulk.sedeId)obj.sedeId=bulk.sedeId
    if(bulk.piqueteId==='__sem__')obj.piqueteId=null
    else if(bulk.piqueteId)obj.piqueteId=bulk.piqueteId
    if(Object.keys(obj).length===0||selected.length===0)return
    const ids=[...selected]
    const {data,error}=await sb.from('animais').update(obj).in('id',ids).select()
    if(error){alert('Erro ao atualizar animais: '+error.message);return}
    setRows(p=>p.map(r=>{
      const novo=data?.find(d=>d.id===r.id)
      return ids.includes(r.id)?(novo||{...r,...obj}):r
    }))
    setSelected([])
    setBulk({especie:'',status:'',categoria:'',sedeId:'',piqueteId:''})
    setModal(null)
  }
  async function excluirSelecionados(){
    const ids=[...selected]
    if(ids.length===0)return
    const {error}=await sb.from('animais').delete().in('id',ids)
    if(error){alert('Erro ao excluir animais: '+error.message);return}
    setRows(p=>p.filter(r=>!ids.includes(r.id)))
    setSelected([])
    setModal(null)
  }
  function toggleOne(id){setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  function toggleVisible(){setSelected(p=>allVisibleSelected?p.filter(id=>!visibleIds.includes(id)):[...new Set([...p,...visibleIds])]);}

  const sedeOpts=sedes.map(s=>({v:s.id,l:s.nome}))
  const piqueteOpts=[{v:'',l:'Sem piquete'},...piquetes.filter(p=>!sedeId||p.sedeId===sedeId).map(p=>({v:p.id,l:p.nome}))]
  const filtroPiquetes=piquetes.filter(p=>!fSede||p.sedeId===fSede)
  const bulkStatusOpts=[{v:'',l:'Manter status atual'},...['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural','Vendido','Morto'].map(s=>({v:s,l:s}))]
  const bulkEspecieOpts=[{v:'',l:'Manter espécie atual'},...especieOpts]
  const bulkCatOpts=[{v:'',l:'Manter categoria atual'},...[...new Set(Object.values(categoriasPorEspecie).flat())].map(c=>({v:c,l:c}))]
  const bulkSedeOpts=[{v:'',l:'Manter sede atual'},...sedeOpts]
  const bulkPiqueteOpts=[{v:'',l:'Manter piquete atual'},{v:'__sem__',l:'Sem piquete'},...piquetes.filter(p=>!bulk.sedeId||p.sedeId===bulk.sedeId).map(p=>{const s=sedes.find(x=>x.id===p.sedeId);return {v:p.id,l:p.nome+(s?' - '+s.nome:'')}})]
  const checkStyle={width:16,height:16,accentColor:Y,cursor:'pointer'}
  const formBody=<div style={{display:'flex',flexDirection:'column',gap:13}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Brinco' value={brinco} onChange={setBrinco}/><Inp label='Nome' value={nome} onChange={setNome}/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}><Inp label='Espécie' value={especie} onChange={changeEspecie} opts={especieOpts}/><Inp label='Raca' value={raca} onChange={setRaca} opts={racaOpts}/><Inp label='Sexo' value={sexo} onChange={setSexo} opts={[{v:'M',l:'Macho'},{v:'F',l:'Femea'}]}/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Categoria' value={categoria} onChange={setCategoria} opts={categoriaOpts}/><Inp label='Status' value={status} onChange={setStatus} opts={['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural','Vendido','Morto'].map(s=>({v:s,l:s}))}/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Nascimento' value={nasc} onChange={setNasc} type='date'/><Inp label='Peso (kg)' value={peso} onChange={setPeso} type='number'/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Pai' value={pai} onChange={setPai}/><Inp label='Mae' value={mae} onChange={setMae}/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Sede' value={sedeId} onChange={changeSede} opts={sedeOpts}/><Inp label='Piquete' value={piqueteId} onChange={setPiqueteId} opts={piqueteOpts}/></div>
  </div>

  return <div>
    <SH title='🐂 Rebanho' action={canEdit&&<Btn onClick={()=>{reset();setModal('new')}}>+ Novo Animal</Btn>}/>
    <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      <input value={filt} onChange={e=>setFilt(e.target.value)} placeholder='Buscar brinco ou nome...' style={{flex:1,minWidth:160,background:CARD,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',color:TX,fontSize:13,outline:'none'}}/>
      <select value={fSede} onChange={e=>{setFSede(e.target.value);setFPiquete('');}} style={{background:CARD,border:'1px solid '+B,borderRadius:9,padding:'9px 13px',color:TX,fontSize:13}}><option value=''>Todas as sedes</option>{sedes.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</select>
      <select value={fPiquete} onChange={e=>setFPiquete(e.target.value)} style={{background:CARD,border:'1px solid '+B,borderRadius:9,padding:'9px 13px',color:TX,fontSize:13}}><option value=''>Todos os piquetes</option>{filtroPiquetes.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}</select>
      <select value={fEspecie} onChange={e=>setFEspecie(e.target.value)} style={{background:CARD,border:'1px solid '+B,borderRadius:9,padding:'9px 13px',color:TX,fontSize:13}}><option value=''>Todas as espécies</option>{['Bovino','Caprino','Ovino'].map(e=><option key={e} value={e}>{e}</option>)}</select>
      <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{background:CARD,border:'1px solid '+B,borderRadius:9,padding:'9px 13px',color:TX,fontSize:13}}>
        <option value=''>Todos os status</option>
        <option value='ativo_todos'>Todos Ativos</option>
        {['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural','Vendido','Morto'].map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={toggleVisible} disabled={listaFiltrada.length===0} style={{background:allVisibleSelected?Y+'18':CARD2,border:'1px solid '+(allVisibleSelected?Y:B),borderRadius:9,padding:'9px 14px',fontSize:13,color:allVisibleSelected?Y:D1,fontWeight:700,cursor:listaFiltrada.length===0?'not-allowed':'pointer'}}>{allVisibleSelected?'Desmarcar todos':'Selecionar todos'}</button>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',fontSize:13,color:D1}}>{listaFiltrada.length} animais</div>
      {selected.length>0&&<button onClick={()=>setSelected([])} style={{background:R+'15',border:'1px solid '+R+'35',borderRadius:9,padding:'9px 14px',fontSize:13,color:R,fontWeight:700,cursor:'pointer'}}>{selected.length} selecionado(s) - limpar</button>}
    </div>
    {canEdit&&selected.length>0&&<div style={{background:Y+'10',border:'1px solid '+Y+'35',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div style={{color:Y,fontWeight:800,fontSize:13}}>{selected.length} animal(is) selecionado(s)</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <Btn v='g' small onClick={()=>{setBulk({especie:'',status:'',categoria:'',sedeId:'',piqueteId:''});setModal('bulk')}}>Aplicar em lote</Btn>
        <Btn v='r' small onClick={()=>setModal('bulkDelete')}>Excluir selecionados</Btn>
      </div>
    </div>}
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:980}}>
          <thead><tr><Th><input type='checkbox' checked={allVisibleSelected} onChange={toggleVisible} style={checkStyle}/></Th><Th>Brinco</Th><Th>Nome</Th><Th>Espécie</Th><Th>Categoria</Th><Th>Raca</Th><Th>Sexo</Th><Th>Nascimento</Th><Th>Peso</Th><Th>Sede</Th><Th>Piquete</Th><Th>Status</Th>{canEdit&&<Th>Acoes</Th>}</tr></thead>
          <tbody>{listaFiltrada.map(a=>{const sede=sedes.find(s=>s.id===a.sedeId);const piq=piquetes.find(p=>p.id===a.piqueteId);const sc=statusCores[a.status]||D1;const marcado=selected.includes(a.id);const esp=a.especie||'Bovino';return <TR key={a.id}><Td><input type='checkbox' checked={marcado} onChange={()=>toggleOne(a.id)} style={checkStyle}/></Td><Td s={{fontWeight:800,color:Y}}>{a.brinco}</Td><Td s={{fontWeight:600}}>{a.nome||'-'}</Td><Td><Badge label={esp} color={esp==='Caprino'?G:esp==='Ovino'?BL:Y}/></Td><Td><Badge label={a.categoria||'-'} color={catColors[a.categoria]||D1}/></Td><Td>{a.raca}</Td><Td>{a.sexo==='M'?'Macho':'Femea'}</Td><Td s={{color:D1}}>{fmtDate(a.nascimento)}</Td><Td s={{fontWeight:700}}>{a.peso?a.peso+' kg':'-'}</Td><Td s={{color:D1,fontSize:12}}>{sede?.nome||'-'}</Td><Td>{piq?<Badge label={piq.nome} color={G}/>:<span style={{color:D2,fontSize:12}}>-</span>}</Td><Td><Badge label={a.status} color={sc} dot/></Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(a);loadF(a);setModal('edit');}} onDel={()=>{setSel(a);setModal('delete');}}/></Td>}</TR>})}</tbody>
        </table>
        {listaFiltrada.length===0&&<Empty/>}
      </div>}
    </div>
    {modal==='new'&&<Modal title='Cadastrar Novo Animal' onClose={()=>setModal(null)}>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarNovo} label='Salvar Animal' disabled={!brinco}/></Modal>}
    {modal==='edit'&&sel&&<Modal title={'Editar: '+sel.brinco} onClose={()=>setModal(null)}>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarEdit} disabled={!brinco}/></Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Animal' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+sel.brinco+'?'} onCancel={()=>setModal(null)} onConfirm={confirmarDel}/></Modal>}
    {modal==='bulk'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{selected.length} animal(is) selecionado(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Espécie' value={bulk.especie} onChange={v=>setBulk(p=>({...p,especie:v}))} opts={bulkEspecieOpts}/>
        <Inp label='Status' value={bulk.status} onChange={v=>setBulk(p=>({...p,status:v}))} opts={bulkStatusOpts}/>
        <Inp label='Categoria' value={bulk.categoria} onChange={v=>setBulk(p=>({...p,categoria:v}))} opts={bulkCatOpts}/>
        <Inp label='Sede' value={bulk.sedeId} onChange={v=>setBulk(p=>({...p,sedeId:v,piqueteId:''}))} opts={bulkSedeOpts}/>
        <Inp label='Piquete' value={bulk.piqueteId} onChange={v=>setBulk(p=>({...p,piqueteId:v}))} opts={bulkPiqueteOpts}/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLote} label='Aplicar nos Selecionados' disabled={!bulk.especie&&!bulk.status&&!bulk.categoria&&!bulk.sedeId&&!bulk.piqueteId}/>
      </div>
    </Modal>}
    {modal==='bulkDelete'&&<Modal title='Excluir Selecionados' onClose={()=>setModal(null)}>
      <DelConfirm msg={'Excluir '+selected.length+' animal(is) selecionado(s)? Essa acao nao pode ser desfeita.'} onCancel={()=>setModal(null)} onConfirm={excluirSelecionados}/>
    </Modal>}
  </div>
}

// ── ESTOQUE ───────────────────────────────────────────────
function Estoque({sedes,user}){
  const {rows,loading,add,update,remove,setRows}=useTable('estoque')
  const [modal,setModal]=useState(null),[sel,setSel]=useState(null)
  const blank={nome:'',categoria:'Hormônio',quantidade:'',unidade:'unid',minimo:'',sedeId:sedes[0]?.id||''}
  const [form,setForm]=useState(blank)
  const [selected,setSelected]=useState([])
  const [bulk,setBulk]=useState({categoria:'',unidade:'',minimo:'',sedeId:''})
  const fv=v=>setForm(p=>({...p,...v}))
  const canEdit=user.perfil!=='funcionario'
  const visibleIds=rows.map(e=>e.id)
  const selectedVisible=visibleIds.filter(id=>selected.includes(id)).length
  const allVisibleSelected=visibleIds.length>0&&selectedVisible===visibleIds.length
  async function salvarNovo(){await add({id:genId(),...form,quantidade:Number(form.quantidade),minimo:Number(form.minimo)});setModal(null);}
  async function salvarEdit(){await update(sel.id,{...form,quantidade:Number(form.quantidade),minimo:Number(form.minimo)});setModal(null);}
  async function confirmarDel(){await remove(sel.id);setSelected(p=>p.filter(id=>id!==sel.id));setModal(null);}
  async function aplicarLote(){
    const obj={}
    if(bulk.categoria)obj.categoria=bulk.categoria
    if(bulk.unidade)obj.unidade=bulk.unidade
    if(bulk.sedeId)obj.sedeId=bulk.sedeId
    if(bulk.minimo!=='')obj.minimo=Number(bulk.minimo)
    if(Object.keys(obj).length===0||selected.length===0)return
    const ids=[...selected]
    const {data,error}=await sb.from('estoque').update(obj).in('id',ids).select()
    if(error){alert('Erro ao atualizar estoque: '+error.message);return}
    setRows(p=>p.map(r=>ids.includes(r.id)?(data?.find(d=>d.id===r.id)||{...r,...obj}):r))
    setSelected([]);setBulk({categoria:'',unidade:'',minimo:'',sedeId:''});setModal(null)
  }
  async function excluirSelecionados(){
    const ids=[...selected]
    if(ids.length===0)return
    const {error}=await sb.from('estoque').delete().in('id',ids)
    if(error){alert('Erro ao excluir estoque: '+error.message);return}
    setRows(p=>p.filter(r=>!ids.includes(r.id)))
    setSelected([]);setModal(null)
  }
  function toggleOne(id){setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  function toggleVisible(){setSelected(p=>allVisibleSelected?p.filter(id=>!visibleIds.includes(id)):[...new Set([...p,...visibleIds])]);}
  const sedeOpts=sedes.map(s=>({v:s.id,l:s.nome}))
  const catEstOpts=['Hormônio','Antiparasitário','Vacina','Ração','Sêmen','Equipamento','Outro'].map(c=>({v:c,l:c}))
  const unidadeOpts=['unid','mL','L','kg','g','dose','comp'].map(u=>({v:u,l:u}))
  const checkStyle={width:16,height:16,accentColor:Y,cursor:'pointer'}
  const fields=<div style={{display:'flex',flexDirection:'column',gap:13}}>
    <Inp label='Nome do Item' value={form.nome} onChange={v=>fv({nome:v})}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Categoria' value={form.categoria} onChange={v=>fv({categoria:v})} opts={catEstOpts}/><Inp label='Unidade' value={form.unidade} onChange={v=>fv({unidade:v})} opts={unidadeOpts}/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Qtd. Atual' value={form.quantidade} onChange={v=>fv({quantidade:v})} type='number'/><Inp label='Estoque Minimo' value={form.minimo} onChange={v=>fv({minimo:v})} type='number'/></div>
    <Inp label='Sede' value={form.sedeId} onChange={v=>fv({sedeId:v})} opts={sedeOpts}/>
  </div>
  return <div>
    <SH title='📦 Estoque e Insumos' action={canEdit&&<Btn onClick={()=>{setForm(blank);setModal('new')}}>+ Novo Item</Btn>}/>
    {canEdit&&<div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      <button onClick={toggleVisible} disabled={rows.length===0} style={{background:allVisibleSelected?Y+'18':CARD2,border:'1px solid '+(allVisibleSelected?Y:B),borderRadius:9,padding:'9px 14px',fontSize:13,color:allVisibleSelected?Y:D1,fontWeight:700,cursor:rows.length===0?'not-allowed':'pointer'}}>{allVisibleSelected?'Desmarcar todos':'Selecionar todos'}</button>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',fontSize:13,color:D1}}>{rows.length} item(ns)</div>
      {selected.length>0&&<button onClick={()=>setSelected([])} style={{background:R+'15',border:'1px solid '+R+'35',borderRadius:9,padding:'9px 14px',fontSize:13,color:R,fontWeight:700,cursor:'pointer'}}>{selected.length} selecionado(s) - limpar</button>}
    </div>}
    {canEdit&&selected.length>0&&<div style={{background:Y+'10',border:'1px solid '+Y+'35',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div style={{color:Y,fontWeight:800,fontSize:13}}>{selected.length} item(ns) selecionado(s)</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Btn v='g' small onClick={()=>{setBulk({categoria:'',unidade:'',minimo:'',sedeId:''});setModal('bulk')}}>Aplicar em lote</Btn><Btn v='r' small onClick={()=>setModal('bulkDelete')}>Excluir selecionados</Btn></div>
    </div>}
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
          <thead><tr>{canEdit&&<Th><input type='checkbox' checked={allVisibleSelected} onChange={toggleVisible} style={checkStyle}/></Th>}<Th>Item</Th><Th>Categoria</Th><Th>Qtd. Atual</Th><Th>Minimo</Th><Th>Sede</Th><Th>Status</Th>{canEdit&&<Th>Acoes</Th>}</tr></thead>
          <tbody>{rows.map(e=>{const crit=e.quantidade<=e.minimo;const sede=sedes.find(s=>s.id===e.sedeId);const marcado=selected.includes(e.id);return <TR key={e.id}>{canEdit&&<Td><input type='checkbox' checked={marcado} onChange={()=>toggleOne(e.id)} style={checkStyle}/></Td>}<Td s={{fontWeight:600}}>{e.nome}</Td><Td><Badge label={e.categoria} color={PU}/></Td><Td s={{fontWeight:800,color:crit?R:TX}}>{e.quantidade+' '+e.unidade}</Td><Td s={{color:D1}}>{e.minimo+' '+e.unidade}</Td><Td s={{color:D1,fontSize:12}}>{sede?.nome||'-'}</Td><Td><Badge label={crit?'Critico':'Normal'} color={crit?R:G} dot/></Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(e);setForm({nome:e.nome,categoria:e.categoria,quantidade:e.quantidade,unidade:e.unidade,minimo:e.minimo,sedeId:e.sedeId});setModal('edit');}} onDel={()=>{setSel(e);setModal('delete');}}/></Td>}</TR>})}</tbody>
        </table>
        {rows.length===0&&<Empty/>}
      </div>}
    </div>
    {modal==='new'&&<Modal title='Novo Item' onClose={()=>setModal(null)}>{fields}<MFooter onCancel={()=>setModal(null)} onSave={salvarNovo} label='Salvar Item' disabled={!form.nome}/></Modal>}
    {modal==='edit'&&sel&&<Modal title={'Editar: '+sel.nome} onClose={()=>setModal(null)}>{fields}<MFooter onCancel={()=>setModal(null)} onSave={salvarEdit} disabled={!form.nome}/></Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Item' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+sel.nome+'?'} onCancel={()=>setModal(null)} onConfirm={confirmarDel}/></Modal>}
    {modal==='bulk'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{selected.length} item(ns) selecionado(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Categoria' value={bulk.categoria} onChange={v=>setBulk(p=>({...p,categoria:v}))} opts={[{v:'',l:'Manter categoria atual'},...catEstOpts]}/>
        <Inp label='Unidade' value={bulk.unidade} onChange={v=>setBulk(p=>({...p,unidade:v}))} opts={[{v:'',l:'Manter unidade atual'},...unidadeOpts]}/>
        <Inp label='Estoque Minimo' value={bulk.minimo} onChange={v=>setBulk(p=>({...p,minimo:v}))} type='number' ph='Deixe vazio para manter'/>
        <Inp label='Sede' value={bulk.sedeId} onChange={v=>setBulk(p=>({...p,sedeId:v}))} opts={[{v:'',l:'Manter sede atual'},...sedeOpts]}/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLote} label='Aplicar nos Selecionados' disabled={!bulk.categoria&&!bulk.unidade&&!bulk.sedeId&&bulk.minimo===''}/>
      </div>
    </Modal>}
    {modal==='bulkDelete'&&<Modal title='Excluir Selecionados' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+selected.length+' item(ns) selecionado(s)?'} onCancel={()=>setModal(null)} onConfirm={excluirSelecionados}/></Modal>}
  </div>
}

// ── CLIENTES E FORNECEDORES ──────────────────────────────
function ClientesFornecedores({user}){
  const {rows,loading,add,update,remove,setRows}=useTable('clientes')
  const [modal,setModal]=useState(null),[sel,setSel]=useState(null),[tab,setTab]=useState('todos')
  const blank={nome:'',tipo:'cliente',documento:'',telefone:'',email:'',cidade:'',estado:'PR',obs:''}
  const [form,setForm]=useState(blank)
  const [selected,setSelected]=useState([])
  const [bulk,setBulk]=useState({tipo:'',cidade:'',estado:''})
  const fv=v=>setForm(p=>({...p,...v}))
  const canEdit=user.perfil!=='funcionario'
  const lista=(tab==='todos'?rows:rows.filter(c=>(c.tipo||'cliente')===tab))
  const visibleIds=lista.map(c=>c.id)
  const selectedVisible=visibleIds.filter(id=>selected.includes(id)).length
  const allVisibleSelected=visibleIds.length>0&&selectedVisible===visibleIds.length
  const tipoColor={cliente:G,fornecedor:Y,ambos:BL}
  const tipoOpts=[{v:'cliente',l:'Cliente'},{v:'fornecedor',l:'Fornecedor'},{v:'ambos',l:'Cliente e Fornecedor'}]
  async function salvarNovo(){try{await add({id:genId(),...form});setModal(null);setForm(blank)}catch(e){alert('Erro ao salvar: '+e.message)}}
  async function salvarEdit(){try{await update(sel.id,form);setModal(null)}catch(e){alert('Erro ao salvar: '+e.message)}}
  async function confirmarDel(){try{await remove(sel.id);setSelected(p=>p.filter(id=>id!==sel.id));setModal(null)}catch(e){alert('Erro ao excluir: '+e.message)}}
  async function aplicarLote(){
    const obj={}
    if(bulk.tipo)obj.tipo=bulk.tipo
    if(bulk.cidade)obj.cidade=bulk.cidade
    if(bulk.estado)obj.estado=bulk.estado
    if(Object.keys(obj).length===0||selected.length===0)return
    const ids=[...selected]
    const {data,error}=await sb.from('clientes').update(obj).in('id',ids).select()
    if(error){alert('Erro ao atualizar cadastros: '+error.message);return}
    setRows(p=>p.map(r=>ids.includes(r.id)?(data?.find(d=>d.id===r.id)||{...r,...obj}):r))
    setSelected([]);setBulk({tipo:'',cidade:'',estado:''});setModal(null)
  }
  async function excluirSelecionados(){
    const ids=[...selected]
    if(ids.length===0)return
    const {error}=await sb.from('clientes').delete().in('id',ids)
    if(error){alert('Erro ao excluir cadastros: '+error.message);return}
    setRows(p=>p.filter(r=>!ids.includes(r.id)))
    setSelected([]);setModal(null)
  }
  function toggleOne(id){setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  function toggleVisible(){setSelected(p=>allVisibleSelected?p.filter(id=>!visibleIds.includes(id)):[...new Set([...p,...visibleIds])]);}
  const checkStyle={width:16,height:16,accentColor:Y,cursor:'pointer'}
  const formBody=<div style={{display:'flex',flexDirection:'column',gap:13}}>
    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
      <Inp label='Nome / Razao Social' value={form.nome} onChange={v=>fv({nome:v})}/>
      <Inp label='Tipo' value={form.tipo} onChange={v=>fv({tipo:v})} opts={tipoOpts}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Inp label='CPF / CNPJ' value={form.documento} onChange={v=>fv({documento:v})}/>
      <Inp label='Telefone / WhatsApp' value={form.telefone} onChange={v=>fv({telefone:v})}/>
    </div>
    <Inp label='E-mail' value={form.email} onChange={v=>fv({email:v})} type='email'/>
    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
      <Inp label='Cidade' value={form.cidade} onChange={v=>fv({cidade:v})}/>
      <Inp label='Estado' value={form.estado} onChange={v=>fv({estado:v})}/>
    </div>
    <Inp label='Observacoes' value={form.obs} onChange={v=>fv({obs:v})}/>
  </div>
  return <div>
    <SH title='👥 Clientes e Fornecedores' action={canEdit&&<Btn onClick={()=>{setForm(blank);setSel(null);setModal('new')}}>+ Novo Cadastro</Btn>}/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:18}}>
      <StatCard icon='👤' label='Clientes' value={rows.filter(c=>(c.tipo||'cliente')==='cliente').length} color={G}/>
      <StatCard icon='🏪' label='Fornecedores' value={rows.filter(c=>c.tipo==='fornecedor').length} color={Y}/>
      <StatCard icon='🔁' label='Ambos' value={rows.filter(c=>c.tipo==='ambos').length} color={BL}/>
      <StatCard icon='📋' label='Total' value={rows.length} color={PU}/>
    </div>
    <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
      {[['todos','Todos'],['cliente','Clientes'],['fornecedor','Fornecedores'],['ambos','Ambos']].map(t=><button key={t[0]} onClick={()=>{setTab(t[0]);}} style={{padding:'6px 16px',borderRadius:8,border:'1px solid '+(tab===t[0]?Y:B),background:tab===t[0]?Y+'18':'transparent',color:tab===t[0]?Y:D1,fontWeight:700,fontSize:12,cursor:'pointer'}}>{t[1]}</button>)}
    </div>
    {canEdit&&<div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      <button onClick={toggleVisible} disabled={lista.length===0} style={{background:allVisibleSelected?Y+'18':CARD2,border:'1px solid '+(allVisibleSelected?Y:B),borderRadius:9,padding:'9px 14px',fontSize:13,color:allVisibleSelected?Y:D1,fontWeight:700,cursor:lista.length===0?'not-allowed':'pointer'}}>{allVisibleSelected?'Desmarcar todos':'Selecionar todos'}</button>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',fontSize:13,color:D1}}>{lista.length} cadastro(s)</div>
      {selected.length>0&&<button onClick={()=>setSelected([])} style={{background:R+'15',border:'1px solid '+R+'35',borderRadius:9,padding:'9px 14px',fontSize:13,color:R,fontWeight:700,cursor:'pointer'}}>{selected.length} selecionado(s) - limpar</button>}
    </div>}
    {canEdit&&selected.length>0&&<div style={{background:Y+'10',border:'1px solid '+Y+'35',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div style={{color:Y,fontWeight:800,fontSize:13}}>{selected.length} cadastro(s) selecionado(s)</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Btn v='g' small onClick={()=>{setBulk({tipo:'',cidade:'',estado:''});setModal('bulk')}}>Aplicar em lote</Btn><Btn v='r' small onClick={()=>setModal('bulkDelete')}>Excluir selecionados</Btn></div>
    </div>}
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:820}}>
          <thead><tr>{canEdit&&<Th><input type='checkbox' checked={allVisibleSelected} onChange={toggleVisible} style={checkStyle}/></Th>}<Th>Nome</Th><Th>Tipo</Th><Th>CPF/CNPJ</Th><Th>Telefone</Th><Th>E-mail</Th><Th>Cidade/UF</Th>{canEdit&&<Th>Acoes</Th>}</tr></thead>
          <tbody>{lista.map(c=>{const tc=tipoColor[c.tipo||'cliente']||D1;const marcado=selected.includes(c.id);return <TR key={c.id}>{canEdit&&<Td><input type='checkbox' checked={marcado} onChange={()=>toggleOne(c.id)} style={checkStyle}/></Td>}<Td s={{fontWeight:700}}>{c.nome}</Td><Td><Badge label={c.tipo||'cliente'} color={tc}/></Td><Td s={{color:D1,fontSize:12}}>{c.documento||'-'}</Td><Td s={{color:D1,fontSize:12}}>{c.telefone||'-'}</Td><Td s={{color:D1,fontSize:12}}>{c.email||'-'}</Td><Td s={{color:D1,fontSize:12}}>{c.cidade?c.cidade+'/'+(c.estado||''):'-'}</Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(c);setForm({nome:c.nome||'',tipo:c.tipo||'cliente',documento:c.documento||'',telefone:c.telefone||'',email:c.email||'',cidade:c.cidade||'',estado:c.estado||'PR',obs:c.obs||''});setModal('edit');}} onDel={()=>{setSel(c);setModal('delete');}}/></Td>}</TR>})}</tbody>
        </table>
        {lista.length===0&&<Empty msg='Nenhum cliente ou fornecedor cadastrado.'/>}
      </div>}
    </div>
    {modal==='new'&&<Modal title='Novo Cliente / Fornecedor' onClose={()=>setModal(null)}>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarNovo} disabled={!form.nome}/></Modal>}
    {modal==='edit'&&sel&&<Modal title={'Editar: '+sel.nome} onClose={()=>setModal(null)}>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarEdit} disabled={!form.nome}/></Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Cadastro' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+sel.nome+'?'} onCancel={()=>setModal(null)} onConfirm={confirmarDel}/></Modal>}
    {modal==='bulk'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{selected.length} cadastro(s) selecionado(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Tipo' value={bulk.tipo} onChange={v=>setBulk(p=>({...p,tipo:v}))} opts={[{v:'',l:'Manter tipo atual'},...tipoOpts]}/>
        <Inp label='Cidade' value={bulk.cidade} onChange={v=>setBulk(p=>({...p,cidade:v}))} ph='Deixe vazio para manter'/>
        <Inp label='Estado' value={bulk.estado} onChange={v=>setBulk(p=>({...p,estado:v}))} ph='Ex: PR'/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLote} label='Aplicar nos Selecionados' disabled={!bulk.tipo&&!bulk.cidade&&!bulk.estado}/>
      </div>
    </Modal>}
    {modal==='bulkDelete'&&<Modal title='Excluir Selecionados' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+selected.length+' cadastro(s) selecionado(s)?'} onCancel={()=>setModal(null)} onConfirm={excluirSelecionados}/></Modal>}
  </div>
}

// ── FINANCEIRO ────────────────────────────────────────────
const CAT_DESP=['Sanidade','Medicamentos','Sal','Alimentação/Ração','Mão de Obra','Combustível','Manutenção','Feitio de Cerca','Roçada','Extração de Erva Mate','Plantio de Erva Mate','Viveiro','Reprodução','Impostos/Taxas','Transporte','Deslocamento/Entrega','Energia Elétrica','Outros']
const CAT_REC=['Venda de Animais','Arrendamento','Serviços','Outros']
const catCorFin={Sanidade:PU,Medicamentos:'#c084fc',Sal:'#facc15','Alimentação/Ração':'#34d399','Mão de Obra':BL,Combustível:'#fb923c',Manutenção:Y,'Feitio de Cerca':'#eab308',Roçada:'#84cc16','Extração de Erva Mate':'#10b981','Plantio de Erva Mate':'#22c55e',Viveiro:'#38bdf8',Reprodução:'#f472b6','Impostos/Taxas':R,Transporte:'#a3e635','Deslocamento/Entrega':BL,'Energia Elétrica':'#facc15','Venda de Animais':G,Arrendamento:G,Serviços:G,Outros:D1}
function Financeiro({clientes,user}){
  const {rows,loading,add,update,remove,setRows}=useTable('financeiro')
  const [modal,setModal]=useState(null),[sel,setSel]=useState(null),[tab,setTab]=useState('todos'),[fCat,setFCat]=useState('')
  const blank={tipo:'despesa',categoria:'Outros',descricao:'',valor:'',data:'',vencimento:'',statusPagamento:'pago',formaPagamento:'',codigoBoleto:'',clienteId:'',propriedadeDestino:'',kmRodados:'',valorKm:'',notaNumero:'',notaSerie:'',notaChave:'',notaEmissao:'',notaUrl:'',notaObs:''}
  const [form,setForm]=useState(blank)
  const [notaFile,setNotaFile]=useState(null)
  const [uploading,setUploading]=useState(false)
  const [selected,setSelected]=useState([])
  const [bulk,setBulk]=useState({tipo:'',categoria:'',data:'',clienteId:''})
  const [parcelas,setParcelas]=useState({qtd:'1'})
  const fv=v=>setForm(p=>({...p,...v}))
  const hoje=todayISO()
  const limite7=(()=>{const d=new Date();d.setDate(d.getDate()+7);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);})()
  const rec=rows.filter(x=>x.tipo==='venda'&&!financeiroCancelado(x)).reduce((s,x)=>s+Number(x.valor),0)
  const dep=rows.filter(x=>x.tipo==='despesa'&&financeiroPago(x)).reduce((s,x)=>s+Number(x.valor),0)
  const contasPagar=rows.filter(financeiroPendente).sort(sortVencimento)
  const contasAtrasadas=contasPagar.filter(x=>x.vencimento&&x.vencimento<hoje)
  const contasHoje=contasPagar.filter(x=>x.vencimento===hoje)
  const contas7=contasPagar.filter(x=>x.vencimento&&x.vencimento>hoje&&x.vencimento<=limite7)
  const totalPagar=contasPagar.reduce((s,x)=>s+Number(x.valor),0)
  const listaBase=tab==='pagar'?contasPagar:(tab==='todos'?rows:rows.filter(x=>x.tipo===tab))
  const lista=listaBase.filter(x=>fCat===''||x.categoria===fCat)
  const canEdit=user.perfil!=='funcionario'
  const visibleIds=lista.map(x=>x.id)
  const selectedVisible=visibleIds.filter(id=>selected.includes(id)).length
  const allVisibleSelected=visibleIds.length>0&&selectedVisible===visibleIds.length
  const catOpts=form.tipo==='venda'?CAT_REC.map(c=>({v:c,l:c})):CAT_DESP.map(c=>({v:c,l:c}))
  const allCatOpts=[...new Set([...CAT_REC,...CAT_DESP])].map(c=>({v:c,l:c}))
  const isDeslocamento=form.categoria==='Deslocamento/Entrega'
  function calcFinanceiroDeslocamento(f){return (parseFloat(f.kmRodados||0)||0)*(parseFloat(f.valorKm||0)||0);}
  function setDeslocamento(v){
    setForm(p=>{
      const next={...p,...v,categoria:'Deslocamento/Entrega',tipo:'despesa'}
      const total=calcFinanceiroDeslocamento(next)
      return {...next,valor:total>0?String(total):next.valor}
    })
  }
  function buildFinanceiro(notaUrl){
    const status=form.tipo==='despesa'?(form.statusPagamento||'pago'):'pago'
    return {...form,notaUrl,statusPagamento:status,valor:Number(form.valor),kmRodados:Number(form.kmRodados)||0,valorKm:Number(form.valorKm)||0}
  }
  function buildParcelas(base,idBase){
    const qtd=Math.max(1,parseInt(parcelas.qtd)||1)
    if(qtd===1)return [{id:idBase,...base}]
    const grupoId=genId()
    const total=Number(base.valor)||0
    const valorParcela=Math.round((total/qtd)*100)/100
    const vencBase=base.vencimento||base.data||todayISO()
    return Array.from({length:qtd},(_,i)=>{
      const valor=i===qtd-1?Math.round((total-(valorParcela*(qtd-1)))*100)/100:valorParcela
      return {...base,id:i===0?idBase:genId(),valor,vencimento:addMonthsISO(vencBase,i),descricao:base.descricao+' ('+(i+1)+'/'+qtd+')',codigoBoleto:i===0?base.codigoBoleto:'',parcelaGrupoId:grupoId,parcelaNumero:i+1,parcelaTotal:qtd}
    })
  }
  async function uploadNota(id){
    if(!notaFile)return form.notaUrl||''
    const safe=notaFile.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-')
    const path=id+'/'+Date.now()+'-'+safe
    const {error}=await sb.storage.from('notas-fiscais').upload(path,notaFile,{upsert:true})
    if(error)throw error
    return 'storage:notas-fiscais/'+path
  }
  function storageNotaPath(url){
    const prefix='storage:notas-fiscais/'
    return url?.startsWith(prefix)?url.slice(prefix.length):''
  }
  async function abrirNotaFiscal(url){
    if(!url)return
    const path=storageNotaPath(url)
    if(path){
      const {data,error}=await sb.storage.from('notas-fiscais').createSignedUrl(path,600)
      if(error){alert('Erro ao abrir nota fiscal: '+error.message);return}
      window.open(data.signedUrl,'_blank','noopener,noreferrer')
      return
    }
    window.open(url,'_blank','noopener,noreferrer')
  }
  async function salvarNovo(){
    const id=genId()
    try{
      setUploading(true)
      const notaUrl=await uploadNota(id)
      const obj=buildFinanceiro(notaUrl)
      const regs=buildParcelas(obj,id)
      if(regs.length===1)await add(regs[0])
      else{
        const {data,error}=await sb.from('financeiro').insert(regs).select()
        if(error)throw error
        setRows(p=>[...p,...(data||regs)])
      }
      setModal(null);setForm(blank);setNotaFile(null);setParcelas({qtd:'1'})
    }
    catch(e){alert('Erro ao salvar: '+e.message)}
    finally{setUploading(false)}
  }
  async function salvarEdit(){
    try{setUploading(true);const notaUrl=await uploadNota(sel.id);await update(sel.id,buildFinanceiro(notaUrl));setModal(null);setNotaFile(null)}
    catch(e){alert('Erro ao salvar: '+e.message)}
    finally{setUploading(false)}
  }
  async function confirmarDel(){try{await remove(sel.id);setSelected(p=>p.filter(id=>id!==sel.id));setModal(null)}catch(e){alert('Erro ao excluir: '+e.message)}}
  async function aplicarLote(){
    const obj={}
    if(bulk.tipo)obj.tipo=bulk.tipo
    if(bulk.categoria)obj.categoria=bulk.categoria
    if(bulk.data)obj.data=bulk.data
    if(bulk.clienteId!=='')obj.clienteId=bulk.clienteId
    if(Object.keys(obj).length===0||selected.length===0)return
    const ids=[...selected]
    const {data,error}=await sb.from('financeiro').update(obj).in('id',ids).select()
    if(error){alert('Erro ao atualizar lancamentos: '+error.message);return}
    setRows(p=>p.map(r=>ids.includes(r.id)?(data?.find(d=>d.id===r.id)||{...r,...obj}):r))
    setSelected([]);setBulk({tipo:'',categoria:'',data:'',clienteId:''});setModal(null)
  }
  async function excluirSelecionados(){
    const ids=[...selected]
    if(ids.length===0)return
    const {error}=await sb.from('financeiro').delete().in('id',ids)
    if(error){alert('Erro ao excluir lancamentos: '+error.message);return}
    setRows(p=>p.filter(r=>!ids.includes(r.id)))
    setSelected([]);setModal(null)
  }
  function abrirDespesaEntrega(){
    setForm({...blank,tipo:'despesa',categoria:'Deslocamento/Entrega',descricao:'Ida para propriedade - entrega de sal/medicamentos'})
    setNotaFile(null)
    setParcelas({qtd:'1'})
    setModal('new')
  }
  function abrirBoleto(){
    setForm({...blank,tipo:'despesa',categoria:'Outros',descricao:'Boleto a pagar',statusPagamento:'pendente',formaPagamento:'Boleto',vencimento:todayISO()})
    setNotaFile(null)
    setParcelas({qtd:'1'})
    setModal('new')
  }
  function toggleOne(id){setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  function toggleVisible(){setSelected(p=>allVisibleSelected?p.filter(id=>!visibleIds.includes(id)):[...new Set([...p,...visibleIds])]);}
  const checkStyle={width:16,height:16,accentColor:Y,cursor:'pointer'}
  const cliOpts=[{v:'',l:'Nenhum'},...clientes.map(c=>({v:c.id,l:c.nome}))]
  const formBody=<div style={{display:'flex',flexDirection:'column',gap:13}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Inp label='Tipo' value={form.tipo} onChange={v=>fv({tipo:v,categoria:v==='venda'?'Venda de Animais':'Outros'})} opts={[{v:'despesa',l:'Despesa'},{v:'venda',l:'Receita'}]}/>
      <Inp label='Categoria' value={form.categoria} onChange={v=>fv({categoria:v})} opts={catOpts}/>
    </div>
    <Inp label='Descrição' value={form.descricao} onChange={v=>fv({descricao:v})} ph='Ex: Ivermectina lote A, Venda Touro 2526...'/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Valor (R$)' value={form.valor} onChange={v=>fv({valor:v})} type='number'/><Inp label='Data' value={form.data} onChange={v=>fv({data:v})} type='date'/></div>
    {form.tipo==='despesa'&&<div style={{display:'flex',flexDirection:'column',gap:13}}>
      <div style={{background:Y+'15',border:'1px solid '+Y+'30',borderRadius:9,padding:'8px 13px',color:Y,fontSize:12,fontWeight:700}}>🧾 Conta / Boleto</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Inp label='Status' value={form.statusPagamento} onChange={v=>fv({statusPagamento:v})} opts={[{v:'pago',l:'Pago'},{v:'pendente',l:'Pendente / Futuro'},{v:'cancelado',l:'Cancelado'}]}/>
        <Inp label='Vencimento' value={form.vencimento} onChange={v=>fv({vencimento:v})} type='date'/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:12}}>
        <Inp label='Forma' value={form.formaPagamento} onChange={v=>fv({formaPagamento:v})} opts={[{v:'',l:'Nao informado'},{v:'Boleto',l:'Boleto'},{v:'Pix',l:'Pix'},{v:'Dinheiro',l:'Dinheiro'},{v:'Cartao',l:'Cartao'},{v:'Transferencia',l:'Transferencia'}]}/>
        <Inp label='Codigo / Linha Digitavel' value={form.codigoBoleto} onChange={v=>fv({codigoBoleto:v})} ph='Linha digitavel ou codigo do boleto'/>
      </div>
      {modal==='new'&&form.statusPagamento==='pendente'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Inp label='Quantidade de Parcelas' value={parcelas.qtd} onChange={v=>setParcelas({qtd:v})} type='number' ph='Ex: 3'/>
        <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'10px 12px'}}>
          <div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Valor por Parcela</div>
          <div style={{color:Y,fontWeight:800,fontSize:18,marginTop:4}}>{fmtR((Number(form.valor)||0)/Math.max(1,parseInt(parcelas.qtd)||1))}</div>
        </div>
      </div>}
      {modal==='new'&&form.statusPagamento==='pendente'&&Number(parcelas.qtd)>1&&<div style={{background:BL+'12',border:'1px solid '+BL+'35',borderRadius:9,padding:'9px 12px',color:BL,fontSize:12,fontWeight:700}}>Serao criadas {parseInt(parcelas.qtd)||1} contas a pagar, uma por mes, vinculadas a esta mesma compra/nota.</div>}
    </div>}
    <Inp label='Cliente / Fornecedor' value={form.clienteId} onChange={v=>fv({clienteId:v})} opts={cliOpts}/>
    {isDeslocamento&&<div style={{display:'flex',flexDirection:'column',gap:13}}>
      <div style={{background:BL+'15',border:'1px solid '+BL+'30',borderRadius:9,padding:'8px 13px',color:BL,fontSize:12,fontWeight:700}}>Deslocamento até a propriedade</div>
      <Inp label='Propriedade / Destino' value={form.propriedadeDestino} onChange={v=>setDeslocamento({propriedadeDestino:v})} ph='Ex: Sede Principal, Fazenda X'/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
        <Inp label='Km Rodados' value={form.kmRodados} onChange={v=>setDeslocamento({kmRodados:v})} type='number'/>
        <Inp label='Valor por Km (R$)' value={form.valorKm} onChange={v=>setDeslocamento({valorKm:v})} type='number'/>
        <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'10px 12px'}}>
          <div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Total KM</div>
          <div style={{color:Y,fontWeight:800,fontSize:18,marginTop:4}}>{fmtR(calcFinanceiroDeslocamento(form))}</div>
        </div>
      </div>
    </div>}
    <div style={{background:Y+'15',border:'1px solid '+Y+'30',borderRadius:9,padding:'8px 13px',color:Y,fontSize:12,fontWeight:700,marginTop:4}}>📄 Nota Fiscal</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Inp label='Numero da Nota' value={form.notaNumero} onChange={v=>fv({notaNumero:v})}/>
      <Inp label='Serie' value={form.notaSerie} onChange={v=>fv({notaSerie:v})}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
      <Inp label='Chave de Acesso' value={form.notaChave} onChange={v=>fv({notaChave:v})}/>
      <Inp label='Emissao' value={form.notaEmissao} onChange={v=>fv({notaEmissao:v})} type='date'/>
    </div>
    <Inp label='Link da Nota / Foto' value={form.notaUrl} onChange={v=>fv({notaUrl:v})} ph='Cole a URL ou envie um arquivo abaixo'/>
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{color:D1,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6}}>Foto ou PDF da Nota</label>
      <input type='file' accept='image/*,.pdf' onChange={e=>setNotaFile(e.target.files?.[0]||null)} style={{background:CARD2,border:'1px solid '+B,borderRadius:8,padding:'9px 12px',color:D1,fontSize:13,width:'100%'}}/>
      <div style={{color:D2,fontSize:11}}>Usa o bucket privado notas-fiscais e abre anexos com link temporario.</div>
    </div>
    <Inp label='Observacoes da Nota' value={form.notaObs} onChange={v=>fv({notaObs:v})}/>
  </div>
  const depPorCat=CAT_DESP.map(c=>({cat:c,total:rows.filter(x=>x.tipo==='despesa'&&x.categoria===c&&!financeiroCancelado(x)).reduce((s,x)=>s+Number(x.valor),0)})).filter(x=>x.total>0)
  return <div>
    <SH title='💰 Financeiro' action={canEdit&&<div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}><Btn v='g' onClick={abrirDespesaEntrega}>+ Ida/Entrega</Btn><Btn v='gh' onClick={abrirBoleto}>+ Boleto Futuro</Btn><Btn onClick={()=>{setForm(blank);setNotaFile(null);setParcelas({qtd:'1'});setModal('new')}}>+ Novo Lançamento</Btn></div>}/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:12,marginBottom:18}}>
      <StatCard icon='📈' label='Receitas' value={fmtR(rec)} color={G}/>
      <StatCard icon='📉' label='Despesas Pagas' value={fmtR(dep)} color={R}/>
      <StatCard icon='💵' label='Saldo' value={fmtR(rec-dep)} color={rec-dep>=0?Y:R}/>
      <StatCard icon='🧾' label='A Pagar' value={fmtR(totalPagar)} color={contasAtrasadas.length?R:Y} sub={contasAtrasadas.length+' vencida(s)'}/>
      <StatCard icon='📋' label='Lançamentos' value={rows.length} color={BL}/>
    </div>
    <div style={{background:CARD,border:'1px solid '+B,borderRadius:12,padding:16,marginBottom:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:12}}>
        <div><div style={{color:TX,fontWeight:800,fontSize:14}}>Relatorio Diario - Contas a Pagar</div><div style={{color:D2,fontSize:12,marginTop:2}}>Hoje: {fmtDate(hoje)}</div></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Badge label={'Vencidas: '+contasAtrasadas.length} color={contasAtrasadas.length?R:D1}/><Badge label={'Hoje: '+contasHoje.length} color={contasHoje.length?Y:D1}/><Badge label={'7 dias: '+contas7.length} color={contas7.length?BL:D1}/></div>
      </div>
      {contasPagar.length>0?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
        {contasPagar.slice(0,6).map(c=>{const atrasada=c.vencimento&&c.vencimento<hoje,venceHoje=c.vencimento===hoje;return <div key={c.id} style={{background:CARD2,border:'1px solid '+B,borderLeft:'3px solid '+(atrasada?R:venceHoje?Y:BL),borderRadius:9,padding:'10px 12px'}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'flex-start'}}><div style={{color:TX,fontWeight:700,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.descricao}</div><div style={{color:atrasada?R:venceHoje?Y:BL,fontWeight:800,fontSize:13}}>{fmtR(c.valor)}</div></div>
          <div style={{color:D2,fontSize:11,marginTop:5}}>Vence {fmtDate(c.vencimento)} - {c.formaPagamento||'sem forma'}</div>
        </div>})}
      </div>:<div style={{color:D2,fontSize:12}}>Nenhuma conta pendente cadastrada.</div>}
    </div>
    {depPorCat.length>0&&<div style={{background:CARD,border:'1px solid '+B,borderRadius:12,padding:16,marginBottom:18}}>
      <div style={{color:D1,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6,marginBottom:12}}>Despesas por Categoria</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{depPorCat.sort((a,b)=>b.total-a.total).map(x=><div key={x.cat} style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'8px 14px',cursor:'pointer',borderLeft:'3px solid '+(catCorFin[x.cat]||D1)}} onClick={()=>setFCat(fCat===x.cat?'':x.cat)}><div style={{color:catCorFin[x.cat]||D1,fontWeight:700,fontSize:13}}>{fmtR(x.total)}</div><div style={{color:D2,fontSize:10,marginTop:2}}>{x.cat}</div></div>)}</div>
    </div>}
    <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
      {[['todos','Todos'],['despesa','Despesas'],['venda','Receitas'],['pagar','Contas a pagar']].map(t=><button key={t[0]} onClick={()=>{setTab(t[0]);setFCat('');}} style={{padding:'6px 16px',borderRadius:8,border:'1px solid '+(tab===t[0]?Y:B),background:tab===t[0]?Y+'18':'transparent',color:tab===t[0]?Y:D1,fontWeight:700,fontSize:12,cursor:'pointer'}}>{t[1]}</button>)}
      {fCat&&<button onClick={()=>setFCat('')} style={{padding:'6px 12px',borderRadius:8,border:'1px solid '+R+'40',background:R+'15',color:R,fontWeight:700,fontSize:11,cursor:'pointer'}}>✕ {fCat}</button>}
    </div>
    {canEdit&&<div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      <button onClick={toggleVisible} disabled={lista.length===0} style={{background:allVisibleSelected?Y+'18':CARD2,border:'1px solid '+(allVisibleSelected?Y:B),borderRadius:9,padding:'9px 14px',fontSize:13,color:allVisibleSelected?Y:D1,fontWeight:700,cursor:lista.length===0?'not-allowed':'pointer'}}>{allVisibleSelected?'Desmarcar todos':'Selecionar todos'}</button>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',fontSize:13,color:D1}}>{lista.length} lancamento(s)</div>
      {selected.length>0&&<button onClick={()=>setSelected([])} style={{background:R+'15',border:'1px solid '+R+'35',borderRadius:9,padding:'9px 14px',fontSize:13,color:R,fontWeight:700,cursor:'pointer'}}>{selected.length} selecionado(s) - limpar</button>}
    </div>}
    {canEdit&&selected.length>0&&<div style={{background:Y+'10',border:'1px solid '+Y+'35',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div style={{color:Y,fontWeight:800,fontSize:13}}>{selected.length} lancamento(s) selecionado(s)</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Btn v='g' small onClick={()=>{setBulk({tipo:'',categoria:'',data:'',clienteId:''});setModal('bulk')}}>Aplicar em lote</Btn><Btn v='r' small onClick={()=>setModal('bulkDelete')}>Excluir selecionados</Btn></div>
    </div>}
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:1180}}>
          <thead><tr>{canEdit&&<Th><input type='checkbox' checked={allVisibleSelected} onChange={toggleVisible} style={checkStyle}/></Th>}<Th>Tipo</Th><Th>Categoria</Th><Th>Descrição</Th><Th>Valor</Th><Th>Data</Th><Th>Vencimento</Th><Th>Status</Th><Th>Destino/Km</Th><Th>Cliente/Fornecedor</Th><Th>Nota</Th>{canEdit&&<Th>Ações</Th>}</tr></thead>
          <tbody>{lista.map(x=>{const cli=clientes.find(c=>c.id===x.clienteId);const cc=catCorFin[x.categoria]||D1;const temNota=x.notaNumero||x.notaUrl||x.notaChave;const marcado=selected.includes(x.id);const desloc=x.categoria==='Deslocamento/Entrega';const st=financeiroStatus(x);const atrasada=st==='pendente'&&x.vencimento&&x.vencimento<hoje;const stColor=st==='pago'?G:st==='cancelado'?D2:atrasada?R:Y;const stLabel=st==='pago'?'Pago':st==='cancelado'?'Cancelado':atrasada?'Vencido':'Pendente';return <TR key={x.id}>{canEdit&&<Td><input type='checkbox' checked={marcado} onChange={()=>toggleOne(x.id)} style={checkStyle}/></Td>}<Td><Badge label={x.tipo==='venda'?'Receita':'Despesa'} color={x.tipo==='venda'?G:R}/></Td><Td><Badge label={x.categoria||'Outros'} color={cc}/></Td><Td s={{fontWeight:600}}>{x.descricao}</Td><Td s={{fontWeight:800,color:x.tipo==='venda'?G:R}}>{fmtR(x.valor)}</Td><Td s={{color:D1,whiteSpace:'nowrap'}}>{fmtDate(x.data)}</Td><Td s={{color:D1,whiteSpace:'nowrap'}}>{fmtDate(x.vencimento)}</Td><Td><Badge label={stLabel} color={stColor} dot/></Td><Td s={{color:D1,fontSize:12}}>{desloc?<div><div style={{color:TX,fontWeight:700}}>{x.propriedadeDestino||'-'}</div><div style={{color:BL,fontWeight:700}}>{x.kmRodados?x.kmRodados+' km':'-'}</div></div>:'-'}</Td><Td s={{color:D1}}>{cli?.nome||'-'}</Td><Td>{temNota?(x.notaUrl?<button onClick={()=>abrirNotaFiscal(x.notaUrl)} style={{background:'transparent',border:'none',color:Y,textDecoration:'none',fontWeight:700,cursor:'pointer',padding:0}}>NF {x.notaNumero||'anexo'}</button>:<Badge label={'NF '+(x.notaNumero||'informada')} color={Y}/>):<span style={{color:D2}}>-</span>}</Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(x);setNotaFile(null);setForm({tipo:x.tipo,categoria:x.categoria||'Outros',descricao:x.descricao,valor:String(x.valor),data:x.data||'',vencimento:x.vencimento||'',statusPagamento:financeiroStatus(x),formaPagamento:x.formaPagamento||'',codigoBoleto:x.codigoBoleto||'',clienteId:x.clienteId||'',propriedadeDestino:x.propriedadeDestino||'',kmRodados:String(x.kmRodados||''),valorKm:String(x.valorKm||''),notaNumero:x.notaNumero||'',notaSerie:x.notaSerie||'',notaChave:x.notaChave||'',notaEmissao:x.notaEmissao||'',notaUrl:x.notaUrl||'',notaObs:x.notaObs||''});setModal('edit');}} onDel={()=>{setSel(x);setModal('delete');}}/></Td>}</TR>})}</tbody>
        </table>
        {lista.length===0&&<Empty/>}
      </div>}
    </div>
    {modal==='new'&&<Modal title='Novo Lançamento' onClose={()=>setModal(null)} wide>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarNovo} disabled={!form.descricao||!form.valor||uploading} label={uploading?'Enviando...':'Salvar'}/></Modal>}
    {modal==='edit'&&sel&&<Modal title={'Editar: '+sel.descricao} onClose={()=>setModal(null)} wide>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarEdit} disabled={!form.descricao||!form.valor||uploading} label={uploading?'Enviando...':'Salvar'}/></Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Lançamento' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+sel.descricao+'?'} onCancel={()=>setModal(null)} onConfirm={confirmarDel}/></Modal>}
    {modal==='bulk'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{selected.length} lancamento(s) selecionado(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Tipo' value={bulk.tipo} onChange={v=>setBulk(p=>({...p,tipo:v}))} opts={[{v:'',l:'Manter tipo atual'},{v:'despesa',l:'Despesa'},{v:'venda',l:'Receita'}]}/>
        <Inp label='Categoria' value={bulk.categoria} onChange={v=>setBulk(p=>({...p,categoria:v}))} opts={[{v:'',l:'Manter categoria atual'},...allCatOpts]}/>
        <Inp label='Data' value={bulk.data} onChange={v=>setBulk(p=>({...p,data:v}))} type='date'/>
        <Inp label='Cliente / Fornecedor' value={bulk.clienteId} onChange={v=>setBulk(p=>({...p,clienteId:v}))} opts={[{v:'',l:'Manter cliente atual'},...clientes.map(c=>({v:c.id,l:c.nome}))]}/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLote} label='Aplicar nos Selecionados' disabled={!bulk.tipo&&!bulk.categoria&&!bulk.data&&bulk.clienteId===''}/>
      </div>
    </Modal>}
    {modal==='bulkDelete'&&<Modal title='Excluir Selecionados' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+selected.length+' lancamento(s) selecionado(s)?'} onCancel={()=>setModal(null)} onConfirm={excluirSelecionados}/></Modal>}
  </div>
}

// ── REPRODUCAO ────────────────────────────────────────────
function Reproducao({animais,sedes,user}){
  const {rows,loading,add,update,remove,setRows}=useTable('reproducao')
  const makeBlank=()=>({animalId:animais[0]?.id||'',tipo:'IATF',data:'',resultado:'Pendente',obs:'',sedeId:sedes[0]?.id||''})
  const [modal,setModal]=useState(null),[sel,setSel]=useState(null),[form,setForm]=useState(makeBlank())
  const [selected,setSelected]=useState([])
  const [bulk,setBulk]=useState({tipo:'',resultado:'',sedeId:''})
  const fv=v=>setForm(p=>({...p,...v}))
  const tColor={IATF:PU,DG:BL,Parto:G,'Monta Natural':Y}
  const rColor={Prenha:G,Vazia:R,Pendente:Y,Normal:BL}
  const canEdit=user.perfil!=='funcionario'
  const visibleIds=rows.map(r=>r.id)
  const selectedVisible=visibleIds.filter(id=>selected.includes(id)).length
  const allVisibleSelected=visibleIds.length>0&&selectedVisible===visibleIds.length
  function reset(){setForm(makeBlank());setSel(null);}
  function loadF(r){setForm({animalId:r.animalId||animais[0]?.id||'',tipo:r.tipo||'IATF',data:r.data||'',resultado:r.resultado||'Pendente',obs:r.obs||'',sedeId:r.sedeId||sedes[0]?.id||''});}
  async function salvarNovo(){await add({id:genId(),...form});setModal(null);reset();}
  async function salvarEdit(){if(!sel)return;await update(sel.id,form);setModal(null);reset();}
  async function confirmarDel(){if(!sel)return;await remove(sel.id);setSelected(p=>p.filter(id=>id!==sel.id));setModal(null);setSel(null);}
  async function aplicarLote(){
    const obj={}
    if(bulk.tipo)obj.tipo=bulk.tipo
    if(bulk.resultado)obj.resultado=bulk.resultado
    if(bulk.sedeId)obj.sedeId=bulk.sedeId
    if(Object.keys(obj).length===0||selected.length===0)return
    const ids=[...selected]
    const {data,error}=await sb.from('reproducao').update(obj).in('id',ids).select()
    if(error){alert('Erro ao atualizar registros: '+error.message);return}
    setRows(p=>p.map(r=>{
      const novo=data?.find(d=>d.id===r.id)
      return ids.includes(r.id)?(novo||{...r,...obj}):r
    }))
    setSelected([])
    setBulk({tipo:'',resultado:'',sedeId:''})
    setModal(null)
  }
  async function excluirSelecionados(){
    const ids=[...selected]
    if(ids.length===0)return
    const {error}=await sb.from('reproducao').delete().in('id',ids)
    if(error){alert('Erro ao excluir registros: '+error.message);return}
    setRows(p=>p.filter(r=>!ids.includes(r.id)))
    setSelected([])
    setModal(null)
  }
  function toggleOne(id){setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  function toggleVisible(){setSelected(p=>allVisibleSelected?p.filter(id=>!visibleIds.includes(id)):[...new Set([...p,...visibleIds])]);}
  const tipoOpts=['IATF','DG','Parto','Monta Natural'].map(t=>({v:t,l:t}))
  const resultadoOpts=['Pendente','Prenha','Vazia','Normal'].map(t=>({v:t,l:t}))
  const sedeOpts=sedes.map(s=>({v:s.id,l:s.nome}))
  const bulkTipoOpts=[{v:'',l:'Manter tipo atual'},...tipoOpts]
  const bulkResultadoOpts=[{v:'',l:'Manter resultado atual'},...resultadoOpts]
  const bulkSedeOpts=[{v:'',l:'Manter sede atual'},...sedeOpts]
  const checkStyle={width:16,height:16,accentColor:Y,cursor:'pointer'}
  return <div>
    <SH title='🔬 Reproducao' action={canEdit&&<Btn onClick={()=>{reset();setModal('new')}}>+ Novo Registro</Btn>}/>
    {canEdit&&<div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      <button onClick={toggleVisible} disabled={rows.length===0} style={{background:allVisibleSelected?Y+'18':CARD2,border:'1px solid '+(allVisibleSelected?Y:B),borderRadius:9,padding:'9px 14px',fontSize:13,color:allVisibleSelected?Y:D1,fontWeight:700,cursor:rows.length===0?'not-allowed':'pointer'}}>{allVisibleSelected?'Desmarcar todos':'Selecionar todos'}</button>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',fontSize:13,color:D1}}>{rows.length} registro(s)</div>
      {selected.length>0&&<button onClick={()=>setSelected([])} style={{background:R+'15',border:'1px solid '+R+'35',borderRadius:9,padding:'9px 14px',fontSize:13,color:R,fontWeight:700,cursor:'pointer'}}>{selected.length} selecionado(s) - limpar</button>}
    </div>}
    {canEdit&&selected.length>0&&<div style={{background:Y+'10',border:'1px solid '+Y+'35',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div style={{color:Y,fontWeight:800,fontSize:13}}>{selected.length} registro(s) selecionado(s)</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <Btn v='g' small onClick={()=>{setBulk({tipo:'',resultado:'',sedeId:''});setModal('bulk')}}>Aplicar em lote</Btn>
        <Btn v='r' small onClick={()=>setModal('bulkDelete')}>Excluir selecionados</Btn>
      </div>
    </div>}
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:780}}>
          <thead><tr>{canEdit&&<Th><input type='checkbox' checked={allVisibleSelected} onChange={toggleVisible} style={checkStyle}/></Th>}<Th>Animal</Th><Th>Tipo</Th><Th>Data</Th><Th>Resultado</Th><Th>Sede</Th><Th>Obs.</Th>{canEdit&&<Th>Acoes</Th>}</tr></thead>
          <tbody>{rows.map(r=>{const a=animais.find(x=>x.id===r.animalId);const sede=sedes.find(s=>s.id===r.sedeId);const marcado=selected.includes(r.id);return <TR key={r.id}>{canEdit&&<Td><input type='checkbox' checked={marcado} onChange={()=>toggleOne(r.id)} style={checkStyle}/></Td>}<Td s={{fontWeight:700,color:Y}}>{a?a.brinco+' - '+(a.nome||a.raca)+' ('+(a.especie||'Bovino')+')':'-'}</Td><Td><Badge label={r.tipo} color={tColor[r.tipo]||D1}/></Td><Td s={{color:D1}}>{fmtDate(r.data)}</Td><Td><Badge label={r.resultado} color={rColor[r.resultado]||D1} dot/></Td><Td s={{color:D1,fontSize:12}}>{sede?.nome||'-'}</Td><Td s={{color:D1}}>{r.obs||'-'}</Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(r);loadF(r);setModal('edit');}} onDel={()=>{setSel(r);setModal('delete');}}/></Td>}</TR>})}</tbody>
        </table>
        {rows.length===0&&<Empty/>}
      </div>}
    </div>
    {(modal==='new'||modal==='edit')&&<Modal title={modal==='edit'?'Editar Registro Reprodutivo':'Novo Registro Reprodutivo'} onClose={()=>{setModal(null);reset();}}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Inp label='Animal' value={form.animalId} onChange={v=>fv({animalId:v})} opts={animais.map(a=>({v:a.id,l:a.brinco+' - '+(a.nome||a.raca)+' ('+(a.especie||'Bovino')+')'}))}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Tipo' value={form.tipo} onChange={v=>fv({tipo:v})} opts={tipoOpts}/><Inp label='Data' value={form.data} onChange={v=>fv({data:v})} type='date'/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Resultado' value={form.resultado} onChange={v=>fv({resultado:v})} opts={resultadoOpts}/><Inp label='Sede' value={form.sedeId} onChange={v=>fv({sedeId:v})} opts={sedeOpts}/></div>
        <Inp label='Observacoes' value={form.obs} onChange={v=>fv({obs:v})}/>
        <MFooter onCancel={()=>{setModal(null);reset();}} onSave={modal==='edit'?salvarEdit:salvarNovo} label={modal==='edit'?'Salvar Alteracoes':'Salvar Registro'} disabled={!form.animalId}/>
      </div>
    </Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Registro' onClose={()=>{setModal(null);setSel(null);}}>
      <DelConfirm msg={'Excluir este registro reprodutivo?'} onCancel={()=>{setModal(null);setSel(null);}} onConfirm={confirmarDel}/>
    </Modal>}
    {modal==='bulk'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{selected.length} registro(s) selecionado(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Tipo' value={bulk.tipo} onChange={v=>setBulk(p=>({...p,tipo:v}))} opts={bulkTipoOpts}/>
        <Inp label='Resultado' value={bulk.resultado} onChange={v=>setBulk(p=>({...p,resultado:v}))} opts={bulkResultadoOpts}/>
        <Inp label='Sede' value={bulk.sedeId} onChange={v=>setBulk(p=>({...p,sedeId:v}))} opts={bulkSedeOpts}/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLote} label='Aplicar nos Selecionados' disabled={!bulk.tipo&&!bulk.resultado&&!bulk.sedeId}/>
      </div>
    </Modal>}
    {modal==='bulkDelete'&&<Modal title='Excluir Selecionados' onClose={()=>setModal(null)}>
      <DelConfirm msg={'Excluir '+selected.length+' registro(s) selecionado(s)? Essa acao nao pode ser desfeita.'} onCancel={()=>setModal(null)} onConfirm={excluirSelecionados}/>
    </Modal>}
  </div>
}

// ── MANEJOS ───────────────────────────────────────────────
function Manejos({sedes,user}){
  const {rows,loading,add,update,remove,setRows}=useTable('manejos')
  const blankMed=()=>({id:genId(),nome:'',qtd:'',unidade:'mL',valor:''})
  const makeBlankForm=()=>({nome:'',data:'',sedeId:sedes[0]?.id||'',cabecas:'',medicamentos:[blankMed()],kmRodados:'',valorKm:'',tempoHoras:'',pessoas:'',valorHoraPessoa:'',obs:'',status:'pendente'})
  const [modal,setModal]=useState(null),[detail,setDetail]=useState(null),[sel,setSel]=useState(null)
  const [form,setForm]=useState(makeBlankForm())
  const [selected,setSelected]=useState([])
  const [bulk,setBulk]=useState({status:'',sedeId:''})
  const canEdit=user.perfil!=='funcionario'
  const visibleIds=rows.map(m=>m.id)
  const selectedVisible=visibleIds.filter(id=>selected.includes(id)).length
  const allVisibleSelected=visibleIds.length>0&&selectedVisible===visibleIds.length
  function calcTotal(meds){return manejoMedicamentosTotal(meds);}
  function calcDeslocamento(m){return manejoDeslocamentoTotal(m);}
  function calcEquipe(m){return manejoEquipeTotal(m);}
  function calcTotalManejo(m){return manejoCustoTotal(m);}
  const ft=calcTotal(form.medicamentos),fd=calcDeslocamento(form),fe=calcEquipe(form),fg=ft+fd+fe,fpp=form.cabecas>0?fg/parseFloat(form.cabecas||1):0
  function resetForm(){setForm(makeBlankForm());setSel(null);}
  function buildManejo(){return {...form,cabecas:parseInt(form.cabecas)||0,kmRodados:parseFloat(form.kmRodados)||0,valorKm:parseFloat(form.valorKm)||0,tempoHoras:parseFloat(form.tempoHoras)||0,pessoas:parseInt(form.pessoas)||0,valorHoraPessoa:parseFloat(form.valorHoraPessoa)||0,medicamentos:form.medicamentos.map(m=>({...m,qtd:parseFloat(m.qtd)||0,valor:parseFloat(m.valor)||0}))};}
  function loadManejo(m){
    const meds=Array.isArray(m.medicamentos)&&m.medicamentos.length?m.medicamentos:[blankMed()]
    setForm({nome:m.nome||'',data:m.data||'',sedeId:m.sedeId||sedes[0]?.id||'',cabecas:String(m.cabecas||''),medicamentos:meds.map(md=>({id:md.id||genId(),nome:md.nome||'',qtd:String(md.qtd||''),unidade:md.unidade||'mL',valor:String(md.valor||'')})),kmRodados:String(m.kmRodados||''),valorKm:String(m.valorKm||''),tempoHoras:String(m.tempoHoras||''),pessoas:String(m.pessoas||''),valorHoraPessoa:String(m.valorHoraPessoa||''),obs:m.obs||'',status:m.status||'pendente'})
  }
  function addMed(){setForm(f=>({...f,medicamentos:[...f.medicamentos,blankMed()]}));}
  function updMed(i,k,v){setForm(f=>({...f,medicamentos:f.medicamentos.map((m,idx)=>idx===i?{...m,[k]:v}:m)}));}
  function remMed(i){setForm(f=>({...f,medicamentos:f.medicamentos.filter((_,idx)=>idx!==i)}));}
  async function salvarNovo(){
    await add({id:genId(),...buildManejo()});setModal(null);resetForm();
  }
  async function salvarEdit(){
    if(!sel)return
    await update(sel.id,buildManejo());setModal(null);resetForm();
  }
  async function confirmarDel(){
    if(!sel)return
    await remove(sel.id);setSelected(p=>p.filter(id=>id!==sel.id));setModal(null);setSel(null);
  }
  async function aplicarLote(){
    const obj={}
    if(bulk.status)obj.status=bulk.status
    if(bulk.sedeId)obj.sedeId=bulk.sedeId
    if(Object.keys(obj).length===0||selected.length===0)return
    const ids=[...selected]
    const {data,error}=await sb.from('manejos').update(obj).in('id',ids).select()
    if(error){alert('Erro ao atualizar manejos: '+error.message);return}
    setRows(p=>p.map(r=>{
      const novo=data?.find(d=>d.id===r.id)
      return ids.includes(r.id)?(novo||{...r,...obj}):r
    }))
    setSelected([])
    setBulk({status:'',sedeId:''})
    setModal(null)
  }
  async function excluirSelecionados(){
    const ids=[...selected]
    if(ids.length===0)return
    const {error}=await sb.from('manejos').delete().in('id',ids)
    if(error){alert('Erro ao excluir manejos: '+error.message);return}
    setRows(p=>p.filter(r=>!ids.includes(r.id)))
    setSelected([])
    setModal(null)
  }
  function toggleOne(id){setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  function toggleVisible(){setSelected(p=>allVisibleSelected?p.filter(id=>!visibleIds.includes(id)):[...new Set([...p,...visibleIds])]);}
  const sC={concluido:G,pendente:Y,cancelado:R},sL={concluido:'Concluido',pendente:'Pendente',cancelado:'Cancelado'}
  const bulkStatusOpts=[{v:'',l:'Manter status atual'},{v:'pendente',l:'Pendente'},{v:'concluido',l:'Concluido'},{v:'cancelado',l:'Cancelado'}]
  const bulkSedeOpts=[{v:'',l:'Manter sede atual'},...sedes.map(s=>({v:s.id,l:s.nome}))]
  const checkStyle={width:16,height:16,accentColor:Y,cursor:'pointer'}
  return <div>
    <SH title='🩺 Manejos Sanitarios' action={canEdit&&<Btn onClick={()=>{resetForm();setModal('new')}}>+ Novo Manejo</Btn>}/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:20}}>
      <StatCard icon='🩺' label='Total' value={rows.length} color={Y}/>
      <StatCard icon='💊' label='Custo Total' value={fmtR(rows.reduce((s,m)=>s+calcTotalManejo(m),0))} color={PU}/>
      <StatCard icon='🚗' label='Deslocamento' value={fmtR(rows.reduce((s,m)=>s+calcDeslocamento(m),0))} color={BL}/>
      <StatCard icon='✅' label='Concluidos' value={rows.filter(m=>m.status==='concluido').length} color={G}/>
      <StatCard icon='⏳' label='Pendentes' value={rows.filter(m=>m.status==='pendente').length} color={Y}/>
    </div>
    {canEdit&&<div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      <button onClick={toggleVisible} disabled={rows.length===0} style={{background:allVisibleSelected?Y+'18':CARD2,border:'1px solid '+(allVisibleSelected?Y:B),borderRadius:9,padding:'9px 14px',fontSize:13,color:allVisibleSelected?Y:D1,fontWeight:700,cursor:rows.length===0?'not-allowed':'pointer'}}>{allVisibleSelected?'Desmarcar todos':'Selecionar todos'}</button>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',fontSize:13,color:D1}}>{rows.length} manejo(s)</div>
      {selected.length>0&&<button onClick={()=>setSelected([])} style={{background:R+'15',border:'1px solid '+R+'35',borderRadius:9,padding:'9px 14px',fontSize:13,color:R,fontWeight:700,cursor:'pointer'}}>{selected.length} selecionado(s) - limpar</button>}
    </div>}
    {canEdit&&selected.length>0&&<div style={{background:Y+'10',border:'1px solid '+Y+'35',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div style={{color:Y,fontWeight:800,fontSize:13}}>{selected.length} manejo(s) selecionado(s)</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <Btn v='g' small onClick={()=>{setBulk({status:'',sedeId:''});setModal('bulk')}}>Aplicar em lote</Btn>
        <Btn v='r' small onClick={()=>setModal('bulkDelete')}>Excluir selecionados</Btn>
      </div>
    </div>}
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:1050}}>
          <thead><tr>{canEdit&&<Th><input type='checkbox' checked={allVisibleSelected} onChange={toggleVisible} style={checkStyle}/></Th>}<Th>Manejo</Th><Th>Data</Th><Th>Sede</Th><Th>Cabecas</Th><Th>Km</Th><Th>Tempo</Th><Th>Pessoas</Th><Th>Custo Total</Th><Th>Custo/Cabeca</Th><Th>Status</Th>{canEdit&&<Th>Acoes</Th>}</tr></thead>
          <tbody>{rows.map(m=>{const total=calcTotalManejo(m);const cpp=m.cabecas>0?total/m.cabecas:0;const sede=sedes.find(s=>s.id===m.sedeId);const marcado=selected.includes(m.id);return <TR key={m.id}>{canEdit&&<Td><input type='checkbox' checked={marcado} onChange={()=>toggleOne(m.id)} style={checkStyle}/></Td>}<Td s={{fontWeight:700,color:BL,textDecoration:'underline',cursor:'pointer'}} onClick={()=>setDetail(m)}>{m.nome}</Td><Td s={{color:D1}}>{fmtDate(m.data)}</Td><Td s={{color:D1,fontSize:12}}>{sede?.nome||'-'}</Td><Td s={{fontWeight:700,textAlign:'center'}}>{m.cabecas}</Td><Td s={{color:D1}}>{m.kmRodados?m.kmRodados+' km':'-'}</Td><Td s={{color:D1}}>{m.tempoHoras?m.tempoHoras+' h':'-'}</Td><Td s={{fontWeight:700,textAlign:'center'}}>{m.pessoas||'-'}</Td><Td s={{fontWeight:800,color:PU}}>{fmtR(total)}</Td><Td s={{fontWeight:700,color:Y}}>{fmtR(cpp)}</Td><Td><Badge label={sL[m.status]||m.status} color={sC[m.status]||D1} dot/></Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(m);loadManejo(m);setModal('edit');}} onDel={()=>{setSel(m);setModal('delete');}}/></Td>}</TR>})}</tbody>
        </table>
        {rows.length===0&&<Empty msg='Nenhum manejo registrado.'/>}
      </div>}
    </div>
    {(modal==='new'||modal==='edit')&&<Modal title={modal==='edit'?'Editar Manejo':'Registrar Manejo Sanitario'} onClose={()=>{setModal(null);resetForm();}} wide>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}><Inp label='Nome' value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))}/><Inp label='Data' value={form.data} onChange={v=>setForm(f=>({...f,data:v}))} type='date'/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Sede' value={form.sedeId} onChange={v=>setForm(f=>({...f,sedeId:v}))} opts={sedes.map(s=>({v:s.id,l:s.nome}))}/><Inp label='Cabecas' value={form.cabecas} onChange={v=>setForm(f=>({...f,cabecas:v}))} type='number'/></div>
        <div style={{background:BL+'15',border:'1px solid '+BL+'30',borderRadius:9,padding:'8px 13px',color:BL,fontSize:12,fontWeight:700}}>Deslocamento e equipe</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <Inp label='Km Rodados' value={form.kmRodados} onChange={v=>setForm(f=>({...f,kmRodados:v}))} type='number'/>
          <Inp label='Valor por Km (R$)' value={form.valorKm} onChange={v=>setForm(f=>({...f,valorKm:v}))} type='number'/>
          <Inp label='Tempo de Serviço (h)' value={form.tempoHoras} onChange={v=>setForm(f=>({...f,tempoHoras:v}))} type='number'/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Inp label='Quantidade de Pessoas' value={form.pessoas} onChange={v=>setForm(f=>({...f,pessoas:v}))} type='number'/>
          <Inp label='Valor/Hora por Pessoa (R$)' value={form.valorHoraPessoa} onChange={v=>setForm(f=>({...f,valorHoraPessoa:v}))} type='number'/>
        </div>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}><label style={{color:D1,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6}}>Medicamentos</label><Btn v='g' small onClick={addMed}>+ Adicionar</Btn></div>
          <div style={{background:CARD2,borderRadius:10,border:'1px solid '+B,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'2.5fr 0.8fr 0.8fr 1fr 1fr auto',padding:'8px 12px',background:CARD,borderBottom:'1px solid '+B}}>{['Medicamento','Qtd','Unidade','Vl. Unit.','Subtotal',''].map((h,i)=><div key={i} style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,padding:'0 4px'}}>{h}</div>)}</div>
            {form.medicamentos.map((m,i)=>{const sub=parseFloat(m.qtd||0)*parseFloat(m.valor||0);return <div key={m.id} style={{display:'grid',gridTemplateColumns:'2.5fr 0.8fr 0.8fr 1fr 1fr auto',padding:'8px 12px',borderBottom:i<form.medicamentos.length-1?'1px solid '+B+'30':'none',alignItems:'center'}}>
              <input value={m.nome} onChange={e=>updMed(i,'nome',e.target.value)} placeholder='Nome' style={{background:'transparent',border:'none',color:TX,fontSize:13,padding:'4px',outline:'none',width:'100%'}}/>
              <input value={m.qtd} onChange={e=>updMed(i,'qtd',e.target.value)} type='number' placeholder='0' style={{background:'transparent',border:'none',color:TX,fontSize:13,padding:'4px',outline:'none',width:'100%',textAlign:'center'}}/>
              <select value={m.unidade} onChange={e=>updMed(i,'unidade',e.target.value)} style={{background:'transparent',border:'none',color:D1,fontSize:12,padding:'4px',cursor:'pointer'}}>{['mL','L','g','kg','dose','unid','comp'].map(u=><option key={u} value={u} style={{background:CARD2}}>{u}</option>)}</select>
              <input value={m.valor} onChange={e=>updMed(i,'valor',e.target.value)} type='number' placeholder='0.00' step='0.01' style={{background:'transparent',border:'none',color:TX,fontSize:13,padding:'4px',outline:'none',width:'100%'}}/>
              <div style={{color:PU,fontWeight:700,fontSize:13,padding:'4px'}}>{fmtR(sub)}</div>
              <button onClick={()=>remMed(i)} disabled={form.medicamentos.length===1} style={{background:'none',border:'none',color:R,cursor:'pointer',fontSize:16,padding:'4px 8px',opacity:form.medicamentos.length===1?0.3:1}}>✕</button>
            </div>})}
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
            <div style={{background:CARD2,border:'1px solid '+B,borderRadius:10,padding:'12px 18px',display:'flex',gap:24}}>
              {[['Medicamentos',fmtR(ft),PU],['Deslocamento',fmtR(fd),BL],['Equipe',fmtR(fe),G],['Total Geral',fmtR(fg),Y],['Custo/Cabeca',fmtR(fpp),Y]].map(([l,v,c])=><div key={l} style={{textAlign:'center'}}><div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>{l}</div><div style={{color:c,fontWeight:800,fontSize:18,marginTop:2}}>{v}</div></div>)}
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Observacoes' value={form.obs} onChange={v=>setForm(f=>({...f,obs:v}))}/><Inp label='Status' value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} opts={[{v:'pendente',l:'Pendente'},{v:'concluido',l:'Concluido'},{v:'cancelado',l:'Cancelado'}]}/></div>
        <MFooter onCancel={()=>{setModal(null);resetForm();}} onSave={modal==='edit'?salvarEdit:salvarNovo} label={modal==='edit'?'Salvar Alteracoes':'Registrar Manejo'} disabled={!form.nome||!form.cabecas}/>
      </div>
    </Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Manejo' onClose={()=>{setModal(null);setSel(null);}}>
      <DelConfirm msg={'Excluir o manejo "'+sel.nome+'"?'} onCancel={()=>{setModal(null);setSel(null);}} onConfirm={confirmarDel}/>
    </Modal>}
    {modal==='bulk'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{selected.length} manejo(s) selecionado(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Status' value={bulk.status} onChange={v=>setBulk(p=>({...p,status:v}))} opts={bulkStatusOpts}/>
        <Inp label='Sede' value={bulk.sedeId} onChange={v=>setBulk(p=>({...p,sedeId:v}))} opts={bulkSedeOpts}/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLote} label='Aplicar nos Selecionados' disabled={!bulk.status&&!bulk.sedeId}/>
      </div>
    </Modal>}
    {modal==='bulkDelete'&&<Modal title='Excluir Selecionados' onClose={()=>setModal(null)}>
      <DelConfirm msg={'Excluir '+selected.length+' manejo(s) selecionado(s)? Essa acao nao pode ser desfeita.'} onCancel={()=>setModal(null)} onConfirm={excluirSelecionados}/>
    </Modal>}
    {detail&&<Modal title={detail.nome} onClose={()=>setDetail(null)} wide>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:12}}>{[['Data',fmtDate(detail.data),TX],['Sede',(sedes.find(s=>s.id===detail.sedeId)||{nome:'-'}).nome,TX],['Cabecas',detail.cabecas,Y],['Km',detail.kmRodados?detail.kmRodados+' km':'-',BL],['Tempo',detail.tempoHoras?detail.tempoHoras+' h':'-',G],['Pessoas',detail.pessoas||'-',Y],['Medicamentos',fmtR(calcTotal(detail.medicamentos)),PU],['Deslocamento',fmtR(calcDeslocamento(detail)),BL],['Equipe',fmtR(calcEquipe(detail)),G],['Total',fmtR(calcTotalManejo(detail)),Y],['Custo/Cabeca',fmtR(detail.cabecas>0?calcTotalManejo(detail)/detail.cabecas:0),Y],['Status',sL[detail.status]||detail.status,sC[detail.status]||D1]].map(([l,v,c])=><div key={l} style={{background:CARD2,borderRadius:9,padding:'12px 14px',border:'1px solid '+B}}><div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>{l}</div><div style={{color:c,fontWeight:700,fontSize:15,marginTop:4}}>{v}</div></div>)}</div>
        {detail.obs&&<div style={{color:D1,fontSize:13}}><strong>Obs:</strong> {detail.obs}</div>}
      </div>
    </Modal>}
  </div>
}

// ── AGENDA ────────────────────────────────────────────────
function Agenda({sedes}){
  const {rows,loading,add,update,remove,setRows}=useTable('agenda')
  const makeBlank=()=>({titulo:'',data:'',tipo:'Reproducao',descricao:'',sedeId:sedes[0]?.id||'',status:'pendente'})
  const [modal,setModal]=useState(null),[sel,setSel]=useState(null),[form,setForm]=useState(makeBlank())
  const [selected,setSelected]=useState([])
  const [bulk,setBulk]=useState({tipo:'',status:'',sedeId:''})
  const fv=v=>setForm(p=>({...p,...v}))
  function reset(){setForm(makeBlank());setSel(null);}
  async function salvarNovo(){await add({id:genId(),...form});setModal(null);reset();}
  async function salvarEdit(){if(!sel)return;await update(sel.id,form);setModal(null);reset();}
  async function confirmarDel(){if(!sel)return;await remove(sel.id);setSelected(p=>p.filter(id=>id!==sel.id));setModal(null);setSel(null);}
  async function toggle(a){await update(a.id,{status:a.status==='pendente'?'concluido':'pendente'});}
  async function aplicarLote(){
    const obj={}
    if(bulk.tipo)obj.tipo=bulk.tipo
    if(bulk.status)obj.status=bulk.status
    if(bulk.sedeId)obj.sedeId=bulk.sedeId
    if(Object.keys(obj).length===0||selected.length===0)return
    const ids=[...selected]
    const {data,error}=await sb.from('agenda').update(obj).in('id',ids).select()
    if(error){alert('Erro ao atualizar tarefas: '+error.message);return}
    setRows(p=>p.map(r=>ids.includes(r.id)?(data?.find(d=>d.id===r.id)||{...r,...obj}):r))
    setSelected([]);setBulk({tipo:'',status:'',sedeId:''});setModal(null)
  }
  async function excluirSelecionados(){
    const ids=[...selected]
    if(ids.length===0)return
    const {error}=await sb.from('agenda').delete().in('id',ids)
    if(error){alert('Erro ao excluir tarefas: '+error.message);return}
    setRows(p=>p.filter(r=>!ids.includes(r.id)))
    setSelected([]);setModal(null)
  }
  function toggleOne(id){setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  function toggleVisible(){setSelected(p=>allVisibleSelected?p.filter(id=>!visibleIds.includes(id)):[...new Set([...p,...visibleIds])]);}
  const tColor={Reproducao:PU,Comercial:Y,Saude:R,Manejo:G,Outro:D1}
  const tipoOpts=['Reproducao','Comercial','Saude','Manejo','Outro'].map(t=>({v:t,l:t}))
  const statusOpts=[{v:'pendente',l:'Pendente'},{v:'concluido',l:'Concluido'}]
  const sedeOpts=sedes.map(s=>({v:s.id,l:s.nome}))
  const pend=rows.filter(a=>a.status==='pendente').sort((a,b)=>a.data?.localeCompare(b.data))
  const done=rows.filter(a=>a.status==='concluido')
  const visibleIds=rows.map(a=>a.id)
  const selectedVisible=visibleIds.filter(id=>selected.includes(id)).length
  const allVisibleSelected=visibleIds.length>0&&selectedVisible===visibleIds.length
  const checkStyle={width:16,height:16,accentColor:Y,cursor:'pointer'}
  function taskRow(a,doneRow=false){
    const sede=sedes.find(s=>s.id===a.sedeId),tc=doneRow?G:(tColor[a.tipo]||D1),marcado=selected.includes(a.id)
    return <div key={a.id} style={{background:CARD,border:'1px solid '+B,borderRadius:11,display:'flex',alignItems:'center',gap:14,padding:doneRow?'11px 18px':'13px 18px',opacity:doneRow?0.55:1}}>
      <input type='checkbox' checked={marcado} onChange={()=>toggleOne(a.id)} style={checkStyle}/>
      <div style={{width:3,height:doneRow?34:44,background:tc,borderRadius:2,flexShrink:0}}/>
      <div style={{flex:1}}><div style={{color:doneRow?D2:TX,fontWeight:700,fontSize:14,textDecoration:doneRow?'line-through':'none'}}>{a.titulo}</div><div style={{color:D2,fontSize:12,marginTop:3}}>{a.descricao} - {fmtDate(a.data)} - {sede?.nome||''}</div></div>
      <Badge label={doneRow?'Feito':a.tipo} color={tc}/>
      <button onClick={()=>toggle(a)} style={{background:doneRow?'none':CARD2,border:doneRow?'none':'1px solid '+B,borderRadius:8,padding:doneRow?'6px 8px':'6px 13px',cursor:'pointer',color:D1,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{doneRow?'Reabrir':'Concluir'}</button>
      <ActBtns onEdit={()=>{setSel(a);setForm({titulo:a.titulo||'',data:a.data||'',tipo:a.tipo||'Reproducao',descricao:a.descricao||'',sedeId:a.sedeId||sedes[0]?.id||'',status:a.status||'pendente'});setModal('edit')}} onDel={()=>{setSel(a);setModal('delete')}}/>
    </div>
  }
  return <div>
    <SH title='📅 Agenda e Tarefas' action={<Btn onClick={()=>{reset();setModal('new')}}>+ Nova Tarefa</Btn>}/>
    <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      <button onClick={toggleVisible} disabled={rows.length===0} style={{background:allVisibleSelected?Y+'18':CARD2,border:'1px solid '+(allVisibleSelected?Y:B),borderRadius:9,padding:'9px 14px',fontSize:13,color:allVisibleSelected?Y:D1,fontWeight:700,cursor:rows.length===0?'not-allowed':'pointer'}}>{allVisibleSelected?'Desmarcar todos':'Selecionar todos'}</button>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',fontSize:13,color:D1}}>{rows.length} tarefa(s)</div>
      {selected.length>0&&<button onClick={()=>setSelected([])} style={{background:R+'15',border:'1px solid '+R+'35',borderRadius:9,padding:'9px 14px',fontSize:13,color:R,fontWeight:700,cursor:'pointer'}}>{selected.length} selecionado(s) - limpar</button>}
    </div>
    {selected.length>0&&<div style={{background:Y+'10',border:'1px solid '+Y+'35',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div style={{color:Y,fontWeight:800,fontSize:13}}>{selected.length} tarefa(s) selecionada(s)</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Btn v='g' small onClick={()=>{setBulk({tipo:'',status:'',sedeId:''});setModal('bulk')}}>Aplicar em lote</Btn><Btn v='r' small onClick={()=>setModal('bulkDelete')}>Excluir selecionados</Btn></div>
    </div>}
    {loading?<Loading/>:<>
      {pend.length>0&&<div style={{marginBottom:10,color:D1,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6}}>Pendentes: {pend.length}</div>}
      <div style={{display:'flex',flexDirection:'column',gap:9,marginBottom:20}}>
        {pend.map(a=>taskRow(a,false))}
        {pend.length===0&&<div style={{color:D2,textAlign:'center',padding:'30px 0',fontSize:13}}>Nenhuma tarefa pendente!</div>}
      </div>
      {done.length>0&&<><div style={{marginBottom:10,color:D2,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6}}>Concluidas: {done.length}</div><div style={{display:'flex',flexDirection:'column',gap:7}}>{done.map(a=>taskRow(a,true))}</div></>}
    </>}
    {(modal==='new'||modal==='edit')&&<Modal title={modal==='edit'?'Editar Tarefa':'Nova Tarefa'} onClose={()=>{setModal(null);reset();}}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Inp label='Titulo' value={form.titulo} onChange={v=>fv({titulo:v})}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Data' value={form.data} onChange={v=>fv({data:v})} type='date'/><Inp label='Tipo' value={form.tipo} onChange={v=>fv({tipo:v})} opts={tipoOpts}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Sede' value={form.sedeId} onChange={v=>fv({sedeId:v})} opts={sedeOpts}/><Inp label='Status' value={form.status} onChange={v=>fv({status:v})} opts={statusOpts}/></div>
        <Inp label='Descricao' value={form.descricao} onChange={v=>fv({descricao:v})}/>
        <MFooter onCancel={()=>{setModal(null);reset();}} onSave={modal==='edit'?salvarEdit:salvarNovo} label={modal==='edit'?'Salvar Alteracoes':'Salvar Tarefa'} disabled={!form.titulo}/>
      </div>
    </Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Tarefa' onClose={()=>{setModal(null);setSel(null);}}><DelConfirm msg={'Excluir '+sel.titulo+'?'} onCancel={()=>{setModal(null);setSel(null);}} onConfirm={confirmarDel}/></Modal>}
    {modal==='bulk'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{selected.length} tarefa(s) selecionada(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Tipo' value={bulk.tipo} onChange={v=>setBulk(p=>({...p,tipo:v}))} opts={[{v:'',l:'Manter tipo atual'},...tipoOpts]}/>
        <Inp label='Status' value={bulk.status} onChange={v=>setBulk(p=>({...p,status:v}))} opts={[{v:'',l:'Manter status atual'},...statusOpts]}/>
        <Inp label='Sede' value={bulk.sedeId} onChange={v=>setBulk(p=>({...p,sedeId:v}))} opts={[{v:'',l:'Manter sede atual'},...sedeOpts]}/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLote} label='Aplicar nos Selecionados' disabled={!bulk.tipo&&!bulk.status&&!bulk.sedeId}/>
      </div>
    </Modal>}
    {modal==='bulkDelete'&&<Modal title='Excluir Selecionados' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+selected.length+' tarefa(s) selecionada(s)?'} onCancel={()=>setModal(null)} onConfirm={excluirSelecionados}/></Modal>}
  </div>
}

// ── SEDES ─────────────────────────────────────────────────
function Sedes({user}){
  const {rows:sedes,loading,add,update,remove}=useTable('sedes')
  const {rows:animais}=useTable('animais')
  const {rows:movs,add:addMov,setRows:setMovs}=useTable('movimentacoes')
  const {rows:estoque}=useTable('estoque')
  const {rows:agenda}=useTable('agenda')
  const {rows:manejos}=useTable('manejos')
  const {rows:piquetes,add:addPiquete,update:updatePiquete,remove:removePiquete}=useTable('piquetes')
  const [tab,setTab]=useState('sedes'),[modal,setModal]=useState(null),[sel,setSel]=useState(null)
  const [form,setForm]=useState({nome:'',cidade:'',estado:'PR'})
  const blankPiquete={nome:'',sedeId:sedes[0]?.id||'',areaHa:'',capacidade:'',obs:''}
  const [formPiquete,setFormPiquete]=useState(blankPiquete)
  const ff=v=>setForm(p=>({...p,...v}))
  const fp=v=>setFormPiquete(p=>({...p,...v}))
  const blankMov={animalId:'',sedeDestId:'',data:'',motivo:''}
  const [movForm,setMovForm]=useState(blankMov)
  const hasAnim=sel&&animais.some(a=>a.sedeId===sel.id)
  const hasAnimPiquete=sel&&animais.some(a=>a.piqueteId===sel.id)
  const canManage=user.perfil!=='funcionario'
  async function salvarNova(){await add({id:genId(),...form});setModal(null);setForm({nome:'',cidade:'',estado:'PR'});}
  async function salvarEdit(){await update(sel.id,form);setModal(null);}
  async function confirmarDel(){await remove(sel.id);setModal(null);}
  async function salvarNovoPiquete(){await addPiquete({id:genId(),...formPiquete,areaHa:Number(formPiquete.areaHa)||0,capacidade:Number(formPiquete.capacidade)||0});setModal(null);setFormPiquete(blankPiquete);}
  async function salvarEditPiquete(){await updatePiquete(sel.id,{...formPiquete,areaHa:Number(formPiquete.areaHa)||0,capacidade:Number(formPiquete.capacidade)||0});setModal(null);}
  async function confirmarDelPiquete(){await removePiquete(sel.id);setModal(null);}
  const animalSel=animais.find(a=>a.id===movForm.animalId)
  async function salvarMov(){
    if(!movForm.animalId||!movForm.sedeDestId||!movForm.data)return
    const orig=animalSel?.sedeId
    if(orig===movForm.sedeDestId)return
    const mov={id:genId(),animalId:movForm.animalId,sedeOrigId:orig,sedeDestId:movForm.sedeDestId,data:movForm.data,motivo:movForm.motivo}
    await sb.from('animais').update({sedeId:movForm.sedeDestId,piqueteId:null}).eq('id',movForm.animalId)
    await addMov(mov)
    setMovForm(blankMov)
  }
  const sedeForm=<div style={{display:'flex',flexDirection:'column',gap:13}}><Inp label='Nome da Sede' value={form.nome} onChange={v=>ff({nome:v})}/><div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}><Inp label='Cidade' value={form.cidade} onChange={v=>ff({cidade:v})}/><Inp label='Estado' value={form.estado} onChange={v=>ff({estado:v})}/></div></div>
  const piqueteForm=<div style={{display:'flex',flexDirection:'column',gap:13}}>
    <Inp label='Nome do Piquete' value={formPiquete.nome} onChange={v=>fp({nome:v})} ph='Ex: Piquete 1, Campo Norte'/>
    <Inp label='Sede / Fazenda' value={formPiquete.sedeId} onChange={v=>fp({sedeId:v})} opts={sedes.map(s=>({v:s.id,l:s.nome}))}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Area (ha)' value={formPiquete.areaHa} onChange={v=>fp({areaHa:v})} type='number'/><Inp label='Capacidade de Animais' value={formPiquete.capacidade} onChange={v=>fp({capacidade:v})} type='number'/></div>
    <Inp label='Observacoes' value={formPiquete.obs} onChange={v=>fp({obs:v})} ph='Ex: agua, sombra, sal, potreiro de inverno'/>
  </div>
  if(loading)return <Loading/>
  return <div>
    <SH title='🗺️ Sedes e Localidades' action={(user.perfil==='admin'&&tab==='sedes'&&<Btn onClick={()=>setModal('new')}>+ Nova Sede</Btn>)||(canManage&&tab==='piquetes'&&<Btn onClick={()=>{setSel(null);setFormPiquete({...blankPiquete,sedeId:sedes[0]?.id||''});setModal('new_piquete')}}>+ Novo Piquete</Btn>)}/>
    <div style={{display:'flex',gap:6,marginBottom:20}}>{[['sedes','Sedes'],['piquetes','Piquetes'],['movimentacoes','Movimentacoes']].map(t=><button key={t[0]} onClick={()=>setTab(t[0])} style={{padding:'7px 18px',borderRadius:8,border:'1px solid '+(tab===t[0]?Y:B),background:tab===t[0]?Y+'18':'transparent',color:tab===t[0]?Y:D1,fontWeight:700,fontSize:13,cursor:'pointer'}}>{t[1]}</button>)}</div>
    {tab==='sedes'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:16}}>
      {sedes.map(s=>{  const statusAtivo=['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural']
  const an=animais.filter(a=>a.sedeId===s.id).length,pi=piquetes.filter(p=>p.sedeId===s.id).length,es=estoque.filter(e=>e.sedeId===s.id).length,ag=agenda.filter(a=>a.sedeId===s.id&&a.status==='pendente').length,ma=manejos.filter(m=>m.sedeId===s.id).length;return <div key={s.id} style={{background:CARD,border:'1px solid '+B,borderRadius:14,padding:22,borderTop:'3px solid '+Y}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:11}}><div style={{width:42,height:42,borderRadius:10,background:Y+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🏡</div><div><div style={{color:TX,fontWeight:800,fontSize:15}}>{s.nome}</div><div style={{color:D2,fontSize:12,marginTop:2}}>{s.cidade}, {s.estado}</div></div></div>
          {user.perfil==='admin'&&<div style={{display:'flex',gap:6,flexShrink:0}}><button onClick={()=>{setSel(s);setForm({nome:s.nome,cidade:s.cidade,estado:s.estado});setModal('edit');}} style={{background:CARD2,border:'1px solid '+B,borderRadius:7,padding:'5px 10px',cursor:'pointer',color:D1,fontSize:13}}>✏️</button><button onClick={()=>{setSel(s);setModal('delete');}} style={{background:R+'15',border:'1px solid '+R+'30',borderRadius:7,padding:'5px 10px',cursor:'pointer',color:R,fontSize:13}}>🗑️</button></div>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>{[[an,'Animais',Y],[pi,'Piquetes',G],[es,'Insumos',PU],[ag,'Tarefas',BL],[ma,'Manejos',G]].map(([n,l,c])=><div key={l} style={{background:CARD2,borderRadius:8,padding:'10px 12px',border:'1px solid '+B}}><div style={{color:c,fontWeight:800,fontSize:20}}>{n}</div><div style={{color:D2,fontSize:11,marginTop:2}}>{l}</div></div>)}</div>
      </div>})}
    </div>}
    {tab==='piquetes'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
      {piquetes.map(p=>{const sede=sedes.find(s=>s.id===p.sedeId);const an=animais.filter(a=>a.piqueteId===p.id);const cap=Number(p.capacidade||0);const pct=cap>0?Math.min((an.length/cap)*100,100):0;const lotado=cap>0&&an.length>=cap;return <div key={p.id} style={{background:CARD,border:'1px solid '+B,borderRadius:14,padding:20,borderTop:'3px solid '+(lotado?R:G)}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',marginBottom:14}}>
          <div><div style={{color:TX,fontWeight:800,fontSize:16}}>{p.nome}</div><div style={{color:D2,fontSize:12,marginTop:3}}>{sede?.nome||'-'}</div></div>
          {canManage&&<div style={{display:'flex',gap:6,flexShrink:0}}><button onClick={()=>{setSel(p);setFormPiquete({nome:p.nome||'',sedeId:p.sedeId||sedes[0]?.id||'',areaHa:String(p.areaHa||''),capacidade:String(p.capacidade||''),obs:p.obs||''});setModal('edit_piquete');}} style={{background:CARD2,border:'1px solid '+B,borderRadius:7,padding:'5px 10px',cursor:'pointer',color:D1,fontSize:13}}>✏️</button><button onClick={()=>{setSel(p);setModal('delete_piquete');}} style={{background:R+'15',border:'1px solid '+R+'30',borderRadius:7,padding:'5px 10px',cursor:'pointer',color:R,fontSize:13}}>🗑️</button></div>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:9,marginBottom:12}}>
          {[[an.length,'Animais',Y],[p.areaHa?Number(p.areaHa).toLocaleString('pt-BR'):'-','ha',BL],[cap||'-','Capacidade',PU]].map(([n,l,c])=><div key={l} style={{background:CARD2,borderRadius:8,padding:'10px 12px',border:'1px solid '+B}}><div style={{color:c,fontWeight:800,fontSize:18}}>{n}</div><div style={{color:D2,fontSize:10,marginTop:2}}>{l}</div></div>)}
        </div>
        {cap>0&&<div style={{marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',color:D2,fontSize:11,marginBottom:5}}><span>Ocupacao</span><span>{Math.round(pct)}%</span></div><div style={{background:B,borderRadius:5,height:7}}><div style={{background:lotado?R:G,width:pct+'%',height:'100%',borderRadius:5}}/></div></div>}
        {p.obs&&<div style={{color:D2,fontSize:12,lineHeight:1.45}}>{p.obs}</div>}
        {an.length>0&&<div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:12}}>{an.slice(0,8).map(a=><Badge key={a.id} label={a.brinco} color={Y}/>) }{an.length>8&&<Badge label={'+'+(an.length-8)} color={D1}/>}</div>}
      </div>})}
      {piquetes.length===0&&<div style={{gridColumn:'1/-1'}}><Empty msg='Nenhum piquete cadastrado. Crie subdivisoes para separar os animais dentro da mesma sede.'/></div>}
    </div>}
    {tab==='movimentacoes'&&<div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:18,alignItems:'start'}}>
      <div style={{background:CARD,border:'1px solid '+B,borderRadius:12,padding:20}}>
        <div style={{fontWeight:700,color:TX,marginBottom:16,fontSize:14}}>Nova Transferencia</div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Inp label='Animal' value={movForm.animalId} onChange={v=>setMovForm(f=>({...f,animalId:v,sedeDestId:''}))} opts={[{v:'',l:'Selecione...'},...animais.filter(a=>a.status==='Ativo').map(a=>({v:a.id,l:a.brinco+' - '+(a.nome||a.raca)}))]}/>
          {animalSel&&<div style={{background:CARD2,borderRadius:8,padding:'10px 13px',border:'1px solid '+B}}><div style={{color:D2,fontSize:11,fontWeight:600,textTransform:'uppercase'}}>Sede Atual</div><div style={{color:Y,fontWeight:700,fontSize:13,marginTop:4}}>{sedes.find(s=>s.id===animalSel.sedeId)?.nome||'-'}</div></div>}
          <Inp label='Sede de Destino' value={movForm.sedeDestId} onChange={v=>setMovForm(f=>({...f,sedeDestId:v}))} opts={[{v:'',l:'Selecione...'},...sedes.filter(s=>!animalSel||s.id!==animalSel.sedeId).map(s=>({v:s.id,l:s.nome}))]}/>
          <Inp label='Data' value={movForm.data} onChange={v=>setMovForm(f=>({...f,data:v}))} type='date'/>
          <Inp label='Motivo' value={movForm.motivo} onChange={v=>setMovForm(f=>({...f,motivo:v}))}/>
          <Btn onClick={salvarMov} disabled={!movForm.animalId||!movForm.sedeDestId||!movForm.data} s={{width:'100%',padding:'11px',marginTop:2}}>Confirmar Transferencia</Btn>
        </div>
      </div>
      <div style={{background:CARD,border:'1px solid '+B,borderRadius:12,overflow:'hidden'}}>
        <div style={{padding:'16px 18px',borderBottom:'1px solid '+B,fontWeight:700,color:TX,fontSize:14}}>Historico de Movimentacoes</div>
        <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:540}}>
          <thead><tr><Th>Animal</Th><Th>Origem</Th><Th>Destino</Th><Th>Data</Th><Th>Motivo</Th></tr></thead>
          <tbody>{[...movs].reverse().map(m=>{const a=animais.find(x=>x.id===m.animalId);const orig=sedes.find(s=>s.id===m.sedeOrigId);const dest=sedes.find(s=>s.id===m.sedeDestId);return <TR key={m.id}><Td s={{fontWeight:700,color:Y}}>{a?.brinco||'-'}</Td><Td s={{color:D1,fontSize:12}}>{orig?.nome||'-'}</Td><Td><Badge label={dest?.nome||'-'} color={G}/></Td><Td s={{color:D1,fontSize:12}}>{fmtDate(m.data)}</Td><Td s={{color:D1,fontSize:12}}>{m.motivo||'-'}</Td></TR>})}</tbody>
        </table>
        {movs.length===0&&<Empty msg='Nenhuma movimentacao registrada.'/>}</div>
      </div>
    </div>}
    {modal==='new'&&<Modal title='Nova Sede' onClose={()=>setModal(null)}>{sedeForm}<MFooter onCancel={()=>setModal(null)} onSave={salvarNova} label='Criar Sede' disabled={!form.nome}/></Modal>}
    {modal==='edit'&&sel&&<Modal title={'Editar: '+sel.nome} onClose={()=>setModal(null)}>{sedeForm}<MFooter onCancel={()=>setModal(null)} onSave={salvarEdit} disabled={!form.nome}/></Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Sede' onClose={()=>setModal(null)}>
      <div style={{background:hasAnim?R+'15':CARD2,border:'1px solid '+(hasAnim?R:B),borderRadius:10,padding:16,marginBottom:18}}>
        {hasAnim?<><div style={{color:R,fontWeight:700,marginBottom:6}}>Nao e possivel excluir</div><div style={{color:D1,fontSize:13}}>{sel.nome} possui animais. Transfira-os antes.</div></>:<><div style={{color:TX,fontWeight:700,marginBottom:6}}>Confirmar exclusao</div><div style={{color:D1,fontSize:13}}>Excluir {sel.nome}?</div></>}
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><Btn v='gh' onClick={()=>setModal(null)}>Cancelar</Btn>{!hasAnim&&<Btn v='r' onClick={confirmarDel}>Excluir Sede</Btn>}</div>
    </Modal>}
    {modal==='new_piquete'&&<Modal title='Novo Piquete' onClose={()=>setModal(null)}>{piqueteForm}<MFooter onCancel={()=>setModal(null)} onSave={salvarNovoPiquete} label='Criar Piquete' disabled={!formPiquete.nome||!formPiquete.sedeId}/></Modal>}
    {modal==='edit_piquete'&&sel&&<Modal title={'Editar Piquete: '+sel.nome} onClose={()=>setModal(null)}>{piqueteForm}<MFooter onCancel={()=>setModal(null)} onSave={salvarEditPiquete} label='Salvar Piquete' disabled={!formPiquete.nome||!formPiquete.sedeId}/></Modal>}
    {modal==='delete_piquete'&&sel&&<Modal title='Excluir Piquete' onClose={()=>setModal(null)}>
      <div style={{background:hasAnimPiquete?R+'15':CARD2,border:'1px solid '+(hasAnimPiquete?R:B),borderRadius:10,padding:16,marginBottom:18}}>
        {hasAnimPiquete?<><div style={{color:R,fontWeight:700,marginBottom:6}}>Nao e possivel excluir</div><div style={{color:D1,fontSize:13}}>{sel.nome} possui animais. Mova os animais para outro piquete antes.</div></>:<><div style={{color:TX,fontWeight:700,marginBottom:6}}>Confirmar exclusao</div><div style={{color:D1,fontSize:13}}>Excluir o piquete {sel.nome}?</div></>}
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><Btn v='gh' onClick={()=>setModal(null)}>Cancelar</Btn>{!hasAnimPiquete&&<Btn v='r' onClick={confirmarDelPiquete}>Excluir Piquete</Btn>}</div>
    </Modal>}
  </div>
}

// ── USUARIOS ──────────────────────────────────────────────
function Usuarios({sedes}){
  const {rows,loading,add}=useTable('usuarios')
  const blank={nome:'',email:'',senha:'',authUserId:'',perfil:'funcionario',sedeId:''}
  const [modal,setModal]=useState(false),[form,setForm]=useState(blank)
  const fv=v=>setForm(p=>({...p,...v}))
  async function salvar(){
    const obj={id:genId(),nome:form.nome,email:form.email,perfil:form.perfil,sedeId:form.sedeId}
    if(form.authUserId)obj.authUserId=form.authUserId
    if(form.senha)obj.senha=form.senha
    await add(obj);setModal(false);setForm(blank);
  }
  const pColor={admin:Y,gestor:G,funcionario:BL}
  return <div>
    <SH title='👥 Gestao de Usuarios' action={<Btn onClick={()=>setModal(true)}>+ Novo Usuario</Btn>}/>
    {loading?<Loading/>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
      {rows.map(u=>{const sede=sedes.find(s=>s.id===u.sedeId);const pc=pColor[u.perfil]||D1;return <div key={u.id} style={{background:CARD,border:'1px solid '+B,borderLeft:'3px solid '+pc,borderRadius:12,padding:20}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}><div style={{width:38,height:38,borderRadius:9,background:pc+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>👤</div><div><div style={{color:TX,fontWeight:700,fontSize:14}}>{u.nome}</div><div style={{color:D2,fontSize:12,marginTop:2}}>{u.email}</div></div></div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><Badge label={u.perfil} color={pc}/><Badge label={u.authUserId?'Auth ligado':'Auth pendente'} color={u.authUserId?G:R}/><span style={{color:D2,fontSize:11}}>{sede?.nome||'Todas as sedes'}</span></div>
      </div>})}
    </div>}
    {modal&&<Modal title='Novo Usuario' onClose={()=>setModal(false)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Inp label='Nome Completo' value={form.nome} onChange={v=>fv({nome:v})}/>
        <Inp label='E-mail' value={form.email} onChange={v=>fv({email:v})} type='email'/>
        <div style={{background:BL+'12',border:'1px solid '+BL+'35',borderRadius:10,padding:12,color:D1,fontSize:12,lineHeight:1.5}}>Crie o usuario em Supabase Authentication primeiro. Depois cole aqui o User ID para ligar este perfil ao login seguro.</div>
        <Inp label='Auth User ID' value={form.authUserId} onChange={v=>fv({authUserId:v})} ph='UUID do usuario no Supabase Auth'/>
        <Inp label='Senha antiga (temporaria)' value={form.senha} onChange={v=>fv({senha:v})} type='password' ph='Use apenas ate migrar para Auth'/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Perfil' value={form.perfil} onChange={v=>fv({perfil:v})} opts={[{v:'admin',l:'Admin'},{v:'gestor',l:'Gestor'},{v:'funcionario',l:'Funcionario'}]}/><Inp label='Sede' value={form.sedeId} onChange={v=>fv({sedeId:v})} opts={[{v:'',l:'Todas'},...sedes.map(s=>({v:s.id,l:s.nome}))]}/></div>
        <MFooter onCancel={()=>setModal(false)} onSave={salvar} label='Criar Usuario' disabled={!form.nome||!form.email}/>
      </div>
    </Modal>}
  </div>
}

// ── GRAFICOS ──────────────────────────────────────────────
function Graficos({animais,financeiro,reproducao,manejos,sedes}){
  const statusAtivo=['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural']
  const catCount={};animais.filter(a=>statusAtivo.includes(a.status)).forEach(a=>{const c=a.categoria||'Sem categoria';catCount[c]=(catCount[c]||0)+1;});
  const catData=Object.keys(catCount).map(k=>({name:k,valor:catCount[k]}));
  const catColors={Terneiro:BL,Sobreano:'#34d399',Matriz:'#f472b6',Novilha:PU,Touro:Y,Descarte:R,Fêmea:'#f472b6',Reprodutor:Y,'Carneiro Reprodutor':Y,Borrego:BL,'Sem categoria':D1};
  const racaCount={};animais.filter(a=>statusAtivo.includes(a.status)).forEach(a=>{racaCount[a.raca]=(racaCount[a.raca]||0)+1;});
  const racaData=Object.keys(racaCount).map(k=>({name:k,valor:racaCount[k]}));
  const racaColors=[Y,G,BL,PU,R,'#34d399'];
  const mesMap={};financeiro.forEach(f=>{if(!f.data)return;const mes=f.data.substring(0,7);if(!mesMap[mes])mesMap[mes]={mes,receita:0,despesa:0};if(f.tipo==='venda')mesMap[mes].receita+=Number(f.valor);else mesMap[mes].despesa+=Number(f.valor);});
  const finData=Object.values(mesMap).sort((a,b)=>a.mes.localeCompare(b.mes)).map(m=>({name:m.mes.replace('-','/'),receita:m.receita,despesa:m.despesa}));
  const repCount={};reproducao.forEach(r=>{repCount[r.resultado]=(repCount[r.resultado]||0)+1;});
  const repData=Object.keys(repCount).map(k=>({name:k,valor:repCount[k]}));
  const repColors={Prenha:G,Vazia:R,Pendente:Y,Normal:BL};
  const sedeData=sedes.map(s=>({name:s.nome,animais:animais.filter(a=>a.sedeId===s.id&&statusAtivo.includes(a.status)).length}));
  const tt={contentStyle:{background:CARD2,border:'1px solid '+B,borderRadius:8,color:TX,fontSize:12},labelStyle:{color:D1}};
  const card={background:CARD,border:'1px solid '+B,borderRadius:12,padding:20};
  return <div>
    <div style={{color:TX,fontWeight:800,fontSize:22,marginBottom:6}}>📊 Graficos e Analises</div>
    <div style={{color:D2,fontSize:13,marginBottom:22}}>Visualizacao dos dados da Cabanha Pagliosa</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
      <div style={card}><div style={{color:TX,fontWeight:700,fontSize:14,marginBottom:16}}>🐂 Animais por Categoria</div><ResponsiveContainer width='100%' height={220}><BarChart data={catData}><CartesianGrid strokeDasharray='3 3' stroke={B}/><XAxis dataKey='name' tick={{fill:D1,fontSize:11}}/><YAxis tick={{fill:D1,fontSize:11}}/><Tooltip {...tt}/><Bar dataKey='valor' name='Animais' radius={[6,6,0,0]}>{catData.map((e,i)=><Cell key={i} fill={catColors[e.name]||PU}/>)}</Bar></BarChart></ResponsiveContainer></div>
      <div style={card}><div style={{color:TX,fontWeight:700,fontSize:14,marginBottom:16}}>🧬 Animais por Raca</div><ResponsiveContainer width='100%' height={220}><PieChart><Pie data={racaData} dataKey='valor' nameKey='name' cx='50%' cy='50%' outerRadius={80} label={e=>e.name+' ('+e.valor+')'}>{racaData.map((e,i)=><Cell key={i} fill={racaColors[i%racaColors.length]}/>)}</Pie><Tooltip {...tt}/></PieChart></ResponsiveContainer></div>
      <div style={card}><div style={{color:TX,fontWeight:700,fontSize:14,marginBottom:16}}>💰 Financeiro por Mes</div>{finData.length===0?<div style={{color:D2,textAlign:'center',padding:'40px 0',fontSize:13}}>Sem lancamentos com data.</div>:<ResponsiveContainer width='100%' height={220}><BarChart data={finData}><CartesianGrid strokeDasharray='3 3' stroke={B}/><XAxis dataKey='name' tick={{fill:D1,fontSize:11}}/><YAxis tick={{fill:D1,fontSize:11}}/><Tooltip {...tt} formatter={v=>'R$ '+v.toLocaleString('pt-BR')}/><Legend wrapperStyle={{color:D1,fontSize:12}}/><Bar dataKey='receita' name='Receita' fill={G} radius={[4,4,0,0]}/><Bar dataKey='despesa' name='Despesa' fill={R} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>}</div>
      <div style={card}><div style={{color:TX,fontWeight:700,fontSize:14,marginBottom:16}}>🔬 Resultados de Reproducao</div>{repData.length===0?<div style={{color:D2,textAlign:'center',padding:'40px 0',fontSize:13}}>Sem registros.</div>:<ResponsiveContainer width='100%' height={220}><PieChart><Pie data={repData} dataKey='valor' nameKey='name' cx='50%' cy='50%' outerRadius={80} label={e=>e.name+' ('+e.valor+')'}>{repData.map((e,i)=><Cell key={i} fill={repColors[e.name]||PU}/>)}</Pie><Tooltip {...tt}/><Legend wrapperStyle={{color:D1,fontSize:12}}/></PieChart></ResponsiveContainer>}</div>
      <div style={card}><div style={{color:TX,fontWeight:700,fontSize:14,marginBottom:16}}>🏡 Animais por Sede</div><ResponsiveContainer width='100%' height={220}><BarChart data={sedeData}><CartesianGrid strokeDasharray='3 3' stroke={B}/><XAxis dataKey='name' tick={{fill:D1,fontSize:11}}/><YAxis tick={{fill:D1,fontSize:11}}/><Tooltip {...tt}/><Bar dataKey='animais' name='Animais' fill={Y} radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
    </div>
  </div>
}

// ── EXCEL ─────────────────────────────────────────────────
function ExcelPanel({sedes}){
  const {rows:animais}=useTable('animais')
  const {rows:financeiro}=useTable('financeiro')
  const {rows:estoque}=useTable('estoque')
  const {rows:clientes}=useTable('clientes')
  const {rows:piquetes}=useTable('piquetes')
  const fileRef=useRef(null)
  const [importTab,setImportTab]=useState('animais'),[importMsg,setImportMsg]=useState(null),[preview,setPreview]=useState(null)
  function exportSheet(name,data,file){const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,name);XLSX.writeFile(wb,file+'.xlsx');}
  function exportAnimais(){exportSheet('Rebanho',animais.map(a=>{const s=sedes.find(x=>x.id===a.sedeId)||{nome:''};const p=piquetes.find(x=>x.id===a.piqueteId)||{nome:''};return {Brinco:a.brinco,Nome:a.nome||'',Especie:a.especie||'Bovino',Categoria:a.categoria||'',Raca:a.raca,Sexo:a.sexo,Nascimento:a.nascimento||'',Peso:a.peso||'',Status:a.status,Sede:s.nome,Piquete:p.nome};}),'PecuarIA_Rebanho');}
  function exportFin(){exportSheet('Financeiro',financeiro.map(f=>{const c=clientes.find(x=>x.id===f.clienteId)||{nome:''};return {Tipo:f.tipo,Categoria:f.categoria||'',Descricao:f.descricao,Valor:f.valor,Data:f.data||'',Vencimento:f.vencimento||'',Status_Pagamento:f.statusPagamento||'pago',Forma_Pagamento:f.formaPagamento||'',Codigo_Boleto:f.codigoBoleto||'',Parcela_Numero:f.parcelaNumero||1,Parcela_Total:f.parcelaTotal||1,Grupo_Parcelas:f.parcelaGrupoId||'',Propriedade:f.propriedadeDestino||'',Km_Rodados:f.kmRodados||'',Valor_Km:f.valorKm||'',Cliente:c.nome||''};}),'PecuarIA_Financeiro');}
  function exportEst(){exportSheet('Estoque',estoque.map(e=>{const s=sedes.find(x=>x.id===e.sedeId)||{nome:''};return {Nome:e.nome,Categoria:e.categoria,Quantidade:e.quantidade,Unidade:e.unidade,Minimo:e.minimo,Sede:s.nome};}),'PecuarIA_Estoque');}
  function downloadTemplate(tipo){
    const tpls={
      animais:[{Brinco:'2526',Nome:'Touro 2526',Especie:'Bovino',Categoria:'Touro',Raca:'Charolês',Sexo:'M',Nascimento:'2022-03-15',Peso:820,Status:'Ativo',Sede:'Sede Principal',Piquete:'Piquete 1'},{Brinco:'4001',Nome:'Cabra Boer 4001',Especie:'Caprino',Categoria:'Fêmea',Raca:'Boer',Sexo:'F',Nascimento:'2024-08-20',Peso:65,Status:'Ativo',Sede:'Sede Principal',Piquete:'Piquete 2'},{Brinco:'5001',Nome:'Borrego Texel 5001',Especie:'Ovino',Categoria:'Borrego',Raca:'Texel',Sexo:'M',Nascimento:'2025-01-12',Peso:42,Status:'Ativo',Sede:'Sede Principal',Piquete:'Piquete 2'}],
      financeiro:[{Tipo:'despesa',Categoria:'Medicamentos',Descricao:'Ivermectina lote A',Valor:1500,Data:'2026-05-01',Vencimento:'',Status_Pagamento:'pago',Forma_Pagamento:'Pix',Codigo_Boleto:'',Parcela_Numero:1,Parcela_Total:1,Grupo_Parcelas:'',Propriedade:'',Km_Rodados:'',Valor_Km:'',Cliente:''},{Tipo:'despesa',Categoria:'Sal',Descricao:'Boleto sal mineral (1/3)',Valor:933.33,Data:'2026-05-02',Vencimento:'2026-05-20',Status_Pagamento:'pendente',Forma_Pagamento:'Boleto',Codigo_Boleto:'00000.00000 00000.000000 00000.000000 0 00000000000000',Parcela_Numero:1,Parcela_Total:3,Grupo_Parcelas:'compra-sal-maio',Propriedade:'',Km_Rodados:'',Valor_Km:'',Cliente:''},{Tipo:'despesa',Categoria:'Sal',Descricao:'Boleto sal mineral (2/3)',Valor:933.33,Data:'2026-05-02',Vencimento:'2026-06-20',Status_Pagamento:'pendente',Forma_Pagamento:'Boleto',Codigo_Boleto:'',Parcela_Numero:2,Parcela_Total:3,Grupo_Parcelas:'compra-sal-maio',Propriedade:'',Km_Rodados:'',Valor_Km:'',Cliente:''},{Tipo:'despesa',Categoria:'Deslocamento/Entrega',Descricao:'Ida para propriedade - entrega de sal e medicamentos',Valor:280,Data:'2026-05-02',Vencimento:'',Status_Pagamento:'pago',Forma_Pagamento:'',Codigo_Boleto:'',Parcela_Numero:1,Parcela_Total:1,Grupo_Parcelas:'',Propriedade:'Sede Principal',Km_Rodados:112,Valor_Km:2.5,Cliente:''}],
      estoque:[{Nome:'Ivermectina 1%',Categoria:'Antiparasitário',Quantidade:50,Unidade:'mL',Minimo:10,Sede:'Sede Principal'}],
      manejos:[{Brinco:'2526',Nome:'Touro 2526',Especie:'Bovino',Categoria:'Touro',Raca:'Charoles',Sexo:'M',Peso:820,Status:'Ativo',Nome_Manejo:'Vermifugacao Maio',Data:'2026-05-10',Sede:'Sede Principal',Piquete:'Piquete 1',Km_Rodados:80,Valor_Km:2.5,Tempo_Horas:3,Pessoas:2,Valor_Hora_Pessoa:35,Medicamento:'Ivermectina 1%',Quantidade:10,Unidade:'mL',Valor_Unit:0.85,Obs:'Dose individual'},{Brinco:'4001',Nome:'Cabra Boer 4001',Especie:'Caprino',Categoria:'Fêmea',Raca:'Boer',Sexo:'F',Peso:65,Status:'Ativo',Nome_Manejo:'Vermifugacao Maio',Data:'2026-05-10',Sede:'Sede Principal',Piquete:'Piquete 2',Km_Rodados:80,Valor_Km:2.5,Tempo_Horas:3,Pessoas:2,Valor_Hora_Pessoa:35,Medicamento:'Closantel',Quantidade:5,Unidade:'mL',Valor_Unit:1.20,Obs:'Animal novo sera criado se nao existir'},{Brinco:'5001',Nome:'Borrego Texel 5001',Especie:'Ovino',Categoria:'Borrego',Raca:'Texel',Sexo:'M',Peso:42,Status:'Ativo',Nome_Manejo:'Vermifugacao Maio',Data:'2026-05-10',Sede:'Sede Principal',Piquete:'Piquete 2',Km_Rodados:80,Valor_Km:2.5,Tempo_Horas:3,Pessoas:2,Valor_Hora_Pessoa:35,Medicamento:'Vermifugo',Quantidade:3,Unidade:'mL',Valor_Unit:0.95,Obs:'Tambem aceita ovinos e caprinos'}],
      vendas:[{Brinco:'2526',Data:'2026-05-10',Valor:18000,Peso:650,Comprador:'João da Silva',CPF:'000.000.000-00',Telefone:'(46) 99999-9999',Cidade:'Palmas',Estado:'PR',Obs:'GTA 1234'}]
    }
    exportSheet(tipo,tpls[tipo],'Template_'+tipo)
  }
  function handleFile(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{try{const wb=XLSX.read(ev.target.result,{type:'binary'});const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:''});setPreview({rows,file:file.name});setImportMsg(null);}catch{setImportMsg({type:'error',text:'Erro ao ler o arquivo.'});}};reader.readAsBinaryString(file);e.target.value='';}
  async function confirmarImport(){
    if(!preview)return
    const rows=preview.rows
    try{
      if(importTab==='animais'){
        const novos=rows.map(r=>{const sede=sedes.find(s=>s.nome===r.Sede)||sedes[0];const piquete=piquetes.find(p=>p.nome===r.Piquete&&p.sedeId===sede?.id);const especie=r.Especie||r.Espécie||'Bovino';return {id:genId(),brinco:String(r.Brinco||''),nome:r.Nome||'',especie,categoria:r.Categoria||'',raca:r.Raca||(especie==='Caprino'?'Boer':especie==='Ovino'?'Texel':'Charolês'),sexo:r.Sexo==='F'?'F':'M',nascimento:r.Nascimento||'',peso:Number(r.Peso)||0,status:r.Status||'Ativo',sedeId:sede?.id||'',piqueteId:piquete?.id||null,pai:r.Pai||'',mae:r.Mae||''};}).filter(a=>a.brinco)
        await sb.from('animais').insert(novos)
        setImportMsg({type:'ok',text:novos.length+' animal(is) importado(s)!'})
      } else if(importTab==='financeiro'){
        const novos=rows.map(r=>{const cli=clientes.find(c=>c.nome===r.Cliente);const km=Number(r.Km_Rodados)||0,valorKm=Number(r.Valor_Km)||0,totalKm=km*valorKm;const tipo=['venda','Venda','receita','Receita'].includes(r.Tipo)?'venda':'despesa';return {id:genId(),tipo,categoria:r.Categoria||'Outros',descricao:r.Descricao||'',valor:Number(r.Valor)||totalKm||0,data:r.Data||'',vencimento:r.Vencimento||'',statusPagamento:tipo==='despesa'?(r.Status_Pagamento||'pago'):'pago',formaPagamento:r.Forma_Pagamento||'',codigoBoleto:r.Codigo_Boleto||'',parcelaNumero:Number(r.Parcela_Numero)||1,parcelaTotal:Number(r.Parcela_Total)||1,parcelaGrupoId:r.Grupo_Parcelas||'',propriedadeDestino:r.Propriedade||'',kmRodados:km,valorKm,clienteId:cli?.id||''};}).filter(f=>f.descricao)
        await sb.from('financeiro').insert(novos)
        setImportMsg({type:'ok',text:novos.length+' lançamento(s) importado(s)!'})
      } else if(importTab==='estoque'){
        const novos=rows.map(r=>{const sede=sedes.find(s=>s.nome===r.Sede)||sedes[0];return {id:genId(),nome:r.Nome||'',categoria:r.Categoria||'Outro',quantidade:Number(r.Quantidade)||0,unidade:r.Unidade||'unid',minimo:Number(r.Minimo)||0,sedeId:sede?.id||''};}).filter(e=>e.nome)
        await sb.from('estoque').insert(novos)
        setImportMsg({type:'ok',text:novos.length+' item(s) importado(s)!'})
      } else if(importTab==='manejos'){
        const existentes=new Map(animais.map(a=>[String(a.brinco||'').trim(),a]))
        const novosAnimaisMap={}
        rows.forEach(r=>{
          const brinco=String(r.Brinco||'').trim()
          if(!brinco||existentes.has(brinco)||novosAnimaisMap[brinco])return
          const sede=sedes.find(s=>s.nome===r.Sede)||sedes[0]
          const piquete=piquetes.find(p=>p.nome===r.Piquete&&p.sedeId===sede?.id)
          const especie=r.Especie||r.Espécie||'Bovino'
          const categoriaPadrao=especie==='Ovino'?'Borrego':especie==='Caprino'?'Fêmea':'Touro'
          const racaPadrao=especie==='Caprino'?'Boer':especie==='Ovino'?'Texel':'Outro'
          novosAnimaisMap[brinco]={id:genId(),brinco,nome:r.Nome||'',especie,categoria:r.Categoria||categoriaPadrao,raca:r.Raca||racaPadrao,sexo:r.Sexo==='F'?'F':'M',nascimento:r.Nascimento||'',peso:Number(r.Peso)||0,status:r.Status||'Ativo',sedeId:sede?.id||'',piqueteId:piquete?.id||null,pai:r.Pai||'',mae:r.Mae||''}
        })
        const novosAnimais=Object.values(novosAnimaisMap)
        if(novosAnimais.length)await sb.from('animais').insert(novosAnimais)

        const grupos={}
        rows.forEach(r=>{
          const sede=sedes.find(s=>s.nome===r.Sede)||sedes[0]
          const chave=(r.Nome_Manejo||'Manejo')+'||'+(r.Data||'')+'||'+(sede?.id||'')
          if(!grupos[chave])grupos[chave]={nome:r.Nome_Manejo||'Manejo',data:r.Data||'',sedeId:sede?.id||'',cabecas:Number(r.Num_Cabecas)||0,kmRodados:Number(r.Km_Rodados)||0,valorKm:Number(r.Valor_Km)||0,tempoHoras:Number(r.Tempo_Horas)||0,pessoas:Number(r.Pessoas)||0,valorHoraPessoa:Number(r.Valor_Hora_Pessoa)||0,meds:[],brincos:new Set(),obs:[]}
          const brinco=String(r.Brinco||'').trim()
          if(brinco)grupos[chave].brincos.add(brinco)
          if(r.Obs)grupos[chave].obs.push(String(r.Obs))
          if(r.Medicamento)grupos[chave].meds.push({id:genId(),nome:String(r.Medicamento),qtd:Number(r.Quantidade)||0,unidade:r.Unidade||'mL',valor:Number(r.Valor_Unit)||0})
        })
        const novos=Object.values(grupos).map(g=>{
          const brincos=[...g.brincos]
          const obs=['Importado via Excel',brincos.length?'Animais: '+brincos.join(', '):'',...g.obs].filter(Boolean).join(' | ')
          return {id:genId(),nome:g.nome,data:g.data,sedeId:g.sedeId,cabecas:brincos.length||g.cabecas,kmRodados:g.kmRodados,valorKm:g.valorKm,tempoHoras:g.tempoHoras,pessoas:g.pessoas,valorHoraPessoa:g.valorHoraPessoa,medicamentos:g.meds,obs,status:'concluido'}
        })
        if(novos.length)await sb.from('manejos').insert(novos)
        setImportMsg({type:'ok',text:novos.length+' manejo(s) criado(s), '+novosAnimais.length+' animal(is) novo(s) cadastrado(s) e '+rows.length+' linha(s) processada(s)!'})
      } else if(importTab==='vendas'){
        const novos=rows.filter(r=>r.Brinco).map(r=>{const animal=animais.find(a=>String(a.brinco)===String(r.Brinco));return {id:genId(),animalId:animal?.id||'',data:r.Data||'',valor:Number(r.Valor)||0,peso:Number(r.Peso)||0,compradorNome:r.Comprador||'',compradorCpf:r.CPF||'',compradorTelefone:r.Telefone||'',compradorCidade:r.Cidade||'',compradorEstado:r.Estado||'PR',obs:r.Obs||''};})
        await sb.from('vendas').insert(novos)
        // Atualizar status dos animais para Vendido
        const ids=novos.map(v=>v.animalId).filter(Boolean)
        if(ids.length)await sb.from('animais').update({status:'Vendido'}).in('id',ids)
        // Lançar receitas no financeiro
        const fins=novos.filter(v=>v.animalId).map(v=>{const a=animais.find(x=>x.id===v.animalId);return {id:genId(),tipo:'venda',categoria:'Venda de Animais',descricao:'Venda: '+(a?.brinco||'')+' para '+v.compradorNome,valor:v.valor,data:v.data,clienteId:''};})
        if(fins.length)await sb.from('financeiro').insert(fins)
        setImportMsg({type:'ok',text:novos.length+' venda(s) importada(s)! Animais marcados como Vendido.'})
      }
      setPreview(null)
    }catch(err){setImportMsg({type:'error',text:'Erro: '+err.message})}
  }
  const exportBtns=[{label:'🐂 Rebanho',fn:exportAnimais,color:Y},{label:'💰 Financeiro',fn:exportFin,color:G},{label:'📦 Estoque',fn:exportEst,color:PU}]
  const importTabs=[['animais','🐂 Rebanho'],['manejos','🩺 Manejos (Lida)'],['vendas','💲 Vendas'],['financeiro','💰 Financeiro'],['estoque','📦 Estoque']]
  const descTab={animais:'Importe bovinos, caprinos e ovinos em massa. Baixe o template, preencha especie, categoria, raca, sede e piquete, depois envie.',manejos:'Importe lidas por brinco, medicamento, sede e piquete. Animais novos sao cadastrados automaticamente; animais existentes recebem apenas o manejo.',vendas:'Importe vendas de animais. O status do animal vira "Vendido" e a receita é lançada no financeiro automaticamente.',financeiro:'Importe lançamentos financeiros (despesas e receitas) em lote.',estoque:'Importe itens de estoque em massa.'}
  const card={background:CARD,border:'1px solid '+B,borderRadius:12,padding:22}
  return <div>
    <div style={{color:TX,fontWeight:800,fontSize:22,marginBottom:6}}>📂 Importar / Exportar Excel</div>
    <div style={{color:D2,fontSize:13,marginBottom:22}}>Exporte dados ou importe planilhas para alimentar o sistema automaticamente</div>
    <div style={{...card,marginBottom:18}}>
      <div style={{color:TX,fontWeight:700,fontSize:15,marginBottom:6}}>⬇️ Exportar para Excel</div>
      <div style={{color:D2,fontSize:13,marginBottom:16}}>Baixe os dados em formato .xlsx para editar ou arquivar.</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>{exportBtns.map(b=><button key={b.label} onClick={b.fn} style={{background:b.color+'18',border:'1px solid '+b.color+'40',borderRadius:10,padding:'12px 16px',cursor:'pointer',color:b.color,fontWeight:700,fontSize:13,textAlign:'left'}}>{b.label}</button>)}</div>
    </div>
    <div style={card}>
      <div style={{color:TX,fontWeight:700,fontSize:15,marginBottom:6}}>⬆️ Importar do Excel</div>
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>{importTabs.map(t=><button key={t[0]} onClick={()=>{setImportTab(t[0]);setPreview(null);setImportMsg(null);}} style={{padding:'7px 16px',borderRadius:8,border:'1px solid '+(importTab===t[0]?Y:B),background:importTab===t[0]?Y+'18':'transparent',color:importTab===t[0]?Y:D1,fontWeight:700,fontSize:13,cursor:'pointer'}}>{t[1]}</button>)}</div>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:10,padding:14,marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div><div style={{color:TX,fontWeight:600,fontSize:13}}>📄 {importTabs.find(t=>t[0]===importTab)?.[1]} — Template</div><div style={{color:D2,fontSize:12,marginTop:2}}>{descTab[importTab]}</div></div>
        <button onClick={()=>downloadTemplate(importTab)} style={{background:BL+'20',border:'1px solid '+BL+'40',borderRadius:8,padding:'8px 16px',cursor:'pointer',color:BL,fontWeight:700,fontSize:13,whiteSpace:'nowrap'}}>⬇️ Baixar Template</button>
      </div>
      <div onClick={()=>fileRef.current?.click()} style={{border:'2px dashed '+B,borderRadius:10,padding:'28px 20px',textAlign:'center',cursor:'pointer',marginBottom:14}} onMouseEnter={e=>e.currentTarget.style.borderColor=Y} onMouseLeave={e=>e.currentTarget.style.borderColor=B}>
        <div style={{fontSize:36,marginBottom:8}}>📤</div>
        <div style={{color:TX,fontWeight:600,fontSize:14}}>Clique para selecionar o arquivo .xlsx</div>
        <div style={{color:D2,fontSize:12,marginTop:4}}>Aceita .xlsx e .xls</div>
        <input ref={fileRef} type='file' accept='.xlsx,.xls' onChange={handleFile} style={{display:'none'}}/>
      </div>
      {preview&&<div style={{marginBottom:14}}>
        <div style={{background:Y+'18',border:'1px solid '+Y+'40',borderRadius:10,padding:14,marginBottom:12}}><div style={{color:Y,fontWeight:700,fontSize:13}}>📋 Preview: {preview.file}</div><div style={{color:D1,fontSize:12,marginTop:3}}>{preview.rows.length} linha(s) encontrada(s).</div></div>
        <div style={{background:CARD2,border:'1px solid '+B,borderRadius:10,overflow:'auto',maxHeight:220}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:400}}>
            <thead><tr>{preview.rows.length>0&&Object.keys(preview.rows[0]).map(k=><th key={k} style={{padding:'8px 12px',textAlign:'left',color:D2,fontSize:11,fontWeight:700,textTransform:'uppercase',background:CARD,whiteSpace:'nowrap'}}>{k}</th>)}</tr></thead>
            <tbody>{preview.rows.slice(0,8).map((row,i)=><tr key={i} style={{borderTop:'1px solid '+B+'30'}}>{Object.values(row).map((v,j)=><td key={j} style={{padding:'8px 12px',color:TX,fontSize:12,whiteSpace:'nowrap'}}>{String(v)}</td>)}</tr>)}</tbody>
          </table>
          {preview.rows.length>8&&<div style={{padding:'8px 12px',color:D2,fontSize:12}}>...e mais {preview.rows.length-8} linha(s)</div>}
        </div>
        <div style={{display:'flex',gap:10,marginTop:12,justifyContent:'flex-end'}}><button onClick={()=>setPreview(null)} style={{background:'transparent',border:'1px solid '+B,borderRadius:8,padding:'8px 18px',cursor:'pointer',color:D1,fontWeight:700,fontSize:13}}>Cancelar</button><button onClick={confirmarImport} style={{background:G,border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer',color:'#000',fontWeight:700,fontSize:13}}>✅ Confirmar Importação</button></div>
      </div>}
      {importMsg&&<div style={{background:importMsg.type==='ok'?G+'18':R+'18',border:'1px solid '+(importMsg.type==='ok'?G:R)+'40',borderRadius:10,padding:14}}><div style={{color:importMsg.type==='ok'?G:R,fontWeight:700,fontSize:13}}>{importMsg.type==='ok'?'✅':'❌'} {importMsg.text}</div></div>}
    </div>
  </div>
}

// ── SEMEN ─────────────────────────────────────────────────
function Semen({sedes,user}){
  const {rows:botijoes,loading:loadBot,add:addBot,update:updateBot,remove:removeBot,setRows:setBotijoes}=useTable('semen_botijoes')
  const {rows:palhetas,loading:loadPal,add:addPal,update:updatePal,remove:removePal,setRows:setPalhetas}=useTable('semen_palhetas')
  const {rows:saidas,loading:loadSai,add:addSai,update:updateSai,remove:removeSai,setRows:setSaidas}=useTable('semen_saidas')
  const [tab,setTab]=useState('botijoes')
  const [modal,setModal]=useState(null)
  const [sel,setSel]=useState(null)
  const [modalSaida,setModalSaida]=useState(null)
  const [selected,setSelected]=useState({botijoes:[],palhetas:[],saidas:[]})
  const [bulk,setBulk]=useState({sedeId:'',botijoId:'',raca:'',motivo:'',destino:''})

  // forms
  const blankBot={nome:'',sedeId:sedes[0]?.id||'',obs:''}
  const blankPal={botijoId:'',caneca:'',touro:'',raca:'',dose_total:'',dose_atual:'',obs:''}
  const blankSaida={palhetaId:'',quantidade:'',destino:'',motivo:'IATF',data:'',obs:''}
  const [formBot,setFormBot]=useState(blankBot)
  const [formPal,setFormPal]=useState(blankPal)
  const [formSaida,setFormSaida]=useState(blankSaida)
  const fbv=v=>setFormBot(p=>({...p,...v}))
  const fpv=v=>setFormPal(p=>({...p,...v}))
  const fsv=v=>setFormSaida(p=>({...p,...v}))

  const canEdit=user.perfil!=='funcionario'
  const currentRows=tab==='botijoes'?botijoes:tab==='palhetas'?palhetas:saidas
  const currentSelected=selected[tab]||[]
  const currentIds=currentRows.map(x=>x.id)
  const selectedVisible=currentIds.filter(id=>currentSelected.includes(id)).length
  const allVisibleSelected=currentIds.length>0&&selectedVisible===currentIds.length

  // totais
  const totalDoses=palhetas.reduce((s,p)=>s+Number(p.dose_atual||0),0)
  const totalTouros=[...new Set(palhetas.map(p=>p.touro).filter(Boolean))].length
  function clearSelected(t=tab){setSelected(p=>({...p,[t]:[]}));}
  function toggleOne(id){setSelected(p=>{const list=p[tab]||[];return {...p,[tab]:list.includes(id)?list.filter(x=>x!==id):[...list,id]};});}
  function toggleVisible(){setSelected(p=>({...p,[tab]:allVisibleSelected?(p[tab]||[]).filter(id=>!currentIds.includes(id)):[...new Set([...(p[tab]||[]),...currentIds])]}));}
  function selectBar(label){
    return canEdit&&<div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      <button onClick={toggleVisible} disabled={currentRows.length===0} style={{background:allVisibleSelected?Y+'18':CARD2,border:'1px solid '+(allVisibleSelected?Y:B),borderRadius:9,padding:'9px 14px',fontSize:13,color:allVisibleSelected?Y:D1,fontWeight:700,cursor:currentRows.length===0?'not-allowed':'pointer'}}>{allVisibleSelected?'Desmarcar todos':'Selecionar todos'}</button>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',fontSize:13,color:D1}}>{currentRows.length} {label}</div>
      {currentSelected.length>0&&<button onClick={()=>clearSelected()} style={{background:R+'15',border:'1px solid '+R+'35',borderRadius:9,padding:'9px 14px',fontSize:13,color:R,fontWeight:700,cursor:'pointer'}}>{currentSelected.length} selecionado(s) - limpar</button>}
    </div>
  }
  function actionBar(label){
    return canEdit&&currentSelected.length>0&&<div style={{background:Y+'10',border:'1px solid '+Y+'35',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div style={{color:Y,fontWeight:800,fontSize:13}}>{currentSelected.length} {label} selecionado(s)</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <Btn v='g' small onClick={()=>{setBulk({sedeId:'',botijoId:'',raca:'',motivo:'',destino:''});setModal('bulk_'+tab)}}>Aplicar em lote</Btn>
        <Btn v='r' small onClick={()=>setModal('bulk_delete_'+tab)}>Excluir selecionados</Btn>
      </div>
    </div>
  }

  async function salvarBot(){
    if(sel) await updateBot(sel.id,formBot)
    else await addBot({id:genId(),...formBot})
    setModal(null);setFormBot(blankBot);setSel(null)
  }
  async function excluirBot(){await removeBot(sel.id);setSelected(p=>({...p,botijoes:(p.botijoes||[]).filter(id=>id!==sel.id)}));setModal(null);setSel(null);}

  async function salvarPal(){
    if(sel) await updatePal(sel.id,{...formPal,dose_total:Number(formPal.dose_total),dose_atual:Number(formPal.dose_atual)})
    else await addPal({id:genId(),...formPal,dose_total:Number(formPal.dose_total),dose_atual:Number(formPal.dose_atual)})
    setModal(null);setFormPal(blankPal);setSel(null)
  }
  async function excluirPal(){await removePal(sel.id);setSelected(p=>({...p,palhetas:(p.palhetas||[]).filter(id=>id!==sel.id)}));setModal(null);setSel(null);}

  async function salvarSaida(){
    const qtd=Number(formSaida.quantidade)||0
    const pal=palhetas.find(p=>p.id===formSaida.palhetaId)
    const old=modalSaida==='edit'?sel:null
    const disponivel=pal?Number(pal.dose_atual||0)+(old?.palhetaId===pal.id?Number(old.quantidade||0):0):0
    if(!pal||qtd<=0||qtd>disponivel) return
    if(old?.palhetaId&&old.palhetaId!==pal.id){
      const oldPal=palhetas.find(p=>p.id===old.palhetaId)
      if(oldPal)await updatePal(oldPal.id,{dose_atual:Number(oldPal.dose_atual||0)+Number(old.quantidade||0)})
    }
    const payload={...formSaida,quantidade:qtd,touro:pal.touro,raca:pal.raca,caneca:pal.caneca,botijoId:pal.botijoId}
    if(old)await updateSai(old.id,payload)
    else await addSai({id:genId(),...payload})
    await updatePal(pal.id,{dose_atual:disponivel-qtd})
    setModalSaida(null);setFormSaida(blankSaida);setSel(null)
  }
  function loadSaida(s){
    setFormSaida({palhetaId:s.palhetaId||'',quantidade:String(s.quantidade||''),destino:s.destino||'',motivo:s.motivo||'IATF',data:s.data||'',obs:s.obs||''})
  }
  async function excluirSaida(){
    if(!sel)return
    const pal=palhetas.find(p=>p.id===sel.palhetaId)
    await removeSai(sel.id)
    if(pal)await updatePal(pal.id,{dose_atual:Number(pal.dose_atual||0)+Number(sel.quantidade||0)})
    setSelected(p=>({...p,saidas:(p.saidas||[]).filter(id=>id!==sel.id)}))
    setModal(null);setSel(null)
  }
  async function aplicarLoteSemen(){
    const ids=[...currentSelected]
    if(ids.length===0)return
    if(tab==='botijoes'){
      const obj={}
      if(bulk.sedeId)obj.sedeId=bulk.sedeId
      if(!Object.keys(obj).length)return
      const {data,error}=await sb.from('semen_botijoes').update(obj).in('id',ids).select()
      if(error){alert('Erro ao atualizar botijoes: '+error.message);return}
      setBotijoes(p=>p.map(r=>ids.includes(r.id)?(data?.find(d=>d.id===r.id)||{...r,...obj}):r))
    } else if(tab==='palhetas'){
      const obj={}
      if(bulk.botijoId)obj.botijoId=bulk.botijoId
      if(bulk.raca)obj.raca=bulk.raca
      if(!Object.keys(obj).length)return
      const {data,error}=await sb.from('semen_palhetas').update(obj).in('id',ids).select()
      if(error){alert('Erro ao atualizar palhetas: '+error.message);return}
      setPalhetas(p=>p.map(r=>ids.includes(r.id)?(data?.find(d=>d.id===r.id)||{...r,...obj}):r))
    } else {
      const obj={}
      if(bulk.motivo)obj.motivo=bulk.motivo
      if(bulk.destino)obj.destino=bulk.destino
      if(!Object.keys(obj).length)return
      const {data,error}=await sb.from('semen_saidas').update(obj).in('id',ids).select()
      if(error){alert('Erro ao atualizar saidas: '+error.message);return}
      setSaidas(p=>p.map(r=>ids.includes(r.id)?(data?.find(d=>d.id===r.id)||{...r,...obj}):r))
    }
    clearSelected(tab)
    setBulk({sedeId:'',botijoId:'',raca:'',motivo:'',destino:''})
    setModal(null)
  }
  async function excluirSelecionadosSemen(){
    const ids=[...currentSelected]
    if(ids.length===0)return
    if(tab==='botijoes'){
      const {error}=await sb.from('semen_botijoes').delete().in('id',ids)
      if(error){alert('Erro ao excluir botijoes: '+error.message);return}
      setBotijoes(p=>p.filter(r=>!ids.includes(r.id)))
    } else if(tab==='palhetas'){
      const {error}=await sb.from('semen_palhetas').delete().in('id',ids)
      if(error){alert('Erro ao excluir palhetas: '+error.message);return}
      setPalhetas(p=>p.filter(r=>!ids.includes(r.id)))
    } else {
      const regs=saidas.filter(s=>ids.includes(s.id))
      const {error}=await sb.from('semen_saidas').delete().in('id',ids)
      if(error){alert('Erro ao excluir saidas: '+error.message);return}
      const porPal={}
      regs.forEach(s=>{if(s.palhetaId)porPal[s.palhetaId]=(porPal[s.palhetaId]||0)+Number(s.quantidade||0)})
      for(const [palId,qtd] of Object.entries(porPal)){
        const pal=palhetas.find(p=>p.id===palId)
        if(pal)await updatePal(pal.id,{dose_atual:Number(pal.dose_atual||0)+qtd})
      }
      setSaidas(p=>p.filter(r=>!ids.includes(r.id)))
    }
    clearSelected(tab)
    setModal(null)
  }

  const palSel=palhetas.find(p=>p.id===formSaida.palhetaId)
  const palDisponivel=palSel?Number(palSel.dose_atual||0)+(modalSaida==='edit'&&sel?.palhetaId===palSel.id?Number(sel.quantidade||0):0):0
  const motivoOpts=['IATF','Monta Natural','Doação','Descarte','Outro'].map(m=>({v:m,l:m}))
  const sedeOpts=sedes.map(s=>({v:s.id,l:s.nome}))
  const botijoOpts=botijoes.map(b=>({v:b.id,l:b.nome}))
  const racaOpts=['Charolês','Caracu','Tabapuã','Nelore','Braford','Brangus','Angus','Hereford','Simmental','Outro'].map(r=>({v:r,l:r}))
  const card={background:CARD,border:'1px solid '+B,borderRadius:12,padding:20}
  const tabs=[['botijoes','🧊 Botijões'],['palhetas','🧬 Palhetas'],['saidas','📤 Saídas']]

  return <div>
    <SH title='🧊 Controle de Sêmen' action={canEdit&&<div style={{display:'flex',gap:8}}>
      {tab==='botijoes'&&<Btn onClick={()=>{setFormBot(blankBot);setSel(null);setModal('bot')}}>+ Novo Botijão</Btn>}
      {tab==='palhetas'&&<Btn onClick={()=>{setFormPal(blankPal);setSel(null);setModal('pal')}}>+ Nova Palheta</Btn>}
      {tab==='saidas'&&<Btn onClick={()=>{setFormSaida(blankSaida);setSel(null);setModalSaida('new')}}>+ Registrar Saída</Btn>}
    </div>}/>

    {/* Cards resumo */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
      <StatCard icon='🧊' label='Botijões' value={botijoes.length} color={BL}/>
      <StatCard icon='🧬' label='Touros' value={totalTouros} color={Y}/>
      <StatCard icon='💉' label='Doses Disponíveis' value={totalDoses} color={G}/>
      <StatCard icon='📤' label='Saídas Registradas' value={saidas.length} color={PU}/>
    </div>

    {/* Tabs */}
    <div style={{display:'flex',gap:6,marginBottom:18,flexWrap:'wrap'}}>
      {tabs.map(t=><button key={t[0]} onClick={()=>setTab(t[0])} style={{padding:'7px 18px',borderRadius:8,border:'1px solid '+(tab===t[0]?Y:B),background:tab===t[0]?Y+'18':'transparent',color:tab===t[0]?Y:D1,fontWeight:700,fontSize:13,cursor:'pointer'}}>{t[1]}</button>)}
    </div>
    {selectBar(tab==='botijoes'?'botijão(ões)':tab==='palhetas'?'palheta(s)':'saída(s)')}
    {actionBar(tab==='botijoes'?'botijão(ões)':tab==='palhetas'?'palheta(s)':'saída(s)')}

    {/* BOTIJÕES */}
    {tab==='botijoes'&&(loadBot?<Loading/>:
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
        {botijoes.map(b=>{
          const pals=palhetas.filter(p=>p.botijoId===b.id)
          const doses=pals.reduce((s,p)=>s+Number(p.dose_atual||0),0)
          const touros=[...new Set(pals.map(p=>p.touro).filter(Boolean))]
          const sede=sedes.find(s=>s.id===b.sedeId)
          const marcado=currentSelected.includes(b.id)
          return <div key={b.id} style={{background:CARD,border:'1px solid '+B,borderRadius:14,padding:20,borderTop:'3px solid '+BL}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{fontSize:32}}>🧊</div>
                <div><div style={{color:TX,fontWeight:800,fontSize:16}}>{b.nome}</div><div style={{color:D2,fontSize:12,marginTop:2}}>{sede?.nome||'-'}</div></div>
              </div>
              {canEdit&&<div style={{display:'flex',alignItems:'center',gap:8}}><input type='checkbox' checked={marcado} onChange={()=>toggleOne(b.id)} style={{width:16,height:16,accentColor:Y,cursor:'pointer'}}/><ActBtns onEdit={()=>{setSel(b);setFormBot({nome:b.nome,sedeId:b.sedeId,obs:b.obs||''});setModal('bot');}} onDel={()=>{setSel(b);setModal('del_bot');}}/></div>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:12}}>
              <div style={{background:CARD2,borderRadius:8,padding:'10px 12px',border:'1px solid '+B}}><div style={{color:G,fontWeight:800,fontSize:20}}>{doses}</div><div style={{color:D2,fontSize:11,marginTop:2}}>Doses disponíveis</div></div>
              <div style={{background:CARD2,borderRadius:8,padding:'10px 12px',border:'1px solid '+B}}><div style={{color:Y,fontWeight:800,fontSize:20}}>{pals.length}</div><div style={{color:D2,fontSize:11,marginTop:2}}>Palhetas</div></div>
            </div>
            {touros.length>0&&<div style={{marginBottom:8}}><div style={{color:D2,fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Touros</div><div style={{display:'flex',flexWrap:'wrap',gap:5}}>{touros.map(t=><Badge key={t} label={t} color={PU}/>)}</div></div>}
            {b.obs&&<div style={{color:D2,fontSize:12,marginTop:8}}>Obs: {b.obs}</div>}
          </div>
        })}
        {botijoes.length===0&&<Empty msg='Nenhum botijão cadastrado.'/>}
      </div>
    )}

    {/* PALHETAS */}
    {tab==='palhetas'&&(loadPal?<Loading/>:
      <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:750}}>
            <thead><tr>{canEdit&&<Th><input type='checkbox' checked={allVisibleSelected} onChange={toggleVisible} style={{width:16,height:16,accentColor:Y,cursor:'pointer'}}/></Th>}<Th>Touro</Th><Th>Raça</Th><Th>Botijão</Th><Th>Caneca</Th><Th>Doses Total</Th><Th>Doses Atual</Th><Th>Situação</Th>{canEdit&&<Th>Ações</Th>}</tr></thead>
            <tbody>{palhetas.map(p=>{
              const bot=botijoes.find(b=>b.id===p.botijoId)
              const pct=p.dose_total>0?(p.dose_atual/p.dose_total)*100:0
              const cor=pct>50?G:pct>20?Y:R
              const marcado=currentSelected.includes(p.id)
              return <TR key={p.id}>
                {canEdit&&<Td><input type='checkbox' checked={marcado} onChange={()=>toggleOne(p.id)} style={{width:16,height:16,accentColor:Y,cursor:'pointer'}}/></Td>}
                <Td s={{fontWeight:700,color:TX}}>{p.touro||'-'}</Td>
                <Td>{p.raca||'-'}</Td>
                <Td s={{color:BL,fontWeight:600}}>{bot?.nome||'-'}</Td>
                <Td><Badge label={'Caneca '+p.caneca} color={PU}/></Td>
                <Td s={{color:D1}}>{p.dose_total}</Td>
                <Td s={{fontWeight:800,color:cor}}>{p.dose_atual}</Td>
                <Td>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{background:B,borderRadius:4,height:6,width:80,flexShrink:0}}>
                      <div style={{background:cor,width:Math.min(pct,100)+'%',height:'100%',borderRadius:4}}/>
                    </div>
                    <span style={{color:cor,fontSize:11,fontWeight:700}}>{Math.round(pct)}%</span>
                  </div>
                </Td>
                {canEdit&&<Td><ActBtns onEdit={()=>{setSel(p);setFormPal({botijoId:p.botijoId,caneca:p.caneca,touro:p.touro||'',raca:p.raca||'',dose_total:String(p.dose_total),dose_atual:String(p.dose_atual),obs:p.obs||''});setModal('pal');}} onDel={()=>{setSel(p);setModal('del_pal');}}/></Td>}
              </TR>
            })}</tbody>
          </table>
          {palhetas.length===0&&<Empty msg='Nenhuma palheta cadastrada.'/>}
        </div>
      </div>
    )}

    {/* SAÍDAS */}
    {tab==='saidas'&&(loadSai?<Loading/>:
      <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:750}}>
            <thead><tr>{canEdit&&<Th><input type='checkbox' checked={allVisibleSelected} onChange={toggleVisible} style={{width:16,height:16,accentColor:Y,cursor:'pointer'}}/></Th>}<Th>Data</Th><Th>Touro</Th><Th>Raça</Th><Th>Botijão</Th><Th>Caneca</Th><Th>Doses</Th><Th>Motivo</Th><Th>Destino</Th><Th>Obs.</Th>{canEdit&&<Th>Ações</Th>}</tr></thead>
            <tbody>{[...saidas].reverse().map(s=>{
              const bot=botijoes.find(b=>b.id===s.botijoId)
              const marcado=currentSelected.includes(s.id)
              return <TR key={s.id}>
                {canEdit&&<Td><input type='checkbox' checked={marcado} onChange={()=>toggleOne(s.id)} style={{width:16,height:16,accentColor:Y,cursor:'pointer'}}/></Td>}
                <Td s={{color:D1,whiteSpace:'nowrap'}}>{fmtDate(s.data)}</Td>
                <Td s={{fontWeight:700,color:Y}}>{s.touro||'-'}</Td>
                <Td>{s.raca||'-'}</Td>
                <Td s={{color:BL}}>{bot?.nome||'-'}</Td>
                <Td><Badge label={'Caneca '+(s.caneca||'-')} color={PU}/></Td>
                <Td s={{fontWeight:800,color:R}}>{s.quantidade}</Td>
                <Td><Badge label={s.motivo||'-'} color={G}/></Td>
                <Td s={{color:D1}}>{s.destino||'-'}</Td>
                <Td s={{color:D2,fontSize:12}}>{s.obs||'-'}</Td>
                {canEdit&&<Td><ActBtns onEdit={()=>{setSel(s);loadSaida(s);setModalSaida('edit');}} onDel={()=>{setSel(s);setModal('del_saida');}}/></Td>}
              </TR>
            })}</tbody>
          </table>
          {saidas.length===0&&<Empty msg='Nenhuma saída registrada.'/>}
        </div>
      </div>
    )}

    {/* MODAL BOTIJÃO */}
    {modal==='bot'&&<Modal title={sel?'Editar Botijão':'Novo Botijão'} onClose={()=>{setModal(null);setSel(null);}}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Inp label='Nome do Botijão' value={formBot.nome} onChange={v=>fbv({nome:v})} ph='Ex: Botijão 1, Botijão A'/>
        <Inp label='Sede' value={formBot.sedeId} onChange={v=>fbv({sedeId:v})} opts={sedes.map(s=>({v:s.id,l:s.nome}))}/>
        <Inp label='Observações' value={formBot.obs} onChange={v=>fbv({obs:v})} ph='Ex: Capacidade 35L'/>
        <MFooter onCancel={()=>{setModal(null);setSel(null);}} onSave={salvarBot} label={sel?'Salvar Alterações':'Criar Botijão'} disabled={!formBot.nome}/>
      </div>
    </Modal>}

    {/* MODAL PALHETA */}
    {modal==='pal'&&<Modal title={sel?'Editar Palheta':'Nova Palheta'} onClose={()=>{setModal(null);setSel(null);}}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Inp label='Touro' value={formPal.touro} onChange={v=>fpv({touro:v})} ph='Ex: Vagabond'/>
          <Inp label='Raça' value={formPal.raca} onChange={v=>fpv({raca:v})} opts={['Charolês','Caracu','Tabapuã','Nelore','Braford','Brangus','Angus','Hereford','Simmental','Outro'].map(r=>({v:r,l:r}))}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Inp label='Botijão' value={formPal.botijoId} onChange={v=>fpv({botijoId:v})} opts={[{v:'',l:'Selecione...'},...botijoes.map(b=>({v:b.id,l:b.nome}))]}/>
          <Inp label='Nº da Caneca' value={formPal.caneca} onChange={v=>fpv({caneca:v})} ph='Ex: 1, 2, A, B'/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Inp label='Doses Total (entrada)' value={formPal.dose_total} onChange={v=>fpv({dose_total:v})} type='number' ph='Ex: 50'/>
          <Inp label='Doses Atual (disponível)' value={formPal.dose_atual} onChange={v=>fpv({dose_atual:v})} type='number' ph='Ex: 50'/>
        </div>
        <Inp label='Observações' value={formPal.obs} onChange={v=>fpv({obs:v})} ph='Ex: Importado, Partida XYZ'/>
        <MFooter onCancel={()=>{setModal(null);setSel(null);}} onSave={salvarPal} label={sel?'Salvar Alterações':'Salvar Palheta'} disabled={!formPal.touro||!formPal.botijoId||!formPal.caneca}/>
      </div>
    </Modal>}

    {/* MODAL SAÍDA */}
    {modalSaida&&<Modal title={modalSaida==='edit'?'Editar Saída de Doses':'Registrar Saída de Doses'} onClose={()=>{setModalSaida(null);setFormSaida(blankSaida);setSel(null);}}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Inp label='Palheta (Touro)' value={formSaida.palhetaId} onChange={v=>fsv({palhetaId:v})} opts={[{v:'',l:'Selecione...'},...palhetas.filter(p=>p.dose_atual>0||p.id===formSaida.palhetaId).map(p=>{const bot=botijoes.find(b=>b.id===p.botijoId);const disp=Number(p.dose_atual||0)+(modalSaida==='edit'&&sel?.palhetaId===p.id?Number(sel.quantidade||0):0);return {v:p.id,l:(p.touro||'Sem nome')+' — '+bot?.nome+' / Caneca '+p.caneca+' ('+disp+' doses)'}})]}/>
        {palSel&&<div style={{background:CARD2,border:'1px solid '+B,borderRadius:10,padding:14,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <div><div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Touro</div><div style={{color:Y,fontWeight:700,fontSize:14,marginTop:3}}>{palSel.touro}</div></div>
          <div><div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Caneca</div><div style={{color:PU,fontWeight:700,fontSize:14,marginTop:3}}>{palSel.caneca}</div></div>
          <div><div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Disponível</div><div style={{color:G,fontWeight:700,fontSize:14,marginTop:3}}>{palDisponivel} doses</div></div>
        </div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Inp label='Quantidade de Doses' value={formSaida.quantidade} onChange={v=>fsv({quantidade:v})} type='number' ph='Ex: 10'/>
          <Inp label='Data' value={formSaida.data} onChange={v=>fsv({data:v})} type='date'/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Inp label='Motivo' value={formSaida.motivo} onChange={v=>fsv({motivo:v})} opts={motivoOpts}/>
          <Inp label='Destino / Lote' value={formSaida.destino} onChange={v=>fsv({destino:v})} ph='Ex: Lote A, Vaca 2526'/>
        </div>
        <Inp label='Observações' value={formSaida.obs} onChange={v=>fsv({obs:v})} ph='Ex: Protocolo IATF dia 1'/>
        {palSel&&Number(formSaida.quantidade)>palDisponivel&&<div style={{background:R+'18',border:'1px solid '+R+'40',borderRadius:8,padding:'10px 14px',color:R,fontSize:13,fontWeight:600}}>⚠️ Quantidade maior que o estoque disponível ({palDisponivel} doses)</div>}
        <MFooter onCancel={()=>{setModalSaida(null);setFormSaida(blankSaida);setSel(null);}} onSave={salvarSaida} label={modalSaida==='edit'?'Salvar Saída':'Confirmar Saída'} disabled={!formSaida.palhetaId||!formSaida.quantidade||!formSaida.data||Number(formSaida.quantidade)>Number(palDisponivel||0)}/>
      </div>
    </Modal>}

    {/* CONFIRMAÇÕES EXCLUSÃO */}
    {modal==='del_bot'&&sel&&<Modal title='Excluir Botijão' onClose={()=>{setModal(null);setSel(null);}}><DelConfirm msg={'Excluir o botijão "'+sel.nome+'"? Todas as palhetas vinculadas serão afetadas.'} onCancel={()=>{setModal(null);setSel(null);}} onConfirm={excluirBot}/></Modal>}
    {modal==='del_pal'&&sel&&<Modal title='Excluir Palheta' onClose={()=>{setModal(null);setSel(null);}}><DelConfirm msg={'Excluir palheta do touro "'+sel.touro+'"?'} onCancel={()=>{setModal(null);setSel(null);}} onConfirm={excluirPal}/></Modal>}
    {modal==='del_saida'&&sel&&<Modal title='Excluir Saída' onClose={()=>{setModal(null);setSel(null);}}><DelConfirm msg={'Excluir saída de '+sel.quantidade+' dose(s) do touro "'+(sel.touro||'-')+'"? As doses voltam para a palheta.'} onCancel={()=>{setModal(null);setSel(null);}} onConfirm={excluirSaida}/></Modal>}
    {modal==='bulk_botijoes'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{currentSelected.length} botijão(ões) selecionado(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Sede' value={bulk.sedeId} onChange={v=>setBulk(p=>({...p,sedeId:v}))} opts={[{v:'',l:'Manter sede atual'},...sedeOpts]}/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLoteSemen} label='Aplicar nos Selecionados' disabled={!bulk.sedeId}/>
      </div>
    </Modal>}
    {modal==='bulk_palhetas'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{currentSelected.length} palheta(s) selecionada(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Botijão' value={bulk.botijoId} onChange={v=>setBulk(p=>({...p,botijoId:v}))} opts={[{v:'',l:'Manter botijão atual'},...botijoOpts]}/>
        <Inp label='Raça' value={bulk.raca} onChange={v=>setBulk(p=>({...p,raca:v}))} opts={[{v:'',l:'Manter raça atual'},...racaOpts]}/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLoteSemen} label='Aplicar nos Selecionados' disabled={!bulk.botijoId&&!bulk.raca}/>
      </div>
    </Modal>}
    {modal==='bulk_saidas'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{currentSelected.length} saída(s) selecionada(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Motivo' value={bulk.motivo} onChange={v=>setBulk(p=>({...p,motivo:v}))} opts={[{v:'',l:'Manter motivo atual'},...motivoOpts]}/>
        <Inp label='Destino / Lote' value={bulk.destino} onChange={v=>setBulk(p=>({...p,destino:v}))} ph='Ex: Lote A, Vaca 2526'/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLoteSemen} label='Aplicar nos Selecionados' disabled={!bulk.motivo&&!bulk.destino}/>
      </div>
    </Modal>}
    {(modal==='bulk_delete_botijoes'||modal==='bulk_delete_palhetas'||modal==='bulk_delete_saidas')&&<Modal title='Excluir Selecionados' onClose={()=>setModal(null)}>
      <DelConfirm msg={'Excluir '+currentSelected.length+' registro(s) selecionado(s)? Essa acao nao pode ser desfeita.'} onCancel={()=>setModal(null)} onConfirm={excluirSelecionadosSemen}/>
    </Modal>}
  </div>
}
// ── VENDAS ────────────────────────────────────────────────
function Vendas({animais,sedes,user}){
  const {rows,loading,add,update,remove,setRows}=useTable('vendas')
  const [modal,setModal]=useState(null),[sel,setSel]=useState(null)
  const blank={animalId:'',data:'',valor:'',peso:'',compradorNome:'',compradorCpf:'',compradorTelefone:'',compradorCidade:'',compradorEstado:'PR',obs:''}
  const [form,setForm]=useState(blank)
  const [selected,setSelected]=useState([])
  const [bulk,setBulk]=useState({data:'',compradorCidade:'',compradorEstado:''})
  const fv=v=>setForm(p=>({...p,...v}))
  const canEdit=user.perfil!=='funcionario'
  const ativosStatus=['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural']
  const animaisAtivos=animais.filter(a=>ativosStatus.includes(a.status))
  const totalRec=rows.reduce((s,v)=>s+Number(v.valor||0),0)
  const visibleIds=rows.map(v=>v.id)
  const selectedVisible=visibleIds.filter(id=>selected.includes(id)).length
  const allVisibleSelected=visibleIds.length>0&&selectedVisible===visibleIds.length
  async function salvarNovo(){
    const obj={id:genId(),...form,valor:Number(form.valor),peso:Number(form.peso)}
    await add(obj)
    if(form.animalId)await sb.from('animais').update({status:'Vendido'}).eq('id',form.animalId)
    const animal=animais.find(a=>a.id===form.animalId)
    await sb.from('financeiro').insert([{id:genId(),tipo:'venda',categoria:'Venda de Animais',descricao:'Venda: '+(animal?.brinco||'')+(animal?.nome?' — '+animal.nome:'')+' ('+(animal?.especie||'Bovino')+')',valor:Number(form.valor),data:form.data,clienteId:''}])
    setModal(null);setForm(blank)
  }
  async function salvarEdit(){await update(sel.id,{...form,valor:Number(form.valor),peso:Number(form.peso)});setModal(null);}
  async function confirmarDel(){await remove(sel.id);setSelected(p=>p.filter(id=>id!==sel.id));setModal(null);}
  async function aplicarLote(){
    const obj={}
    if(bulk.data)obj.data=bulk.data
    if(bulk.compradorCidade)obj.compradorCidade=bulk.compradorCidade
    if(bulk.compradorEstado)obj.compradorEstado=bulk.compradorEstado
    if(Object.keys(obj).length===0||selected.length===0)return
    const ids=[...selected]
    const {data,error}=await sb.from('vendas').update(obj).in('id',ids).select()
    if(error){alert('Erro ao atualizar vendas: '+error.message);return}
    setRows(p=>p.map(r=>ids.includes(r.id)?(data?.find(d=>d.id===r.id)||{...r,...obj}):r))
    setSelected([]);setBulk({data:'',compradorCidade:'',compradorEstado:''});setModal(null)
  }
  async function excluirSelecionados(){
    const ids=[...selected]
    if(ids.length===0)return
    const {error}=await sb.from('vendas').delete().in('id',ids)
    if(error){alert('Erro ao excluir vendas: '+error.message);return}
    setRows(p=>p.filter(r=>!ids.includes(r.id)))
    setSelected([]);setModal(null)
  }
  function toggleOne(id){setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
  function toggleVisible(){setSelected(p=>allVisibleSelected?p.filter(id=>!visibleIds.includes(id)):[...new Set([...p,...visibleIds])]);}
  const checkStyle={width:16,height:16,accentColor:Y,cursor:'pointer'}
  const formBody=<div style={{display:'flex',flexDirection:'column',gap:13}}>
    <div style={{background:BL+'15',border:'1px solid '+BL+'30',borderRadius:9,padding:'8px 13px',color:BL,fontSize:12,fontWeight:700}}>🐂 ANIMAL</div>
    <Inp label='Animal' value={form.animalId} onChange={v=>fv({animalId:v})} opts={[{v:'',l:'Selecione o animal...'},...animaisAtivos.map(a=>({v:a.id,l:a.brinco+(a.nome?' — '+a.nome:'')+' ('+(a.especie||'Bovino')+', '+a.categoria+', '+a.raca+')'}))]}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
      <Inp label='Data da Venda' value={form.data} onChange={v=>fv({data:v})} type='date'/>
      <Inp label='Valor (R$)' value={form.valor} onChange={v=>fv({valor:v})} type='number' ph='0,00'/>
      <Inp label='Peso na Venda (kg)' value={form.peso} onChange={v=>fv({peso:v})} type='number' ph='0'/>
    </div>
    <div style={{background:Y+'15',border:'1px solid '+Y+'30',borderRadius:9,padding:'8px 13px',color:Y,fontSize:12,fontWeight:700,marginTop:4}}>👤 DADOS DO COMPRADOR</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Inp label='Nome do Comprador' value={form.compradorNome} onChange={v=>fv({compradorNome:v})} ph='Nome completo'/>
      <Inp label='CPF / CNPJ' value={form.compradorCpf} onChange={v=>fv({compradorCpf:v})} ph='000.000.000-00'/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
      <Inp label='Telefone / WhatsApp' value={form.compradorTelefone} onChange={v=>fv({compradorTelefone:v})} ph='(46) 99999-9999'/>
      <Inp label='Cidade' value={form.compradorCidade} onChange={v=>fv({compradorCidade:v})} ph='Palmas'/>
      <Inp label='Estado' value={form.compradorEstado} onChange={v=>fv({compradorEstado:v})} ph='PR'/>
    </div>
    <Inp label='Observações (NF, GTA, etc.)' value={form.obs} onChange={v=>fv({obs:v})} ph='Ex: NF 1234, GTA nº 5678'/>
  </div>
  return <div>
    <SH title='💲 Vendas de Animais' action={canEdit&&<Btn onClick={()=>{setForm(blank);setModal('new')}}>+ Registrar Venda</Btn>}/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
      <StatCard icon='💲' label='Total de Vendas' value={rows.length} color={G}/>
      <StatCard icon='💰' label='Receita Total' value={fmtR(totalRec)} color={Y}/>
      <StatCard icon='🐂' label='Animais Vendidos' value={[...new Set(rows.map(v=>v.animalId).filter(Boolean))].length} color={BL}/>
      <StatCard icon='⚖️' label='Média por Animal' value={rows.length?fmtR(totalRec/rows.length):fmtR(0)} color={PU}/>
    </div>
    {canEdit&&<div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      <button onClick={toggleVisible} disabled={rows.length===0} style={{background:allVisibleSelected?Y+'18':CARD2,border:'1px solid '+(allVisibleSelected?Y:B),borderRadius:9,padding:'9px 14px',fontSize:13,color:allVisibleSelected?Y:D1,fontWeight:700,cursor:rows.length===0?'not-allowed':'pointer'}}>{allVisibleSelected?'Desmarcar todos':'Selecionar todos'}</button>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',fontSize:13,color:D1}}>{rows.length} venda(s)</div>
      {selected.length>0&&<button onClick={()=>setSelected([])} style={{background:R+'15',border:'1px solid '+R+'35',borderRadius:9,padding:'9px 14px',fontSize:13,color:R,fontWeight:700,cursor:'pointer'}}>{selected.length} selecionado(s) - limpar</button>}
    </div>}
    {canEdit&&selected.length>0&&<div style={{background:Y+'10',border:'1px solid '+Y+'35',borderRadius:12,padding:'12px 14px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <div style={{color:Y,fontWeight:800,fontSize:13}}>{selected.length} venda(s) selecionada(s)</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Btn v='g' small onClick={()=>{setBulk({data:'',compradorCidade:'',compradorEstado:''});setModal('bulk')}}>Aplicar em lote</Btn><Btn v='r' small onClick={()=>setModal('bulkDelete')}>Excluir selecionados</Btn></div>
    </div>}
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
          <thead><tr>{canEdit&&<Th><input type='checkbox' checked={allVisibleSelected} onChange={toggleVisible} style={checkStyle}/></Th>}<Th>Animal</Th><Th>Data</Th><Th>Valor</Th><Th>Peso</Th><Th>Comprador</Th><Th>CPF/CNPJ</Th><Th>Telefone</Th><Th>Cidade/UF</Th>{canEdit&&<Th>Ações</Th>}</tr></thead>
          <tbody>{rows.map(v=>{const animal=animais.find(a=>a.id===v.animalId);const marcado=selected.includes(v.id);return <TR key={v.id}>{canEdit&&<Td><input type='checkbox' checked={marcado} onChange={()=>toggleOne(v.id)} style={checkStyle}/></Td>}<Td s={{fontWeight:700,color:Y}}>{animal?animal.brinco+(animal.nome?' — '+animal.nome:'')+' ('+(animal.especie||'Bovino')+')':'(removido)'}</Td><Td s={{color:D1,whiteSpace:'nowrap'}}>{fmtDate(v.data)}</Td><Td s={{fontWeight:800,color:G}}>{fmtR(v.valor)}</Td><Td s={{color:D1}}>{v.peso?v.peso+' kg':'-'}</Td><Td s={{fontWeight:600}}>{v.compradorNome||'-'}</Td><Td s={{color:D1,fontSize:12}}>{v.compradorCpf||'-'}</Td><Td s={{color:D1,fontSize:12}}>{v.compradorTelefone||'-'}</Td><Td s={{color:D1,fontSize:12}}>{v.compradorCidade?v.compradorCidade+'/'+v.compradorEstado:'-'}</Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(v);setForm({animalId:v.animalId||'',data:v.data||'',valor:String(v.valor||''),peso:String(v.peso||''),compradorNome:v.compradorNome||'',compradorCpf:v.compradorCpf||'',compradorTelefone:v.compradorTelefone||'',compradorCidade:v.compradorCidade||'',compradorEstado:v.compradorEstado||'PR',obs:v.obs||''});setModal('edit');}} onDel={()=>{setSel(v);setModal('delete');}}/></Td>}</TR>})}</tbody>
        </table>
        {rows.length===0&&<Empty msg='Nenhuma venda registrada.'/>}
      </div>}
    </div>
    {modal==='new'&&<Modal title='Registrar Venda de Animal' onClose={()=>setModal(null)} wide>
      {formBody}
      <div style={{background:G+'10',border:'1px solid '+G+'30',borderRadius:8,padding:'10px 14px',margin:'10px 0',fontSize:12,color:G,fontWeight:600}}>✅ Ao confirmar: status do animal vira "Vendido" e a receita é lançada no Financeiro automaticamente.</div>
      <MFooter onCancel={()=>setModal(null)} onSave={salvarNovo} label='Confirmar Venda' disabled={!form.animalId||!form.valor||!form.data||!form.compradorNome}/>
    </Modal>}
    {modal==='edit'&&sel&&<Modal title='Editar Venda' onClose={()=>setModal(null)} wide>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarEdit} disabled={!form.animalId||!form.valor||!form.data||!form.compradorNome}/></Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Venda' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir venda de '+fmtR(sel.valor)+' para '+sel.compradorNome+'?'} onCancel={()=>setModal(null)} onConfirm={confirmarDel}/></Modal>}
    {modal==='bulk'&&<Modal title='Aplicar em lote' onClose={()=>setModal(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:9,padding:'10px 13px',color:Y,fontSize:12,fontWeight:700}}>{selected.length} venda(s) selecionada(s). Preencha apenas o que deseja alterar.</div>
        <Inp label='Data da Venda' value={bulk.data} onChange={v=>setBulk(p=>({...p,data:v}))} type='date'/>
        <Inp label='Cidade do Comprador' value={bulk.compradorCidade} onChange={v=>setBulk(p=>({...p,compradorCidade:v}))} ph='Deixe vazio para manter'/>
        <Inp label='Estado do Comprador' value={bulk.compradorEstado} onChange={v=>setBulk(p=>({...p,compradorEstado:v}))} ph='Ex: PR'/>
        <MFooter onCancel={()=>setModal(null)} onSave={aplicarLote} label='Aplicar nos Selecionados' disabled={!bulk.data&&!bulk.compradorCidade&&!bulk.compradorEstado}/>
      </div>
    </Modal>}
    {modal==='bulkDelete'&&<Modal title='Excluir Selecionados' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+selected.length+' venda(s) selecionada(s)?'} onCancel={()=>setModal(null)} onConfirm={excluirSelecionados}/></Modal>}
  </div>
}

const NAV=[
  {id:'dashboard',icon:'📊',label:'Dashboard',g:'Principal'},
  {id:'graficos',icon:'📈',label:'Graficos',g:'Principal'},
  {id:'rebanho',icon:'🐂',label:'Rebanho',g:'Zootecnia'},
  {id:'reproducao',icon:'🔬',label:'Reproducao',g:'Zootecnia'},
  {id:'manejos',icon:'🩺',label:'Manejos',g:'Zootecnia'},
  {id:'semen',icon:'🧊',label:'Controle de Sêmen',g:'Zootecnia'},
  {id:'financeiro',icon:'💰',label:'Financeiro',g:'Gestao'},
  {id:'clientes',icon:'👥',label:'Clientes/Fornecedores',g:'Gestao'},
  {id:'vendas',icon:'💲',label:'Vendas',g:'Gestao'},
  {id:'estoque',icon:'📦',label:'Estoque',g:'Gestao'},
  {id:'agenda',icon:'📅',label:'Agenda',g:'Gestao'},
  {id:'sedes',icon:'🗺️',label:'Sedes',g:'Config'},
  {id:'excel',icon:'📂',label:'Importar/Exportar',g:'Config'},
  {id:'ia',icon:'🤖',label:'IA e Relatorios',g:'Config'},
]

// ── APP ───────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null)
  const [email,setEmail]=useState(''),[senha,setSenha]=useState(''),[err,setErr]=useState('')
  const [authReady,setAuthReady]=useState(false),[loginLoad,setLoginLoad]=useState(false)
  const [mod,setMod]=useState('dashboard'),[col,setCol]=useState(false)
  const dataEnabled=!!user
  const {rows:sedes,loading:loadSedes}=useTable('sedes',dataEnabled)
  const {rows:animais}=useTable('animais',dataEnabled)
  const {rows:financeiro}=useTable('financeiro',dataEnabled)
  const {rows:estoque}=useTable('estoque',dataEnabled)
  const {rows:manejos}=useTable('manejos',dataEnabled)
  const {rows:agenda}=useTable('agenda',dataEnabled)
  const {rows:reproducao}=useTable('reproducao',dataEnabled)
  const {rows:clientes}=useTable('clientes',dataEnabled)

  useEffect(()=>{
    let active=true
    async function initAuth(){
      const {data}=await sb.auth.getSession()
      if(data?.session?.user)await carregarPerfil(data.session.user,{silent:true})
      if(active)setAuthReady(true)
    }
    const {data:{subscription}={}}=sb.auth.onAuthStateChange((_event,session)=>{
      if(!active)return
      if(session?.user)carregarPerfil(session.user,{silent:true})
      else setUser(null)
    })
    initAuth()
    return ()=>{active=false;subscription?.unsubscribe?.()}
  },[])

  async function carregarPerfil(authUser,{silent=false}={}){
    const authEmail=(authUser?.email||'').trim()
    let perfil=null
    const byId=await sb.from('usuarios').select('*').eq('authUserId',authUser.id).maybeSingle()
    if(byId.data)perfil=byId.data
    if(!perfil&&authEmail){
      const byEmail=await sb.from('usuarios').select('*').eq('email',authEmail).maybeSingle()
      if(byEmail.data){
        perfil=byEmail.data
        if(!perfil.authUserId){
          const linked=await sb.from('usuarios').update({authUserId:authUser.id}).eq('id',perfil.id).select().maybeSingle()
          if(linked.data)perfil=linked.data
        }
      }
    }
    if(perfil){setUser(perfil);setErr('');return perfil}
    await sb.auth.signOut()
    if(!silent)setErr('Login seguro feito, mas este e-mail ainda nao tem perfil na tabela usuarios.')
    return null
  }

  async function login(){
    const emailLogin=email.trim()
    if(!emailLogin||!senha){setErr('Preencha e-mail e senha.');return}
    setLoginLoad(true);setErr('')
    const {data,error}=await sb.auth.signInWithPassword({email:emailLogin,password:senha})
    if(!error&&data?.user){
      const perfil=await carregarPerfil(data.user)
      if(perfil)setSenha('')
      setLoginLoad(false)
      return
    }
    const legacy=await sb.from('usuarios').select('*').eq('email',emailLogin).eq('senha',senha).maybeSingle()
    if(legacy.data){setUser({...legacy.data,authModo:'legacy'});setSenha('');setErr('')}
    else setErr('E-mail ou senha incorretos. Se voce ja criou o usuario no Supabase Auth, confira o Auth User ID no perfil.')
    setLoginLoad(false)
  }

  async function logout(){
    await sb.auth.signOut()
    setUser(null);setSenha('');setMod('dashboard')
  }

  if(!authReady)return <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',color:D1}}><style>{`*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}`}</style><Loading/></div>

  if(!user) return <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif'}}>
    <style>{`*{box-sizing:border-box}input,select{outline:none}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{width:400,padding:'44px 40px',background:CARD,borderRadius:20,border:'1px solid '+B,boxShadow:'0 32px 100px rgba(0,0,0,0.7)'}}>
      <div style={{display:'flex',justifyContent:'center',marginBottom:28}}><div style={{textAlign:'center'}}><Logo/><div style={{color:G,fontSize:11,fontWeight:700,letterSpacing:2.5,marginTop:6,textTransform:'uppercase'}}>Sistema de Gestao Rural</div></div></div>
      <div style={{height:1,background:B,marginBottom:24}}/>
      <div style={{color:TX,fontWeight:700,fontSize:16,textAlign:'center',marginBottom:4}}>Bem-vindo de volta</div>
      <div style={{color:D2,fontSize:13,textAlign:'center',marginBottom:22}}>Faca login para acessar o sistema</div>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Inp label='E-mail' value={email} onChange={setEmail} type='email' ph='seu@email.com'/>
        <Inp label='Senha' value={senha} onChange={setSenha} type='password' ph='********'/>
        {err&&<div style={{color:R,fontSize:12,textAlign:'center',background:R+'15',borderRadius:7,padding:'8px'}}>{err}</div>}
        <button onClick={login} disabled={loginLoad} style={{background:Y,color:'#000',border:'none',borderRadius:10,padding:'13px',fontWeight:800,fontSize:14,cursor:loginLoad?'not-allowed':'pointer',marginTop:4,opacity:loginLoad?0.55:1}}>{loginLoad?'Entrando...':'Entrar no Sistema'}</button>
      </div>
      <div style={{marginTop:16,padding:12,background:CARD2,borderRadius:10,border:'1px solid '+B,fontSize:11,color:D2}}>
        <div style={{fontWeight:700,color:D1,marginBottom:4}}>Login seguro</div>
        <div>Crie o usuario em Supabase Auth e vincule o Auth User ID no perfil do sistema.</div>
      </div>
    </div>
  </div>

  const navItems=[...NAV,...(user.perfil==='admin'?[{id:'usuarios',icon:'👥',label:'Usuarios',g:'Config'}]:[]) ]
  const groups=navItems.reduce((acc,n)=>{if(!acc.includes(n.g))acc.push(n.g);return acc;},[])
  const curNav=navItems.find(n=>n.id===mod)||{icon:'',label:''}
  const critCount=estoque.filter(e=>e.quantidade<=e.minimo).length

  return <div style={{minHeight:'100vh',background:BG,display:'flex',fontFamily:'system-ui,sans-serif',color:TX}}>
    <style>{`*{box-sizing:border-box}input,select{outline:none}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:${B};border-radius:3px}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{width:col?58:222,background:CARD,borderRight:'1px solid '+B,display:'flex',flexDirection:'column',transition:'width 0.22s',flexShrink:0,overflow:'hidden'}}>
      <div style={{padding:col?'13px 10px':'18px 16px',borderBottom:'1px solid '+B,display:'flex',alignItems:'center',justifyContent:'center',minHeight:68,background:BG}}><Logo small={col}/></div>
      <nav style={{flex:1,padding:'10px 7px',overflowY:'auto',overflowX:'hidden'}}>
        {groups.map(g=><div key={g}>{!col&&<div style={{color:D3,fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:1,padding:'12px 10px 5px'}}>{g}</div>}{navItems.filter(n=>n.g===g).map(n=>{const active=mod===n.id;return <button key={n.id} onClick={()=>setMod(n.id)} title={col?n.label:''} style={{display:'flex',alignItems:'center',gap:10,padding:col?'10px':'9px 11px',borderRadius:9,border:'none',cursor:'pointer',width:'100%',background:active?Y+'18':'transparent',color:active?Y:D1,fontWeight:active?700:500,fontSize:13,transition:'all 0.15s',marginBottom:2,justifyContent:col?'center':'flex-start',whiteSpace:'nowrap',overflow:'hidden'}}><span style={{fontSize:17,flexShrink:0}}>{n.icon}</span>{!col&&<span>{n.label}</span>}{!col&&active&&<div style={{width:4,height:4,borderRadius:'50%',background:Y,marginLeft:'auto',flexShrink:0}}/>}</button>})}</div>)}
      </nav>
      <div style={{padding:'10px 7px',borderTop:'1px solid '+B}}>
        <button onClick={()=>setCol(!col)} style={{width:'100%',padding:'8px',background:'transparent',border:'1px solid '+B,color:D2,cursor:'pointer',fontSize:13,borderRadius:8}}>{col?'▶':'◀'}</button>
        {!col&&<div style={{padding:'10px 12px 4px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:30,height:30,borderRadius:8,background:Y+'18',border:'1px solid '+Y+'40',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:Y,fontSize:14}}>{user.nome?.charAt(0)}</div><div><div style={{color:TX,fontSize:12,fontWeight:700}}>{user.nome?.split(' ')[0]}</div><div style={{color:D2,fontSize:10,textTransform:'capitalize'}}>{user.perfil}</div></div></div>
          <button onClick={logout} style={{marginTop:8,color:R,background:'none',border:'none',cursor:'pointer',fontSize:11,padding:0,fontWeight:600}}>Sair</button>
        </div>}
      </div>
    </div>
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{height:58,background:CARD,borderBottom:'1px solid '+B,display:'flex',alignItems:'center',padding:'0 26px',gap:12,flexShrink:0}}>
        <div style={{flex:1}}><div style={{color:TX,fontWeight:700,fontSize:15}}>{curNav.icon} {curNav.label}</div><div style={{color:D2,fontSize:11,marginTop:1}}>Cabanha Pagliosa - {user.nome}</div></div>
        {user.authModo==='legacy'&&<div style={{background:Y+'15',border:'1px solid '+Y+'35',borderRadius:8,padding:'5px 11px',fontSize:11,color:Y,fontWeight:700}}>Login antigo: vincule no Supabase Auth antes de ativar RLS</div>}
        {critCount>0&&<div style={{background:R+'15',border:'1px solid '+R+'30',borderRadius:8,padding:'5px 11px',fontSize:11,color:R,fontWeight:700}}>{critCount} item(s) critico(s)</div>}
        <div style={{width:34,height:34,borderRadius:9,background:Y+'18',border:'1px solid '+Y+'40',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:Y,fontSize:14}}>{user.nome?.charAt(0)}</div>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'26px 28px'}}>
        {mod==='dashboard'&&<Dashboard animais={animais} financeiro={financeiro} estoque={estoque} manejos={manejos} agenda={agenda} sedes={sedes}/>}
        {mod==='graficos'&&<Graficos animais={animais} financeiro={financeiro} reproducao={reproducao} manejos={manejos} sedes={sedes}/>}
        {mod==='rebanho'&&<Rebanho sedes={sedes} user={user}/>}
        {mod==='reproducao'&&<Reproducao animais={animais} sedes={sedes} user={user}/>}
        {mod==='manejos'&&<Manejos sedes={sedes} user={user}/>}
        {mod==='semen'&&<Semen sedes={sedes} user={user}/>}
        {mod==='financeiro'&&<Financeiro clientes={clientes} user={user}/>}
        {mod==='clientes'&&<ClientesFornecedores user={user}/>}
        {mod==='vendas'&&<Vendas animais={animais} sedes={sedes} user={user}/>}
        {mod==='estoque'&&<Estoque sedes={sedes} user={user}/>}
        {mod==='agenda'&&<Agenda sedes={sedes}/>}
        {mod==='sedes'&&<Sedes user={user}/>}
        {mod==='excel'&&<ExcelPanel sedes={sedes}/>}
        {mod==='ia'&&<div style={{height:'calc(100vh - 80px)',display:'flex',flexDirection:'column'}}><div style={{color:TX,fontWeight:800,fontSize:20,marginBottom:18}}>🤖 IA e Relatorios</div><div style={{flex:1,background:CARD,borderRadius:14,border:'1px solid '+B,padding:20,display:'flex',flexDirection:'column'}}><AIPanel animais={animais} manejos={manejos} estoque={estoque} reproducao={reproducao} financeiro={financeiro}/></div></div>}
        {mod==='usuarios'&&user.perfil==='admin'&&<Usuarios sedes={sedes}/>}
      </div>
    </div>
  </div>
}
