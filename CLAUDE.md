# Mentoring Programmes for Claude Code

For programme coordinators running voluntary workplace mentoring. This database holds declared skills, participant confirmation, matches, sessions, development goals and review evidence. Read current CLI output before answering.

## Routing

- /programmes: Read the programme register. Read .claude/commands/programmes.md.
- /people: Read participant profiles. Read .claude/commands/people.md.
- /enrolments: Read programme enrolments. Read .claude/commands/enrolments.md.
- /matches: Read mentoring relationships. Read .claude/commands/matches.md.
- /sessions: Read scheduled and completed sessions. Read .claude/commands/sessions.md.
- /goals: Read development commitments. Read .claude/commands/goals.md.
- /capacity: Review mentor capacity. Read .claude/commands/capacity.md.
- /unmatched: Find mentees without an active match. Read .claude/commands/unmatched.md.
- /suggestions: Review skill-based match suggestions. Read .claude/commands/suggestions.md.
- /quiet-pairs: Find relationships needing a check-in. Read .claude/commands/quiet-pairs.md.
- /attention: Find overdue mentoring work. Read .claude/commands/attention.md.
- /goal-progress: Review development progress. Read .claude/commands/goal-progress.md.
- /compliance: Review privacy and programme record checks. Read .claude/commands/compliance.md.
- /weekly-review: Prepare the Monday programme review. Read .claude/commands/weekly-review.md.
- /person: Read one participant and their relationships. Read .claude/commands/person.md.
- /match: Read one relationship and its history. Read .claude/commands/match.md.
- /activity: Read the operator change history. Read .claude/commands/activity.md.
- /export: Export the owned records. Read .claude/commands/export.md.
- /draft-agenda: Draft a mentoring session agenda. Read .claude/commands/draft-agenda.md.
- /draft-review: Draft a relationship review. Read .claude/commands/draft-review.md.
- /add-programme: Register a mentoring programme. Read .claude/commands/add-programme.md.
- /add-person: Register a participant. Read .claude/commands/add-person.md.
- /enrol: Record programme participation. Read .claude/commands/enrol.md.
- /pair: Record an agreed mentoring match. Read .claude/commands/pair.md.
- /end-pair: End a mentoring relationship. Read .claude/commands/end-pair.md.
- /log-session: Record or update a session. Read .claude/commands/log-session.md.
- /add-goal: Record a development commitment. Read .claude/commands/add-goal.md.
- /complete-goal: Record completion evidence. Read .claude/commands/complete-goal.md.
- /review-person: Record the completed participant review. Read .claude/commands/review-person.md.
- /review-programme: Record the completed programme review. Read .claude/commands/review-programme.md.
- /import: Import Together report exports. Read .claude/commands/import.md.
- /help: Read the CLI command list. Read .claude/commands/help.md.
- /customise: add a tested migration and adjust the commands.
- /new-view: add a read-only report.
- /docs and /view: render private branded documents.

## Rules

All commands support --json. Mutations require --actor and accept --dry-run. Resolve ambiguous names before changing records. Actual participant agreement is required for a new match. Suggestions use declared skills only and do not make employment decisions. Never invent attendance, ratings or development evidence.

Never send, publish or delete without explicit operator instructions. No sending or automatic matching is implemented. Drafts, exports and import files stay private. Never seed production. Shared demos require --demo-database; tests require an empty disposable TEST_DATABASE_URL.

Read docs/compliance.md before interpreting checks and docs/operations.md before shared use. Keep changes on main and run npm test after functional changes. Claude Code, Codex, OpenCode and Cursor use this same command library.
