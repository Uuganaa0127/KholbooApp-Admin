import Policy from './Policy.jsx';
import Reports from './Reports.jsx';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {Users, Stories, Coins, Discussions} from './PlatformManagers.jsx';
import Categories from './Categories.jsx';
import Surveys from './Surveys.jsx';
import Games from './Games.jsx';
import YouthHealthMembers from './YouthHealthMembers.jsx';
import LearningAnalytics from './LearningAnalytics.jsx';
import {Courses, Tests} from './ContentEditors.jsx';

const apiUrl = import.meta.env.VITE_API_URL || '/api';
const request = async (path, token, options = {}) => {
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); }
  catch (_) { throw new Error('Backend JSON хариу өгөөгүй байна. Port 4000 дээр зөв backend ажиллаж байгаа эсэхийг шалгана уу.'); }
  if (!response.ok) throw Object.assign(new Error(payload.error || 'Something went wrong.'),{status:response.status});
  return payload;
};

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@youthhealthpf.mn');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = async event => { event.preventDefault(); try { onLogin(await request('/auth/login', null, { method: 'POST', body: JSON.stringify({ email, password }) })); } catch (err) { setError(err.message); } };
  return <main className="login"><section><p className="eyebrow">YOUTH MED</p><h1>Админ удирдлага</h1><p>Курс, хичээл, сорил, суралцагчийг удирдана.</p><form onSubmit={submit}><Field label="И-мэйл" value={email} onChange={setEmail}/><Field label="Нууц үг" value={password} onChange={setPassword} type="password"/>{error && <p className="error">{error}</p>}<button>Нэвтрэх</button></form></section></main>;
}

function Dashboard({ token, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({});
  const [error, setError] = useState('');
  const tabs = [['overview', 'Тойм'], ['courses', 'Курс ба видео'], ['categories', 'Ангилал'], ['tests', 'Сорил'], ['games','Мини тоглоом'], ['surveys', 'Санал асуулга'], ['users', 'Хэрэглэгч'], ['youth-health-members', 'Youth Health гишүүд'], ['discussions', 'Кейс хэлэлцүүлэг'], ['reports','Зөрчлийн мэдээлэл'], ['policy','Нууцлал / Тусламж'], ['stories', 'Мэдээ / Stories'], ['coins', 'Бонус coin'], ['assessments', 'Скрининг']];
  const load = async () => { try { setData(await request(tab === 'overview' ? '/analytics' : `/${tab}`, token)); setError(''); } catch (err) { if(err.status===401){onLogout();return;} setError(err.message); } };
  useEffect(() => { load(); }, [tab]);
  const list = Array.isArray(data) ? data : [];
  return <div className="app"><aside><div className="brand">YOUTH <span>MED</span><small>ADMIN</small></div>{tabs.map(([key, label]) => <button className={tab === key ? 'selected' : ''} onClick={() => {setData([]); setTab(key);}} key={key}>{label}</button>)}<button className="logout" onClick={onLogout}>Гарах</button></aside><main className="content"><header><div><p className="eyebrow">УДИРДЛАГА</p><h1>{tabs.find(([key]) => key === tab)[1]}</h1></div><button onClick={load}>Шинэчлэх</button></header>{error && <p className="error">{error}</p>}{tab === 'overview' && <LearningAnalytics data={data}/>} {tab === 'categories' && <Categories token={token} categories={list} onSaved={load}/>} {tab === 'games' && <Games token={token} games={list} onSaved={load}/>} {tab === 'surveys' && <Surveys token={token} surveys={list} onSaved={load}/>} {tab === 'tests' && <Tests token={token} tests={list} onSaved={load}/>} {tab === 'youth-health-members' && <YouthHealthMembers members={list}/>} {tab === 'users' && <Users token={token} users={list} onSaved={load}/>} {tab === 'courses' && <Courses token={token} courses={list} onSaved={load}/>} {tab === 'stories' && <Stories token={token} stories={list} onSaved={load}/>} {tab === 'discussions' && <Discussions token={token} discussions={list} onSaved={load}/>} {tab === 'policy' && <Policy token={token} data={data} onSaved={load}/>} {tab === 'reports' && <Reports token={token} reports={list} onSaved={load}/>} {tab === 'coins' && <Coins token={token} data={data} onSaved={load}/>} {tab === 'assessments' && <AssessmentList assessments={list}/>}</main></div>;
}

function AssessmentList({ assessments }) { return <section className="panel"><Table columns={['Өвчтөн', 'Нас / хүйс', 'БЖИ', 'Б/Ө харьцаа', 'Огноо']} rows={assessments.map(a => [a.patientName, `${a.age} / ${a.sex}`, a.bmi || '—', a.waistHeightRatio || '—', new Date(a.createdAt).toLocaleDateString()])}/></section>; }
function Field({ label, value, onChange, type = 'text' }) { return <label>{label}<input required value={value} type={type} onChange={event => onChange(event.target.value)}/></label>; }
function Select({ label, value, onChange, options }) { return <label>{label}<select value={value} onChange={event => onChange(event.target.value)}>{options.map(([key, text]) => <option value={key} key={key}>{text}</option>)}</select></label>; }
function Table({ columns, rows }) { return <div className="table-wrap"><table><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : <tr><td colSpan={columns.length}>Мэдээлэл алга байна.</td></tr>}</tbody></table></div>; }
function App() { const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('youth-med-admin') || 'null')); const logout = () => { localStorage.removeItem('youth-med-admin'); setSession(null); }; const login = next => { localStorage.setItem('youth-med-admin', JSON.stringify(next)); setSession(next); }; return session ? <Dashboard token={session.token} onLogout={logout}/> : <Login onLogin={login}/>; }
createRoot(document.getElementById('root')).render(<App/>);
