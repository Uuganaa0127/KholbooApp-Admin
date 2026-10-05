import React, {useState} from 'react';
const empty = {name:'', color:'#176BFF', order:0, active:true};
export default function Categories({token, categories, onSaved}) {
  const [form,setForm] = useState(empty), [editing,setEditing] = useState(null), [query,setQuery] = useState(''), [error,setError] = useState(''), [message,setMessage] = useState(''), [busy,setBusy] = useState(false);
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/categories${editing ? `/${editing}` : ''}`, {method:editing?'PATCH':'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify(form)});
      const payload = await response.json(); if(!response.ok) throw new Error(payload.error);
      setForm(empty);setEditing(null);setMessage('Ангилал хадгалагдлаа. Апп дээр Ангилал шинэчлэх товчийг дарна уу.');await onSaved();
    } catch(e) {setError(e.message);} finally {setBusy(false);}
  }
  const visible = categories.filter(c=>c.name.toLowerCase().includes(query.toLowerCase()));
  return <>
    <section className="metrics"><article className="metric"><strong>{categories.length}</strong><span>Нийт ангилал</span></article><article className="metric"><strong>{categories.filter(c=>c.active).length}</strong><span>Идэвхтэй</span></article><article className="metric"><strong>{categories.filter(c=>!c.active).length}</strong><span>Архивласан</span></article></section>
    <section className="panel"><p className="eyebrow">КЕЙСИЙН СЭДВҮҮД</p><h2>{editing ? 'Ангилал засах' : 'Шинэ ангилал'}</h2><p className="hint">Энд хадгалсан ангиллууд аппын кейсийн сэдэв болон шинэ кейсийн сонголтод харагдана. Архивлахад хуучин кейсүүд хадгалагдана.</p>
      <form className="form-grid" onSubmit={save}>
        <label>Ангиллын нэр<input required maxLength={60} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Өнгө<input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}/></label>
        <label>Дараалал<input type="number" min="0" max="9999" required value={form.order} onChange={e=>setForm({...form,order:Number(e.target.value)})}/></label>
        <label>Төлөв<select value={String(form.active)} onChange={e=>setForm({...form,active:e.target.value==='true'})}><option value="true">Идэвхтэй</option><option value="false">Архивласан</option></select></label>
        <button disabled={busy}>{busy?'Хадгалж байна…':'Хадгалах'}</button>{editing && <button type="button" disabled={busy} onClick={()=>{setEditing(null);setForm(empty);}}>Болих</button>}
      </form>{error && <p role="alert" className="error">{error}</p>}{message && <p role="status">{message}</p>}
    </section>
    <section className="panel"><h2>Ангиллууд</h2><label>Ангилал хайх<input placeholder="Нэрээр хайх…" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="table-wrap"><table><thead><tr><th>Өнгө</th><th>Нэр</th><th>Дараалал</th><th>Төлөв</th><th>Үйлдэл</th></tr></thead><tbody>{visible.map(c=><tr key={c.id}><td><span className="color-dot" style={{backgroundColor:c.color}}/></td><td>{c.name}</td><td>{c.order}</td><td>{c.active?'Идэвхтэй':'Архивласан'}</td><td><button disabled={busy} className="small" onClick={()=>{setEditing(c.id);setForm({name:c.name,color:c.color,order:c.order,active:c.active});setError('');setMessage('');window.scrollTo({top:0,behavior:'smooth'});}}>Засах</button></td></tr>)}</tbody></table>{!visible.length && <p>Ангилал олдсонгүй.</p>}</div></section>
  </>;
}
