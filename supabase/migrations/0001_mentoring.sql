create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table programmes (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 owner text not null, cadence_days integer not null default 30 check(cadence_days between 1 and 365),
 purpose text not null, review_due date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table people (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 email text not null unique, department text not null default '', skills text[] not null default '{}',
 capacity integer not null default 1 check(capacity between 0 and 20), active boolean not null default true,
 participation_confirmed boolean not null default false, purpose text not null default '',
 profile_reviewed date, retention_review date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table enrolments (
 id uuid primary key default gen_random_uuid(), programme_id uuid not null references programmes,
 person_id uuid not null references people, role text not null check(role in ('mentor','mentee','both')),
 wants text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(programme_id,person_id)
);
create table matches (
 id uuid primary key default gen_random_uuid(), code text not null unique,
 programme_id uuid not null references programmes, mentor_id uuid not null references people,
 mentee_id uuid not null references people, status text not null check(status in ('staged','active','ended')),
 started_on date not null, ended_on date, reason text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(mentor_id<>mentee_id), check((status='ended' and ended_on>=started_on) or (status<>'ended' and ended_on is null))
);
create unique index one_active_pair on matches(programme_id,mentor_id,mentee_id) where status='active';
create unique index one_active_mentor_per_mentee on matches(programme_id,mentee_id) where status='active';
create table sessions (
 id uuid primary key default gen_random_uuid(), code text not null unique, match_id uuid not null references matches,
 held_on date not null, status text not null check(status in ('scheduled','completed','cancelled')),
 minutes integer not null check(minutes between 1 and 1440), topic text not null,
 feedback integer check(feedback between 1 and 5), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table goals (
 id uuid primary key default gen_random_uuid(), code text not null unique, match_id uuid not null references matches,
 title text not null, owner text not null, due date not null, status text not null default 'open' check(status in ('open','done')),
 evidence text, completed_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((status='done' and length(trim(evidence))>0 and completed_on is not null) or (status='open' and completed_on is null))
);
create table import_rows (
 id uuid primary key default gen_random_uuid(), source text not null, kind text not null,
 external_key text not null, original jsonb not null, imported_at timestamptz not null default now(),
 unique(source,kind,external_key)
);
create table audit (
 id uuid primary key default gen_random_uuid(), actor text not null, command text not null,
 detail jsonb not null, created_at timestamptz not null default now()
);
do $$ declare n text; begin foreach n in array array['programmes','people','enrolments','matches','sessions','goals'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',n);
 end loop;
 foreach n in array array['programmes','people','enrolments','matches','sessions','goals','import_rows','audit'] loop
 execute format('alter table %I enable row level security',n);
 execute format('revoke all on %I from public',n);
 end loop;
end $$;
create view mentor_capacity as
 select p.id,p.code,p.name,p.capacity,count(m.id)::int as active_matches,
 p.capacity-count(m.id)::int as available,p.active,p.participation_confirmed
 from people p left join matches m on m.mentor_id=p.id and m.status='active'
 where exists(select 1 from enrolments e where e.person_id=p.id and e.role in ('mentor','both'))
 group by p.id;
create view pair_health as
 select m.id,m.code,p.code as programme,a.name as mentor,b.name as mentee,m.status,m.started_on,
 max(s.held_on) filter(where s.status='completed') as last_completed,
 min(s.held_on) filter(where s.status='scheduled' and s.held_on>=current_date) as next_session,
 count(s.id) filter(where s.status='completed')::int as completed_sessions,
 count(s.id) filter(where s.status='scheduled' and s.held_on<current_date)::int as overdue_sessions,
 current_date-coalesce(max(s.held_on) filter(where s.status='completed'),m.started_on) as quiet_days,
 p.cadence_days,
 case when not a.active or not b.active then 'inactive participant'
 when not a.participation_confirmed or not b.participation_confirmed then 'confirm participation'
 when current_date-coalesce(max(s.held_on) filter(where s.status='completed'),m.started_on)>p.cadence_days then 'overdue check-in'
 else 'on cadence' end as health
 from matches m join programmes p on p.id=m.programme_id join people a on a.id=m.mentor_id join people b on b.id=m.mentee_id
 left join sessions s on s.match_id=m.id group by m.id,p.id,a.id,b.id;
create view goal_progress as
 select g.id,g.code,m.code as match,g.title,g.owner,g.due,g.status,g.evidence,
 case when g.status='done' then 'done' when g.due<current_date then 'overdue' else 'on time' end as state
 from goals g join matches m on m.id=g.match_id;
create view compliance_checks as
 select code,'NZ IPP8 / AU APP10'::text as rule,'profile accuracy review due'::text as finding from people where profile_reviewed is null or profile_reviewed<current_date-90
 union all select code,'NZ IPP9 / AU APP11','retention-purpose review due' from people where purpose='' or retention_review is null or retention_review<current_date
 union all select code,'Local participation policy','participation unconfirmed' from people where active and not participation_confirmed
 union all select code,'Local programme policy','programme review overdue' from programmes where review_due<current_date
 union all select code,'Local capacity policy','mentor over capacity' from mentor_capacity where available<0;
revoke all on mentor_capacity,pair_health,goal_progress,compliance_checks from public;
