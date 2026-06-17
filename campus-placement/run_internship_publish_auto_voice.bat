@echo off
cd /d "%~dp0"
echo.
echo Employer publish + college approve — auto + voice
echo Terminal 1: npm run dev
echo.
npm run test:guided:playbook-auto
pause
