import React, { useEffect, useState } from 'react';
import { SITE } from '../config';
import { get, submit, friendlyError } from '../lib/api';
import { currentReferral } from '../lib/referral';
import { formatLocalClassDays, useTimeZone } from './Site';

function Field({label,required,children,hint,error}) { const id=React.useId(); const hintId=hint?`${id}-hint`:undefined; const errorId=error?`${id}-error`:undefined; return <div className="form-field"><label htmlFor={id}>{label}{required && <span className="required"> *</span>}</label>{React.cloneElement(children,{id,'aria-invalid':Boolean(error),'aria-describedby':[hintId,errorId].filter(Boolean).join(' ')||undefined})}{hint && <small id={hintId} className="field-hint">{hint}</small>}{error && <small id={errorId} className="field-error">{error}</small>}</div>; }
function Input({label,required,type='text',value,onChange,placeholder='',error,hint,autoComplete}) { return <Field label={label} required={required} error={error} hint={hint}><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} required={required}/></Field>; }
function Select({label,required,value,onChange,options,placeholder='Choose',error}) { return <Field label={label} required={required} error={error}><select value={value} onChange={e=>onChange(e.target.value)} required={required}><option value="">{placeholder}</option>{options.map(v=><option key={typeof v==='string'?v:v.value} value={typeof v==='string'?v:v.value}>{typeof v==='string'?v:v.label}</option>)}</select></Field>; }
function TextArea({label,value,onChange,required=false,rows=4,hint}) { return <Field label={label} required={required} hint={hint}><textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} required={required}/></Field>; }
function Terms({checked,onChange}) { return <label className="check-field"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} required/><span>I have read and agree to the <a href="#/documents/terms">Terms and Conditions</a>, <a href="#/documents/privacy-policy">Privacy Policy</a> and <a href="#/documents/code-of-conduct">Code of Conduct</a>.</span></label>; }

export function useOptions() {
  const [options,setOptions] = useState(null), [error,setError] = useState('');
  useEffect(()=>{get('getFormOptions').then(setOptions).catch(e=>setError(e.message));},[]);
  return {options,error};
}

function useSubmission(form, readyToRender) {
  const [loadedAt,setLoadedAt] = useState(null);
  const [busy,setBusy] = useState(false), [success,setSuccess] = useState(''), [error,setError] = useState('');
  useEffect(()=>{ if(readyToRender && loadedAt===null) setLoadedAt(Date.now()); },[readyToRender,loadedAt]);
  const send = async (fields) => {
    setBusy(true); setError(''); setSuccess('');
    try {
      if(!loadedAt) throw new Error('The form is still loading. Please try again.');
      const result = await submit({ form, origin: window.location.origin, loaded_at: loadedAt, website: '', ref: currentReferral() || '', ...fields });
      setSuccess(result.message || 'Your submission has been received.');
      return true;
    } catch(e) { setError(friendlyError(e)); return false; }
    finally { setBusy(false); }
  };
  return {send,busy,success,error,ready:loadedAt!==null};
}

export function RegistrationForm({course,category}) {
  const {options,error:optionsError}=useOptions();
  const {zone}=useTimeZone();
  const [path,setPath]=useState(category==='Children'?'Child':'Self');
  const [fields,setFields]=useState({first:'',last:'',guardianFirst:'',guardianLast:'',gender:'',age:'',location:'',email:'',whatsapp:'',group_id:'',seminary_name:'',seminary_location:'',current_status:'',terms:false,prereq:false,quote:'No'});
  const [eligibilityNotice,setEligibilityNotice]=useState('');
  const {send,busy,success,error,ready}=useSubmission('register',Boolean(options));
  const set=(k,v)=>setFields(f=>({...f,[k]:v}));
  const child=path==='Child';
  const isChildren=course.audience==='Children';
  const groups=course.groups || [];
  const selectedGroup=groups.find(g=>g.group_id===fields.group_id);
  const prereqs=course.prerequisites_list || [];
  const lists=options?.lists || {};
  const settings=options?.settings || {};
  const minAge=Number(isChildren?settings.age_children_courses_min:child?settings.age_child_on_adult_courses_min:settings.age_self_min) || (isChildren?6:child?16:18);
  const maxAge=isChildren?Number(settings.age_children_courses_max)||15:100;
  const ageOptions=Array.from({length:Math.max(0,maxAge-minAge+1)},(_,i)=>String(minAge+i));
  const todayUtc=new Date().toISOString().slice(0,10);
  // Full groups remain selectable so the backend can record an Over capacity request;
  // groups whose admissions date has passed are not offered.
  const availableGroups=groups.filter(g=>!g.admissions_close_date || String(g.admissions_close_date).slice(0,10)>=todayUtc);
  const genderMismatch=Boolean(selectedGroup && fields.gender && ((selectedGroup.open_to==='Males' && fields.gender!=='Male') || (selectedGroup.open_to==='Females' && fields.gender!=='Female')));
  const noSelectableGroups=course.format==='Group' && availableGroups.length===0;
  useEffect(()=>{ if(isChildren) setPath('Child'); },[isChildren]);
  useEffect(()=>{
    if(genderMismatch) setEligibilityNotice(`Unfortunately, this group is only open to ${selectedGroup.open_to.toLowerCase()}. Please choose an eligible group.`);
    else setEligibilityNotice('');
  },[genderMismatch,selectedGroup?.group_id,fields.gender]);
  const onSubmit=async(e)=>{
    e.preventDefault();
    if(!fields.terms || (prereqs.length>0 && !fields.prereq)) return;
    const website=e.currentTarget.elements.website?.value || '';
    const studentName=`${fields.first} ${fields.last}`.trim();
    const payload={registering_for:path,student_name:studentName,gender:fields.gender,age:Number(fields.age),country_and_city:fields.location,email:fields.email,whatsapp:fields.whatsapp,course_id:course.course_id,terms_agreed:'Yes',group_id:course.format==='Group'?fields.group_id:'',guardian_name:child?`${fields.guardianFirst} ${fields.guardianLast}`.trim():'',seminary_name:fields.seminary_name,seminary_location:fields.seminary_location,current_status:fields.current_status,syllabus_books_quote:fields.quote,prerequisites_confirmed:fields.prereq?'Yes':'No',website};
    await send(payload);
  };
  if(optionsError) return <div className="form-alert error">Unable to load form choices: {optionsError}</div>;
  if(!options) return <div className="form-loading">Loading registration options…</div>;
  return <form className="site-form" onSubmit={onSubmit}>
    <input className="honeypot" type="text" name="website" defaultValue="" autoComplete="off" tabIndex={-1} aria-hidden="true" aria-label="Leave this field empty"/>
    <h3>Registration form</h3><p className="form-context">Registering for: <strong>{course.title_english}</strong></p>
    {!isChildren && <div className="form-field"><label>Who are you registering?</label><div className="choice-row">{(lists.registering_for||['Self','Child']).map(v=><label key={v}><input type="radio" checked={path===v} onChange={()=>setPath(v)} /> {v==='Self'?'Myself':'My child'}</label>)}</div></div>}
    <div className="form-grid"><Input label="Student first name" required value={fields.first} onChange={v=>set('first',v)} autoComplete="given-name"/><Input label="Student surname" required value={fields.last} onChange={v=>set('last',v)} autoComplete="family-name"/>
      {child && <><Input label="Guardian first name" required value={fields.guardianFirst} onChange={v=>set('guardianFirst',v)}/><Input label="Guardian surname" required value={fields.guardianLast} onChange={v=>set('guardianLast',v)}/></>}
      <Select label="Gender" required value={fields.gender} onChange={v=>set('gender',v)} options={lists.genders||[]}/>
      <Select label="Age" required value={fields.age} onChange={v=>set('age',v)} options={ageOptions}/>
      <Input label="Country and city / location" required value={fields.location} onChange={v=>set('location',v)} />
      <Input label="Email address" type="email" required value={fields.email} onChange={v=>set('email',v)} autoComplete="email"/>
      <Input label="WhatsApp number" required value={fields.whatsapp} onChange={v=>set('whatsapp',v)} hint="Include your country code. Required by the institute registration system."/>
      {course.format==='Group' && <Select label="Group" required value={fields.group_id} onChange={v=>set('group_id',v)} options={availableGroups.map(g=>({value:g.group_id,label:`${g.group_label || g.group_id} — ${g.open_to==='Both'?'All genders':g.open_to==='Males'?'Males only':'Females only'}${Number(g.seats_left)===0?' — Full':''}`}))}/>}
      {course.audience==='Alimiyah' && <><Input label="Name of seminary / institute studied at" value={fields.seminary_name} onChange={v=>set('seminary_name',v)}/><Input label="Location of seminary / institute" value={fields.seminary_location} onChange={v=>set('seminary_location',v)}/></>}
      <Select label="Current status" value={fields.current_status} onChange={v=>set('current_status',v)} options={lists.current_statuses||[]}/>
    </div>
    {noSelectableGroups && <div className="form-alert error">There are no groups currently accepting registrations for this course. Please submit an enquiry instead.</div>}
    {genderMismatch && <div className="form-alert error" role="alert">Unfortunately, this group is only open to {selectedGroup.open_to.toLowerCase()}. Please choose an eligible group.</div>}
    {eligibilityNotice && <div className="eligibility-modal" role="alertdialog" aria-modal="true" aria-label="Course eligibility notice"><div className="eligibility-dialog"><span className="eyebrow">Group eligibility</span><p>{eligibilityNotice}</p><button type="button" className="btn btn-navy" onClick={()=>setEligibilityNotice('')}>I understand</button></div></div>}
    {course.format==='Group' && selectedGroup && <div className="group-info"><strong>{selectedGroup.group_label || 'Selected group'}</strong><p>{selectedGroup.open_to==='Males'?'This group is open to males only.':selectedGroup.open_to==='Females'?'This group is open to females only.':'This group is open to all genders.'}</p><p>{formatLocalClassDays(selectedGroup,zone)} · {formatGroupTime(selectedGroup,zone)}</p><p>{Number(selectedGroup.seats_left)>0?`${selectedGroup.seats_left} places currently listed as available.`:'This group is currently full. You may submit a request; the institute will confirm next steps.'}</p></div>}
    {prereqs.length>0 && <div className="prereq-box"><strong>Prerequisites</strong><ul>{prereqs.map(x=><li key={x}>{x}</li>)}</ul><label className="check-field"><input type="checkbox" checked={fields.prereq} onChange={e=>set('prereq',e.target.checked)}/><span>I confirm that the student fulfils the listed prerequisites.</span></label></div>}
    <label className="check-field"><input type="checkbox" checked={fields.quote==='Yes'} onChange={e=>set('quote',e.target.checked?'Yes':'No')}/><span>Request a quote for syllabus books (handled privately).</span></label>
    <Terms checked={fields.terms} onChange={v=>set('terms',v)}/>
    {error && <div className="form-alert error" role="alert">{error}</div>}{success && <div className="form-alert success" role="status">{success}</div>}
    <button className="btn btn-gold form-submit" disabled={!ready || busy || noSelectableGroups || genderMismatch || (prereqs.length>0 && !fields.prereq)}>{busy?'Submitting…':'Submit registration'}</button>
  </form>;
}
function formatGroupTime(g,zone) {
  if(!g.start_date || !g.start_time_utc) return 'Schedule to be confirmed';
  const date = new Date(`${String(g.start_date).slice(0,10)}T${String(g.start_time_utc).slice(0,8)}Z`);
  if(Number.isNaN(date.getTime())) return `${g.start_time_utc} UTC`;
  return new Intl.DateTimeFormat(undefined,{timeZone:zone,weekday:'short',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(date);
}

export function EnquiryForm({audience='Students and Adults',courseId='',alimiyah=false}) {
  const {options,error:optionsError}=useOptions();
  const [fields,setFields]=useState({for:'Myself',first:'',last:'',location:'',email:'',whatsapp:'',telegram:'',platform:'Email',status:'',goals:'',seminary_name:'',seminary_location:'',terms:false});
  const {send,busy,success,error,ready}=useSubmission('enquiry',Boolean(options));
  const set=(k,v)=>setFields(f=>({...f,[k]:v}));
  const lists=options?.lists||{};
  const onSubmit=async(e)=>{e.preventDefault();if(!fields.terms)return;const website=e.currentTarget.elements.website?.value || '';await send({website,audience,enquiry_for:fields.for,student_name:`${fields.first} ${fields.last}`.trim(),country_and_city:fields.location,email:fields.email,preferred_platform:fields.platform,whatsapp:fields.whatsapp,telegram:fields.telegram,course_id:courseId,seminary_name:fields.seminary_name,seminary_location:fields.seminary_location,current_status:fields.status,goals:fields.goals,terms_agreed:'Yes'});};
  if(optionsError) return <div className="form-alert error">Unable to load enquiry options: {optionsError}</div>;
  if(!options) return <div className="form-loading">Loading enquiry options…</div>;
  return <form className="site-form" onSubmit={onSubmit}><input className="honeypot" type="text" name="website" defaultValue="" autoComplete="off" tabIndex={-1} aria-hidden="true" aria-label="Leave this field empty"/><h3>Enquiry form</h3><div className="form-field"><label>Enquiry for</label><div className="choice-row">{(lists.enquiry_for||['Myself','My child']).map(v=><label key={v}><input type="radio" checked={fields.for===v} onChange={()=>set('for',v)}/> {v}</label>)}</div></div>
    <div className="form-grid"><Input label="Student first name" required value={fields.first} onChange={v=>set('first',v)}/><Input label="Student surname" required value={fields.last} onChange={v=>set('last',v)}/><Input label="Country and city / location" required value={fields.location} onChange={v=>set('location',v)}/><Input label="Email address" required type="email" value={fields.email} onChange={v=>set('email',v)}/><Select label="Preferred contact platform" required value={fields.platform} onChange={v=>set('platform',v)} options={lists.preferred_platforms||[]}/>
    {fields.platform==='WhatsApp' && <Input label="WhatsApp number" required value={fields.whatsapp} onChange={v=>set('whatsapp',v)}/>} {fields.platform==='Telegram' && <Input label="Telegram username / details" required value={fields.telegram} onChange={v=>set('telegram',v)}/>} {fields.platform!=='WhatsApp' && <Input label="WhatsApp number (optional)" value={fields.whatsapp} onChange={v=>set('whatsapp',v)}/>}
    {alimiyah && <><Input label="Name of seminary / institute studied at" value={fields.seminary_name} onChange={v=>set('seminary_name',v)}/><Input label="Location of seminary / institute" value={fields.seminary_location} onChange={v=>set('seminary_location',v)}/></>}
    <Select label="Current status" value={fields.status} onChange={v=>set('status',v)} options={lists.current_statuses||[]}/></div>
    <TextArea label="Goals, schedule preferences and other information" value={fields.goals} onChange={v=>set('goals',v)} hint="Please do not include sensitive personal information."/><Terms checked={fields.terms} onChange={v=>set('terms',v)}/>
    {error && <div className="form-alert error" role="alert">{error}</div>}{success && <div className="form-alert success" role="status">{success}</div>}<button className="btn btn-gold form-submit" disabled={!ready || busy}>{busy?'Submitting…':'Submit enquiry'}</button>
  </form>;
}

export function MessageForm() {
  const {options,error:optionsError}=useOptions();
  const [f,setF]=useState({name:'',email:'',topic:'',message:''});
  const {send,busy,success,error,ready}=useSubmission('message',Boolean(options));
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const onSubmit=async e=>{e.preventDefault();const website=e.currentTarget.elements.website?.value || '';await send({website,name:f.name,email:f.email,topic:f.topic,message:f.message});};
  if(optionsError)return <div className="form-alert error">Unable to load message topics: {optionsError}</div>;
  if(!options)return <div className="form-loading">Loading message topics…</div>;
  return <form className="site-form" onSubmit={onSubmit}><input className="honeypot" type="text" name="website" defaultValue="" autoComplete="off" tabIndex={-1} aria-hidden="true" aria-label="Leave this field empty"/><h3>Submit a question, request or feedback</h3><Input label="Full name" required value={f.name} onChange={v=>set('name',v)}/><Input label="Email address" required type="email" value={f.email} onChange={v=>set('email',v)}/><Select label="Topic" required value={f.topic} onChange={v=>set('topic',v)} options={options.lists.message_topics||[]}/><TextArea label="Message" required value={f.message} onChange={v=>set('message',v)} rows={6}/>{error&&<div className="form-alert error" role="alert">{error}</div>}{success&&<div className="form-alert success" role="status">{success}</div>}<button className="btn btn-gold form-submit" disabled={!ready || busy}>{busy?'Sending…':'Submit'}</button></form>;
}
