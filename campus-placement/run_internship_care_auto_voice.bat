@echo off
cd /d "%~dp0"
echo.
echo Campus Placement — internship guides, supervisors and feedback (voice, no clicks)
echo.
echo Prerequisite: at least one Selected intern (run run_internship_apply_auto_voice.bat first if empty)
echo Terminal 1: npm run dev
echo One-time: pip install -r qa\guided\requirements-voice.txt
echo.
npm run test:guided:voice-internship-care
pause
