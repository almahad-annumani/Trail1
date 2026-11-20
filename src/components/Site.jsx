import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { SITE, AUDIENCES } from '../config';
import { hasStorageChoice, setStorageConsent } from '../lib/referral';

const TimeContext = createContext({ zone: 'UTC', setZone: () => {} });
export const useTimeZone = () => useContext(TimeContext);

export function TimeZoneProvider({ children }) {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [zone, setZone] = useState(() => {
    try { return localStorage.getItem('mahad_timezone') || detected; } catch { return detected; }
  });
  const change = (v) => { setZone(v); try { localStorage.setItem('mahad_timezone', v); } catch {} };
  return <TimeContext.Provider value={{ zone, setZone: change }}>{children}</TimeContext.Provider>;
}

export function formatInstituteTime(dateValue, timeValue, zone) {
  if (!dateValue || !timeValue) return '';
  const d = String(dateValue).slice(0, 10);
  const t = String(timeValue).slice(0, 8);
  const iso = `${d}T${t.length === 5 ? `${t}:00` : t}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return `${d} ${t} UTC`;
  return new Intl.DateTimeFormat(undefined, { timeZone: zone, weekday: 'short', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }).format(date);
}

export function formatLocalClassDays(group, zone) {
  const sourceDays=group.class_days_list || String(group.class_days || '').split(',').map(x=>x.trim()).filter(Boolean);
  if(!group.start_date || !group.start_time_utc) return sourceDays.join(', ');
  const indexes={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  const [year,month,day]=String(group.start_date).slice(0,10).split('-').map(Number);
  const [hour=0,minute=0,second=0]=String(group.start_time_utc).split(':').map(Number);
  const startWeekday=new Date(Date.UTC(year,month-1,day)).getUTCDay();
  return sourceDays.map(dayName=>{
    const target=indexes[dayName.slice(0,3)];
    if(target===undefined) return dayName;
    const offset=(target-startWeekday+7)%7;
    const occurrence=new Date(Date.UTC(year,month-1,day+offset,hour,minute,second));
    return new Intl.DateTimeFormat(undefined,{timeZone:zone,weekday:'short'}).format(occurrence);
  }).join(', ');
}

export function Header() {
  const { zone, setZone } = useTimeZone();
  const [menu, setMenu] = useState(false);
  const [showZoneHelp, setShowZoneHelp] = useState(false);
  const location = useLocation();
  useEffect(() => { setMenu(false); }, [location.pathname]);
  useEffect(() => {
    try { if (!localStorage.getItem('mahad_timezone_explained')) setShowZoneHelp(true); } catch {}
  }, []);
  const dismiss = () => { setShowZoneHelp(false); try { localStorage.setItem('mahad_timezone_explained', 'yes'); } catch {} };
  const zones = useMemo(() => {
    try { return ['UTC', ...Intl.supportedValuesOf('timeZone').filter(z => z !== 'UTC')]; } catch { return ['UTC', 'Africa/Johannesburg', 'Europe/London', 'America/New_York', 'Asia/Karachi']; }
  }, []);
  return <>
    <div className="topline"><div className="container topline-inner"><span>Traditional Islamic education for a global community</span><div className="zone-control"><span className="material-symbols-outlined">schedule</span><label htmlFor="timezone">Display time:</label><select id="timezone" value={zone} onChange={e => setZone(e.target.value)}>{zones.map(z => <option key={z} value={z}>{z.replaceAll('_', ' ')}</option>)}</select></div></div></div>
    {showZoneHelp && <div className="zone-note"><span>Institute schedules are stored in UTC and displayed in your selected time zone ({zone}).</span><button onClick={dismiss} aria-label="Dismiss time zone notice">×</button></div>}
    <header className="site-header"><div className="container nav-wrap">
      <Link to="/" className="brand" aria-label="Al-Maʿhad An-Nuʿmānī home"><span className="brand-mark">م</span><span><strong>Al-Maʿhad</strong><small>An-Nuʿmānī</small></span></Link>
      <button className="menu-toggle" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Toggle navigation"><span className="material-symbols-outlined">{menu ? 'close' : 'menu'}</span></button>
      <nav className={menu ? 'main-nav open' : 'main-nav'}>
        <NavLink to="/about">About</NavLink><NavLink to="/courses">All Courses</NavLink>
        <div className="nav-dropdown"><span>Course Categories</span><div className="nav-dropdown-menu">{AUDIENCES.map(a => <Link key={a.value} to={a.path}>{a.label}</Link>)}</div></div>
        <NavLink to="/contact">Contact</NavLink>
      </nav>
    </div></header>
  </>;
}

export function Footer() {
  return <footer className="site-footer"><div className="container footer-grid">
    <div className="footer-brand"><div className="brand brand-light"><span className="brand-mark">م</span><span><strong>Al-Maʿhad</strong><small>An-Nuʿmānī</small></span></div><p>‘The foundations laid by the predecessors, with a modern approach’</p></div>
    <div><h4>Courses</h4>{AUDIENCES.map(a => <Link key={a.value} to={a.path}>{a.label}</Link>)}</div>
    <div><h4>Institute</h4><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/documents/code-of-conduct">Code of Conduct</Link></div>
    <div><h4>Contact</h4><PlaceholderLink label="Email" value={SITE.contact.email}/><PlaceholderLink label="WhatsApp" value={SITE.contact.whatsapp}/><PlaceholderLink label="Telegram" value={SITE.contact.telegram}/><PlaceholderLink label="Instagram" value={SITE.contact.instagram}/></div>
    <div><h4>Documents</h4><DocumentLink to="/documents/privacy-policy" label="Privacy Policy"/><DocumentLink to="/documents/terms" label="Terms and Conditions"/></div>
  </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Al-Maʿhad An-Nuʿmānī</span><span>Developed by {SITE.developerCredit}</span></div></footer>;
}
function PlaceholderLink({label,value}) { return value ? <a href={value}>{label}</a> : <span className="placeholder-item">{label}: <em>To be supplied</em></span>; }
function DocumentLink({to,label}) { return <Link to={to}>{label}</Link>; }

export function CookieNotice() {
  const [visible, setVisible] = useState(() => !hasStorageChoice());
  if (!visible) return null;
  const choose = (yes) => { setStorageConsent(yes); setVisible(false); };
  return <aside className="cookie-notice" aria-label="Storage notice"><div><strong>Privacy and local storage</strong><p>This site uses local storage to remember your selected time zone. A referral code supplied during this visit may be included with a form; if you accept, it can also be remembered for the backend-configured attribution period. Declining optional storage prevents that persistent referral record. The site does not currently implement analytics or advertising tracking. See the <Link to="/documents/privacy-policy">Privacy Policy</Link>.</p></div><div className="cookie-actions"><button className="btn btn-gold" onClick={() => choose(true)}>Accept</button><button className="btn btn-outline-light" onClick={() => choose(false)}>Decline optional storage</button></div></aside>;
}

export function PageIntro({eyebrow,title,children}) { return <section className="page-intro"><div className="container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{children && <p>{children}</p>}</div></section>; }
export function Loading({label='Loading...'}) { return <div className="loading-state"><span className="spinner"/> {label}</div>; }
export function ErrorState({message,retry}) { return <div className="state-card error-state"><p>{message}</p>{retry && <button className="btn btn-navy" onClick={retry}>Try again</button>}</div>; }
export function EmptyState({children='No courses are currently available.'}) { return <div className="state-card">{children}</div>; }
export function MaterialIcon({name}) { return <span className="material-symbols-outlined" aria-hidden="true">{name}</span>; }
