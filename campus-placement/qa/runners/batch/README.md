# Windows launchers (`.bat` / `.ps1`)

Double-click or run from any directory — each script `cd`s to the **campus-placement** repo root first.

| Script | npm equivalent |
|--------|----------------|
| `run-guided.bat` / `run-guided.ps1` | `npm run test:guided -- --playbook …` |
| `run_use_case_auto_voice.bat <slug>` | `npm run test:guided:voice -- <slug>` |
| `run_internship_e2e_auto_voice.bat` | `npm run test:guided:playbook-e2e-auto-voice` |
| `run_internship_publish_auto_voice.bat` | `npm run test:guided:playbook-auto` |
| `run_internship_apply_auto_voice.bat` | `npm run test:guided:playbook-apply-auto` |
| `run_internship_care_auto_voice.bat` | `npm run test:guided:voice-internship-care` |

Voice deps (once): `pip install -r qa/data/requirements/requirements-voice.txt`

From repo root: `qa\runners\batch\<script>.bat` · Parent folder: `CampusPlacement\run-guided.bat` forwards to `run-guided` here.
