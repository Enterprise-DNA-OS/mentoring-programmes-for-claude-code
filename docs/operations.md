# Operating and recovery

Node 20 or 22 runs the same code on Windows and Linux. Without DATABASE_URL, PGlite uses .data/db. Set DATA_DIR for a separate local store. PostgreSQL uses DATABASE_URL and verifies TLS for remote hosts. Local test connections explicitly disable TLS.

Never seed a working database. npm run demo is for a fresh local store. Shared demo seeding requires --demo-database. npm test uses a temporary PGlite store, or an empty disposable TEST_DATABASE_URL which it refuses if any public tables exist.

Only trusted coordinators should have database access. There is no login or tenant isolation service. Do not expose the database or HTML reports to the public. Keep imports/, exports/, drafts/, docs-out/ and views/ private and out of source control. Use OS permissions and encryption for participant records. On Windows, configure the folder ACL because POSIX file modes do not provide the same protection.

Before production, take a database-native backup and test restoration to a separate database. PGlite directory backups must be taken while all processes are closed. The JSON export is a portable snapshot with original imports and audit history; no automated JSON restore exists. Verify backups and record counts after any upgrade.

New matches serialize programme and participant checks. Mentor capacity is global. Ending a relationship preserves sessions and goals; it does not cancel calendar invitations. Review remaining scheduled sessions and outstanding goals explicitly. The CLI cannot send invitations or messages.

The change log records the actor supplied by the operator and before/after records for updates. A database administrator can edit the log. Do not call it tamper-proof or authenticated.
