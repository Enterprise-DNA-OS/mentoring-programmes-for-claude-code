insert into programmes(id,code,name,owner,cadence_days,purpose,review_due) values
 ('10000000-0000-4000-8000-000000000001','LEAD','First-time leaders','Aroha',30,'Voluntary leadership mentoring',current_date+60),
 ('10000000-0000-4000-8000-000000000002','PEER','Peer learning','Ben',14,'Voluntary skills exchange',current_date-5) on conflict do nothing;
insert into people(id,code,name,email,department,skills,capacity,active,participation_confirmed,purpose,profile_reviewed,retention_review) values
 ('20000000-0000-4000-8000-000000000001','AROHA','Aroha Wilson','aroha@example.test','Operations',array['leadership','planning'],2,true,true,'Voluntary mentoring',current_date,current_date+180),
 ('20000000-0000-4000-8000-000000000002','BEN','Ben Chen','ben@example.test','Finance',array['budgeting','planning'],1,true,true,'Voluntary mentoring',current_date,current_date+180),
 ('20000000-0000-4000-8000-000000000003','MOANA','Moana King','moana@example.test','Operations',array['delivery'],0,true,true,'Voluntary mentoring',current_date,current_date+180),
 ('20000000-0000-4000-8000-000000000004','JAMES','James Park','james@example.test','Service',array['support'],0,true,true,'Voluntary mentoring',current_date,current_date+180),
 ('20000000-0000-4000-8000-000000000005','TAYLOR-A','Taylor Smith','taylor.a@example.test','Service',array['delivery'],0,true,false,'',current_date-120,current_date-1),
 ('20000000-0000-4000-8000-000000000006','TAYLOR-B','Taylor Smith','taylor.b@example.test','Finance',array['planning'],0,true,true,'Voluntary mentoring',current_date,current_date+60)
 on conflict do nothing;
insert into enrolments(programme_id,person_id,role,wants)
 select '10000000-0000-4000-8000-000000000001',id,case when capacity>0 then 'mentor' else 'mentee' end,
 case when code='JAMES' then array['budgeting'] else array['leadership'] end from people where code in ('AROHA','BEN','MOANA','JAMES','TAYLOR-A','TAYLOR-B') on conflict do nothing;
insert into matches(id,code,programme_id,mentor_id,mentee_id,status,started_on,reason) values
 ('30000000-0000-4000-8000-000000000001','LEAD-01','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','active',current_date-60,'Participants agreed leadership focus'),
 ('30000000-0000-4000-8000-000000000002','LEAD-02','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000004','active',current_date-30,'Participants agreed budget focus') on conflict do nothing;
insert into sessions(code,match_id,held_on,status,minutes,topic,feedback) values
 ('S-01','30000000-0000-4000-8000-000000000001',current_date-45,'completed',45,'Delegation practice',4),
 ('S-02','30000000-0000-4000-8000-000000000001',current_date-10,'scheduled',45,'Team planning',null),
 ('S-03','30000000-0000-4000-8000-000000000002',current_date-3,'completed',30,'Budget review',5),
 ('S-04','30000000-0000-4000-8000-000000000002',current_date+7,'scheduled',30,'Quarterly priorities',null) on conflict do nothing;
insert into goals(code,match_id,title,owner,due) values
 ('G-01','30000000-0000-4000-8000-000000000001','Run a delegation check-in','Moana',current_date-7),
 ('G-02','30000000-0000-4000-8000-000000000002','Prepare the next budget narrative','James',current_date+14) on conflict do nothing;
