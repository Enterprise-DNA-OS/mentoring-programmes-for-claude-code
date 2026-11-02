#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {page,table,record,writeOut} from './lib/render.mjs';
import {table as textTable} from './lib/format.mjs';
const printTable=rows=>console.log(textTable(rows,rows.length?Object.keys(rows[0]).map(key=>({key,label:key.replaceAll('_',' ')})):[]));

export const commands=['programmes','people','enrolments','matches','sessions','goals','capacity','unmatched','suggestions','quiet-pairs','attention','goal-progress','compliance','weekly-review','person','match','activity','export','draft-agenda','draft-review','add-programme','add-person','enrol','pair','end-pair','log-session','add-goal','complete-goal','review-person','review-programme','import','help'];
const mutable=new Set(['add-programme','add-person','enrol','pair','end-pair','log-session','add-goal','complete-goal','review-person','review-programme','import']);
const stores=['programmes','people','enrolments','matches','sessions','goals','import_rows','audit'];
const today=()=>new Date().toISOString().slice(0,10);
const required=(value,name)=>{if(typeof value!=='string'||!value.trim())throw Error(`Required: --${name}`);return value.trim();};
const int=(v,name,min,max)=>{if(!/^\d+$/.test(String(v))||Number(v)<min||Number(v)>max)throw Error(`${name} must be an integer ${min}..${max}`);return Number(v);};
const date=(v,name)=>{required(v,name);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid date: ${name}`);return v;};
const choice=(v,name,values)=>{if(!values.includes(v))throw Error(`${name} must be ${values.join('|')}`);return v;};
const boolean=(v,name)=>{if(!['true','false'].includes(v))throw Error(`${name} must be true|false`);return v==='true';};
const list=v=>String(v||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
const code=v=>{required(v,'code');if(!/^[a-z0-9_-]{1,60}$/i.test(v))throw Error('code must use letters, digits, underscore or hyphen');return v.toUpperCase();};
const email=v=>{required(v,'email');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw Error('Invalid email');return v.toLowerCase();};
function options(args){const o={};const pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(k in o)throw Error(`Duplicate --${k}`);if(['dry-run','json'].includes(k)&&i>=0)throw Error(`--${k} is a flag, not a value`);o[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {o,pos};}
export async function resolve(db,kind,input){
 if(!['programmes','people','matches','goals'].includes(kind))throw Error('Unsupported record type');
 required(input,kind);const name=kind==='goals'?'title':kind==='matches'?'code':'name';
 const exact=await db.query(`select * from ${kind} where lower(code)=lower($1) or id::text=$1`,[input]);if(exact.length===1)return exact[0];
 const rows=await db.query(`select * from ${kind} where lower(${name})=lower($1) or starts_with(id::text,lower($1)) order by code`,[input]);
 if(rows.length===1)return rows[0];const e=Error(rows.length?`Ambiguous ${kind}: ${input}`:`No ${kind}: ${input}`);e.candidates=rows.map(r=>({id:r.id,code:r.code,name:r[name]}));throw e;
}
const queries={
 programmes:'select code,name,owner,cadence_days,review_due from programmes order by code',
 people:'select code,name,department,skills,capacity,active,participation_confirmed from people order by code',
 enrolments:'select p.code as programme,u.code as person,e.role,e.wants from enrolments e join programmes p on p.id=e.programme_id join people u on u.id=e.person_id order by p.code,u.code',
 matches:'select code,programme,mentor,mentee,status,health from pair_health order by code',
 sessions:'select s.code,m.code as match,s.held_on,s.status,s.minutes,s.topic,s.feedback from sessions s join matches m on m.id=s.match_id order by s.held_on,s.code',
 goals:'select code,match,title,owner,due,status from goal_progress order by due,code',
 capacity:'select code,name,capacity,active_matches,available,active,participation_confirmed from mentor_capacity order by code',
 unmatched:`select p.code as programme,u.code,u.name,e.wants,u.participation_confirmed from enrolments e join people u on u.id=e.person_id join programmes p on p.id=e.programme_id where e.role in ('mentee','both') and u.active and not exists(select 1 from matches m where m.programme_id=e.programme_id and m.mentee_id=e.person_id and m.status='active') order by p.code,u.code`,
 'quiet-pairs':"select code,mentor,mentee,last_completed,quiet_days,cadence_days,next_session,health from pair_health where status='active' and health<>'on cadence' order by code",
 'goal-progress':'select code,match,title,owner,due,state from goal_progress order by due,code',
 compliance:'select * from compliance_checks order by code,rule',
 activity:'select actor,command,detail,created_at from audit order by created_at,id',
 attention:`select code,'pair check-in' as kind,health as reason from pair_health where status='active' and health<>'on cadence'
 union all select code,'session','scheduled date passed without completion' from sessions where status='scheduled' and held_on<current_date
 union all select code,'goal','development goal overdue' from goals where status='open' and due<current_date
 union all select code,'record review',finding from compliance_checks order by code,kind`
};
async function insert(db,kind,values){const keys=Object.keys(values);return (await db.query(`insert into ${kind} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values)))[0];}
function fresh(p){return p.active&&p.participation_confirmed&&p.purpose&&p.profile_reviewed&&p.profile_reviewed>=new Date(Date.now()-90*86400000).toISOString().slice(0,10)&&p.retention_review&&p.retention_review>=today();}
async function pairReady(db,programme,mentor,mentee){
 // Serialise cross-programme mentor capacity and the programme's mentee assignments.
 programme=(await db.query('select * from programmes where id=$1 for update',[programme.id]))[0];
 const locked=await db.query('select * from people where id=any($1::uuid[]) order by id for update',[[mentor.id,mentee.id]]);
 mentor=locked.find(x=>x.id===mentor.id);mentee=locked.find(x=>x.id===mentee.id);
 if(mentor.id===mentee.id)throw Error('A person cannot mentor themselves');
 if(!fresh(mentor)||!fresh(mentee))throw Error('Both participants need confirmed participation and current profile and retention-purpose reviews');
 if(programme.review_due<today())throw Error('Programme review is overdue');
 const e=await db.query('select * from enrolments where programme_id=$1 and person_id=any($2::uuid[])',[programme.id,[mentor.id,mentee.id]]);
 if(!e.some(x=>x.person_id===mentor.id&&['mentor','both'].includes(x.role))||!e.some(x=>x.person_id===mentee.id&&['mentee','both'].includes(x.role)))throw Error('Both people need the appropriate programme enrolment');
 const n=(await db.query("select count(*)::int as n from matches where mentor_id=$1 and status='active'",[mentor.id]))[0].n;
 if(n>=mentor.capacity)throw Error('Mentor capacity is full');
 if((await db.query("select id from matches where programme_id=$1 and mentee_id=$2 and status='active'",[programme.id,mentee.id])).length)throw Error('Mentee already has an active match in this programme');
}
async function suggestions(db){
 const rows=await db.query(`select p.code as programme,u.code as mentee,v.code as mentor,u.id as mentee_id,v.id as mentor_id,e.wants,v.skills,c.available
 from enrolments e join people u on u.id=e.person_id join programmes p on p.id=e.programme_id
 join enrolments me on me.programme_id=e.programme_id and me.role in ('mentor','both')
 join people v on v.id=me.person_id join mentor_capacity c on c.id=v.id
 where e.role in ('mentee','both') and u.id<>v.id and u.active and v.active and u.participation_confirmed and v.participation_confirmed
 and c.available>0 and p.review_due>=current_date and u.purpose<>'' and v.purpose<>''
 and u.profile_reviewed>=current_date-90 and v.profile_reviewed>=current_date-90 and u.retention_review>=current_date and v.retention_review>=current_date
 and not exists(select 1 from matches m where m.programme_id=e.programme_id and m.mentee_id=u.id and m.status='active')
 order by p.code,u.code,v.code`);
 return rows.map(r=>({programme:r.programme,mentee:r.mentee,mentor:r.mentor,shared_skills:r.wants.filter(x=>r.skills.includes(x)),available:r.available})).filter(r=>r.shared_skills.length).sort((a,b)=>b.shared_skills.length-a.shared_skills.length||a.mentor.localeCompare(b.mentor));
}
const defaults={
 users:{id:['id','User ID','userId'],name:['Name','Full Name'],email:['Email','emailAddress'],department:['Department']},
 matches:{id:['id','Match ID','Pairing ID'],mentor:['Mentor ID','mentorId'],mentee:['Mentee ID','menteeId'],status:['Status','Match Status'],started:['Start Date','startedAt'],ended:['End Date','endedAt']},
 sessions:{id:['id','Session ID','sessionId'],match:['Match ID','Pairing ID','pairingId'],day:['Date','Session Date','scheduledAt'],status:['Status','Session Status'],minutes:['Minutes','Duration'],topic:['Topic','Agenda'],feedback:['Feedback','Rating']}
};
const importCode=(source,kind,key)=>`${kind[0].toUpperCase()}-${createHash('sha256').update(JSON.stringify([source,kind,key])).digest('hex').slice(0,20).toUpperCase()}`;
async function importTogether(db,o){
 const source=required(o.source,'source');const programme=await resolve(db,'programmes',required(o.programme,'programme'));
 const mapping=o.mapping?JSON.parse(fs.readFileSync(o.mapping,'utf8')):{};
 if(!o.users&&!o.matches&&!o.sessions)throw Error('Provide --users, --matches or --sessions');
 const result={inserted:0,unchanged:0,by_kind:{}};
 for(const kind of ['users','matches','sessions']){
  if(!o[kind])continue;let raw=fs.readFileSync(o[kind],'utf8');
  if(raw.trimStart().startsWith('{')){const body=JSON.parse(raw);if(typeof body.report!=='string')throw Error('Expected a Together report string');raw=body.report;}
  const rows=parseCsv(raw);if(!rows.length)throw Error(`Empty ${kind} report`);
  result.by_kind[kind]={inserted:0,unchanged:0};
  for(const row of rows){
   const val=key=>{const custom=mapping[kind]?.[key];return pick(row,...(custom?[custom]:defaults[kind][key]||[key])).trim();};
   const key=required(val('id'),`${kind} stable id column (supply --mapping)`);
   const prior=(await db.query('select original from import_rows where source=$1 and kind=$2 and external_key=$3',[source,kind,key]))[0];
   if(prior){
    if(kind==='matches'){const existing=await resolve(db,'matches',importCode(source,kind,key));if(existing.programme_id!==programme.id)throw Error('Match belongs to a different programme');}
    if(kind==='sessions'){const existing=(await db.query('select m.programme_id from sessions s join matches m on m.id=s.match_id where s.code=$1',[importCode(source,kind,key)]))[0];if(existing?.programme_id!==programme.id)throw Error('Session belongs to a different programme');}
    if(JSON.stringify(prior.original)!==JSON.stringify(JSON.parse(JSON.stringify(row),Object.keys(row).sort()))) {
     // PostgreSQL jsonb key order differs from insertion order; compare keys and values.
     if(Object.keys(prior.original).length!==Object.keys(row).length||Object.keys(row).some(k=>prior.original[k]!==row[k]))throw Error(`Changed duplicate ${kind} ${key}; review the source change before applying it`);
    } result.unchanged++;result.by_kind[kind].unchanged++;continue;}
   const c=importCode(source,kind,key);
   if(kind==='users'){
    const name=val('name')||[pick(row,'First Name','firstName'),pick(row,'Last Name','lastName')].filter(Boolean).join(' ');
    await insert(db,'people',{code:c,name:required(name,'name column'),email:email(val('email')),department:val('department'),capacity:0});
   }else if(kind==='matches'){
    const mentor=await resolve(db,'people',importCode(source,'users',required(val('mentor'),'mentor id column')));
    const mentee=await resolve(db,'people',importCode(source,'users',required(val('mentee'),'mentee id column')));
    let status=val('status').toLowerCase();status=mapping.match_status?.[status]||status;
    choice(status,'match status',['staged','active','ended']);
    const started=date(val('started'),'match start');const ended=status==='ended'?date(val('ended'),'match end'):null;
    if(started>today()||(ended&&ended>today()))throw Error('Imported match dates cannot be in the future');
    await insert(db,'matches',{code:c,programme_id:programme.id,mentor_id:mentor.id,mentee_id:mentee.id,status,started_on:started,ended_on:ended,reason:'Imported historical match; review participation and capacity before new matching'});
   }else{
    const match=await resolve(db,'matches',importCode(source,'matches',required(val('match'),'match id column')));
    if(match.programme_id!==programme.id)throw Error('Session belongs to a different programme');
    let status=val('status').toLowerCase();status=mapping.session_status?.[status]||status;choice(status,'session status',['scheduled','completed','cancelled']);
    const day=date(val('day'),'session date');if(status==='completed'&&day>today())throw Error('Completed session cannot be in the future');
    if(day<match.started_on||(match.ended_on&&day>match.ended_on))throw Error('Session outside match dates');
    await insert(db,'sessions',{code:c,match_id:match.id,held_on:day,status,minutes:int(val('minutes'),'minutes',1,1440),topic:required(val('topic'),'topic column'),feedback:val('feedback')?int(val('feedback'),'feedback',1,5):null});
   }
   await insert(db,'import_rows',{source,kind,external_key:key,original:JSON.stringify(row)});result.inserted++;result.by_kind[kind].inserted++;
  }
 }
 return result;
}
export async function run(db,args){
 const {o,pos}=options(args);const [cmd='help',ref]=pos;
 if(!commands.includes(cmd))throw Error(`Unknown command: ${cmd}. Use help.`);
 if(cmd==='help')return {commands,usage:'npm run mentoring -- <command> [record] --json; mutations require --actor and accept --dry-run',import:'import together --programme=CODE --source=ACCOUNT --users=users.csv --matches=matches.csv --sessions=sessions.csv [--mapping=map.json] --actor=NAME --dry-run'};
 if(cmd in queries)return db.query(queries[cmd]);
 if(cmd==='suggestions')return suggestions(db);
 if(cmd==='weekly-review')return {quiet_pairs:await run(db,['quiet-pairs']),unmatched:await run(db,['unmatched']),goals:await run(db,['goal-progress']),attention:await run(db,['attention']),capacity:await run(db,['capacity'])};
 if(cmd==='person'){
  const p=await resolve(db,'people',ref);return {person:p,enrolments:await db.query('select * from enrolments where person_id=$1',[p.id]),matches:await db.query('select * from matches where mentor_id=$1 or mentee_id=$1',[p.id])};
 }
 if(cmd==='match'){
  const m=await resolve(db,'matches',ref);return {match:m,health:(await db.query('select * from pair_health where id=$1',[m.id]))[0],sessions:await db.query('select * from sessions where match_id=$1 order by held_on',[m.id]),goals:await db.query('select * from goals where match_id=$1 order by due',[m.id])};
 }
 if(cmd==='export'){
  await db.exec('BEGIN READ ONLY');try{const data={format:'mentoring-programmes-v1',at:new Date().toISOString()};for(const s of stores)data[s]=await db.query(`select * from ${s} order by id`);
   const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'exports');fs.mkdirSync(dir,{recursive:true,mode:0o700});
   const file=path.join(dir,`mentoring-${Date.now()}.json`);fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{mode:0o600});return {file,counts:Object.fromEntries(stores.map(s=>[s,data[s].length]))};
  }finally{await db.exec('ROLLBACK');}
 }
 if(cmd==='draft-agenda'||cmd==='draft-review'){
  const m=await resolve(db,'matches',ref);const data=await run(db,['match',m.code]);
  const title=cmd==='draft-agenda'?'Mentoring session agenda':'Mentoring relationship review';
  const sections=[{title:'Relationship',html:record(data.health,['code','mentor','mentee','last_completed','next_session','health'])},{title:'Development goals',html:table(data.goals,['code','title','owner','due','status','evidence'])},{title:'Session history',html:table(data.sessions,['held_on','status','topic','feedback'])},{title:'Discussion',html:'<p>Confirm the participants still want this match. Review progress against the agreed goals, record obstacles and agree the next meeting. This draft contains no inferred feedback.</p>'}];
  return {file:writeOut('drafts',`${cmd}-${m.id}`,page({title,subtitle:m.code,sections}))};
 }
 if(!mutable.has(cmd))throw Error('Command not implemented');
 const actor=required(o.actor,'actor');await db.exec('BEGIN');
 try{
  let result;
  if(cmd==='add-programme')result=await insert(db,'programmes',{code:code(o.code),name:required(o.name,'name'),owner:required(o.owner,'owner'),cadence_days:int(o.cadence||'30','cadence',1,365),purpose:required(o.purpose,'purpose'),review_due:date(o.review,'review')});
  if(cmd==='review-programme'){const p=await resolve(db,'programmes',ref);result={before:p,after:(await db.query('update programmes set owner=$1,purpose=$2,review_due=$3,cadence_days=$4 where id=$5 returning *',[required(o.owner,'owner'),required(o.purpose,'purpose'),date(o.review,'review'),int(o.cadence||String(p.cadence_days),'cadence',1,365),p.id]))[0]};}
  if(cmd==='add-person')result=await insert(db,'people',{code:code(o.code),name:required(o.name,'name'),email:email(o.email),department:o.department||'',skills:list(o.skills),capacity:int(o.capacity||'0','capacity',0,20)});
  if(cmd==='enrol'){
   const p=await resolve(db,'programmes',o.programme),u=await resolve(db,'people',o.person);
   const before=(await db.query('select * from enrolments where programme_id=$1 and person_id=$2',[p.id,u.id]))[0]||null;
   const after=(await db.query('insert into enrolments(programme_id,person_id,role,wants) values($1,$2,$3,$4) on conflict(programme_id,person_id) do update set role=excluded.role,wants=excluded.wants returning *',[p.id,u.id,choice(o.role,'role',['mentor','mentee','both']),list(o.wants)]))[0];result={before,after};
  }
  if(cmd==='review-person'){
   const p=await resolve(db,'people',ref);const reviewed=date(o.reviewed,'reviewed');if(reviewed>today())throw Error('Profile review cannot be in the future');
   result=(await db.query('update people set participation_confirmed=$1,active=$2,purpose=$3,profile_reviewed=$4,retention_review=$5,capacity=$6,skills=$7 where id=$8 returning *',[boolean(o.confirmed,'confirmed'),o.active===undefined?p.active:boolean(o.active,'active'),required(o.purpose,'purpose'),reviewed,date(o.retention,'retention'),o.capacity===undefined?p.capacity:int(o.capacity,'capacity',0,20),o.skills===undefined?p.skills:list(o.skills),p.id]))[0];
   result={before:p,after:result};
  }
  if(cmd==='pair'){
   const p=await resolve(db,'programmes',o.programme),a=await resolve(db,'people',o.mentor),b=await resolve(db,'people',o.mentee);
   await pairReady(db,p,a,b);result=await insert(db,'matches',{code:code(o.code),programme_id:p.id,mentor_id:a.id,mentee_id:b.id,status:'active',started_on:today(),reason:required(o.reason,'reason')});
  }
  if(cmd==='end-pair'){
   const m=await resolve(db,'matches',ref);await db.query('select id from matches where id=$1 for update',[m.id]);
   const changed=await db.query("update matches set status='ended',ended_on=current_date,reason=$1 where id=$2 and status<>'ended' returning *",[required(o.reason,'reason'),m.id]);if(!changed.length)throw Error('Match already ended');result={before:m,after:changed[0]};
   // Scheduled meetings are not silently cancelled. They stay visible for operator review.
  }
  if(cmd==='log-session'){
   let m=await resolve(db,'matches',o.match);m=(await db.query('select * from matches where id=$1 for update',[m.id]))[0];
   const status=choice(o.status,'status',['scheduled','completed','cancelled']);const day=date(o.day,'day');
   if(status==='completed'&&day>today())throw Error('Completed session cannot be in the future');
   if(day<m.started_on||(m.ended_on&&day>m.ended_on))throw Error('Session outside match dates');
   if(m.status!=='active'&&status==='scheduled')throw Error('Only active matches can schedule sessions');
   const existing=(await db.query('select * from sessions where code=$1 for update',[code(o.code)]))[0];
   const values={code:code(o.code),match_id:m.id,held_on:day,status,minutes:int(o.minutes,'minutes',1,1440),topic:required(o.topic,'topic'),feedback:o.feedback?int(o.feedback,'feedback',1,5):null};
   if(existing){if(existing.match_id!==m.id||existing.status!=='scheduled')throw Error('Only a scheduled session in the same match can be updated');
    result={before:existing,after:(await db.query('update sessions set held_on=$1,status=$2,minutes=$3,topic=$4,feedback=$5 where id=$6 returning *',[day,status,values.minutes,values.topic,values.feedback,existing.id]))[0]};
   }else result=await insert(db,'sessions',values);
  }
  if(cmd==='add-goal'){
   let m=await resolve(db,'matches',o.match);m=(await db.query('select * from matches where id=$1 for update',[m.id]))[0];if(m.status!=='active')throw Error('Goal requires an active match');
   result=await insert(db,'goals',{code:code(o.code),match_id:m.id,title:required(o.title,'title'),owner:required(o.owner,'owner'),due:date(o.due,'due')});
  }
  if(cmd==='complete-goal'){
   const g=await resolve(db,'goals',ref);const changed=await db.query("update goals set status='done',evidence=$1,completed_on=current_date where id=$2 and status='open' returning *",[required(o.evidence,'evidence'),g.id]);if(!changed.length)throw Error('Goal already completed');result={before:g,after:changed[0]};
  }
  if(cmd==='import'){if(ref!=='together')throw Error('Use import together');result=await importTogether(db,o);}
  await insert(db,'audit',{actor,command:cmd,detail:JSON.stringify(result)});
  await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return {dry_run:Boolean(o['dry-run']),result};
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
function human(data){if(Array.isArray(data))return printTable(data);if(data&&typeof data==='object'){for(const [key,value] of Object.entries(data)){console.log(`\n${key.replaceAll('_',' ')}`);if(Array.isArray(value)){if(value.every(v=>typeof v==='string'))console.log(value.join('\n'));else printTable(value);}else if(value&&typeof value==='object')console.log(JSON.stringify(value,null,2));else console.log(value);}}else console.log(data);}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const data=await run(db,process.argv.slice(2));if(process.argv.includes('--json'))console.log(JSON.stringify(data,null,2));else human(data);}catch(e){if(process.argv.includes('--json'))console.error(JSON.stringify({error:e.message,candidates:e.candidates||[]}));else{console.error(e.message);if(e.candidates?.length)printTable(e.candidates);}process.exitCode=1;}finally{if(db)await db.close();}}
