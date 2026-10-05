import React, {useEffect, useRef, useState} from 'react';
const professions=['Ерөнхий','Дотор өвчин','Хүүхэд','Мэс засал','Яаралтай тусламж','Дүрс оношилгоо','Шүд','Бусад'];
const api = import.meta.env.VITE_API_URL || '/api';
async function request(path, token, body, method='POST') {
 const response=await fetch(`${api}${path}`,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Хадгалж чадсангүй.');return payload;
}
const blankQuestion=()=>({prompt:'',options:['','','',''],answer:null,explanation:''});
const clone=value=>JSON.parse(JSON.stringify(value));
const field=(label,value,onChange,options={})=><label>{label}<input value={value} onChange={e=>onChange(e.target.value)} {...options}/></label>;
const toMediaUrl=url=>url.startsWith('/uploads/')&&api.startsWith('http')?new URL(url,api).href:url;

export function QuestionEditor({items,onChange}) {
 const update=(index,patch)=>onChange(items.map((q,i)=>i===index?{...q,...patch}:q));
 return <section className="question-editor"><div className="editor-heading"><h3>Асуулт ба хариулт ({items.length})</h3><button type="button" onClick={()=>onChange([...items,blankQuestion()])}>+ Асуулт нэмэх</button></div>
 {!items.length&&<p className="hint">Асуултын текст, хариултын сонголтууд болон зөв хариултыг оруулна уу.</p>}
 {items.map((q,i)=><fieldset className="question-card" key={i}><legend>Асуулт {i+1}</legend><label>Асуултын текст<textarea required maxLength={3000} value={q.prompt} onChange={e=>update(i,{prompt:e.target.value})}/></label>
 <div className="form-grid">{field('Сэдэв',q.topic??'',topic=>update(i,{topic}),{maxLength:120})}{field('Дэд сэдэв',q.subtopic??'',subtopic=>update(i,{subtopic}),{maxLength:120})}<label>Хүндрэл<select value={q.difficulty??'unspecified'} onChange={e=>update(i,{difficulty:e.target.value})}><option value="unspecified">Тодорхойгүй</option><option value="easy">Хялбар</option><option value="medium">Дунд</option><option value="hard">Хүнд</option></select></label>{field('Ур чадвар',q.skill??'',skill=>update(i,{skill}),{maxLength:120})}{field('Эх сурвалж',q.source??'',source=>update(i,{source}),{type:'url',maxLength:2000})}</div><p className="hint">Сэдэв хоосон бол тестийн ангиллыг ашиглана. Зөв хариултын дугуйг сонгоно уу.</p>
 {q.options.map((option,j)=><div className="answer-option" key={j}><input type="radio" required name={`correct-${i}`} aria-label={`Асуулт ${i+1}: ${String.fromCharCode(65+j)} зөв`} checked={q.answer===j} onChange={()=>update(i,{answer:j})}/><label>{String.fromCharCode(65+j)}<input required maxLength={1000} aria-label={`Асуулт ${i+1}: ${String.fromCharCode(65+j)} хариулт`} value={option} onChange={e=>update(i,{options:q.options.map((v,k)=>k===j?e.target.value:v)})}/></label>{q.options.length>2&&<button type="button" className="secondary small" aria-label={`${i+1}-${j+1} сонголт хасах`} onClick={()=>update(i,{options:q.options.filter((_,k)=>k!==j),answer:q.answer===j?null:q.answer>j?q.answer-1:q.answer})}>×</button>}</div>)}
 <div className="editor-actions">{q.options.length<6&&<button type="button" className="secondary small" onClick={()=>update(i,{options:[...q.options,'']})}>+ Сонголт</button>}<button type="button" className="danger small" onClick={()=>onChange(items.filter((_,index)=>index!==i))}>Асуулт хасах</button></div>
 <label>Хариултын тайлбар<textarea maxLength={5000} value={q.explanation} onChange={e=>update(i,{explanation:e.target.value})}/></label></fieldset>)}
 </section>;
}
function VideoUpload({token,value,onChange,onBusy}) {
 const [progress,setProgress]=useState(null),[error,setError]=useState('');const active=useRef(null);
 useEffect(()=>()=>active.current?.abort(),[]);
 function upload(file) {
  if(!file)return;
  if(!/\.(mp4|webm)$/i.test(file.name)||file.size>250*1024*1024){setError('MP4 эсвэл WebM файл, дээд хэмжээ 250 MB.');return;}
  setError('');setProgress(0);onBusy(true);
  const xhr=new XMLHttpRequest();active.current=xhr;xhr.open('POST',`${api}/uploads/video`);xhr.setRequestHeader('Authorization',`Bearer ${token}`);xhr.timeout=600000;
  xhr.upload.onprogress=e=>{if(e.lengthComputable)setProgress(Math.round(e.loaded/e.total*100));};
  const finish=()=>{setProgress(null);onBusy(false);active.current=null;};
  xhr.onload=()=>{try{const payload=JSON.parse(xhr.responseText);if(xhr.status>=400)throw new Error(payload.error||'Байршуулж чадсангүй.');onChange(payload.url);}catch(e){setError(e.message);}finally{finish();}};
  xhr.onerror=()=>{setError('Сервертэй холбогдсонгүй. Дахин оролдоно уу.');finish();};xhr.ontimeout=()=>{setError('Хугацаа дууслаа. Дахин оролдоно уу.');finish();};xhr.onabort=finish;
  const data=new FormData();data.append('video',file);xhr.send(data);
 }
 return <section className="video-upload"><label>Видео файл байршуулах<input type="file" accept="video/mp4,video/webm,.mp4,.webm" disabled={progress!==null} onChange={e=>upload(e.target.files[0])}/></label><p className="hint">MP4 / WebM • 250 MB хүртэл. Видео байхгүй бол хичээлийн тайлбар / унших агуулга оруулна уу.</p>
 {progress!==null&&<div role="status"><progress max="100" value={progress}/> {progress}% {progress===100?'• Боловсруулж байна…':''}</div>}{error&&<p className="error" role="alert">{error}</p>}
 {field('Видео холбоос',value,onChange,{disabled:progress!==null,maxLength:2000})}
 {value.startsWith('/uploads/')&&<video className="uploaded-video" key={value} src={toMediaUrl(value)} controls preload="metadata"/>}
 </section>;
}
function Editor({title,children,onClose,onSubmit,busy,error}) {
 const ref=useRef();useEffect(()=>{ref.current?.scrollIntoView({behavior:'smooth',block:'start'});},[]);
 return <section ref={ref} className="panel content-editor"><div className="editor-heading"><h2>{title}</h2><button type="button" className="secondary" disabled={busy} onClick={onClose}>Болих</button></div><form onSubmit={onSubmit}><fieldset disabled={busy} className="editor-fields">{children}</fieldset>{error&&<p className="error" role="alert">{error}</p>}<button className="save-content" disabled={busy}>{busy?'Хадгалж байна…':'Хадгалах'}</button></form></section>;
}
export function Tests({token,tests,onSaved}) {
 const [editing,setEditing]=useState(null),[form,setForm]=useState(null),[categories,setCategories]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{request('/categories',token,undefined,'GET').then(setCategories).catch(e=>setError(e.message));},[token]);
 function edit(item) {setEditing(item?.id??null);setForm({premium:item?.premium??false,kind:item?.kind??'test',professions:item?.professions??['Ерөнхий'],title:item?.title??'',category:item?.category??categories.find(c=>c.active)?.name??'',active:item?.active??true,imageUrl:item?.imageUrl??'',questionItems:clone(item?.questionItems?.length?item.questionItems:[blankQuestion()])});setError('');setMessage('');}
 async function save(e){e.preventDefault();setBusy(true);setError('');try{await request(`/tests${editing?`/${editing}`:''}`,token,form,editing?'PATCH':'POST');await onSaved();setForm(null);setMessage('Сорил ба хариултууд хадгалагдлаа.');}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <><div className="editor-heading"><p className="hint">Асуулт, сонголт, зөв хариулт, тайлбартай сорилууд.</p><button onClick={()=>edit(null)}>+ Сорил нэмэх</button></div>{message&&<p role="status">{message}</p>}
 {form&&<Editor key={editing??'new'} title={editing?'Сорил засах':'Шинэ сорил'} onClose={()=>setForm(null)} onSubmit={save} busy={busy} error={error}><div className="form-grid">
 <label>Тестийн эрх<select value={String(form.premium)} onChange={e=>setForm({...form,premium:e.target.value==='true'})}><option value="false">Энгийн • үнэгүй</option><option value="true">Premium гишүүнчлэл</option></select></label><label>Төрөл<select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="test">Тест</option><option value="case">Кейс</option></select></label><label>Санал болгох мэргэжил<select multiple value={form.professions} onChange={e=>setForm({...form,professions:Array.from(e.target.selectedOptions,o=>o.value)})}>{professions.map(p=><option key={p}>{p}</option>)}</select></label>
 {field('Сорилын нэр',form.title,title=>setForm({...form,title}),{required:true,maxLength:300})}
 <label>Ангилал<select required value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="">Сонгох</option>{form.category&&!categories.some(c=>c.name===form.category)&&<option value={form.category}>{form.category} (хуучин)</option>}{categories.filter(c=>c.active||c.name===form.category).map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></label>
 {field('Зургийн холбоос (заавал биш)',form.imageUrl,imageUrl=>setForm({...form,imageUrl}),{maxLength:2000})}<label>Төлөв<select value={String(form.active)} onChange={e=>setForm({...form,active:e.target.value==='true'})}><option value="true">Идэвхтэй</option><option value="false">Идэвхгүй</option></select></label></div>
 <QuestionEditor items={form.questionItems} onChange={questionItems=>setForm({...form,questionItems})}/></Editor>}
 {!form&&error&&<p role="alert" className="error">{error}</p>}
 <section className="panel"><h2>Хадгалсан сорилууд</h2>{tests.length?<div className="table-wrap"><table><thead><tr><th>Сорил</th><th>Ангилал</th><th>Асуулт</th><th>Үйлдэл</th></tr></thead><tbody>{tests.map(t=><tr key={t.id}><td>{t.title}<small>{t.premium?' • PREMIUM':' • Энгийн'}</small></td><td>{t.category}</td><td>{t.questionItems?.length??0}{!t.questionItems?.length&&<small className="hint"> • Хариулт оруулаагүй</small>}</td><td><button onClick={()=>edit(t)}>Засах</button></td></tr>)}</tbody></table></div>:<p>Сорил алга байна.</p>}</section></>;
}
export function Courses({token,courses,onSaved}) {
 const [editor,setEditor]=useState(null),[form,setForm]=useState({}),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 function open(kind,course=null,lesson=null){setEditor({kind,courseId:course?.id,lessonId:lesson?.id});setError('');setMessage('');
  setForm(kind==='course'?{title:course?.title??'',description:course?.description??'',reward:course?.reward??50,premium:course?.premium??false,priceCoins:course?.priceCoins??100,active:course?.active??true}:kind==='pretest'?{title:course?.preTest?.title??`${course?.title} • Pre-test`,questionItems:clone(course?.preTest?.questionItems?.length?course.preTest.questionItems:[blankQuestion()])}:kind==='lesson'?{title:lesson?.title??'',description:lesson?.description??'',durationMinutes:lesson?.durationMinutes??3,videoUrl:lesson?.videoUrl??'',imageUrl:lesson?.imageUrl??'',questionItems:clone(lesson?.questionItems??[])}:{title:course?.finalTest?.title??`${course?.title} • Үндсэн шалгалт`,passPercent:course?.finalTest?.passPercent??80,questionItems:clone(course?.finalTest?.questionItems?.length?course.finalTest.questionItems:[blankQuestion()])});
 }
 async function save(e){e.preventDefault();setBusy(true);setError('');try{
  const path=editor.kind==='course'?`/courses${editor.courseId?`/${editor.courseId}`:''}`:editor.kind==='lesson'?`/courses/${editor.courseId}/lessons${editor.lessonId?`/${editor.lessonId}`:''}`:`/courses/${editor.courseId}/${editor.kind==='pretest'?'pre-test':'test'}`;
  const method=['exam','pretest'].includes(editor.kind)||(editor.kind==='course'&&editor.courseId)||editor.lessonId?'PATCH':'POST';
  await request(path,token,form,method);await onSaved();setEditor(null);setMessage('Өөрчлөлт хадгалагдлаа.');
 }catch(e){setError(e.message);}finally{setBusy(false);}}
 const update=(key,value)=>setForm(current=>({...current,[key]:value}));
 return <><div className="editor-heading"><p className="hint">Курс → видео дэд курс → үндсэн шалгалт.</p><button disabled={uploading||busy} onClick={()=>open('course')}>+ Курс нэмэх</button></div>{message&&<p role="status">{message}</p>}
 {editor&&<Editor key={`${editor.kind}-${editor.courseId}-${editor.lessonId}`} title={editor.kind==='course'?(editor.courseId?'Курс засах':'Шинэ курс'):editor.kind==='lesson'?(editor.lessonId?'Дэд курс засах':'Дэд курс нэмэх'):editor.kind==='pretest'?'Курсийн Pre-test':'Курсийн үндсэн шалгалт'} onClose={()=>setEditor(null)} onSubmit={save} busy={busy||uploading} error={error}>
 <div className="form-grid">{field('Нэр',form.title,v=>update('title',v),{required:true,maxLength:300})}
 {editor.kind==='course'&&<><label>Курсийн эрх<select value={String(form.premium)} onChange={e=>update('premium',e.target.value==='true')}><option value="false">Үнэгүй</option><option value="true">Premium — coin эсвэл гишүүнчлэл</option></select></label>{form.premium&&field('Худалдан авах үнэ • coin',form.priceCoins,v=>update('priceCoins',Number(v)),{type:'number',min:1,max:100000,required:true})}{field('Шагнал • Premium coin',form.reward,v=>update('reward',Number(v)),{type:'number',min:0,max:100000,required:true})}<label>Төлөв<select value={String(form.active)} onChange={e=>update('active',e.target.value==='true')}><option value="true">Идэвхтэй</option><option value="false">Идэвхгүй</option></select></label></>}
 {editor.kind==='lesson'&&field('Үргэлжлэх хугацаа (минут)',form.durationMinutes,v=>update('durationMinutes',Number(v)),{required:true,type:'number',min:.1,max:600,step:.1})}
 {editor.kind==='exam'&&field('Тэнцэх босго (%)',form.passPercent,v=>update('passPercent',Number(v)),{required:true,type:'number',min:1,max:100})}
 </div>
 {!['exam','pretest'].includes(editor.kind)&&<label>Тайлбар<textarea maxLength={5000} value={form.description} onChange={e=>update('description',e.target.value)}/></label>}
 {editor.kind==='lesson'&&<VideoUpload token={token} value={form.videoUrl} onChange={v=>update('videoUrl',v)} onBusy={setUploading}/>}
 {editor.kind!=='course'&&<><p className="hint">{editor.kind==='lesson'?'Дэд курсийн сорил (заавал биш).':'Үндсэн шалгалтад дор хаяж нэг асуулт оруулна уу.'}</p><QuestionEditor items={form.questionItems} onChange={v=>update('questionItems',v)}/></>}
 </Editor>}
 <section className="courses">{courses.map(c=><article className="course" key={c.id}><div className="editor-heading"><div><p className="eyebrow">КУРС • {c.active?'ИДЭВХТЭЙ':'ИДЭВХГҮЙ'}</p><h2>{c.title}</h2></div><button disabled={uploading||busy} className="secondary" onClick={()=>open('course',c)}>Курс засах</button></div><p>{c.description||'Тайлбар оруулаагүй.'}</p><p>{c.premium?`${c.priceCoins} coin эсвэл идэвхтэй Premium гишүүнчлэл`:'Үнэгүй курс'}</p><p className="hint">{c.lessons?.length??0} дэд курс • {c.reward??50} Premium coin</p>
 <div className="editor-actions"><button disabled={uploading||busy} onClick={()=>open('lesson',c)}>+ Дэд курс нэмэх</button><button disabled={uploading||busy} className="secondary" onClick={()=>open('pretest',c)}>{c.preTest?'Pre-test засах':'+ Pre-test нэмэх'}</button><button disabled={uploading||busy} className="secondary" onClick={()=>open('exam',c)}>{c.finalTest?'Үндсэн шалгалт засах':'+ Үндсэн шалгалт нэмэх'}</button></div>
 {(c.lessons??[]).map((l,i)=><div className="lesson editable-lesson" key={l.id}><div><strong>{i+1}. {l.title}</strong><p className="hint">{l.durationMinutes} минут • {l.questionItems?.length??0} асуулт</p>{l.videoUrl?.startsWith('/uploads/')&&<video className="lesson-video" controls preload="none" src={toMediaUrl(l.videoUrl)}/>}</div><button disabled={uploading||busy} className="small secondary" onClick={()=>open('lesson',c,l)}>Дэд курс / сорил засах</button></div>)}
 {c.finalTest&&<div className="exam-summary"><strong>{c.finalTest.title}</strong><span>{c.finalTest.questionItems.length} асуулт • {c.finalTest.passPercent}% тэнцэх босго</span></div>}
 </article>)}</section></>;
}
