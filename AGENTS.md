# Vehicle Logic Lab

This folder is an independently runnable deliverable. Keep all runtime sources and assets inside it. Do not import from the parent repository or rely on its node_modules, servers, filesystem aliases, or external asset URLs.

Product direction: `docs/DEVELOPMENT_BRIEF_v3.md` and the user's latest UX direction supersede v2 here: a bright cozy game, title → driver-view opening → garage → one concept/action at a time → verification → reward. Keep the full graph optional. Preserve original TRACKBACK apps outside this folder. Use TRACKBACK's own art, not third-party identities.

READY content is an explicitly fictional educational vehicle specification, not an OEM or safety-standard claim. Mission 1 computes a request without changing vehicle state. Mission 2 changes state once per rising button edge. Mission 3 validates behavior rather than graph shape. Never use unreviewed legacy data as an answer key.

Keep engine, content, verification, and presentation separate. Run `npm test`, `npm run build`, and `npm run check:independence` after meaningful changes. Record deferred features and actionable follow-up prompts in docs.
