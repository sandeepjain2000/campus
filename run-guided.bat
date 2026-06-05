@echo off
REM Guided manual test runner — works from CampusPlacement parent folder.
REM Example: run-guided.bat --section internships.employer

cd /d "%~dp0campus-placement"
if not exist "qa\guided\run-guided.mjs" (
  echo ERROR: qa\guided\run-guided.mjs not found. cd campus-placement first.
  exit /b 1
)
node qa\guided\run-guided.mjs %*
