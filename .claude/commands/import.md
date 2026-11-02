---
description: Import Together report exports
---
# Import Together report exports

Run `npm run mentoring -- import together --programme=CODE --source=ACCOUNT --users=imports/users.csv --matches=imports/matches.csv --sessions=imports/sessions.csv --mapping=imports/mapping.json --actor="Operator" --dry-run --json`.

Read the returned records before answering. Present the relevant names, dates and next actions. Missing evidence stays missing. Resolve ambiguous names with the operator.

Use the operator-supplied facts and actor name. Preview with --dry-run, explain the changes, then apply within the operator's instructions. Do not invent confirmation, attendance, evidence or feedback.

Read docs/replace-together.md. Default headers are aliases, not a vendor-guaranteed schema. Map the actual export explicitly. A failed row rolls back the batch. Reconcile source counts and original records before removing --dry-run.
