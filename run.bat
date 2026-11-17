@echo off
title Kiwi Connect Digital - Runner
echo ========================================================
echo   Starting Kiwi Connect Digital AI Automation System
echo ========================================================
echo.

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "Kiwi Connect Backend (FastAPI)" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload"

echo [2/2] Launching React Vite Frontend on http://localhost:5173 ...
start "Kiwi Connect Frontend (React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   Both servers are now running!
echo   Open your browser at: http://localhost:5173
echo ========================================================
echo.

