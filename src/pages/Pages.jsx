import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AUDIENCES, SITE } from '../config';
import { get } from '../lib/api';
import { EnquiryForm, MessageForm, RegistrationForm } from '../components/Forms';
import { EmptyState, ErrorState, Loading, PageIntro, formatInstituteTime, formatLocalClassDays, useTimeZone } from '../components/Site';

function useApi(action,params={}) {
  const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[reload,setReload]=useState(0);
  const key=JSON.stringify(params);
  useEffect(()=>{let alive=true;setLoading(true);setError('');get(action,params).then(d=>{if(alive)setData(d);}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[action,key,reload]);
  return {data,error,loading,retry:()=>setReload(x=>x+1)};
}

export function HomePage() {
  const {data:featured,error,loading,retry}=useApi('getHomepageCards');
  const {data:subjects}=useApi('getSubjects');
  return <>
    <section className="hero"><div className="hero-pattern"/><div className="container hero-content"><div className="hero-copy"><span className="eyebrow eyebrow-light">Al-Maʿhad An-Nuʿmānī</span><h1>An ocean of Islamic knowledge, <em>at your fingertips</em></h1><p>Knowledge is light, and in the age of darkness every flickering candle becomes a beacon of hope.</p><div className="hero-actions"><Link className="btn btn-gold" to="/courses">Browse courses</Link><Link className="btn btn-outline-light" to="/about">Discover the institute</Link></div></div><div className="hero-calligraphy" aria-hidden="true">أصول السلف<br/><span>بأسلوب الخلف</span></div></div></section>
    <section className="audience-strip"><div className="container audience-grid">{AUDIENCES.map((a,i)=><Link to={a.path} key={a.value} className="audience-tile"><span>0{i+1}</span><strong>{a.label}</strong><small>Explore learning opportunities</small></Link>)}</div></section>
    <SearchCourses/>
    <section className="section container intro-section"><div className="section-heading"><span className="eyebrow">Our goal</span><h2>Rooted in tradition.<br/><em>Delivered through innovation.</em></h2></div><div className="section-copy"><p>Rooted in tradition and delivered through innovation, the courses at Al-Maʿhad An-Nuʿmānī aim to facilitate access to high-quality Islamic education tailored to suit the needs of a diverse global community.</p><Link className="text-link" to="/about">Learn more about us <span>→</span></Link></div></section>
    <section className="section featured-section"><div className="container"><div className="section-title-row"><div><span className="eyebrow">Explore our offerings</span><h2>Featured and seasonal courses</h2></div><Link className="text-link" to="/courses">See all courses →</Link></div>{loading?<Loading label="Loading featured courses…"/>:error?<ErrorState message={error} retry={retry}/>:featured?.length?<div className="course-grid">{featured.map(item=><CourseCard key={item.course.course_id} course={item.course}/>)}</div>:<EmptyState>No featured courses are currently published.</EmptyState>}</div></section>
    <section className="section philosophy-band"><div className="container philosophy-inner"><div className="arabic-quote">أصول السلف بأسلوب الخلف</div><div><span className="eyebrow eyebrow-light">Our philosophy</span><h2>‘The foundations laid by the predecessors, with a modern approach’</h2><p>Rooted in the traditional sciences, the educators at Al-Maʿhad endeavour to preserve the sacred sciences in their pristine form, while adapting the methods of transmission to suit the modern technological era.</p><Link to="/about" className="btn btn-gold">About the institute</Link></div></div></section>
    <section className="section container"><div className="section-title-row"><div><span className="eyebrow">Study by subject</span><h2>Explore the sciences</h2></div><Link to="/courses" className="text-link">All courses →</Link></div><div className="subject-pills">{(subjects||[]).filter(s=>!s.is_section).map(s=><Link key={s.name} to={`/courses?subject=${encodeURIComponent(s.name)}`}>{s.name}</Link>)}</div></section>
    <section className="contact-cta"><div className="container contact-cta-inner"><div><span className="eyebrow eyebrow-light">Have a question?</span><h2>Begin your learning journey.</h2><p>Contact the institute to find the course that best suits your goals.</p></div><Link to="/contact" className="btn btn-gold">Contact the institute</Link></div></section>
  </>;
}


function SearchCourses() {
  const navigate=useNavigate();
  const {data:subjects}=useApi('getSubjects');
  const [audience,setAudience]=useState('');
  const [subject,setSubject]=useState('');
  const [query,setQuery]=useState('');
  const submitSearch=e=>{
    e.preventDefault();
    const path=audience==='Children'?'/courses/children':audience==='Students and Adults'?'/courses/students-adults':audience==='Alimiyah'?'/courses/alimiyah':'/courses';
    const params=new URLSearchParams();
    if(subject)params.set('subject',subject);
    if(query.trim())params.set('q',query.trim());
    navigate(`${path}${params.toString()?`?${params.toString()}`:''}`);
  };
  return <section className="home-search"><div className="container home-search-inner"><div><span className="eyebrow">Find your path</span><h2>Search courses</h2><p>Choose an audience and subject to explore the available courses.</p></div><form onSubmit={submitSearch} className="home-search-form"><label>Audience<select value={audience} onChange={e=>setAudience(e.target.value)}><option value="">All audiences</option>{AUDIENCES.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}</select></label><label>Subject<select value={subject} onChange={e=>setSubject(e.target.value)}><option value="">All subjects</option>{(subjects||[]).filter(s=>!s.is_section).map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></label><label>Search<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Course title or topic"/></label><button className="btn btn-gold">Search</button></form></div></section>;
}

function CourseCard({course}) {
  return <article className="course-card"><div className="course-card-top"><span className="course-subject">{course.subject}</span><span className="course-format">{course.format==='Group'?'Live group classes':'One-on-one'}</span></div><h3>{course.title_english}</h3>{course.title_arabic&&<div className="course-arabic" dir="rtl">{course.title_arabic}</div>}<p>{course.short_description}</p><div className="course-meta"><span>{course.course_duration?`${course.course_duration} ${course.duration_unit||''}`:'Duration varies'}</span><span>{course.total_lessons?`${course.total_lessons} lessons`:''}</span></div><div className="course-card-bottom"><strong>{priceText(course.price)}</strong><div className="course-card-actions"><Link to={`/course/${course.course_id}`}>Details</Link><Link className="card-register" to={`/course/${course.course_id}`}>Register</Link></div></div></article>;
}
function priceText(price) { if(!price||!price.type||price.type==='Estimate')return 'Enquire for details';if(price.monthly)return `$${price.monthly} / month`;if(price.value!==null&&price.value!==undefined)return `$${price.value}`;return 'Enquire for details'; }

export function CoursesPage({audience:fixedAudience}) {
  const [searchParams,setSearchParams]=useSearchParams();
  const [subject,setSubject]=useState(searchParams.get('subject')||'');
  const [search,setSearch]=useState(searchParams.get('q')||'');
  const audience=fixedAudience||'';
  const {data:subjects}=useApi('getSubjects');
  const {data:courses,error,loading,retry}=useApi('getCourses',{audience,subject});
  useEffect(()=>{setSubject(searchParams.get('subject')||'');setSearch(searchParams.get('q')||'');},[searchParams]);
  const filtered=useMemo(()=> (courses||[]).filter(c=>`${c.title_english} ${c.short_description} ${c.subject}`.toLowerCase().includes(search.toLowerCase())),[courses,search]);
  const title=fixedAudience==='Children'?'Children’s Courses':fixedAudience==='Students and Adults'?'Students and Adults Courses':fixedAudience==='Alimiyah'?'Ālimiyah Courses':'All Courses';
  const chooseSubject=v=>{setSubject(v);const p=new URLSearchParams(searchParams);if(v)p.set('subject',v);else p.delete('subject');setSearchParams(p);};
  return <><PageIntro eyebrow="Our courses" title={title}>Explore courses rooted in the traditional Islamic sciences and designed for a global learning community.</PageIntro><main className="container section courses-page"><div className="filter-panel"><div className="filter-title"><span className="eyebrow">Find a course</span><h2>Browse by subject</h2></div><div className="filter-controls"><label>Filter by subject<select value={subject} onChange={e=>chooseSubject(e.target.value)}><option value="">All subjects</option>{(subjects||[]).filter(s=>!s.is_section).map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></label><label>Search courses<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by course or topic…"/></label></div></div>
    {loading?<Loading label="Loading courses…"/>:error?<ErrorState message={error} retry={retry}/>:filtered.length?<><div className="results-caption">{filtered.length} course{filtered.length===1?'':'s'} available</div><div className="course-grid">{filtered.map(c=><CourseCard key={c.course_id} course={c}/>)}</div></>:<EmptyState>No courses match these filters.</EmptyState>}</main></>;
}

export function CoursePage() {
  const {id}=useParams();
  const {data:course,error,loading,retry}=useApi('getCourse',{id});
  const [tab,setTab]=useState('register');
  const {zone}=useTimeZone();
  if(loading)return <main className="container section"><Loading label="Loading course details…"/></main>;
  if(error)return <main className="container section"><ErrorState message={error} retry={retry}/></main>;
  if(!course)return null;
  return <><PageIntro eyebrow={`${course.audience} · ${course.subject}`} title={course.title_english}>{course.short_description}</PageIntro><main className="container section course-detail-layout"><div className="course-detail-main"><div className="detail-card"><div className="detail-topline"><span>{course.format==='Group'?'Live group classes':'One-on-one course'}</span><span>{course.ijazah_provided==='Yes'?'Ijāzah offered':''}</span></div>{course.title_arabic&&<div className="detail-arabic" dir="rtl">{course.title_arabic}</div>}<div className="detail-description">{(course.long_description||course.short_description||'').split('\n').map((line,i)=><p key={i}>{line}</p>)}</div><div className="detail-facts"><Fact label="Duration" value={course.course_duration?`${course.course_duration} ${course.duration_unit||''}`:'To be confirmed'}/><Fact label="Total lessons" value={course.total_lessons||'To be confirmed'}/><Fact label="Lesson duration" value={course.lesson_length_hours?`${course.lesson_length_hours} hour(s)`:''}/><Fact label="Homework assignment and moderation" value={course.homework_assignment_and_moderation==='Yes'?'Included':'As specified by the institute'}/><Fact label="Question support" value={course.question_support==='Yes'?'Available':'As specified by the institute'}/><Fact label="Price" value={priceText(course.price)}/></div>{course.syllabus_line&&<div className="detail-syllabus"><h3>Syllabus</h3><p>{course.syllabus_line}</p></div>}{(course.prerequisites_list||[]).length>0&&<div className="detail-syllabus"><h3>Prerequisites</h3><ul>{course.prerequisites_list.map(p=><li key={p}>{p}</li>)}</ul></div>}</div>
    {course.format==='Group'&&<section className="groups-section"><h2>Available groups</h2>{course.groups?.length?course.groups.map(g=><GroupCard key={g.group_id} group={g} zone={zone}/>):<EmptyState>No groups are currently listed for this course.</EmptyState>}</section>}
    <div className="course-action-tabs"><button className={tab==='register'?'active':''} onClick={()=>setTab('register')}>Registration</button><button className={tab==='enquiry'?'active':''} onClick={()=>setTab('enquiry')}>Enquiry</button></div>{tab==='register'?<RegistrationForm course={course} category={course.audience}/>:<EnquiryForm audience={course.audience} courseId={course.course_id} alimiyah={course.audience==='Alimiyah'}/>}
    </div><aside className="course-detail-aside"><div className="aside-card"><span className="eyebrow">Course overview</span><h3>{course.title_english}</h3><p>{course.audience}</p><strong>{priceText(course.price)}</strong><button className="btn btn-gold full-width" onClick={()=>{setTab('register');document.querySelector('.course-action-tabs')?.scrollIntoView({behavior:'smooth'});}}>Register</button><button className="btn btn-outline-navy full-width" onClick={()=>{setTab('enquiry');document.querySelector('.course-action-tabs')?.scrollIntoView({behavior:'smooth'});}}>Make an enquiry</button></div></aside></main></>;
}
function Fact({label,value}) { return value?<div><small>{label}</small><strong>{value}</strong></div>:null; }
function formatGroupRange(group,zone) {
  const start=formatInstituteTime(group.start_date,group.start_time_utc,zone);
  if(!group.end_time_utc || !group.start_date) return start;
  const endDate=new Date(`${String(group.start_date).slice(0,10)}T${String(group.end_time_utc).slice(0,8)}Z`);
  if(Number.isNaN(endDate.getTime())) return start;
  const end=new Intl.DateTimeFormat(undefined,{timeZone:zone,hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(endDate);
  return `${start} – ${end}`;
}
function GroupCard({group,zone}) {
  const full=Number(group.seats_left)<=0;
  const eligible=group.open_to==='Both'?'Open to all genders':group.open_to==='Males'?'Males only':'Females only';
  return <article className="group-card"><div><h3>{group.group_label||'Group'}</h3><span className={`status-tag ${!full&&group.open==='Yes'?'available':'closed'}`}>{full?'Currently full':group.open==='Yes'?'Open':'Closed'}</span></div><p>{eligible}</p><p>{formatLocalClassDays(group,zone)} · {formatGroupRange(group,zone)}</p><p>Educator: {group.educator_name||'To be confirmed'}</p>{group.admissions_close_date&&<small>Admissions close: {group.admissions_close_date}</small>}{full&&<small>This group is full. Requests may still be received; enrolment is not confirmed.</small>}</article>;
}

export function AboutPage() {
  const {data:faculty,error,loading,retry}=useApi('getFaculty');
  return <><PageIntro eyebrow="About the institute" title="Al-Maʿhad An-Nuʿmānī">The foundations laid by the predecessors, with a modern approach.</PageIntro><main className="container section about-page"><section className="about-copy"><h2>Our story</h2><p>Founded in 2026, Al-Maʿhad An-Nuʿmānī is an online institution established with the aim of facilitating high-quality traditional Islamic education for the wider public.</p><p>Named in honour of the illustrious tābiʿī and jurist Nuʿmān ibn Thābit al-Kūfī (d. 150 AH), Al-Maʿhad aspires to uphold his legacy by balancing reason and tradition to present solutions in a constantly changing world.</p><blockquote>‘The foundations laid by the predecessors, with a modern approach’</blockquote><p>Rooted in the traditional sciences, the educators at Al-Maʿhad endeavour to preserve the sacred sciences in their pristine form, while adapting the methods of transmission to suit the modern technological era.</p></section><section className="faculty-section"><span className="eyebrow">Our outreach</span><h2>Faculty</h2><p>Students, educators, representatives and administration officers from across the globe.</p>{loading?<Loading label="Loading faculty…"/>:error?<ErrorState message={error} retry={retry}/>:faculty?.length?<div className="faculty-grid">{faculty.map(f=><article className="faculty-card" key={f.educator_id}><h3>{f.name_with_title}</h3><span>{f.role}</span><p>{f.specialisation}</p><ul>{(f.qualifications_list||[]).map(q=><li key={q}>{q}</li>)}</ul></article>)}</div>:<EmptyState>Faculty profiles will appear here when published by the institute.</EmptyState>}</section><section className="about-courses"><h2>Our courses</h2><p>The courses offered by Al-Maʿhad An-Nuʿmānī aim to provide students with the foundational knowledge and skills necessary to progress in the various fields of Islamic studies. In addition, courses exploring the rich academic and cultural heritage of Islam, including history and poetry, have been made available. Other courses, such as reviews of concise booklets on Prophetic traditions, focus on the essential principles of Islamic ethics and morality, while reinforcing the preservation of Islamic identity.</p><p>Designed specifically for the online learning environment, these courses and their accompanying homework assignments are structured to accommodate students’ day-to-day schedules, allowing them to pursue their studies alongside their other commitments.</p><Link className="btn btn-gold" to="/courses">View courses</Link></section></main></>;
}

export function ContactPage() { return <><PageIntro eyebrow="Get in touch" title="Contact">Submit a question, request or feedback to Al-Maʿhad An-Nuʿmānī.</PageIntro><main className="container section contact-layout"><div className="contact-details"><h2>Contact directly</h2><p>Contact details will be added when confirmed by the institute.</p>{[['Email',SITE.contact.email],['WhatsApp',SITE.contact.whatsapp],['Telegram',SITE.contact.telegram],['Instagram',SITE.contact.instagram]].map(([l,v])=><div className="contact-detail" key={l}><span>{l}</span><strong>{v||'To be supplied'}</strong></div>)}</div><MessageForm/></main></>; }

export function DocumentPage() { const {slug}=useParams();const map={'privacy-policy':['Privacy Policy',SITE.documents.privacy],'terms':['Terms and Conditions',SITE.documents.terms],'code-of-conduct':['Code of Conduct',SITE.documents.conduct]};const [title,url]=map[slug]||['Institute document',''];return <><PageIntro eyebrow="Institute documents" title={title}>Official institute documents will be linked here.</PageIntro><main className="container section document-placeholder"><div className="document-icon">▤</div><h2>{title}</h2><p>{url?'The approved document is available at the configured link.':'This document link has not yet been supplied by the institute. No document URL has been invented.'}</p>{url&&<a className="btn btn-gold" href={url} target="_blank" rel="noreferrer">Open {title}</a>}</main></>; }
