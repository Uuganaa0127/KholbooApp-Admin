import React,{useState} from 'react';
const api=import.meta.env.VITE_API_URL||'/api';
export default function Reports({token,reports,onSaved}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const review=async(id,action)=>{setBusy(true);setError('');try{const r=await fetch(`${api}/reports/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action})});const d=await r.json();if(!r.ok)throw Error(d.error);await onSaved();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <section className="panel"><h2>Зөрчлийн мэдээлэл</h2><p>Мэдээллийг тогтмол шалгаж, шаардлагатай арга хэмжээг авна уу.</p>{error&&<p className="error">{error}</p>}{!reports.length&&<p>Мэдээлэл алга.</p>}{reports.map(r=><article key={r.id} className="editor"><strong>{r.post?.title||'Устсан кейс'}</strong><p>{r.reason}</p><p>{r.content}</p><small>{r.status} • {r.createdAt}</small><div>{[['reviewed','Шалгасан'],['dismissed','Зөрчилгүй'],['hide','Кейс нуух'],['suspend','Хэрэглэгч түдгэлзүүлэх']].map(([action,label])=><button key={action} disabled={busy} onClick={()=>review(r.id,action)}>{label}</button>)}</div></article>)}</section>;
}
