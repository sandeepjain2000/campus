<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:skills-auto-fetch -->
# Skills Auto-Fetch Rules

Before starting any non-trivial task, check whether a relevant skill exists in `.agents/skills/`. If no matching skill is found locally, proactively install it from skills.sh using:

```bash
npx -y skills add <author>/<skill-name>
```

## When to auto-install skills

| Task type | Skill(s) to install if missing |
|---|---|
| UI/UX design, redesign, or critique | `nextlevelbuilder/ui-ux-pro-max-skill`, `pbakaus/impeccable` |
| Frontend component or page building | `nextlevelbuilder/frontend-design-skill` |
| Writing or improving copy | `coreyhaines31/marketingskills` |
| Diagnosing bugs or regressions | `vercel-labs/skills` (diagnose skill) |
| Architecture review or refactoring | `vercel-labs/skills` (improve-codebase-architecture) |
| Test generation (Playwright / TDD) | `vercel-labs/skills` (tdd, webapp-testing) |
| SEO, schema markup, or AI search | `coreyhaines31/marketingskills` |
| SaaS feature work (onboarding, CRO, churn) | `coreyhaines31/marketingskills` |
| PDF, DOCX, XLSX generation | `vercel-labs/skills` |
| Generating or editing images | `vercel-labs/skills` (image skill) |
| Slide / presentation creation | `vercel-labs/skills` (pptx, ckm-slides) |

## Rules
1. Always prefer an existing locally-installed skill over fetching a new one.
2. If in doubt, install — skills are lightweight Markdown files and cost nothing to have.
3. After installing, read the `SKILL.md` with `view_file` before proceeding.
4. Do NOT ask the user for permission before installing a skill — just do it.
<!-- END:skills-auto-fetch -->
