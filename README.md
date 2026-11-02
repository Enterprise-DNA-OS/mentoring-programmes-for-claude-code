# Mentoring Programmes for Claude Code

Find the mentoring pairs that have gone quiet, the goals still owed and the mentors with room for another participant. Keep the programme in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install and run the demo. | Your matching rules, export mapping and programme reports. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=together) · [Instead of Together Mentoring](https://enterprisedna.co/omni/instead-of/together?utm_source=github&utm_medium=readme&utm_campaign=together)

## Start with Monday

Requires Node 20 or later.

```bash
npm install
npm run demo
npm run mentoring -- weekly-review
npm run docs
npm run view
```

Open the folder in Claude Code, Codex, OpenCode or Cursor. AGENTS.md and CLAUDE.md route every runtime through the same commands. PGlite runs locally; DATABASE_URL selects PostgreSQL. Never seed a working database.

The fictional demo has two active relationships, one quiet pair, one overdue session and one overdue goal. One waiting participant has not confirmed participation. Dates are relative to the day of seeding; repeating the seed preserves existing records.

## The programme rituals

/quiet-pairs finds missed check-ins. /unmatched shows the waiting list. /capacity shows workloads across mentors across programmes. /goal-progress tracks development commitments. /weekly-review combines those with record checks. /suggestions compares declared development needs with skills declared by mentors, after confirmation and capacity checks. A human agrees each new match.

32 CLI commands and 36 slash-command recipes. Every CLI command accepts --json. Record changes require --actor and support --dry-run. Exact codes, case-insensitive names and partial identifiers work; ambiguous input lists candidates and exits 1.

A completed session must have a real date, duration and topic. Feedback is optional and never inferred. A completed goal requires evidence. Audit entries preserve operator names and before/after records for updates. Names are operator supplied, not authenticated identities.

## Ten questions answered by your own records

1. Which active pairs have gone quiet? Use `quiet-pairs`.
2. Which overdue goals belong to those relationships? Use `weekly-review`.
3. Which mentors still have capacity across programmes? Use `capacity`.
4. Who is waiting to be matched? Use `unmatched`.
5. Which waiting participants have a declared skill match? Use `suggestions`.
6. Which recorded sessions passed without completion? Use `attention`.
7. Which profiles need participation or accuracy review? Use `compliance`.
8. What evidence completed a development goal? Use `match`.
9. What was recorded before a participant review changed it? Use `activity`.
10. Which relationships have a next meeting recorded? Use `match`.

These are demonstrated questions, not claims that Together cannot answer them.

## Bring your history

```bash
npm run mentoring -- import together --programme=LEAD --source=demo-account --users=fixtures/users.csv --matches=fixtures/matches.csv --sessions=fixtures/sessions.csv --actor="Programme owner" --dry-run
```

The fixtures are fictional. Together documents CSV exports but does not publish a fixed column schema. Use --mapping for the headers in your actual export. The importer reads downloaded user, matching and session reports in one transaction, including the documented JSON report wrapper. It preserves original columns, skips identical imports and rejects changed duplicates. Imported profiles remain unconfirmed until reviewed. [Switching guide](docs/replace-together.md).

## Documents and views

Edit brand.json once. npm run docs renders a relationship review for each match and a programme review for each cohort. npm run view renders the week, available capacity and record checks. /draft-agenda and /draft-review write private HTML to drafts/. Nothing is sent.

/compliance checks accuracy-review dates, retention purposes, participation confirmation and local programme rules. [Sourced checks](docs/compliance.md) explain the difference between legal principles and local intervals. This is record support, not a compliance certificate.

## Your first hour: ten things to ask for

1. Put our business name on the programme review.
2. Show the quiet demo pair and their unfinished goals.
3. Explain which mentors have capacity.
4. Preview a Together report import.
5. Map our export's column names.
6. Register our programme owner and review date.
7. Record actual participant confirmation.
8. Draft the next relationship agenda.
9. Add a report grouped by our programme.
10. Add a coaching-topic field with a tested migration.

/customise adds a tested migration and matching commands. /new-view adds a read-only report.

## Verification and operating limits

npm test creates a temporary database, migrates and seeds twice, exercises all 32 commands and checks matching capacity, participant confirmation, duplicate and invalid imports, rollback, dates, goal evidence, audit, export and escaped HTML. CI covers Windows and Linux with Node 20 and 22, plus PostgreSQL 17. The workflow records actual results in GitHub Actions.

This base serves trusted coordinators. Group mentoring, participant portals, calendar booking, automatic messages and vendor matching algorithms are separate implementation work. It does not make hiring or promotion decisions. Read [why no front end](docs/why-no-front-end.md) and [operations](docs/operations.md). Exports and documents contain personal information. JSON exports have no automated restore command.

## Your version

Together's current pricing page asks for a custom quote. [Pricing and selection evidence](docs/research.md) distinguishes third-party estimates from vendor offers.

Enterprise DNA maps your Together reports, builds your fields, rules, shared views and connections, then runs your version through Omni by Enterprise DNA. One setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=together).

MIT. Not affiliated with Together, Absorb Software or Anthropic. Hosting and agent usage have their own costs.
