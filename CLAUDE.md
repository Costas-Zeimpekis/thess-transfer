# CLAUDE.md — Agent Instructions

## 🤖 Documentation Maintenance Protocol
**CRITICAL:** You are responsible for keeping the project's "Source of Truth" (.md files) synchronized with the codebase.

### 1. The "Double-Update" Rule
Every time I ask for a code change, you must:
1.  **Analyze:** Determine which context files in `docs/` are affected by this change.
2.  **Code:** Implement technical changes following the style rules below.
3.  **Sync:** Immediately update the relevant `.md` files to reflect the new state of the app.
    * *Example:* If you change a database column, update `docs/schema.md`. If you change a status flow, update `docs/business-logic.md`.

### 2. Verification Step
After every implementation, you must confirm: 
> *"I have updated [File Name].md to reflect the new [Feature/Logic] changes."*

---

## 🧠 Agent Context & Memory
Before starting any task, verify the current project state and your operational bounds by reading these root-level files:

- **agent.md**: Contains your persona, reasoning protocols, and the current "Current Focus" of the project.
- **skills.md**: Contains "Golden Patterns" and technical recipes (e.g., Drizzle migrations, Greek PDF formatting).
- **docs/**: All domain-specific knowledge (api.md, ui.md, etc.) as mapped in the Maintenance Protocol.

---

## 🛠 Operating Style
- **Style:** Direct to Code. No preamble. No summaries after edits. Lead with the action.
- **Scope:** Do not add features, comments, docstrings, or type annotations beyond what was asked.
- **Constraints:** Do not add error handling for impossible cases. Prefer editing existing files over creating new ones.

## 🌍 Language Rules
- **UI & Output:** UI labels, toast messages, page titles, and PDF output must be in **Greek**.
- **Codebase:** Code, variable names, comments, and API responses must be in **English**.

## 💻 Commands
- `pnpm dev` — local dev server
- `pnpm build` — production build
- `pnpm lint` — ESLint
- `pnpm db:generate` — drizzle-kit generate (after schema changes)
- `pnpm db:migrate` — drizzle-kit migrate (applies to Neon DB)
- `pnpm db:seed` — seed providers + admin user (admin/admin123)
- `pnpm db:studio` — drizzle-kit studio

## ⚙️ Environment & Deployment
- `.env.local` required for local dev (DATABASE_URL, INTAKE_API_KEY, etc.)
- **Deployment:** Cloudflare Pages via GitHub Actions (push to main)

## 📖 Project Docs (Read before making non-trivial changes)
- `docs/overview.md` — project purpose, access rules, constraints
- `docs/schema.md` — all DB tables and columns
- `docs/business-logic.md` — status flows, assignment rules, financials
- `docs/api.md` — intake API contract + internal API routes
- `docs/ui.md` — all pages, components, PDF spec
- `docs/providers.md` — the 9 providers with emails and slugs

## ⚠️ Key Constraints
- `declared_price` is locked once a booking reaches `completed`.
- **Assignment:** Assign to partner → clears driver + vehicle (mutually exclusive).
- **Intake API:** UPDATE on confirmed booking before pickup → reverts to pending, clears assignment.
- **Immutable:** `completed` bookings cannot be cancelled or updated via intake API.
- **Auth:** No self-registration, no password recovery — users added manually.

## 📝 Commit Style
- No `Co-Authored-By` lines in commits.
- **Prefixes:** `feat:`, `fix:`, `refactor:`, `chore:`.