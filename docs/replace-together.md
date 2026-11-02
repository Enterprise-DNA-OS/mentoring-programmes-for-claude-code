# Bring Together exports across

Together documents CSV downloads at Reports > Custom Data Export for registration, matching, sessions and assessments. HRIS-connected accounts can also export user data. [Official guide](https://help.togetherplatform.com/en-us/articles/15877913-custom-data-export), checked 2 November 2026.

The [Reports API guide](https://help.togetherplatform.com/en-us/articles/15878005-reports-api) documents userReport, pairingReport and sessionReport, plus group reports, with a JSON response containing a report string. API entitlement and credentials depend on the account. This importer reads downloaded CSV or that saved JSON response; it does not contact Together or require a key.

## One command after mapping

1. Export the authorised user, matching and session reports. Filter matching and session exports to one programme. Keep files in the ignored imports/ directory. Create that programme locally with add-programme.
2. Compare your actual headers with fixtures/mapping.example.json and write imports/mapping.json. Together's public guide does not promise fixed column names. The fixture headers are representative test aliases, not a captured customer export. Stable user, match and session IDs must be present. Do not substitute names for IDs.
3. Match user ID, name and email; matching ID, mentor ID, mentee ID, status, start and end; session ID, match ID, date, status, minutes, topic and optional feedback. Dates must be YYYY-MM-DD. Normalize timestamp formats explicitly before import. Use mapping.match_status and mapping.session_status to map your actual labels. Group reports, unknown statuses and incomplete records are not silently converted.
4. Run the batch preview, reconcile counts, then repeat without --dry-run:

```bash
npm run mentoring -- import together --programme=LEAD --source=your-account --users=imports/users.csv --matches=imports/matches.csv --sessions=imports/sessions.csv --mapping=imports/mapping.json --actor="Programme owner" --dry-run
```

You can supply a subset of reports, but referenced users and matches must already exist. One batch is one transaction. Every original column is retained in import_rows. Identical rows are skipped on repeat; changed duplicates fail and require deliberate review. An existing local email is a collision to resolve, not permission to merge two people. Keep source consistent and unique to the Together account.

## What needs review

Imported matches retain their recorded status. Imported profiles default to unconfirmed participation, zero mentor capacity and no profile review. Run compliance and review-person with actual confirmation and current evidence. Enrol people with their programme role and declared development needs before proposing new matches. The system does not turn historical matches into a claim of current agreement.

Group mentoring, colleague circles, custom assessments, confidential session notes, files, emails, calendar invitations, learning materials and Together's matching algorithm are not recreated. Every extra column is preserved as source evidence, not automatically treated as an operational field. Enterprise DNA maps additional history and builds the connections and shared screens you need.

Run both record sets side by side. Reconcile participant, relationship and session totals, inspect original rows, and compare completed-session counts. An empty or invalid export is rejected. Keep Together until the records and required operating connections are accepted. A vendor export with unsupported fields needs mapping work before the one-command import can succeed.
