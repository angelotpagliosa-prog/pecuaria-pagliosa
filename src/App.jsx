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
function useTable(table){
  const [rows,setRows]=useState([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    sb.from(table).select('*').then(({data})=>{setRows(data||[]);setLoading(false);})
  },[table])
  async function add(obj){const {data}=await sb.from(table).insert([obj]).select();if(data)setRows(p=>[...p,data[0]]);}
  async function update(id,obj){const {data}=await sb.from(table).update(obj).eq('id',id).select();if(data)setRows(p=>p.map(r=>r.id===id?data[0]:r));}
  async function remove(id){await sb.from(table).delete().eq('id',id);setRows(p=>p.filter(r=>r.id!==id));}
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
    const custoM=manejos.reduce((s,m)=>{const meds=Array.isArray(m.medicamentos)?m.medicamentos:[];return s+meds.reduce((ss,md)=>ss+(md.qtd*md.valor),0);},0)
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
  const rec=financeiro.filter(f=>f.tipo==='venda').reduce((s,f)=>s+Number(f.valor),0)
  const dep=financeiro.filter(f=>f.tipo==='despesa').reduce((s,f)=>s+Number(f.valor),0)
  const crit=estoque.filter(e=>e.quantidade<=e.minimo).length
  const custoM=manejos.reduce((s,m)=>{const meds=Array.isArray(m.medicamentos)?m.medicamentos:[];return s+meds.reduce((ss,md)=>ss+(md.qtd*md.valor),0);},0)
  const pend=agenda.filter(a=>a.status==='pendente')
  return <div>
    <div style={{marginBottom:22}}><div style={{color:TX,fontWeight:800,fontSize:22}}>Visao Geral</div><div style={{color:D2,fontSize:13,marginTop:3}}>Cabanha Pagliosa</div></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))',gap:12,marginBottom:22}}>
      <StatCard icon='🐂' label='Animais Ativos' value={ativos} color={Y}/>
      <StatCard icon='💰' label='Receita' value={fmtR(rec)} color={G}/>
      <StatCard icon='📉' label='Despesas' value={fmtR(dep)} color={R}/>
      <StatCard icon='💵' label='Saldo' value={fmtR(rec-dep)} color={rec-dep>=0?Y:R}/>
      <StatCard icon='💊' label='Custo Manejos' value={fmtR(custoM)} color={PU}/>
      <StatCard icon='⚠️' label='Estoque Critico' value={crit} color={crit>0?R:G} sub={crit>0?'Requer atencao':'Tudo OK'}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
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
  const {rows,loading,add,update,remove}=useTable('animais')
  const [modal,setModal]=useState(null)
  const [sel,setSel]=useState(null)
  const [filt,setFilt]=useState(''),[fSede,setFSede]=useState(''),[fStatus,setFStatus]=useState('')
  const [brinco,setBrinco]=useState(''),[nome,setNome]=useState(''),[raca,setRaca]=useState('Charolês')
  const [sexo,setSexo]=useState('M'),[nasc,setNasc]=useState(''),[peso,setPeso]=useState('')
  const [status,setStatus]=useState('Ativo'),[categoria,setCategoria]=useState('Touro')
  const [sedeId,setSedeId]=useState(sedes[0]?.id||''),[pai,setPai]=useState(''),[mae,setMae]=useState('')

  function reset(){setBrinco('');setNome('');setRaca('Charolês');setSexo('M');setNasc('');setPeso('');setStatus('Ativo');setCategoria('Touro');setSedeId(sedes[0]?.id||'');setPai('');setMae('');}
  function loadF(a){setBrinco(a.brinco);setNome(a.nome||'');setRaca(a.raca);setSexo(a.sexo);setNasc(a.nascimento||'');setPeso(String(a.peso||''));setStatus(a.status);setCategoria(a.categoria||'Touro');setSedeId(a.sedeId||'');setPai(a.pai||'');setMae(a.mae||'');}
  function buildObj(){return {brinco,nome,raca,sexo,nascimento:nasc,peso:Number(peso),status,categoria,sedeId,pai,mae};}

  const statusAtivos=['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural']
  const statusCores={Ativo:G,Prenha:'#34d399','Não Pronta':R,TEF:PU,Inseminada:BL,'Monta Natural':Y,Vendido:'#fb923c',Morto:D2}
  const catColors={Terneiro:BL,Sobreano:'#34d399',Matriz:'#f472b6',Novilha:PU,Touro:Y,Descarte:R}
  const lista=rows.filter(a=>(filt===''||a.brinco?.includes(filt)||a.nome?.toLowerCase().includes(filt.toLowerCase()))&&(fSede===''||a.sedeId===fSede)&&(fStatus===''||a.status===fStatus))
  const listaFiltrada=fStatus==='ativo_todos'?rows.filter(a=>statusAtivos.includes(a.status)):lista
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
  async function confirmarDel(){await remove(sel.id);setModal(null);}

  const sedeOpts=sedes.map(s=>({v:s.id,l:s.nome}))
  const formBody=<div style={{display:'flex',flexDirection:'column',gap:13}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Brinco' value={brinco} onChange={setBrinco}/><Inp label='Nome' value={nome} onChange={setNome}/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Raca' value={raca} onChange={setRaca} opts={['Charolês','Caracu','Tabapuã','Nelore','Braford','Brangus','Angus','Hereford','Simmental','Outro'].map(r=>({v:r,l:r}))}/><Inp label='Sexo' value={sexo} onChange={setSexo} opts={[{v:'M',l:'Macho'},{v:'F',l:'Femea'}]}/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Categoria' value={categoria} onChange={setCategoria} opts={['Terneiro','Sobreano','Matriz','Novilha','Touro','Descarte'].map(c=>({v:c,l:c}))}/><Inp label='Status' value={status} onChange={setStatus} opts={['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural','Vendido','Morto'].map(s=>({v:s,l:s}))}/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Nascimento' value={nasc} onChange={setNasc} type='date'/><Inp label='Peso (kg)' value={peso} onChange={setPeso} type='number'/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Pai' value={pai} onChange={setPai}/><Inp label='Mae' value={mae} onChange={setMae}/></div>
    <Inp label='Sede' value={sedeId} onChange={setSedeId} opts={sedeOpts}/>
  </div>

  return <div>
    <SH title='🐂 Rebanho' action={canEdit&&<Btn onClick={()=>{reset();setModal('new')}}>+ Novo Animal</Btn>}/>
    <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
      <input value={filt} onChange={e=>setFilt(e.target.value)} placeholder='Buscar brinco ou nome...' style={{flex:1,minWidth:160,background:CARD,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',color:TX,fontSize:13,outline:'none'}}/>
      <select value={fSede} onChange={e=>setFSede(e.target.value)} style={{background:CARD,border:'1px solid '+B,borderRadius:9,padding:'9px 13px',color:TX,fontSize:13}}><option value=''>Todas as sedes</option>{sedes.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</select>
      <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{background:CARD,border:'1px solid '+B,borderRadius:9,padding:'9px 13px',color:TX,fontSize:13}}>
        <option value=''>Todos os status</option>
        <option value='ativo_todos'>Todos Ativos</option>
        {['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural','Vendido','Morto'].map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <div style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'9px 14px',fontSize:13,color:D1}}>{lista.length} animais</div>
    </div>
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:750}}>
          <thead><tr><Th>Brinco</Th><Th>Nome</Th><Th>Categoria</Th><Th>Raca</Th><Th>Sexo</Th><Th>Nascimento</Th><Th>Peso</Th><Th>Sede</Th><Th>Status</Th>{canEdit&&<Th>Acoes</Th>}</tr></thead>
          <tbody>{listaFiltrada.map(a=>{const sede=sedes.find(s=>s.id===a.sedeId);const sc=statusCores[a.status]||D1;return <TR key={a.id}><Td s={{fontWeight:800,color:Y}}>{a.brinco}</Td><Td s={{fontWeight:600}}>{a.nome||'-'}</Td><Td><Badge label={a.categoria||'-'} color={catColors[a.categoria]||D1}/></Td><Td>{a.raca}</Td><Td>{a.sexo==='M'?'Macho':'Femea'}</Td><Td s={{color:D1}}>{fmtDate(a.nascimento)}</Td><Td s={{fontWeight:700}}>{a.peso?a.peso+' kg':'-'}</Td><Td s={{color:D1,fontSize:12}}>{sede?.nome||'-'}</Td><Td><Badge label={a.status} color={sc} dot/></Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(a);loadF(a);setModal('edit');}} onDel={()=>{setSel(a);setModal('delete');}}/></Td>}</TR>})}</tbody>
        </table>
        {lista.length===0&&<Empty/>}
      </div>}
    </div>
    {modal==='new'&&<Modal title='Cadastrar Novo Animal' onClose={()=>setModal(null)}>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarNovo} label='Salvar Animal' disabled={!brinco}/></Modal>}
    {modal==='edit'&&sel&&<Modal title={'Editar: '+sel.brinco} onClose={()=>setModal(null)}>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarEdit} disabled={!brinco}/></Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Animal' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+sel.brinco+'?'} onCancel={()=>setModal(null)} onConfirm={confirmarDel}/></Modal>}
  </div>
}

// ── ESTOQUE ───────────────────────────────────────────────
function Estoque({sedes,user}){
  const {rows,loading,add,update,remove}=useTable('estoque')
  const [modal,setModal]=useState(null),[sel,setSel]=useState(null)
  const blank={nome:'',categoria:'Hormônio',quantidade:'',unidade:'unid',minimo:'',sedeId:sedes[0]?.id||''}
  const [form,setForm]=useState(blank)
  const fv=v=>setForm(p=>({...p,...v}))
  const canEdit=user.perfil!=='funcionario'
  async function salvarNovo(){await add({id:genId(),...form,quantidade:Number(form.quantidade),minimo:Number(form.minimo)});setModal(null);}
  async function salvarEdit(){await update(sel.id,{...form,quantidade:Number(form.quantidade),minimo:Number(form.minimo)});setModal(null);}
  async function confirmarDel(){await remove(sel.id);setModal(null);}
  const sedeOpts=sedes.map(s=>({v:s.id,l:s.nome}))
  const fields=<div style={{display:'flex',flexDirection:'column',gap:13}}>
    <Inp label='Nome do Item' value={form.nome} onChange={v=>fv({nome:v})}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Categoria' value={form.categoria} onChange={v=>fv({categoria:v})} opts={['Hormônio','Antiparasitário','Vacina','Ração','Sêmen','Equipamento','Outro'].map(c=>({v:c,l:c}))}/><Inp label='Unidade' value={form.unidade} onChange={v=>fv({unidade:v})} opts={['unid','mL','L','kg','g','dose','comp'].map(u=>({v:u,l:u}))}/></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Qtd. Atual' value={form.quantidade} onChange={v=>fv({quantidade:v})} type='number'/><Inp label='Estoque Minimo' value={form.minimo} onChange={v=>fv({minimo:v})} type='number'/></div>
    <Inp label='Sede' value={form.sedeId} onChange={v=>fv({sedeId:v})} opts={sedeOpts}/>
  </div>
  return <div>
    <SH title='📦 Estoque e Insumos' action={canEdit&&<Btn onClick={()=>{setForm(blank);setModal('new')}}>+ Novo Item</Btn>}/>
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
          <thead><tr><Th>Item</Th><Th>Categoria</Th><Th>Qtd. Atual</Th><Th>Minimo</Th><Th>Sede</Th><Th>Status</Th>{canEdit&&<Th>Acoes</Th>}</tr></thead>
          <tbody>{rows.map(e=>{const crit=e.quantidade<=e.minimo;const sede=sedes.find(s=>s.id===e.sedeId);return <TR key={e.id}><Td s={{fontWeight:600}}>{e.nome}</Td><Td><Badge label={e.categoria} color={PU}/></Td><Td s={{fontWeight:800,color:crit?R:TX}}>{e.quantidade+' '+e.unidade}</Td><Td s={{color:D1}}>{e.minimo+' '+e.unidade}</Td><Td s={{color:D1,fontSize:12}}>{sede?.nome||'-'}</Td><Td><Badge label={crit?'Critico':'Normal'} color={crit?R:G} dot/></Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(e);setForm({nome:e.nome,categoria:e.categoria,quantidade:e.quantidade,unidade:e.unidade,minimo:e.minimo,sedeId:e.sedeId});setModal('edit');}} onDel={()=>{setSel(e);setModal('delete');}}/></Td>}</TR>})}</tbody>
        </table>
        {rows.length===0&&<Empty/>}
      </div>}
    </div>
    {modal==='new'&&<Modal title='Novo Item' onClose={()=>setModal(null)}>{fields}<MFooter onCancel={()=>setModal(null)} onSave={salvarNovo} label='Salvar Item' disabled={!form.nome}/></Modal>}
    {modal==='edit'&&sel&&<Modal title={'Editar: '+sel.nome} onClose={()=>setModal(null)}>{fields}<MFooter onCancel={()=>setModal(null)} onSave={salvarEdit} disabled={!form.nome}/></Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Item' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+sel.nome+'?'} onCancel={()=>setModal(null)} onConfirm={confirmarDel}/></Modal>}
  </div>
}

// ── FINANCEIRO ────────────────────────────────────────────
const CAT_DESP=['Sanidade','Alimentação/Ração','Mão de Obra','Combustível','Manutenção','Reprodução','Impostos/Taxas','Transporte','Energia Elétrica','Outros']
const CAT_REC=['Venda de Animais','Arrendamento','Serviços','Outros']
const catCorFin={Sanidade:PU,'Alimentação/Ração':'#34d399','Mão de Obra':BL,Combustível:'#fb923c',Manutenção:Y,Reprodução:'#f472b6','Impostos/Taxas':R,Transporte:'#a3e635','Energia Elétrica':'#facc15','Venda de Animais':G,Arrendamento:G,Serviços:G,Outros:D1}
function Financeiro({clientes,user}){
  const {rows,loading,add,update,remove}=useTable('financeiro')
  const [modal,setModal]=useState(null),[sel,setSel]=useState(null),[tab,setTab]=useState('todos'),[fCat,setFCat]=useState('')
  const blank={tipo:'despesa',categoria:'Outros',descricao:'',valor:'',data:'',clienteId:''}
  const [form,setForm]=useState(blank)
  const fv=v=>setForm(p=>({...p,...v}))
  const rec=rows.filter(x=>x.tipo==='venda').reduce((s,x)=>s+Number(x.valor),0)
  const dep=rows.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor),0)
  const lista=(tab==='todos'?rows:rows.filter(x=>x.tipo===tab)).filter(x=>fCat===''||x.categoria===fCat)
  const canEdit=user.perfil!=='funcionario'
  const catOpts=form.tipo==='venda'?CAT_REC.map(c=>({v:c,l:c})):CAT_DESP.map(c=>({v:c,l:c}))
  async function salvarNovo(){await add({id:genId(),...form,valor:Number(form.valor)});setModal(null);setForm(blank);}
  async function salvarEdit(){await update(sel.id,{...form,valor:Number(form.valor)});setModal(null);}
  async function confirmarDel(){await remove(sel.id);setModal(null);}
  const cliOpts=[{v:'',l:'Nenhum'},...clientes.map(c=>({v:c.id,l:c.nome}))]
  const formBody=<div style={{display:'flex',flexDirection:'column',gap:13}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Inp label='Tipo' value={form.tipo} onChange={v=>fv({tipo:v,categoria:v==='venda'?'Venda de Animais':'Outros'})} opts={[{v:'despesa',l:'Despesa'},{v:'venda',l:'Receita'}]}/>
      <Inp label='Categoria' value={form.categoria} onChange={v=>fv({categoria:v})} opts={catOpts}/>
    </div>
    <Inp label='Descrição' value={form.descricao} onChange={v=>fv({descricao:v})} ph='Ex: Ivermectina lote A, Venda Touro 2526...'/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Valor (R$)' value={form.valor} onChange={v=>fv({valor:v})} type='number'/><Inp label='Data' value={form.data} onChange={v=>fv({data:v})} type='date'/></div>
    <Inp label='Cliente / Fornecedor' value={form.clienteId} onChange={v=>fv({clienteId:v})} opts={cliOpts}/>
  </div>
  const depPorCat=CAT_DESP.map(c=>({cat:c,total:rows.filter(x=>x.tipo==='despesa'&&x.categoria===c).reduce((s,x)=>s+Number(x.valor),0)})).filter(x=>x.total>0)
  return <div>
    <SH title='💰 Financeiro' action={canEdit&&<Btn onClick={()=>{setForm(blank);setModal('new')}}>+ Novo Lançamento</Btn>}/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:12,marginBottom:18}}>
      <StatCard icon='📈' label='Receitas' value={fmtR(rec)} color={G}/>
      <StatCard icon='📉' label='Despesas' value={fmtR(dep)} color={R}/>
      <StatCard icon='💵' label='Saldo' value={fmtR(rec-dep)} color={rec-dep>=0?Y:R}/>
      <StatCard icon='📋' label='Lançamentos' value={rows.length} color={BL}/>
    </div>
    {depPorCat.length>0&&<div style={{background:CARD,border:'1px solid '+B,borderRadius:12,padding:16,marginBottom:18}}>
      <div style={{color:D1,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6,marginBottom:12}}>Despesas por Categoria</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{depPorCat.sort((a,b)=>b.total-a.total).map(x=><div key={x.cat} style={{background:CARD2,border:'1px solid '+B,borderRadius:9,padding:'8px 14px',cursor:'pointer',borderLeft:'3px solid '+(catCorFin[x.cat]||D1)}} onClick={()=>setFCat(fCat===x.cat?'':x.cat)}><div style={{color:catCorFin[x.cat]||D1,fontWeight:700,fontSize:13}}>{fmtR(x.total)}</div><div style={{color:D2,fontSize:10,marginTop:2}}>{x.cat}</div></div>)}</div>
    </div>}
    <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
      {[['todos','Todos'],['despesa','Despesas'],['venda','Receitas']].map(t=><button key={t[0]} onClick={()=>{setTab(t[0]);setFCat('');}} style={{padding:'6px 16px',borderRadius:8,border:'1px solid '+(tab===t[0]?Y:B),background:tab===t[0]?Y+'18':'transparent',color:tab===t[0]?Y:D1,fontWeight:700,fontSize:12,cursor:'pointer'}}>{t[1]}</button>)}
      {fCat&&<button onClick={()=>setFCat('')} style={{padding:'6px 12px',borderRadius:8,border:'1px solid '+R+'40',background:R+'15',color:R,fontWeight:700,fontSize:11,cursor:'pointer'}}>✕ {fCat}</button>}
    </div>
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
          <thead><tr><Th>Tipo</Th><Th>Categoria</Th><Th>Descrição</Th><Th>Valor</Th><Th>Data</Th><Th>Cliente/Fornecedor</Th>{canEdit&&<Th>Ações</Th>}</tr></thead>
          <tbody>{lista.map(x=>{const cli=clientes.find(c=>c.id===x.clienteId);const cc=catCorFin[x.categoria]||D1;return <TR key={x.id}><Td><Badge label={x.tipo==='venda'?'Receita':'Despesa'} color={x.tipo==='venda'?G:R}/></Td><Td><Badge label={x.categoria||'Outros'} color={cc}/></Td><Td s={{fontWeight:600}}>{x.descricao}</Td><Td s={{fontWeight:800,color:x.tipo==='venda'?G:R}}>{fmtR(x.valor)}</Td><Td s={{color:D1,whiteSpace:'nowrap'}}>{fmtDate(x.data)}</Td><Td s={{color:D1}}>{cli?.nome||'-'}</Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(x);setForm({tipo:x.tipo,categoria:x.categoria||'Outros',descricao:x.descricao,valor:String(x.valor),data:x.data||'',clienteId:x.clienteId||''});setModal('edit');}} onDel={()=>{setSel(x);setModal('delete');}}/></Td>}</TR>})}</tbody>
        </table>
        {lista.length===0&&<Empty/>}
      </div>}
    </div>
    {modal==='new'&&<Modal title='Novo Lançamento' onClose={()=>setModal(null)}>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarNovo} disabled={!form.descricao||!form.valor}/></Modal>}
    {modal==='edit'&&sel&&<Modal title={'Editar: '+sel.descricao} onClose={()=>setModal(null)}>{formBody}<MFooter onCancel={()=>setModal(null)} onSave={salvarEdit} disabled={!form.descricao||!form.valor}/></Modal>}
    {modal==='delete'&&sel&&<Modal title='Excluir Lançamento' onClose={()=>setModal(null)}><DelConfirm msg={'Excluir '+sel.descricao+'?'} onCancel={()=>setModal(null)} onConfirm={confirmarDel}/></Modal>}
  </div>
}

// ── REPRODUCAO ────────────────────────────────────────────
function Reproducao({animais,sedes,user}){
  const {rows,loading,add}=useTable('reproducao')
  const blank={animalId:animais[0]?.id||'',tipo:'IATF',data:'',resultado:'Pendente',obs:'',sedeId:sedes[0]?.id||''}
  const [modal,setModal]=useState(false),[form,setForm]=useState(blank)
  const fv=v=>setForm(p=>({...p,...v}))
  const tColor={IATF:PU,DG:BL,Parto:G,'Monta Natural':Y}
  const rColor={Prenha:G,Vazia:R,Pendente:Y,Normal:BL}
  async function salvar(){await add({id:genId(),...form});setModal(false);setForm(blank);}
  return <div>
    <SH title='🔬 Reproducao' action={user.perfil!=='funcionario'&&<Btn onClick={()=>setModal(true)}>+ Novo Registro</Btn>}/>
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:650}}>
          <thead><tr><Th>Animal</Th><Th>Tipo</Th><Th>Data</Th><Th>Resultado</Th><Th>Sede</Th><Th>Obs.</Th></tr></thead>
          <tbody>{rows.map(r=>{const a=animais.find(x=>x.id===r.animalId);const sede=sedes.find(s=>s.id===r.sedeId);return <TR key={r.id}><Td s={{fontWeight:700,color:Y}}>{a?a.brinco+' - '+a.nome:'-'}</Td><Td><Badge label={r.tipo} color={tColor[r.tipo]||D1}/></Td><Td s={{color:D1}}>{fmtDate(r.data)}</Td><Td><Badge label={r.resultado} color={rColor[r.resultado]||D1} dot/></Td><Td s={{color:D1,fontSize:12}}>{sede?.nome||'-'}</Td><Td s={{color:D1}}>{r.obs||'-'}</Td></TR>})}</tbody>
        </table>
        {rows.length===0&&<Empty/>}
      </div>}
    </div>
    {modal&&<Modal title='Novo Registro Reprodutivo' onClose={()=>setModal(false)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Inp label='Animal' value={form.animalId} onChange={v=>fv({animalId:v})} opts={animais.map(a=>({v:a.id,l:a.brinco+' - '+a.nome}))}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Tipo' value={form.tipo} onChange={v=>fv({tipo:v})} opts={['IATF','DG','Parto','Monta Natural'].map(t=>({v:t,l:t}))}/><Inp label='Data' value={form.data} onChange={v=>fv({data:v})} type='date'/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Resultado' value={form.resultado} onChange={v=>fv({resultado:v})} opts={['Pendente','Prenha','Vazia','Normal'].map(t=>({v:t,l:t}))}/><Inp label='Sede' value={form.sedeId} onChange={v=>fv({sedeId:v})} opts={sedes.map(s=>({v:s.id,l:s.nome}))}/></div>
        <Inp label='Observacoes' value={form.obs} onChange={v=>fv({obs:v})}/>
        <MFooter onCancel={()=>setModal(false)} onSave={salvar}/>
      </div>
    </Modal>}
  </div>
}

// ── MANEJOS ───────────────────────────────────────────────
function Manejos({sedes,user}){
  const {rows,loading,add}=useTable('manejos')
  const blankMed=()=>({id:genId(),nome:'',qtd:'',unidade:'mL',valor:''})
  const blankForm={nome:'',data:'',sedeId:sedes[0]?.id||'',cabecas:'',medicamentos:[blankMed()],obs:'',status:'pendente'}
  const [modal,setModal]=useState(false),[detail,setDetail]=useState(null),[form,setForm]=useState(blankForm)
  function calcTotal(meds){return (Array.isArray(meds)?meds:[]).reduce((s,m)=>s+(parseFloat(m.qtd||0)*parseFloat(m.valor||0)),0);}
  const ft=calcTotal(form.medicamentos),fpp=form.cabecas>0?ft/parseFloat(form.cabecas||1):0
  function addMed(){setForm(f=>({...f,medicamentos:[...f.medicamentos,blankMed()]}));}
  function updMed(i,k,v){setForm(f=>({...f,medicamentos:f.medicamentos.map((m,idx)=>idx===i?{...m,[k]:v}:m)}));}
  function remMed(i){setForm(f=>({...f,medicamentos:f.medicamentos.filter((_,idx)=>idx!==i)}));}
  async function salvar(){
    const obj={id:genId(),...form,cabecas:parseInt(form.cabecas)||0,medicamentos:form.medicamentos.map(m=>({...m,qtd:parseFloat(m.qtd)||0,valor:parseFloat(m.valor)||0}))}
    await add(obj);setModal(false);setForm(blankForm);
  }
  const sC={concluido:G,pendente:Y,cancelado:R},sL={concluido:'Concluido',pendente:'Pendente',cancelado:'Cancelado'}
  return <div>
    <SH title='🩺 Manejos Sanitarios' action={user.perfil!=='funcionario'&&<Btn onClick={()=>setModal(true)}>+ Novo Manejo</Btn>}/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:20}}>
      <StatCard icon='🩺' label='Total' value={rows.length} color={Y}/>
      <StatCard icon='💊' label='Custo Total' value={fmtR(rows.reduce((s,m)=>s+calcTotal(m.medicamentos),0))} color={PU}/>
      <StatCard icon='✅' label='Concluidos' value={rows.filter(m=>m.status==='concluido').length} color={G}/>
      <StatCard icon='⏳' label='Pendentes' value={rows.filter(m=>m.status==='pendente').length} color={Y}/>
    </div>
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><Th>Manejo</Th><Th>Data</Th><Th>Sede</Th><Th>Cabecas</Th><Th>Custo Total</Th><Th>Custo/Cabeca</Th><Th>Status</Th></tr></thead>
          <tbody>{rows.map(m=>{const total=calcTotal(m.medicamentos);const cpp=m.cabecas>0?total/m.cabecas:0;const sede=sedes.find(s=>s.id===m.sedeId);return <TR key={m.id}><Td s={{fontWeight:700,color:BL,textDecoration:'underline',cursor:'pointer'}} onClick={()=>setDetail(m)}>{m.nome}</Td><Td s={{color:D1}}>{fmtDate(m.data)}</Td><Td s={{color:D1,fontSize:12}}>{sede?.nome||'-'}</Td><Td s={{fontWeight:700,textAlign:'center'}}>{m.cabecas}</Td><Td s={{fontWeight:800,color:PU}}>{fmtR(total)}</Td><Td s={{fontWeight:700,color:Y}}>{fmtR(cpp)}</Td><Td><Badge label={sL[m.status]||m.status} color={sC[m.status]||D1} dot/></Td></TR>})}</tbody>
        </table>
        {rows.length===0&&<Empty msg='Nenhum manejo registrado.'/>}
      </div>}
    </div>
    {modal&&<Modal title='Registrar Manejo Sanitario' onClose={()=>setModal(false)} wide>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}><Inp label='Nome' value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))}/><Inp label='Data' value={form.data} onChange={v=>setForm(f=>({...f,data:v}))} type='date'/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Sede' value={form.sedeId} onChange={v=>setForm(f=>({...f,sedeId:v}))} opts={sedes.map(s=>({v:s.id,l:s.nome}))}/><Inp label='Cabecas' value={form.cabecas} onChange={v=>setForm(f=>({...f,cabecas:v}))} type='number'/></div>
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
              {[['Custo Total',fmtR(ft),PU],['Custo/Cabeca',fmtR(fpp),Y],['Cabecas',form.cabecas||'-',TX]].map(([l,v,c])=><div key={l} style={{textAlign:'center'}}><div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>{l}</div><div style={{color:c,fontWeight:800,fontSize:18,marginTop:2}}>{v}</div></div>)}
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Observacoes' value={form.obs} onChange={v=>setForm(f=>({...f,obs:v}))}/><Inp label='Status' value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} opts={[{v:'pendente',l:'Pendente'},{v:'concluido',l:'Concluido'},{v:'cancelado',l:'Cancelado'}]}/></div>
        <MFooter onCancel={()=>setModal(false)} onSave={salvar} label='Registrar Manejo' disabled={!form.nome||!form.cabecas}/>
      </div>
    </Modal>}
    {detail&&<Modal title={detail.nome} onClose={()=>setDetail(null)} wide>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>{[['Data',fmtDate(detail.data),TX],['Sede',(sedes.find(s=>s.id===detail.sedeId)||{nome:'-'}).nome,TX],['Cabecas',detail.cabecas,Y],['Status',sL[detail.status]||detail.status,sC[detail.status]||D1]].map(([l,v,c])=><div key={l} style={{background:CARD2,borderRadius:9,padding:'12px 14px',border:'1px solid '+B}}><div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>{l}</div><div style={{color:c,fontWeight:700,fontSize:15,marginTop:4}}>{v}</div></div>)}</div>
        {detail.obs&&<div style={{color:D1,fontSize:13}}><strong>Obs:</strong> {detail.obs}</div>}
      </div>
    </Modal>}
  </div>
}

// ── AGENDA ────────────────────────────────────────────────
function Agenda({sedes}){
  const {rows,loading,add,update}=useTable('agenda')
  const blank={titulo:'',data:'',tipo:'Reproducao',descricao:'',sedeId:sedes[0]?.id||'',status:'pendente'}
  const [modal,setModal]=useState(false),[form,setForm]=useState(blank)
  const fv=v=>setForm(p=>({...p,...v}))
  async function salvar(){await add({id:genId(),...form});setModal(false);setForm(blank);}
  async function toggle(a){await update(a.id,{status:a.status==='pendente'?'concluido':'pendente'});}
  const tColor={Reproducao:PU,Comercial:Y,Saude:R,Manejo:G,Outro:D1}
  const pend=rows.filter(a=>a.status==='pendente').sort((a,b)=>a.data?.localeCompare(b.data))
  const done=rows.filter(a=>a.status==='concluido')
  return <div>
    <SH title='📅 Agenda e Tarefas' action={<Btn onClick={()=>setModal(true)}>+ Nova Tarefa</Btn>}/>
    {loading?<Loading/>:<>
      {pend.length>0&&<div style={{marginBottom:10,color:D1,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6}}>Pendentes: {pend.length}</div>}
      <div style={{display:'flex',flexDirection:'column',gap:9,marginBottom:20}}>
        {pend.map(a=>{const sede=sedes.find(s=>s.id===a.sedeId);const tc=tColor[a.tipo]||D1;return <div key={a.id} style={{background:CARD,border:'1px solid '+B,borderRadius:11,display:'flex',alignItems:'center',gap:14,padding:'13px 18px'}}><div style={{width:3,height:44,background:tc,borderRadius:2,flexShrink:0}}/><div style={{flex:1}}><div style={{color:TX,fontWeight:700,fontSize:14}}>{a.titulo}</div><div style={{color:D2,fontSize:12,marginTop:3}}>{a.descricao} - {fmtDate(a.data)} - {sede?.nome||''}</div></div><Badge label={a.tipo} color={tc}/><button onClick={()=>toggle(a)} style={{background:CARD2,border:'1px solid '+B,borderRadius:8,padding:'6px 13px',cursor:'pointer',color:D1,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>Concluir</button></div>})}
        {pend.length===0&&<div style={{color:D2,textAlign:'center',padding:'30px 0',fontSize:13}}>Nenhuma tarefa pendente!</div>}
      </div>
      {done.length>0&&<><div style={{marginBottom:10,color:D2,fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.6}}>Concluidas: {done.length}</div><div style={{display:'flex',flexDirection:'column',gap:7,opacity:0.5}}>{done.map(a=><div key={a.id} style={{background:CARD,border:'1px solid '+B,borderRadius:11,display:'flex',alignItems:'center',gap:14,padding:'11px 18px'}}><div style={{color:D2,fontSize:13,textDecoration:'line-through',flex:1}}>{a.titulo}</div><Badge label='Feito' color={G}/><button onClick={()=>toggle(a)} style={{background:'none',border:'none',color:D2,fontSize:11,cursor:'pointer'}}>Reabrir</button></div>)}</div></>}
    </>}
    {modal&&<Modal title='Nova Tarefa' onClose={()=>setModal(false)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Inp label='Titulo' value={form.titulo} onChange={v=>fv({titulo:v})}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Data' value={form.data} onChange={v=>fv({data:v})} type='date'/><Inp label='Tipo' value={form.tipo} onChange={v=>fv({tipo:v})} opts={['Reproducao','Comercial','Saude','Manejo','Outro'].map(t=>({v:t,l:t}))}/></div>
        <Inp label='Sede' value={form.sedeId} onChange={v=>fv({sedeId:v})} opts={sedes.map(s=>({v:s.id,l:s.nome}))}/>
        <Inp label='Descricao' value={form.descricao} onChange={v=>fv({descricao:v})}/>
        <MFooter onCancel={()=>setModal(false)} onSave={salvar} disabled={!form.titulo}/>
      </div>
    </Modal>}
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
  const [tab,setTab]=useState('sedes'),[modal,setModal]=useState(null),[sel,setSel]=useState(null)
  const [form,setForm]=useState({nome:'',cidade:'',estado:'PR'})
  const ff=v=>setForm(p=>({...p,...v}))
  const blankMov={animalId:'',sedeDestId:'',data:'',motivo:''}
  const [movForm,setMovForm]=useState(blankMov)
  const hasAnim=sel&&animais.some(a=>a.sedeId===sel.id)
  async function salvarNova(){await add({id:genId(),...form});setModal(null);setForm({nome:'',cidade:'',estado:'PR'});}
  async function salvarEdit(){await update(sel.id,form);setModal(null);}
  async function confirmarDel(){await remove(sel.id);setModal(null);}
  const animalSel=animais.find(a=>a.id===movForm.animalId)
  async function salvarMov(){
    if(!movForm.animalId||!movForm.sedeDestId||!movForm.data)return
    const orig=animalSel?.sedeId
    if(orig===movForm.sedeDestId)return
    const mov={id:genId(),animalId:movForm.animalId,sedeOrigId:orig,sedeDestId:movForm.sedeDestId,data:movForm.data,motivo:movForm.motivo}
    await sb.from('animais').update({sedeId:movForm.sedeDestId}).eq('id',movForm.animalId)
    await addMov(mov)
    setMovForm(blankMov)
  }
  const sedeForm=<div style={{display:'flex',flexDirection:'column',gap:13}}><Inp label='Nome da Sede' value={form.nome} onChange={v=>ff({nome:v})}/><div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}><Inp label='Cidade' value={form.cidade} onChange={v=>ff({cidade:v})}/><Inp label='Estado' value={form.estado} onChange={v=>ff({estado:v})}/></div></div>
  if(loading)return <Loading/>
  return <div>
    <SH title='🗺️ Sedes e Localidades' action={user.perfil==='admin'&&tab==='sedes'&&<Btn onClick={()=>setModal('new')}>+ Nova Sede</Btn>}/>
    <div style={{display:'flex',gap:6,marginBottom:20}}>{[['sedes','Sedes'],['movimentacoes','Movimentacoes']].map(t=><button key={t[0]} onClick={()=>setTab(t[0])} style={{padding:'7px 18px',borderRadius:8,border:'1px solid '+(tab===t[0]?Y:B),background:tab===t[0]?Y+'18':'transparent',color:tab===t[0]?Y:D1,fontWeight:700,fontSize:13,cursor:'pointer'}}>{t[1]}</button>)}</div>
    {tab==='sedes'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:16}}>
      {sedes.map(s=>{  const statusAtivo=['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural']
  const an=animais.filter(a=>a.sedeId===s.id).length,es=estoque.filter(e=>e.sedeId===s.id).length,ag=agenda.filter(a=>a.sedeId===s.id&&a.status==='pendente').length,ma=manejos.filter(m=>m.sedeId===s.id).length;return <div key={s.id} style={{background:CARD,border:'1px solid '+B,borderRadius:14,padding:22,borderTop:'3px solid '+Y}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:11}}><div style={{width:42,height:42,borderRadius:10,background:Y+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🏡</div><div><div style={{color:TX,fontWeight:800,fontSize:15}}>{s.nome}</div><div style={{color:D2,fontSize:12,marginTop:2}}>{s.cidade}, {s.estado}</div></div></div>
          {user.perfil==='admin'&&<div style={{display:'flex',gap:6,flexShrink:0}}><button onClick={()=>{setSel(s);setForm({nome:s.nome,cidade:s.cidade,estado:s.estado});setModal('edit');}} style={{background:CARD2,border:'1px solid '+B,borderRadius:7,padding:'5px 10px',cursor:'pointer',color:D1,fontSize:13}}>✏️</button><button onClick={()=>{setSel(s);setModal('delete');}} style={{background:R+'15',border:'1px solid '+R+'30',borderRadius:7,padding:'5px 10px',cursor:'pointer',color:R,fontSize:13}}>🗑️</button></div>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>{[[an,'Animais',Y],[es,'Insumos',PU],[ag,'Tarefas',BL],[ma,'Manejos',G]].map(([n,l,c])=><div key={l} style={{background:CARD2,borderRadius:8,padding:'10px 12px',border:'1px solid '+B}}><div style={{color:c,fontWeight:800,fontSize:20}}>{n}</div><div style={{color:D2,fontSize:11,marginTop:2}}>{l}</div></div>)}</div>
      </div>})}
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
  </div>
}

// ── USUARIOS ──────────────────────────────────────────────
function Usuarios({sedes}){
  const {rows,loading,add}=useTable('usuarios')
  const blank={nome:'',email:'',senha:'',perfil:'funcionario',sedeId:''}
  const [modal,setModal]=useState(false),[form,setForm]=useState(blank)
  const fv=v=>setForm(p=>({...p,...v}))
  async function salvar(){await add({id:genId(),...form});setModal(false);setForm(blank);}
  const pColor={admin:Y,gestor:G,funcionario:BL}
  return <div>
    <SH title='👥 Gestao de Usuarios' action={<Btn onClick={()=>setModal(true)}>+ Novo Usuario</Btn>}/>
    {loading?<Loading/>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
      {rows.map(u=>{const sede=sedes.find(s=>s.id===u.sedeId);const pc=pColor[u.perfil]||D1;return <div key={u.id} style={{background:CARD,border:'1px solid '+B,borderLeft:'3px solid '+pc,borderRadius:12,padding:20}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}><div style={{width:38,height:38,borderRadius:9,background:pc+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>👤</div><div><div style={{color:TX,fontWeight:700,fontSize:14}}>{u.nome}</div><div style={{color:D2,fontSize:12,marginTop:2}}>{u.email}</div></div></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><Badge label={u.perfil} color={pc}/><span style={{color:D2,fontSize:11}}>{sede?.nome||'Todas as sedes'}</span></div>
      </div>})}
    </div>}
    {modal&&<Modal title='Novo Usuario' onClose={()=>setModal(false)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Inp label='Nome Completo' value={form.nome} onChange={v=>fv({nome:v})}/>
        <Inp label='E-mail' value={form.email} onChange={v=>fv({email:v})} type='email'/>
        <Inp label='Senha' value={form.senha} onChange={v=>fv({senha:v})} type='password'/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Inp label='Perfil' value={form.perfil} onChange={v=>fv({perfil:v})} opts={[{v:'admin',l:'Admin'},{v:'gestor',l:'Gestor'},{v:'funcionario',l:'Funcionario'}]}/><Inp label='Sede' value={form.sedeId} onChange={v=>fv({sedeId:v})} opts={[{v:'',l:'Todas'},...sedes.map(s=>({v:s.id,l:s.nome}))]}/></div>
        <MFooter onCancel={()=>setModal(false)} onSave={salvar} label='Criar Usuario' disabled={!form.nome||!form.email||!form.senha}/>
      </div>
    </Modal>}
  </div>
}

// ── GRAFICOS ──────────────────────────────────────────────
function Graficos({animais,financeiro,reproducao,manejos,sedes}){
  const statusAtivo=['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural']
  const catCount={};animais.filter(a=>statusAtivo.includes(a.status)).forEach(a=>{const c=a.categoria||'Sem categoria';catCount[c]=(catCount[c]||0)+1;});
  const catData=Object.keys(catCount).map(k=>({name:k,valor:catCount[k]}));
  const catColors={Terneiro:BL,Sobreano:'#34d399',Matriz:'#f472b6',Novilha:PU,Touro:Y,Descarte:R,'Sem categoria':D1};
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
  const fileRef=useRef(null)
  const [importTab,setImportTab]=useState('animais'),[importMsg,setImportMsg]=useState(null),[preview,setPreview]=useState(null)
  function exportSheet(name,data,file){const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,name);XLSX.writeFile(wb,file+'.xlsx');}
  function exportAnimais(){exportSheet('Rebanho',animais.map(a=>{const s=sedes.find(x=>x.id===a.sedeId)||{nome:''};return {Brinco:a.brinco,Nome:a.nome||'',Categoria:a.categoria||'',Raca:a.raca,Sexo:a.sexo,Nascimento:a.nascimento||'',Peso:a.peso||'',Status:a.status,Sede:s.nome};}),'PecuarIA_Rebanho');}
  function exportFin(){exportSheet('Financeiro',financeiro.map(f=>{const c=clientes.find(x=>x.id===f.clienteId)||{nome:''};return {Tipo:f.tipo,Categoria:f.categoria||'',Descricao:f.descricao,Valor:f.valor,Data:f.data||'',Cliente:c.nome||''};}),'PecuarIA_Financeiro');}
  function exportEst(){exportSheet('Estoque',estoque.map(e=>{const s=sedes.find(x=>x.id===e.sedeId)||{nome:''};return {Nome:e.nome,Categoria:e.categoria,Quantidade:e.quantidade,Unidade:e.unidade,Minimo:e.minimo,Sede:s.nome};}),'PecuarIA_Estoque');}
  function downloadTemplate(tipo){
    const tpls={
      animais:[{Brinco:'2526',Nome:'Touro 2526',Categoria:'Touro',Raca:'Charolês',Sexo:'M',Nascimento:'2022-03-15',Peso:820,Status:'Ativo',Sede:'Sede Principal'}],
      financeiro:[{Tipo:'despesa',Categoria:'Sanidade',Descricao:'Ivermectina lote A',Valor:1500,Data:'2026-05-01',Cliente:''}],
      estoque:[{Nome:'Ivermectina 1%',Categoria:'Antiparasitário',Quantidade:50,Unidade:'mL',Minimo:10,Sede:'Sede Principal'}],
      manejos:[{Nome_Manejo:'Vermifugação Maio',Data:'2026-05-10',Sede:'Sede Principal',Num_Cabecas:120,Medicamento:'Ivermectina 1%',Quantidade:10,Unidade:'mL',Valor_Unit:0.85},{Nome_Manejo:'Vermifugação Maio',Data:'2026-05-10',Sede:'Sede Principal',Num_Cabecas:120,Medicamento:'Closantel',Quantidade:5,Unidade:'mL',Valor_Unit:1.20}],
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
        const novos=rows.map(r=>{const sede=sedes.find(s=>s.nome===r.Sede)||sedes[0];return {id:genId(),brinco:String(r.Brinco||''),nome:r.Nome||'',categoria:r.Categoria||'',raca:r.Raca||'Charolês',sexo:r.Sexo==='F'?'F':'M',nascimento:r.Nascimento||'',peso:Number(r.Peso)||0,status:r.Status||'Ativo',sedeId:sede?.id||'',pai:r.Pai||'',mae:r.Mae||''};}).filter(a=>a.brinco)
        await sb.from('animais').insert(novos)
        setImportMsg({type:'ok',text:novos.length+' animal(is) importado(s)!'})
      } else if(importTab==='financeiro'){
        const novos=rows.map(r=>{const cli=clientes.find(c=>c.nome===r.Cliente);return {id:genId(),tipo:['venda','Venda','receita','Receita'].includes(r.Tipo)?'venda':'despesa',categoria:r.Categoria||'Outros',descricao:r.Descricao||'',valor:Number(r.Valor)||0,data:r.Data||'',clienteId:cli?.id||''};}).filter(f=>f.descricao)
        await sb.from('financeiro').insert(novos)
        setImportMsg({type:'ok',text:novos.length+' lançamento(s) importado(s)!'})
      } else if(importTab==='estoque'){
        const novos=rows.map(r=>{const sede=sedes.find(s=>s.nome===r.Sede)||sedes[0];return {id:genId(),nome:r.Nome||'',categoria:r.Categoria||'Outro',quantidade:Number(r.Quantidade)||0,unidade:r.Unidade||'unid',minimo:Number(r.Minimo)||0,sedeId:sede?.id||''};}).filter(e=>e.nome)
        await sb.from('estoque').insert(novos)
        setImportMsg({type:'ok',text:novos.length+' item(s) importado(s)!'})
      } else if(importTab==='manejos'){
        // Agrupar linhas por Nome_Manejo+Data+Sede → um manejo por grupo
        const grupos={}
        rows.forEach(r=>{
          const chave=(r.Nome_Manejo||'')+'||'+(r.Data||'')+'||'+(r.Sede||'')
          if(!grupos[chave])grupos[chave]={nome:r.Nome_Manejo||'Manejo',data:r.Data||'',sede:r.Sede||'',cabecas:Number(r.Num_Cabecas)||0,meds:[]}
          if(r.Medicamento)grupos[chave].meds.push({id:genId(),nome:String(r.Medicamento),qtd:Number(r.Quantidade)||0,unidade:r.Unidade||'mL',valor:Number(r.Valor_Unit)||0})
        })
        const novos=Object.values(grupos).map(g=>{const sede=sedes.find(s=>s.nome===g.sede)||sedes[0];return {id:genId(),nome:g.nome,data:g.data,sedeId:sede?.id||'',cabecas:g.cabecas,medicamentos:g.meds,obs:'Importado via Excel',status:'concluido'};})
        await sb.from('manejos').insert(novos)
        setImportMsg({type:'ok',text:novos.length+' manejo(s) criado(s) com '+rows.length+' linha(s)!'})
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
  const descTab={animais:'Importe animais em massa. Baixe o template, preencha e envie.',manejos:'Importe lidas e manejos sanitários em lote. Uma linha por medicamento. O sistema agrupa automaticamente por manejo.',vendas:'Importe vendas de animais. O status do animal vira "Vendido" e a receita é lançada no financeiro automaticamente.',financeiro:'Importe lançamentos financeiros (despesas e receitas) em lote.',estoque:'Importe itens de estoque em massa.'}
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
  const {rows:botijoes,loading:loadBot,add:addBot,update:updateBot,remove:removeBot}=useTable('semen_botijoes')
  const {rows:palhetas,loading:loadPal,add:addPal,update:updatePal,remove:removePal}=useTable('semen_palhetas')
  const {rows:saidas,loading:loadSai,add:addSai}=useTable('semen_saidas')
  const [tab,setTab]=useState('botijoes')
  const [modal,setModal]=useState(null)
  const [sel,setSel]=useState(null)
  const [modalSaida,setModalSaida]=useState(null)

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

  // totais
  const totalDoses=palhetas.reduce((s,p)=>s+Number(p.dose_atual||0),0)
  const totalTouros=[...new Set(palhetas.map(p=>p.touro).filter(Boolean))].length

  async function salvarBot(){
    if(sel) await updateBot(sel.id,formBot)
    else await addBot({id:genId(),...formBot})
    setModal(null);setFormBot(blankBot);setSel(null)
  }
  async function excluirBot(){await removeBot(sel.id);setModal(null);setSel(null);}

  async function salvarPal(){
    if(sel) await updatePal(sel.id,{...formPal,dose_total:Number(formPal.dose_total),dose_atual:Number(formPal.dose_atual)})
    else await addPal({id:genId(),...formPal,dose_total:Number(formPal.dose_total),dose_atual:Number(formPal.dose_atual)})
    setModal(null);setFormPal(blankPal);setSel(null)
  }
  async function excluirPal(){await removePal(sel.id);setModal(null);setSel(null);}

  async function salvarSaida(){
    const qtd=Number(formSaida.quantidade)||0
    const pal=palhetas.find(p=>p.id===formSaida.palhetaId)
    if(!pal||qtd<=0||qtd>pal.dose_atual) return
    await addSai({id:genId(),...formSaida,quantidade:qtd,touro:pal.touro,raca:pal.raca,caneca:pal.caneca,botijoId:pal.botijoId})
    await updatePal(pal.id,{dose_atual:pal.dose_atual-qtd})
    setModalSaida(null);setFormSaida(blankSaida)
  }

  const palSel=palhetas.find(p=>p.id===formSaida.palhetaId)
  const motivoOpts=['IATF','Monta Natural','Doação','Descarte','Outro'].map(m=>({v:m,l:m}))
  const card={background:CARD,border:'1px solid '+B,borderRadius:12,padding:20}
  const tabs=[['botijoes','🧊 Botijões'],['palhetas','🧬 Palhetas'],['saidas','📤 Saídas']]

  return <div>
    <SH title='🧊 Controle de Sêmen' action={canEdit&&<div style={{display:'flex',gap:8}}>
      {tab==='botijoes'&&<Btn onClick={()=>{setFormBot(blankBot);setSel(null);setModal('bot')}}>+ Novo Botijão</Btn>}
      {tab==='palhetas'&&<Btn onClick={()=>{setFormPal(blankPal);setSel(null);setModal('pal')}}>+ Nova Palheta</Btn>}
      {tab==='saidas'&&<Btn onClick={()=>{setFormSaida(blankSaida);setModalSaida(true)}}>+ Registrar Saída</Btn>}
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

    {/* BOTIJÕES */}
    {tab==='botijoes'&&(loadBot?<Loading/>:
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
        {botijoes.map(b=>{
          const pals=palhetas.filter(p=>p.botijoId===b.id)
          const doses=pals.reduce((s,p)=>s+Number(p.dose_atual||0),0)
          const touros=[...new Set(pals.map(p=>p.touro).filter(Boolean))]
          const sede=sedes.find(s=>s.id===b.sedeId)
          return <div key={b.id} style={{background:CARD,border:'1px solid '+B,borderRadius:14,padding:20,borderTop:'3px solid '+BL}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{fontSize:32}}>🧊</div>
                <div><div style={{color:TX,fontWeight:800,fontSize:16}}>{b.nome}</div><div style={{color:D2,fontSize:12,marginTop:2}}>{sede?.nome||'-'}</div></div>
              </div>
              {canEdit&&<ActBtns onEdit={()=>{setSel(b);setFormBot({nome:b.nome,sedeId:b.sedeId,obs:b.obs||''});setModal('bot');}} onDel={()=>{setSel(b);setModal('del_bot');}}/>}
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
            <thead><tr><Th>Touro</Th><Th>Raça</Th><Th>Botijão</Th><Th>Caneca</Th><Th>Doses Total</Th><Th>Doses Atual</Th><Th>Situação</Th>{canEdit&&<Th>Ações</Th>}</tr></thead>
            <tbody>{palhetas.map(p=>{
              const bot=botijoes.find(b=>b.id===p.botijoId)
              const pct=p.dose_total>0?(p.dose_atual/p.dose_total)*100:0
              const cor=pct>50?G:pct>20?Y:R
              return <TR key={p.id}>
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
            <thead><tr><Th>Data</Th><Th>Touro</Th><Th>Raça</Th><Th>Botijão</Th><Th>Caneca</Th><Th>Doses</Th><Th>Motivo</Th><Th>Destino</Th><Th>Obs.</Th></tr></thead>
            <tbody>{[...saidas].reverse().map(s=>{
              const bot=botijoes.find(b=>b.id===s.botijoId)
              return <TR key={s.id}>
                <Td s={{color:D1,whiteSpace:'nowrap'}}>{fmtDate(s.data)}</Td>
                <Td s={{fontWeight:700,color:Y}}>{s.touro||'-'}</Td>
                <Td>{s.raca||'-'}</Td>
                <Td s={{color:BL}}>{bot?.nome||'-'}</Td>
                <Td><Badge label={'Caneca '+(s.caneca||'-')} color={PU}/></Td>
                <Td s={{fontWeight:800,color:R}}>{s.quantidade}</Td>
                <Td><Badge label={s.motivo||'-'} color={G}/></Td>
                <Td s={{color:D1}}>{s.destino||'-'}</Td>
                <Td s={{color:D2,fontSize:12}}>{s.obs||'-'}</Td>
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
    {modalSaida&&<Modal title='Registrar Saída de Doses' onClose={()=>setModalSaida(null)}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Inp label='Palheta (Touro)' value={formSaida.palhetaId} onChange={v=>fsv({palhetaId:v})} opts={[{v:'',l:'Selecione...'},...palhetas.filter(p=>p.dose_atual>0).map(p=>{const bot=botijoes.find(b=>b.id===p.botijoId);return {v:p.id,l:(p.touro||'Sem nome')+' — '+bot?.nome+' / Caneca '+p.caneca+' ('+p.dose_atual+' doses)'}})]}/>
        {palSel&&<div style={{background:CARD2,border:'1px solid '+B,borderRadius:10,padding:14,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <div><div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Touro</div><div style={{color:Y,fontWeight:700,fontSize:14,marginTop:3}}>{palSel.touro}</div></div>
          <div><div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Caneca</div><div style={{color:PU,fontWeight:700,fontSize:14,marginTop:3}}>{palSel.caneca}</div></div>
          <div><div style={{color:D2,fontSize:10,fontWeight:700,textTransform:'uppercase'}}>Disponível</div><div style={{color:G,fontWeight:700,fontSize:14,marginTop:3}}>{palSel.dose_atual} doses</div></div>
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
        {palSel&&Number(formSaida.quantidade)>palSel.dose_atual&&<div style={{background:R+'18',border:'1px solid '+R+'40',borderRadius:8,padding:'10px 14px',color:R,fontSize:13,fontWeight:600}}>⚠️ Quantidade maior que o estoque disponível ({palSel.dose_atual} doses)</div>}
        <MFooter onCancel={()=>setModalSaida(null)} onSave={salvarSaida} label='Confirmar Saída' disabled={!formSaida.palhetaId||!formSaida.quantidade||!formSaida.data||Number(formSaida.quantidade)>Number(palSel?.dose_atual||0)}/>
      </div>
    </Modal>}

    {/* CONFIRMAÇÕES EXCLUSÃO */}
    {modal==='del_bot'&&sel&&<Modal title='Excluir Botijão' onClose={()=>{setModal(null);setSel(null);}}><DelConfirm msg={'Excluir o botijão "'+sel.nome+'"? Todas as palhetas vinculadas serão afetadas.'} onCancel={()=>{setModal(null);setSel(null);}} onConfirm={excluirBot}/></Modal>}
    {modal==='del_pal'&&sel&&<Modal title='Excluir Palheta' onClose={()=>{setModal(null);setSel(null);}}><DelConfirm msg={'Excluir palheta do touro "'+sel.touro+'"?'} onCancel={()=>{setModal(null);setSel(null);}} onConfirm={excluirPal}/></Modal>}
  </div>
}
// ── VENDAS ────────────────────────────────────────────────
function Vendas({animais,sedes,user}){
  const {rows,loading,add,update,remove}=useTable('vendas')
  const [modal,setModal]=useState(null),[sel,setSel]=useState(null)
  const blank={animalId:'',data:'',valor:'',peso:'',compradorNome:'',compradorCpf:'',compradorTelefone:'',compradorCidade:'',compradorEstado:'PR',obs:''}
  const [form,setForm]=useState(blank)
  const fv=v=>setForm(p=>({...p,...v}))
  const canEdit=user.perfil!=='funcionario'
  const ativosStatus=['Ativo','Prenha','Não Pronta','TEF','Inseminada','Monta Natural']
  const animaisAtivos=animais.filter(a=>ativosStatus.includes(a.status))
  const totalRec=rows.reduce((s,v)=>s+Number(v.valor||0),0)
  async function salvarNovo(){
    const obj={id:genId(),...form,valor:Number(form.valor),peso:Number(form.peso)}
    await add(obj)
    if(form.animalId)await sb.from('animais').update({status:'Vendido'}).eq('id',form.animalId)
    const animal=animais.find(a=>a.id===form.animalId)
    await sb.from('financeiro').insert([{id:genId(),tipo:'venda',categoria:'Venda de Animais',descricao:'Venda: '+(animal?.brinco||'')+(animal?.nome?' — '+animal.nome:''),valor:Number(form.valor),data:form.data,clienteId:''}])
    setModal(null);setForm(blank)
  }
  async function salvarEdit(){await update(sel.id,{...form,valor:Number(form.valor),peso:Number(form.peso)});setModal(null);}
  async function confirmarDel(){await remove(sel.id);setModal(null);}
  const formBody=<div style={{display:'flex',flexDirection:'column',gap:13}}>
    <div style={{background:BL+'15',border:'1px solid '+BL+'30',borderRadius:9,padding:'8px 13px',color:BL,fontSize:12,fontWeight:700}}>🐂 ANIMAL</div>
    <Inp label='Animal' value={form.animalId} onChange={v=>fv({animalId:v})} opts={[{v:'',l:'Selecione o animal...'},...animaisAtivos.map(a=>({v:a.id,l:a.brinco+(a.nome?' — '+a.nome:'')+' ('+a.categoria+', '+a.raca+')'}))]}/>
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
    <div style={{background:CARD,borderRadius:12,border:'1px solid '+B,overflow:'hidden'}}>
      {loading?<Loading/>:<div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
          <thead><tr><Th>Animal</Th><Th>Data</Th><Th>Valor</Th><Th>Peso</Th><Th>Comprador</Th><Th>CPF/CNPJ</Th><Th>Telefone</Th><Th>Cidade/UF</Th>{canEdit&&<Th>Ações</Th>}</tr></thead>
          <tbody>{rows.map(v=>{const animal=animais.find(a=>a.id===v.animalId);return <TR key={v.id}><Td s={{fontWeight:700,color:Y}}>{animal?animal.brinco+(animal.nome?' — '+animal.nome:''):'(removido)'}</Td><Td s={{color:D1,whiteSpace:'nowrap'}}>{fmtDate(v.data)}</Td><Td s={{fontWeight:800,color:G}}>{fmtR(v.valor)}</Td><Td s={{color:D1}}>{v.peso?v.peso+' kg':'-'}</Td><Td s={{fontWeight:600}}>{v.compradorNome||'-'}</Td><Td s={{color:D1,fontSize:12}}>{v.compradorCpf||'-'}</Td><Td s={{color:D1,fontSize:12}}>{v.compradorTelefone||'-'}</Td><Td s={{color:D1,fontSize:12}}>{v.compradorCidade?v.compradorCidade+'/'+v.compradorEstado:'-'}</Td>{canEdit&&<Td><ActBtns onEdit={()=>{setSel(v);setForm({animalId:v.animalId||'',data:v.data||'',valor:String(v.valor||''),peso:String(v.peso||''),compradorNome:v.compradorNome||'',compradorCpf:v.compradorCpf||'',compradorTelefone:v.compradorTelefone||'',compradorCidade:v.compradorCidade||'',compradorEstado:v.compradorEstado||'PR',obs:v.obs||''});setModal('edit');}} onDel={()=>{setSel(v);setModal('delete');}}/></Td>}</TR>})}</tbody>
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
  </div>
}

const NAV=[
  {id:'dashboard',icon:'📊',label:'Dashboard',g:'Principal'},
  {id:'graficos',icon:'📈',label:'Graficos',g:'Principal'},
  {id:'rebanho',icon:'🐂',label:'Rebanho',g:'Zootecnia'},
  {id:'reproducao',icon:'🔬',label:'Reproducao',g:'Zootecnia'},
  {id:'manejos',icon:'🩺',label:'Manejos',g:'Zootecnia'},
  {id:'semen',icon:'🧊',label:'Controle de Sêmen',g:'Zootecnia'},
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
  const [mod,setMod]=useState('dashboard'),[col,setCol]=useState(false)
  const {rows:sedes,loading:loadSedes}=useTable('sedes')
  const {rows:animais}=useTable('animais')
  const {rows:financeiro}=useTable('financeiro')
  const {rows:estoque}=useTable('estoque')
  const {rows:manejos}=useTable('manejos')
  const {rows:agenda}=useTable('agenda')
  const {rows:reproducao}=useTable('reproducao')
  const {rows:clientes}=useTable('clientes')

  async function login(){
    const {data,error}=await sb.from('usuarios').select('*').eq('email',email).eq('senha',senha).single()
    if(data)setUser(data)
    else setErr('E-mail ou senha incorretos.')
  }

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
        <button onClick={login} style={{background:Y,color:'#000',border:'none',borderRadius:10,padding:'13px',fontWeight:800,fontSize:14,cursor:'pointer',marginTop:4}}>Entrar no Sistema</button>
      </div>
      <div style={{marginTop:16,padding:12,background:CARD2,borderRadius:10,border:'1px solid '+B,fontSize:11,color:D2}}>
        <div style={{fontWeight:700,color:D1,marginBottom:4}}>Primeiro acesso?</div>
        <div>Cadastre um usuario em Supabase → Table Editor → usuarios</div>
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
          <button onClick={()=>setUser(null)} style={{marginTop:8,color:R,background:'none',border:'none',cursor:'pointer',fontSize:11,padding:0,fontWeight:600}}>Sair</button>
        </div>}
      </div>
    </div>
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{height:58,background:CARD,borderBottom:'1px solid '+B,display:'flex',alignItems:'center',padding:'0 26px',gap:12,flexShrink:0}}>
        <div style={{flex:1}}><div style={{color:TX,fontWeight:700,fontSize:15}}>{curNav.icon} {curNav.label}</div><div style={{color:D2,fontSize:11,marginTop:1}}>Cabanha Pagliosa - {user.nome}</div></div>
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
