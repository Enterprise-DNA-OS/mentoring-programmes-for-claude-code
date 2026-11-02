# Record handling and programme checks

Checked 2 November 2026. The command reports records requiring human review. It does not certify compliance or replace employment advice.

| Check | Basis | What the command does |
|---|---|---|
| Profile accuracy | [NZ Privacy Act principle 8](https://www.privacy.org.nz/privacy-principles/8/) and [AU APP 10](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-quick-reference) | Flags a missing profile review or one older than 90 days. The interval is our configurable local policy, not a statutory deadline. |
| Retention purpose | [NZ principle 9](https://www.privacy.org.nz/privacy-principles/9/) and AU APP 11 in the reference above | Flags missing purpose and overdue retention review. A human decides whether information remains necessary, then handles approved removal across database, exports, drafts and backups. |
| Participant agreement | Local voluntary-programme policy | New matches require recorded confirmation from both people. Imported history never creates confirmation. This field alone is not a legal basis for every use of personal information. |
| Mentor workload | Local programme policy | Flags active relationships exceeding recorded capacity. New matches check capacity across all programmes. |
| Programme review | Local programme policy | Flags overdue owner review and blocks new matches in that programme. |

APP coverage depends on the organisation and applicable exceptions. Set appropriate handling rules before live use. Collect only necessary business skills, goals and meeting outcomes. Do not store medical information, protected characteristics or confidential counselling narratives here. Matching does not rank people for recruitment, promotion or compensation.

The database is for authorised coordinators. Public database grants are revoked and row security has no public policies. It does not implement participant-level authorisation. A database owner can read everything, including original imports and audit records. Use a private host, restricted credentials, encrypted storage and verified backups. Generated HTML and exports contain personal information and must stay private. Names in the audit are operator supplied, not authenticated identities.
