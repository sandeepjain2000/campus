Purpose
-------
Workspace for campus placement and related products: Next.js app (campus-placement), CRM assets, infra, shared icons, prompts, and reference exports (for example School Sponsorship Platform HTML capture).

How to use
----------
1. Primary app: open a terminal in the campus-placement folder, run npm install, then npm run dev for local development. Use npm run build / npm start for production-style runs.
2. Supabase and AWS helper scripts are defined in package.json (supabase:*, verify:aws, and so on); run them with npm run <script>.
3. Treat .env.local and any keys as secrets; do not commit them to public repos.
4. Use sibling folders (crm, infra, Prompts) as supporting material for the same product line.
