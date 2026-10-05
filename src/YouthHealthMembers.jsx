import React, {useState} from 'react';
export default function YouthHealthMembers({members}) {
 const [search,setSearch]=useState('');
 const rows=members.filter(m=>[m.name,m.role,m.region,m.specialty].join(' ').toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 return <section className="panel"><h2>Youth Health гишүүд</h2><p>youthhealthpf.mn дээр нийтэлсэн гишүүд. Гишүүнчлэлийн хүсэлтийг вэбийн админ шийдвэрлэнэ. Эдгээр нь аппын нэвтрэх эрхтэй бүртгэл биш.</p><label>Гишүүн хайх<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Нэр, мэргэжил, байршил"/></label><p>{rows.length} гишүүн</p><div className="table-wrap"><table><thead><tr><th>Нэр</th><th>Мэргэжил / албан тушаал</th><th>Нарийн мэргэжил</th><th>Байршил</th><th>Нийтэлсэн утас</th></tr></thead><tbody>{rows.map(m=><tr key={m.id}><td>{m.name}</td><td>{m.role}</td><td>{m.specialty||'—'}</td><td>{m.region}</td><td>{m.phone||'—'}</td></tr>)}</tbody></table></div>{!rows.length&&<p>Гишүүн олдсонгүй.</p>}</section>;
}
